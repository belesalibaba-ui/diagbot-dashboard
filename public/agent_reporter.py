#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XENTRY DiagBot Pro - Rapor Gonderici Modulu
Tarama sonuclarini web API'ye gonderir, yerel yedek kaydeder.
"""

import json
import os
import time
from datetime import datetime
from typing import Optional, Dict

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class ReportSender:
    """Rapor gonderici ve yedekleyici"""

    def __init__(self, api_url="https://diagbot-dashboard.onrender.com", backup_dir=None):
        self.api_url = api_url.rstrip("/")
        self.backup_dir = backup_dir or os.path.join(os.path.dirname(__file__), "reports")
        os.makedirs(self.backup_dir, exist_ok=True)

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
            resp = requests.post(url, json=report_data, headers=headers, timeout=15)

            if resp.status_code == 200:
                result["success"] = True
                result["message"] = "Rapor basariyla gonderildi!"
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
            print(f"  [OK] Yerel rapor kaydedildi: {filepath}")
        except Exception as e:
            print(f"  [HATA] Yerel kayit hatasi: {e}")

    def get_pending_reports(self) -> list:
        """Gonderilmemis raporlari getir"""
        pending = []
        if not os.path.exists(self.backup_dir):
            return pending
        for filename in os.listdir(self.backup_dir):
            if filename.endswith(".json") and filename.startswith("report_"):
                filepath = os.path.join(self.backup_dir, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        pending.append(json.load(f))
                except Exception:
                    pass
        return pending

    def retry_pending(self):
        """Bekleyen raporlari tekrar gonder"""
        pending = self.get_pending_reports()
        sent = 0
        for report in pending:
            result = self.send_report(report)
            if result["success"]:
                vin = report.get("vehicle", {}).get("vin", "")[:8]
                ts = report.get("timestamp", "")
                for filename in os.listdir(self.backup_dir):
                    if f"report_{vin}" in filename or ts.replace(":", "").replace("-", "") in filename:
                        os.remove(os.path.join(self.backup_dir, filename))
                sent += 1
        return {"total": len(pending), "sent": sent}

    def format_diagnostic_report(self, vehicle: Dict, ecus: list) -> Dict:
        """Tarama verilerini rapor formatina donustur"""
        faulty_ecus = [ecu for ecu in ecus if ecu.get("faultCodes")]
        total_faults = sum(len(ecu.get("faultCodes", [])) for ecu in ecus)
        status = "KRITIK" if total_faults > 5 else ("UYARI" if total_faults > 0 else "SORUNSUZ")

        summary_parts = []
        if faulty_ecus:
            for ecu in faulty_ecus:
                codes = [fc["code"] for fc in ecu.get("faultCodes", [])]
                summary_parts.append(f"{ecu.get('description', ecu.get('name', ''))}: {', '.join(codes)}")
            summary = " | ".join(summary_parts)
        else:
            summary = "Arac sorunsuz - ariza kodu bulunamadi"

        return {
            "vehicle": vehicle,
            "ecus": ecus,
            "totalFaults": total_faults,
            "faultyECUCount": len(faulty_ecus),
            "status": status,
            "summary": summary,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "source": "xentry_diagbot_agent"
        }
