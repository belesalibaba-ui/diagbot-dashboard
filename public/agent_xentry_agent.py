#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XENTRY DiagBot Pro v3.0 - Ana Modul
Mercedes-Benz arac tarama ve teshis ajan sistemi.
SD Connect C4 + XENTRY Ekran Otomasyonu
"""

import os
import sys
import json
import time
import subprocess

# Agent klasorunu Python yoluna ekle
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from colorama import init, Fore, Back, Style
    init(autoreset=True)
    C = Fore
    S = Style
except ImportError:
    class _C:
        def __getattr__(self, name): return ""
        def __call__(self, text): return text
    C = _C()
    S = _C()

try:
    from obd_scanner import OBDScanner, MERCEDES_ECUS
    from reporter import ReportSender
except ImportError as e:
    print(f"[HATA] Gerekli moduller yuklu degil: {e}")
    print("Lutfen KURULUM.bat dosyasini calistirin.")
    input("Devam etmek icin Enter basin...")
    sys.exit(1)


def print_logo():
    print(f"""
{C.CYAN}{'='*55}
{C.CYAN}|{S.BRIGHT}  XENTRY DiagBot Pro v3.0{S.RESET_ALL}{C.CYAN}{' '*25}|
{C.CYAN}|  Mercedes-Benz AI Teshis Ajan Sistemi{C.CYAN}{' '*12}|
{C.CYAN}|  SD Connect C4 + XENTRY Otomasyon{C.CYAN}{' '*14}|
{C.CYAN}{'='*55}{S.RESET_ALL}
""")


def load_config():
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    default_config = {
        "api_url": "https://diagbot-dashboard.onrender.com",
        "obd_port": "auto",
        "obd_baudrate": 115200,
        "adapter_type": "auto",
        "xentry_path": "",
        "language": "tr",
        "auto_scan_priority": True,
        "ocr_enabled": True,
    }
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                saved = json.load(f)
                default_config.update(saved)
        except:
            pass
    return default_config


def save_config(config):
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def check_dependencies():
    missing = []
    deps = [
        ("serial", "pyserial"),
        ("requests", "requests"),
        ("colorama", "colorama"),
    ]
    optional = [
        ("pyautogui", "pyautogui"),
        ("pygetwindow", "pygetwindow"),
        ("PIL", "Pillow"),
    ]
    for mod, pkg in deps:
        try:
            __import__(mod)
        except ImportError:
            missing.append(pkg)
    for mod, pkg in optional:
        try:
            __import__(mod)
        except ImportError:
            pass  # Optional
    return missing


def install_dependencies():
    missing = check_dependencies()
    if not missing:
        print(f"  {C.GREEN}[OK]{S.RESET_ALL} Zorunlu paketler yuklu.")
        # Optional paket kontrol
        try:
            import pyautogui
            print(f"  {C.GREEN}[OK]{S.RESET_ALL} pyautogui yuklu (XENTRY otomasyonu hazir)")
        except:
            print(f"  {C.YELLOW}[!] pyautogui yuklu degil (XENTRY otomasyonu kullanilamaz)")
        return True
    print(f"  {C.YELLOW}[BILGI]{S.RESET_ALL} Eksik paketler: {', '.join(missing)}")
    print(f"  {C.CYAN}Kuruluyor...{S.RESET_ALL}")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q"] + missing)
        print(f"  {C.GREEN}[OK]{S.RESET_ALL} Paketler basariyla kuruldu!")
        return True
    except Exception as e:
        print(f"  {C.RED}[HATA]{S.RESET_ALL} Kurulum basarisiz: {e}")
        print(f"  Manuel: pip install {' '.join(missing)}")
        return False


def run_sdconnect_scan(config):
    """SD Connect C4 ile OBD2 tam tarama"""
    print(f"\n{C.CYAN}{'='*55}{S.RESET_ALL}")
    print(f"  {C.WHITE}SD CONNECT C4 - OBD2 TAM TARAMA{S.RESET_ALL}")
    print(f"{'='*55}\n")

    scanner = OBDScanner(
        port=config.get("obd_port", "auto"),
        baudrate=config.get("obd_baudrate", 115200),
        adapter_type=config.get("adapter_type", "auto")
    )

    # COM portlari listele
    ports = scanner.find_com_ports()
    if not ports:
        print(f"  {C.RED}[HATA]{S.RESET_ALL} Hicbir COM portu bulunamadi!")
        print(f"  SD Connect C4'yu USB'ye baglayin ve tekrar deneyin.")
        print(f"  (SD C4 genelde FTDI chip ile taninir)")
        return

    print(f"  {C.WHITE}Bulunan Portlar:{S.RESET_ALL}")
    for i, p in enumerate(ports):
        marker = ""
        desc_l = p['desc'].lower()
        if 'ftdi' in desc_l or 'sd' in desc_l or 'c4' in desc_l or 'mercedes' in desc_l:
            marker = f" {C.GREEN}<-- SD Connect C4{S.RESET_ALL}"
        print(f"    [{i+1}] {p['port']} - {p['desc']}{marker}")

    # Baglan
    print(f"\n  {C.CYAN}Baglaniyor...{S.RESET_ALL}")
    try:
        scanner.connect()
        adapter = scanner.adapter_type
        adapter_label = "SD Connect C4" if adapter == "sdconnect" else f"ELM327 ({adapter})"
        print(f"  {C.GREEN}[OK]{S.RESET_ALL} Baglandi: {scanner.port} ({adapter_label})")
    except Exception as e:
        print(f"  {C.RED}[HATA]{S.RESET_ALL} {e}")
        return

    # VIN oku
    print(f"\n  {C.CYAN}Araç bilgileri okunuyor...{S.RESET_ALL}")
    vin = scanner.read_vin()
    if vin:
        print(f"  {C.GREEN}[VIN]{S.RESET_ALL} {vin}")
    else:
        print(f"  {C.YELLOW}[VIN]{S.RESET_ALL} Okunamadi (kontak acik mi?)")

    # KM oku
    km = scanner.read_km()
    if km:
        print(f"  {C.GREEN}[KM]{S.RESET_ALL} {km:,} km")
    else:
        print(f"  {C.YELLOW}[KM]{S.RESET_ALL} Okunamadi")

    # Sase numarasi
    chassis = ""
    if vin:
        # Mercedes VIN'den sase kodu cikar (WDD...)
        if vin.startswith("W") and len(vin) >= 8:
            chassis = vin[:8]

    vehicle = {
        "vin": vin or "Bilinmiyor",
        "km": km or 0,
        "chassis": chassis,
        "adapter": scanner.adapter_type,
    }

    # ECU taramasi
    print(f"\n  {C.CYAN}ECU taramasi baslatiliyor...{S.RESET_ALL}")
    print(f"  (Oncelik: Motor > Sanziman > SAM > ESP > digerleri)\n")

    ecus = scanner.scan_ecus()

    if not ecus:
        print(f"\n  {C.YELLOW}[UYARI]{S.RESET_ALL} Hicbir ECU bulunamadi.")
        print(f"  Olasi nedenler:")
        print(f"    - Ignition (kontak) acik degil")
        print(f"    - SD Connect C4 dogru baglanmamis")
        print(f"    - XENTRY OpenShell calisiyor olabilir (port kilitli)")
        print(f"    - Arac uyumlu degil")
        scanner.disconnect()
        return

    print(f"\n  {C.GREEN}[OK]{S.RESET_ALL} {len(ecus)} ECU bulundu!\n")

    # Ariza kodu okuma - oncelik sirasinda
    faulty_count = 0
    total_faults = 0

    print(f"  {C.WHITE}Ariza kodlari okunuyor...{S.RESET_ALL}\n")

    for ecu in ecus:
        group = ecu.get("group", "")
        desc = ecu.get("description", ecu.get("name", ""))
        addr = ecu.get("address", "")

        # Grup ikonu
        group_icons = {
            "motor": f"{C.RED}[MOTOR]{S.RESET_ALL}",
            "sanziman": f"{C.RED}[SANZ]{S.RESET_ALL}",
            "sam": f"{C.YELLOW}[SAM]{S.RESET_ALL}",
            "fren": f"{C.YELLOW}[FREN]{S.RESET_ALL}",
            "guvenlik": f"{C.YELLOW}[GUV]{S.RESET_ALL}",
        }
        icon = group_icons.get(group, f"{C.WHITE}[ECU]{S.RESET_ALL}")

        codes = scanner.read_fault_codes(addr)
        ecu["faultCodes"] = codes

        if codes:
            faulty_count += 1
            total_faults += len(codes)
            status_icon = f"{C.RED}x{S.RESET_ALL}"
            print(f"  {status_icon} {icon} {C.WHITE}{desc}{S.RESET_ALL} ({addr})")
            for code in codes:
                urgency = C.RED if code.get("status") == "Aktif" else C.YELLOW
                print(f"       {urgency}>> {code['code']} ({code.get('status', '?')}){S.RESET_ALL}")
        else:
            print(f"  {C.GREEN}ok{S.RESET_ALL} {icon} {C.WHITE}{desc}{S.RESET_ALL} ({addr})")
            ecu["status"] = "SORUNSUZ"

    scanner.disconnect()

    # Ozet
    print(f"\n{C.CYAN}{'='*55}{S.RESET_ALL}")
    print(f"  {C.WHITE}TARAMA OZETI{S.RESET_ALL}")
    print(f"{'='*55}")
    print(f"  Toplam ECU:        {C.WHITE}{len(ecus)}{S.RESET_ALL}")
    print(f"  Arizali ECU:       {C.RED}{faulty_count}{S.RESET_ALL}")
    print(f"  Toplam Ariza Kodu: {C.RED}{total_faults}{S.RESET_ALL}")

    # Kritik kontrol
    motor_faults = [e for e in ecus if e.get("group") == "motor" and e.get("faultCodes")]
    trans_faults = [e for e in ecus if e.get("group") == "sanziman" and e.get("faultCodes")]
    sam_faults = [e for e in ecus if e.get("group") == "sam" and e.get("faultCodes")]

    if motor_faults:
        print(f"\n  {C.RED}[!!!] MOTOR BEYNI ARIZASI TESPIT EDILDI{S.RESET_ALL}")
        for mf in motor_faults:
            for c in mf["faultCodes"]:
                print(f"        {C.RED}>> {mf['desc']}: {c['code']}{S.RESET_ALL}")
    if trans_faults:
        print(f"\n  {C.RED}[!!!] SANZIMAN BEYNI ARIZASI TESPIT EDILDI{S.RESET_ALL}")
        for tf in trans_faults:
            for c in tf["faultCodes"]:
                print(f"        {C.RED}>> {tf['desc']}: {c['code']}{S.RESET_ALL}")
    if sam_faults:
        print(f"\n  {C.YELLOW}[!!]  SAM MODUL ARIZASI ({len(sam_faults)} adet){S.RESET_ALL}")

    if faulty_count == 0:
        print(f"\n  {C.GREEN}Tebrikler! Arac sorunsuz.{S.RESET_ALL}")

    # Rapor olustur ve gonder
    print(f"\n  {C.CYAN}Rapor olusturuluyor...{S.RESET_ALL}")
    reporter = ReportSender(api_url=config.get("api_url", ""))
    report = reporter.format_diagnostic_report(
        vehicle=vehicle,
        ecus=ecus,
        source="sdconnect_obd_scan"
    )

    print(f"  {C.CYAN}Rapor web panel'e gonderiliyor...{S.RESET_ALL}")
    result = reporter.send_report(report)
    print(f"  {C.GREEN if result['success'] else C.RED}{result['message']}{S.RESET_ALL}")

    # Bekleyen raporlari gonder
    if not result["success"]:
        print(f"\n  {C.YELLOW}Bekleyen raporlar tekrar deneniyor...{S.RESET_ALL}")
        retry = reporter.retry_pending()
        if retry["sent"] > 0:
            print(f"  {C.GREEN}[OK]{S.RESET_ALL} {retry['sent']} rapor gonderildi")
        else:
            print(f"  {C.YELLOW}[!]{S.RESET_ALL} Hala gonderilemeyen raporlar var")

    # AI analiz ozeti
    if report.get("analysis"):
        print(f"\n{C.CYAN}{'='*55}{S.RESET_ALL}")
        print(f"  {C.WHITE}AI ARIZA ANALIZI{S.RESET_ALL}")
        print(f"{'='*55}")
        for a in report["analysis"][:5]:
            color = C.RED if a["aciliyet"] == "KRITIK" else (C.YELLOW if a["aciliyet"] == "YUKSEK" else C.WHITE)
            print(f"  {color}[{a['aciliyet']}]{S.RESET_ALL} {a['kod']}: {a['aciklama']}")
            if a.get("cozumler"):
                print(f"        {C.GREEN}Cozum:{S.RESET_ALL} {a['cozumler'][0]['oneri']}")
            print()


def run_xentry_automation(config):
    """XENTRY ekran otomasyonu - pyautogui ile"""
    print(f"\n{C.CYAN}{'='*55}{S.RESET_ALL}")
    print(f"  {C.WHITE}XENTRY EKRAN OTOMASYONU{S.RESET_ALL}")
    print(f"{'='*55}\n")

    try:
        from screen_automator import XENTRYAutomator
    except ImportError:
        print(f"  {C.RED}[HATA]{S.RESET_ALL} pyautogui veya Pillow yuklu degil!")
        print(f"  pip install pyautogui Pillow pygetwindow")
        print(f"  (veya KURULUM.bat dosyasini tekrar calistirin)")
        return

    automator = XENTRYAutomator(xentry_path=config.get("xentry_path", ""))

    if not automator.is_automation_available():
        print(f"  {C.RED}[HATA]{S.RESET_ALL} Otomasyon paketleri yuklu degil!")
        return

    # OCR durumu
    if automator._ocr_available:
        print(f"  {C.GREEN}[OK]{S.RESET_ALL} OCR yuklu - ekran metni okunabilir")
    else:
        print(f"  {C.YELLOW}[!]{S.RESET_ALL} OCR yuklu degil - pytesseract kurun")
        print(f"         (https://github.com/UB-Mannheim/tesseract/wiki)")

    # XENTRY bul
    print(f"\n  XENTRY yolu: {automator.xentry_path or 'Otomatik aranacak'}")
    window = automator.find_xentry_window()
    if window:
        print(f"  {C.GREEN}[OK]{S.RESET_ALL} XENTRY calisiyor: {window.title}")
    else:
        print(f"  {C.YELLOW}[BILGI]{S.RESET_ALL} XENTRY bulunamadi, baslatiliyor...")
        success = automator.launch_xentry()
        if success:
            print(f"  {C.GREEN}[OK]{S.RESET_ALL} XENTRY baslatildi")
        else:
            print(f"  {C.RED}[HATA]{S.RESET_ALL} XENTRY baslatilamadi")
            print(f"  Lutfen XENTRY'yi manuel baslatin ve tekrar deneyin")
            return

    # Otomasyon baslat
    automator.activate_window()
    data = automator.get_xentry_diagnostic_data()

    if data.get("status") == "error":
        print(f"\n  {C.RED}[HATA]{S.RESET_ALL} {data.get('error', 'Bilinmeyen hata')}")
        return

    # Arac bilgileri
    vehicle = data.get("vehicle", {})
    print(f"\n  {C.CYAN}Okunan Arac Bilgileri:{S.RESET_ALL}")
    if vehicle.get("vin"):
        print(f"  VIN:     {C.GREEN}{vehicle['vin']}{S.RESET_ALL}")
    if vehicle.get("km"):
        print(f"  KM:      {C.GREEN}{vehicle['km']:,} km{S.RESET_ALL}")
    if vehicle.get("chassis"):
        print(f"  Sase:    {C.GREEN}{vehicle['chassis']}{S.RESET_ALL}")
    if vehicle.get("model"):
        print(f"  Model:   {C.GREEN}{vehicle['model']}{S.RESET_ALL}")

    # ECU sonuclari
    ecus = data.get("ecus", [])
    faulty = [e for e in ecus if e.get("fault_codes")]
    print(f"\n  Taranan Modul: {len(ecus)}")
    print(f"  Arizali Modul: {len(faulty)}")

    if faulty:
        for f in faulty:
            print(f"  {C.RED}x{S.RESET_ALL} {f.get('name', 'Bilinmiyor')}: {', '.join(f.get('fault_codes', []))}")

    # Rapor gonder
    reporter = ReportSender(api_url=config.get("api_url", ""))
    ecu_data = []
    for m in ecus:
        ecu_data.append({
            "address": f"0x{m.get('module_index', 0):02X}",
            "name": m.get("name", f"Module {m.get('module_index', 0)}"),
            "description": m.get("name", ""),
            "group": "xentry",
            "faultCodes": [{"code": c, "status": "Aktif"} for c in m.get("fault_codes", [])],
            "status": "ARIZALI" if m.get("fault_codes") else "SORUNSUZ",
        })

    report = reporter.format_diagnostic_report(
        vehicle=vehicle or {"vin": "XENTRY", "km": 0},
        ecus=ecu_data,
        source="xentry_screen_automation"
    )
    result = reporter.send_report(report)
    print(f"\n  {C.GREEN if result['success'] else C.RED}{result['message']}{S.RESET_ALL}")


def run_combined_scan(config):
    """Birlesik tarama: SD C4 + XENTRY otomasyonu"""
    print(f"\n{C.CYAN}{'='*55}{S.RESET_ALL}")
    print(f"  {C.WHITE}BIRLESIK TARAMA (SD C4 + XENTRY){S.RESET_ALL}")
    print(f"{'='*55}\n")

    # Adim 1: SD C4 ile direkt OBD tarama
    print(f"  {C.CYAN}[1/2] SD Connect C4 ile OBD tarama...{S.RESET_ALL}")
    scanner = OBDScanner(
        port=config.get("obd_port", "auto"),
        baudrate=config.get("obd_baudrate", 115200),
        adapter_type=config.get("adapter_type", "auto")
    )

    ports = scanner.find_com_ports()
    if ports:
        try:
            scanner.connect()
            print(f"  {C.GREEN}[OK]{S.RESET_ALL} SD C4 baglandi: {scanner.port}")
            vin = scanner.read_vin()
            km = scanner.read_km()
            vehicle = {"vin": vin or "Bilinmiyor", "km": km or 0}
            ecus = scanner.scan_ecus()
            for ecu in ecus:
                codes = scanner.read_fault_codes(ecu["address"])
                ecu["faultCodes"] = codes
                ecu["status"] = "ARIZALI" if codes else "SORUNSUZ"
            scanner.disconnect()
        except Exception as e:
            print(f"  {C.YELLOW}[!]{S.RESET_ALL} SD C4 baglanti hatasi: {e}")
            vehicle = {"vin": "Bilinmiyor", "km": 0}
            ecus = []
    else:
        print(f"  {C.YELLOW}[!]{S.RESET_ALL} SD C4 bulunamadi, atlaniliyor")
        vehicle = {"vin": "Bilinmiyor", "km": 0}
        ecus = []

    # Adim 2: XENTRY ekran otomasyonu
    print(f"\n  {C.CYAN}[2/2] XENTRY ekran otomasyonu...{S.RESET_ALL}")
    try:
        from screen_automator import XENTRYAutomator
        automator = XENTRYAutomator(xentry_path=config.get("xentry_path", ""))
        if automator.is_automation_available() and automator.find_xentry_window():
            xentry_data = automator.get_xentry_diagnostic_data()
            # Birlestir
            if xentry_data.get("vehicle", {}).get("vin") and vehicle.get("vin") == "Bilinmiyor":
                vehicle.update(xentry_data["vehicle"])
            for xm in xentry_data.get("ecus", []):
                ecu_data = {
                    "address": f"0x{xm.get('module_index', 0):02X}",
                    "name": xm.get("name", ""),
                    "description": xm.get("name", ""),
                    "group": "xentry",
                    "faultCodes": [{"code": c, "status": "Aktif"} for c in xm.get("fault_codes", [])],
                    "status": "ARIZALI" if xm.get("fault_codes") else "SORUNSUZ",
                }
                ecus.append(ecu_data)
        else:
            print(f"  {C.YELLOW}[!]{S.RESET_ALL} XENTRY bulunamadi, atlaniliyor")
    except:
        print(f"  {C.YELLOW}[!]{S.RESET_ALL} XENTRY otomasyonu kullanilamaz")

    # Rapor
    reporter = ReportSender(api_url=config.get("api_url", ""))
    report = reporter.format_diagnostic_report(vehicle=vehicle, ecus=ecus, source="combined_scan")
    result = reporter.send_report(report)
    print(f"\n  {C.GREEN if result['success'] else C.RED}{result['message']}{S.RESET_ALL}")


def show_settings(config):
    """Ayarlar menusu"""
    print(f"\n{C.CYAN}{'='*55}{S.RESET_ALL}")
    print(f"  {C.WHITE}AYARLAR{S.RESET_ALL}")
    print(f"{'='*55}\n")
    print(f"  [1] API URL:       {config.get('api_url', '')}")
    print(f"  [2] OBD Portu:     {config.get('obd_port', 'auto')}")
    print(f"  [3] Baudrate:      {config.get('obd_baudrate', 115200)}")
    print(f"  [4] Adaptor Tipi:  {config.get('adapter_type', 'auto')}")
    print(f"  [5] XENTRY Yolu:   {config.get('xentry_path', 'Otomatik')}")
    print(f"  [6] Geri Don")

    choice = input(f"\n  {C.WHITE}Seciminiz: {S.RESET_ALL}").strip()
    if choice == "1":
        new_url = input(f"  Yeni API URL [{config.get('api_url', '')}]: ").strip()
        if new_url:
            config["api_url"] = new_url
    elif choice == "2":
        new_port = input(f"  Port (COM3 veya 'auto') [{config.get('obd_port', 'auto')}]: ").strip()
        if new_port:
            config["obd_port"] = new_port
    elif choice == "3":
        new_baud = input(f"  Baudrate [{config.get('obd_baudrate', 115200)}]: ").strip()
        if new_baud:
            try:
                config["obd_baudrate"] = int(new_baud)
            except:
                print(f"  {C.RED}Gecersiz baudrate!{S.RESET_ALL}")
    elif choice == "4":
        print(f"  Secenekler: auto, sdconnect, elm327")
        new_type = input(f"  Adaptor tipi [{config.get('adapter_type', 'auto')}]: ").strip()
        if new_type:
            config["adapter_type"] = new_type
    elif choice == "5":
        new_path = input(f"  XENTRY yolunu girin: ").strip()
        if new_path:
            config["xentry_path"] = new_path
    elif choice == "6":
        return

    save_config(config)
    print(f"\n  {C.GREEN}[OK]{S.RESET_ALL} Ayarlar kaydedildi!")


def show_pending_reports(config):
    """Bekleyen raporlari goster ve gonder"""
    reporter = ReportSender(api_url=config.get("api_url", ""))
    pending = reporter.get_pending_reports()

    print(f"\n{C.CYAN}{'='*55}{S.RESET_ALL}")
    print(f"  {C.WHITE}BEKLEYEN RAPORLAR{S.RESET_ALL}")
    print(f"{'='*55}\n")

    if not pending:
        print(f"  {C.GREEN}[OK]{S.RESET_ALL} Bekleyen rapor yok.")
        return

    print(f"  {len(pending)} rapor bekliyor:\n")
    for i, r in enumerate(pending):
        vin = r.get("vehicle", {}).get("vin", "?")[:17]
        ts = r.get("timestamp", "?")
        faults = r.get("totalFaults", 0)
        print(f"  [{i+1}] VIN: {vin} | {faults} ariza | {ts}")

    choice = input(f"\n  Tumunu gonder? (E/H): ").strip().upper()
    if choice == "E":
        result = reporter.retry_pending()
        print(f"  {C.GREEN}[OK]{S.RESET_ALL} {result['sent']}/{result['total']} rapor gonderildi")


def main():
    os.system("chcp 65001 >nul 2>&1")
    print_logo()

    # Paket kontrol
    install_dependencies()
    config = load_config()

    while True:
        print(f"\n{C.CYAN}{'='*55}{S.RESET_ALL}")
        print(f"  {C.WHITE}ANA MENU{S.RESET_ALL}")
        print(f"{'='*55}\n")
        print(f"  {C.GREEN}[1]{S.RESET_ALL} SD Connect C4 ile Tarama (Direkt OBD)")
        print(f"  {C.YELLOW}[2]{S.RESET_ALL} XENTRY Otomasyon (Ekran Kontrolu)")
        print(f"  {C.CYAN}[3]{S.RESET_ALL} Birlesik Tarama (SD C4 + XENTRY)")
        print(f"  {C.BLUE}[4]{S.RESET_ALL} Bekleyen Raporlari Gonder")
        print(f"  {C.WHITE}[5]{S.RESET_ALL} Ayarlar")
        print(f"  {C.RED}[6]{S.RESET_ALL} Cikis\n")

        choice = input(f"  {C.WHITE}Seciminiz: {S.RESET_ALL}").strip()

        if choice == "1":
            run_sdconnect_scan(config)
        elif choice == "2":
            run_xentry_automation(config)
        elif choice == "3":
            run_combined_scan(config)
        elif choice == "4":
            show_pending_reports(config)
        elif choice == "5":
            show_settings(config)
        elif choice == "6":
            print(f"\n  {C.CYAN}XENTRY DiagBot Pro kapatiliyor...{S.RESET_ALL}")
            print(f"  {C.WHITE}Gorusuruz!{S.RESET_ALL}\n")
            break
        else:
            print(f"  {C.RED}Gecersiz secim!{S.RESET_ALL}")

        input(f"\n  Devam etmek icin Enter basin...")


if __name__ == "__main__":
    main()
