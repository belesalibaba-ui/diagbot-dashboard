#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XENTRY DiagBot Pro - Rapor Gonderici Modulu (v2.0)
Tarama sonuclarini web API'ye gonderir, AI analiz yapar, yerel yedek kaydeder.
"""

import json
import os
import time
from datetime import datetime
from typing import Optional, Dict, List

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

# Ariza aciliyet siniflandirici
FAULT_SEVERITY = {
    "motor": "KRITIK",
    "sanziman": "KRITIK",
    "fren": "YUKSEK",
    "guvenlik": "YUKSEK",
    "sam": "ORTA",
    "sasis": "ORTA",
    "komunikasyon": "DUSUK",
    "komfor": "DUSUK",
    "adis": "ORTA",
}

# Ariza kodu veritabani (en sik karsilasilan Mercedes kodlari)
MERCEDES_FAULT_DB = {
    "P0010": {"desc": "Kam mili pozisyon aktüatör devresi (Bank 1)", "severity": "YUKSEK", "system": "motor"},
    "P0016": {"desc": "Krank mili / Kam mili pozisyon korelasyonu (Bank 1 Sensör A)", "severity": "KRITIK", "system": "motor"},
    "P0100": {"desc": "Mass Air Flow (MAF) sensör devresi", "severity": "YUKSEK", "system": "motor"},
    "P0101": {"desc": "MAF sensör aralik/performans problemi", "severity": "YUKSEK", "system": "motor"},
    "P0115": {"desc": "Motor soğutma sıvısı sıcaklık sensörü devresi", "severity": "ORTA", "system": "motor"},
    "P0120": {"desc": "Throttle position sensör devresi", "severity": "YUKSEK", "system": "motor"},
    "P0171": {"desc": "Sistem çok fakir (Bank 1)", "severity": "ORTA", "system": "motor"},
    "P0172": {"desc": "Sistem çok zengin (Bank 1)", "severity": "ORTA", "system": "motor"},
    "P0300": {"desc": "Rastgele/Çoklu silindir ateşleme kaçması", "severity": "KRITIK", "system": "motor"},
    "P0301": {"desc": "Silindir 1 ateşleme kaçması", "severity": "KRITIK", "system": "motor"},
    "P0302": {"desc": "Silindir 2 ateşleme kaçması", "severity": "KRITIK", "system": "motor"},
    "P0335": {"desc": "Krank mali pozisyon sensörü A devresi", "severity": "KRITIK", "system": "motor"},
    "P0340": {"desc": "Kam mali pozisyon sensörü A devresi (Bank 1)", "severity": "KRITIK", "system": "motor"},
    "P0400": {"desc": "Egzoz gazı geri dönüşüm akışı", "severity": "ORTA", "system": "motor"},
    "P0401": {"desc": "EGR akışı yetersiz", "severity": "ORTA", "system": "motor"},
    "P0420": {"desc": "Katalitik konvertör verimliliği (Bank 1)", "severity": "YUKSEK", "system": "motor"},
    "P0500": {"desc": "Araç hızı sensörü", "severity": "ORTA", "system": "komunikasyon"},
    "P0700": {"desc": "Şanzıman kontrol modülü arıza", "severity": "KRITIK", "system": "sanziman"},
    "P0715": {"desc": "Giriş/şaft hızı sensörü A devresi", "severity": "KRITIK", "system": "sanziman"},
    "P0720": {"desc": "Çıkış hızı sensörü devresi", "severity": "KRITIK", "system": "sanziman"},
    "P0730": {"desc": "Vites oranı hatalı", "severity": "KRITIK", "system": "sanziman"},
    "P0740": {"desc": "Tork konvertörü kavrama devresi", "severity": "YUKSEK", "system": "sanziman"},
    "B1001": {"desc": "SAM modülü - Sol öndeki aydınlatma arızası", "severity": "DUSUK", "system": "sam"},
    "B1010": {"desc": "SAM modülü - Sol arkadaki aydınlatma arızası", "severity": "DUSUK", "system": "sam"},
    "B1085": {"desc": "SAM modülü - İç aydınlatma arızası", "severity": "DUSUK", "system": "sam"},
    "C1000": {"desc": "ESP sensörü arızası", "severity": "YUKSEK", "system": "fren"},
    "C1020": {"desc": "ESP hidrolik pompası arızası", "severity": "KRITIK", "system": "fren"},
    "C1200": {"desc": "Sol ön tekerlek hızı sensörü", "severity": "YUKSEK", "system": "fren"},
    "C1500": {"desc": "ABS pompası motoru arızası", "severity": "KRITIK", "system": "fren"},
    "U0001": {"desc": "High Speed CAN iletişim hatası", "severity": "YUKSEK", "system": "komunikasyon"},
    "U0100": {"desc": "ECM ile iletişim kaybı", "severity": "KRITIK", "system": "komunikasyon"},
    "U0101": {"desc": "TCM ile iletişim kaybı", "severity": "KRITIK", "system": "komunikasyon"},
    "U0121": {"desc": "ABS kontrol modülü ile iletişim kaybı", "severity": "YUKSEK", "system": "komunikasyon"},
    "U0140": {"desc": "BCM (Central Gateway) ile iletişim kaybı", "severity": "YUKSEK", "system": "komunikasyon"},
    "U0155": {"desc": "Instrument Cluster ile iletişim kaybı", "severity": "ORTA", "system": "komunikasyon"},
}


class ReportSender:
    """Rapor gonderici ve AI analiz modulu"""

    def __init__(self, api_url="https://diagbot-dashboard.onrender.com", backup_dir=None):
        self.api_url = api_url.rstrip("/")
        self.backup_dir = backup_dir or os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
        os.makedirs(self.backup_dir, exist_ok=True)
        os.makedirs(os.path.join(self.backup_dir, "screenshots"), exist_ok=True)

    def send_report(self, report_data: Dict) -> Dict:
        """Raporu web API'ye gonder"""
        result = {"success": False, "message": ""}

        if not REQUESTS_AVAILABLE:
            result["message"] = "requests paketi yuklu degil - rapor yerel kaydedildi"
            self._save_local(report_data)
            return result

        try:
            url = f"{self.api_url}/api/agent/report"
            headers = {"Content-Type": "application/json"}
            resp = requests.post(url, json=report_data, headers=headers, timeout=30)

            if resp.status_code == 200:
                result["success"] = True
                result["message"] = "Rapor basariyla web panel'e gonderildi!"
            else:
                result["message"] = f"Sunucu hatasi: {resp.status_code}"
                self._save_local(report_data)

        except requests.exceptions.ConnectionError:
            result["message"] = "Baglanti hatasi - rapor yerel kaydedildi"
            self._save_local(report_data)
        except requests.exceptions.Timeout:
            result["message"] = "Zaman asimi - rapor yerel kaydedildi"
            self._save_local(report_data)
        except Exception as e:
            result["message"] = f"Hata: {str(e)}"
            self._save_local(report_data)

        return result

    def _save_local(self, report_data: Dict):
        """Raporu yerel diske kaydet"""
        try:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            vin = report_data.get("vehicle", {}).get("vin", "BILINMIYOR")[:8]
            filename = f"report_{vin}_{ts}.json"
            filepath = os.path.join(self.backup_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(report_data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def analyze_fault_codes(self, fault_codes: List[Dict], ecu_info: Dict = None) -> List[Dict]:
        """Ariza kodlarini AI ile analiz et"""
        analyzed = []
        for fc in fault_codes:
            code = fc.get("code", "")
            db_info = MERCEDES_FAULT_DB.get(code, {})

            # ECU grubuna göre oncelik belirle
            group = ecu_info.get("group", "bilinmiyor") if ecu_info else "bilinmiyor"
            severity = db_info.get("severity", FAULT_SEVERITY.get(group, "ORTA"))

            # AI analiz simülasyonu
            analysis = {
                "kod": code,
                "aciklama": db_info.get("desc", f"{code} - Ariza kodu tespit edildi"),
                "ecu": ecu_info.get("description", ecu_info.get("name", "Bilinmeyen ECU")) if ecu_info else "Bilinmiyor",
                "durum": fc.get("status", "Bilinmiyor"),
                "aciliyet": severity,
                "oncelik": self._get_priority(severity),
                "nedenler": self._generate_causes(code, db_info, group),
                "cozumler": self._generate_solutions(code, db_info, group),
                "maliyetTahmini": self._estimate_cost(code, db_info),
                "zorluk": self._estimate_difficulty(code, db_info),
            }
            analyzed.append(analysis)

        # Onceliğe gore sirala
        analyzed.sort(key=lambda x: x["oncelik"])
        return analyzed

    def _get_priority(self, severity: str) -> int:
        """Aciliyet önceliği (1=En kritik)"""
        priority_map = {"KRITIK": 1, "YUKSEK": 2, "ORTA": 3, "DUSUK": 4, "BILGI": 5}
        return priority_map.get(severity.upper(), 3)

    def _generate_causes(self, code: str, db_info: Dict, group: str) -> List[str]:
        """Olası nedenler üret"""
        causes = {
            "motor": [
                "Sensör arızası veya kirlenmesi",
                "Kabloda kısa devre veya kopuk bağlantı",
                "Yakıt sistemi basınç problemi",
                "Ateşleme sistemi bileşen aşınması",
                "Motor kontrol ünitesi (ECM) yazılım sorunu",
            ],
            "sanziman": [
                "Şanzıman yağı seviyesi veya kalitesi düşük",
                "Vites sensörü arızası",
                "Mekatronik ünite problemi",
                "Tork konvertörü hasarı",
                "Şanzıman kontrol modülü (TCM) arızası",
            ],
            "sam": [
                "SAM modülü aşırı ısınma",
                "Kabloda nem veya korozyon",
                "Sigorta arızası",
                "Aydınlatma ampulü arızası (EMF tetiklemesi)",
            ],
            "fren": [
                "ABS/ESP sensörü kirlenmesi",
                "Hydrolik pompası arızası",
                "Fren balata aşınması",
                "Tekerlek hız sensörü arızası",
            ],
            "guvenlik": [
                "Airbag sarsıntı sensörü arızası",
                "Dikiz aynası veya kapı sensörü sorunu",
                "Kablo bağlantı kopması",
            ],
            "komunikasyon": [
                "CAN bus kablosunda kısa devre",
                "Merkezi ağ geçidi (ZGW) arızası",
                "Birden fazla modül iletişim kaybı",
                "Batarya voltajı düşük",
            ],
        }
        return causes.get(group, [
            "Elektriksel bağlantı sorunu",
            "Bileşen aşınması veya hasarı",
            "Yazılım güncelleme gereksinimi",
        ])

    def _generate_solutions(self, code: str, db_info: Dict, group: str) -> List[Dict]:
        """Çözüm önerileri üret"""
        solutions = {
            "motor": [
                {"oneri": "İlgili sensörü kontrol et ve gerekiyorsa değiştir", "maliyet": 500, "zorluk": "Orta"},
                {"oneri": "Motor diagnostic modunda canlı veri kontrolü yap", "maliyet": 0, "zorluk": "Kolay"},
                {"oneri": "Yakıt filtresini kontrol et ve değiştir", "maliyet": 300, "zorluk": "Kolay"},
                {"oneri": "ECM yazılımını güncelle (XENTRY ile)", "maliyet": 0, "zorluk": "Orta"},
                {"oneri": "Ateşleme bobinlerini ve bujileri kontrol et", "maliyet": 1500, "zorluk": "Orta"},
            ],
            "sanziman": [
                {"oneri": "Şanzıman yağını ve filtresini değiştir", "maliyet": 2000, "zorluk": "Orta"},
                {"oneri": "SD Connect C4 ile mekatronik ünite testi yap", "maliyet": 0, "zorluk": "Zor"},
                {"oneri": "Şanzıman adaptasyon değerlerini sıfırla", "maliyet": 0, "zorluk": "Zor"},
                {"oneri": "Vites sensörlerini kontrol et", "maliyet": 800, "zorluk": "Orta"},
            ],
            "sam": [
                {"oneri": "SAM modülünü kontrol et ve gerekiyorsa değiştir", "maliyet": 1500, "zorluk": "Orta"},
                {"oneri": "Tüm sigortaları kontrol et", "maliyet": 0, "zorluk": "Kolay"},
                {"oneri": "Kablo demetini nem/korozyon açısından kontrol et", "maliyet": 200, "zorluk": "Kolay"},
            ],
            "fren": [
                {"oneri": "Tekerlek hız sensörlerini temizle veya değiştir", "maliyet": 800, "zorluk": "Orta"},
                {"oneri": "ABS/ESP modülünü XENTRY ile test et", "maliyet": 0, "zorluk": "Orta"},
                {"oneri": "Fren balatalarını ve disklerini kontrol et", "maliyet": 2500, "zorluk": "Orta"},
                {"oneri": "Fren hidroliği seviyesini kontrol et", "maliyet": 100, "zorluk": "Kolay"},
            ],
            "guvenlik": [
                {"oneri": "Airbag sisteminin tam diagnostic testi", "maliyet": 0, "zorluk": "Zor"},
                {"oneri": "Kapi ve kilit mekanizmalarini kontrol et", "maliyet": 500, "zorluk": "Orta"},
                {"oneri": "XENTRY ile airbag kodlarini sil ve tekrar test et", "maliyet": 0, "zorluk": "Kolay"},
            ],
            "komunikasyon": [
                {"oneri": "CAN bus kablolamasını multimetre ile kontrol et", "maliyet": 0, "zorluk": "Zor"},
                {"oneri": "Arac bataryasını kontrol et (minimum 12.2V)", "maliyet": 0, "zorluk": "Kolay"},
                {"oneri": "Merkezi ağ geçidini (ZGW) resetle", "maliyet": 0, "zorluk": "Orta"},
                {"oneri": "Tüm modül bağlantılarını kontrol et", "maliyet": 200, "zorluk": "Zor"},
            ],
        }
        return solutions.get(group, [
            {"oneri": "Detaylı diagnostic ile arızanın kaynağını bul", "maliyet": 0, "zorluk": "Orta"},
            {"oneri": "İlgili bileşeni kontrol et ve değiştir", "maliyet": 1000, "zorluk": "Orta"},
        ])

    def _estimate_cost(self, code: str, db_info: Dict) -> int:
        """Maliyet tahmini (TL)"""
        base_costs = {"KRITIK": 3000, "YUKSEK": 2000, "ORTA": 1000, "DUSUK": 500}
        severity = db_info.get("severity", "ORTA")
        return base_costs.get(severity, 1000)

    def _estimate_difficulty(self, code: str, db_info: Dict) -> str:
        """Zorluk tahmini"""
        difficulty = {"KRITIK": "Zor", "YUKSEK": "Orta", "ORTA": "Kolay", "DUSUK": "Kolay"}
        severity = db_info.get("severity", "ORTA")
        return difficulty.get(severity, "Orta")

    def format_diagnostic_report(self, vehicle: Dict, ecus: List[Dict], source: str = "agent") -> Dict:
        """Tarama verilerini rapor formatina donustur"""
        faulty_ecus = [ecu for ecu in ecus if ecu.get("faultCodes")]
        total_faults = sum(len(ecu.get("faultCodes", [])) for ecu in ecus)

        # Durum sınıflandır
        has_critical = any(
            any(c.get("code", "") in MERCEDES_FAULT_DB and MERCEDES_FAULT_DB[c["code"]].get("severity") == "KRITIK"
                for c in ecu.get("faultCodes", []))
            for ecu in faulty_ecus
        )
        has_motor_fault = any(ecu.get("group") == "motor" and ecu.get("faultCodes") for ecu in faulty_ecus)
        has_trans_fault = any(ecu.get("group") == "sanziman" and ecu.get("faultCodes") for ecu in faulty_ecus)

        if total_faults > 10 or has_critical or has_motor_fault or has_trans_fault:
            status = "KRITIK"
        elif total_faults > 0:
            status = "UYARI"
        else:
            status = "SORUNSUZ"

        # Ariza ozeti
        summary_parts = []
        if has_motor_fault:
            summary_parts.append("MOTOR BEYNI ARIZASI")
        if has_trans_fault:
            summary_parts.append("SANZIMAN ARIZASI")
        sam_faults = [e for e in faulty_ecus if e.get("group") == "sam"]
        if sam_faults:
            summary_parts.append(f"SAM MODUL ARIZASI ({len(sam_faults)} adet)")

        if faulty_ecus:
            for ecu in faulty_ecus[:5]:
                codes = [fc.get("code", "") for fc in ecu.get("faultCodes", [])]
                summary_parts.append(f"{ecu.get('description', '')}: {', '.join(codes[:3])}")
            summary = " | ".join(summary_parts)
        else:
            summary = "Arac sorunsuz - ariza kodu bulunamadi"

        # AI analiz
        all_faults = []
        for ecu in faulty_ecus:
            for fc in ecu.get("faultCodes", []):
                all_faults.append({"code": fc.get("code", ""), "status": fc.get("status", "")})

        analysis = self.analyze_fault_codes(all_faults, faulty_ecus[0] if faulty_ecus else None)

        # Toplam maliyet
        total_cost = sum(a.get("maliyetTahmini", 0) for a in analysis[:5])

        return {
            "vehicle": vehicle,
            "ecus": ecus,
            "totalFaults": total_faults,
            "faultyECUCount": len(faulty_ecus),
            "status": status,
            "summary": summary,
            "analysis": analysis,
            "estimatedCost": total_cost,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "source": source,
        }

    def get_pending_reports(self) -> list:
        """Gonderilmemis raporlari getir"""
        pending = []
        if not os.path.exists(self.backup_dir):
            return pending
        for filename in sorted(os.listdir(self.backup_dir)):
            if filename.endswith(".json") and filename.startswith("report_"):
                filepath = os.path.join(self.backup_dir, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        pending.append(json.load(f))
                except:
                    pass
        return pending

    def retry_pending(self) -> Dict:
        """Bekleyen raporlari tekrar gonder"""
        pending = self.get_pending_reports()
        sent = 0
        for report in pending:
            result = self.send_report(report)
            if result["success"]:
                ts = report.get("timestamp", "")
                for filename in os.listdir(self.backup_dir):
                    if filename.endswith(".json"):
                        ts_clean = ts.replace(":", "").replace("-", "").replace("T", "")
                        if ts_clean and ts_clean in filename:
                            try:
                                os.remove(os.path.join(self.backup_dir, filename))
                            except:
                                pass
                sent += 1
        return {"total": len(pending), "sent": sent}
