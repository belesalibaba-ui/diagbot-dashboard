#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XENTRY DiagBot Pro - Ana Modul
Mercedes-Benz arac tarama ve tanı ajanı.
"""

import os
import sys
import json
import time

# Agent klasorunu Python yoluna ekle
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from colorama import init, Fore, Back, Style
    init()
    C = Fore
    S = Style
except ImportError:
    class FakeC:
        def __getattr__(self, name): return ""
        def __call__(self, text): return text
    C = FakeC()
    S = FakeC()

from obd_scanner import OBDScanner, MERCEDES_ECUS
from reporter import ReportSender


def print_logo():
    print(f"""
{C.CYAN}╔═══════════════════════════════════════════════════╗
║     {C.WHITE}██╗  ██╗ █████╗  ██████╗  ██████╗██╗  ██╗{C.CYAN}     ║
║     {C.WHITE}██║ ██╔╝██╔══██╗██╔════╝ ██╔════╝██║ ██╔╝{C.CYAN}     ║
║     {C.WHITE}█████╔╝ ███████║██║  ███╗██║     █████╔╝ {C.CYAN}     ║
║     {C.WHITE}██╔═██╗ ██╔══██║██║   ██║██║     ██╔═██╗ {C.CYAN}     ║
║     {C.WHITE}██║  ██╗██║  ██║╚██████╔╝╚██████╗██║  ██╗{C.CYAN}     ║
║     {C.WHITE}╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝{C.CYAN}     ║
║                                                   ║
║   {C.YELLOW}Mercedes-Benz AI Teshis Ajan Sistemi{C.CYAN}           ║
║   {C.WHITE}Surum: 2.2.0  |  Agent Modu{C.CYAN}                    ║
╚═══════════════════════════════════════════════════╝{S.RESET_ALL}
""")


def load_config():
    """Ayar dosyasini yukle"""
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    default_config = {
        "api_url": "https://diagbot-dashboard.onrender.com",
        "obd_port": "auto",
        "xentry_path": "",
        "language": "tr"
    }
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return default_config


def save_config(config):
    """Ayar dosyasini kaydet"""
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def check_dependencies():
    """Gerekli paketleri kontrol et"""
    missing = []
    try:
        import serial
    except ImportError:
        missing.append("pyserial")
    try:
        import requests
    except ImportError:
        missing.append("requests")
    try:
        import colorama
    except ImportError:
        missing.append("colorama")
    try:
        import pyautogui
    except ImportError:
        missing.append("pyautogui")
    try:
        from PIL import Image
    except ImportError:
        missing.append("Pillow")
    return missing


def install_dependencies():
    """Eksik paketleri kur"""
    missing = check_dependencies()
    if not missing:
        print(f"  {C.GREEN}[OK]{S.RESET_ALL} Tum paketler yuklu.")
        return True
    print(f"  {C.YELLOW}[BILGI]{S.RESET_ALL} Eksik paketler: {', '.join(missing)}")
    print(f"  {C.CYAN}Kuruluyor...{S.RESET_ALL}")
    try:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q"] + missing)
        print(f"  {C.GREEN}[OK]{S.RESET_ALL} Paketler basariyla kuruldu!")
        return True
    except Exception as e:
        print(f"  {C.RED}[HATA]{S.RESET_ALL} Kurulum basarisiz: {e}")
        print(f"  Manually: pip install {' '.join(missing)}")
        return False


def run_obd_scan(config):
    """OBD2 tam tarama yap"""
    print(f"\n{C.CYAN}{'='*50}{S.RESET_ALL}")
    print(f"  {C.WHITE}OBD2 TAM TARAMA BASLATILIYOR...{S.RESET_ALL}")
    print(f"{C.CYAN}{'='*50}{S.RESET_ALL}\n")

    scanner = OBDScanner(port=config.get("obd_port", "auto"))

    # COM portlari listele
    ports = scanner.find_com_ports()
    if not ports:
        print(f"  {C.RED}[HATA]{S.RESET_ALL} Hicbir COM portu bulunamadi!")
        print(f"  OBD2 adaptörünü baglayin ve tekrar deneyin.")
        return

    print(f"  {C.WHITE}Bulunan Portlar:{S.RESET_ALL}")
    for i, p in enumerate(ports):
        print(f"    [{i+1}] {p['port']} - {p['desc']}")

    # Baglan
    print(f"\n  {C.CYAN}Baglaniyor...{S.RESET_ALL}")
    try:
        scanner.connect()
        print(f"  {C.GREEN}[OK]{S.RESET_ALL} OBD2 adaptörüne baglanildi ({scanner.port})")
    except Exception as e:
        print(f"  {C.RED}[HATA]{S.RESET_ALL} {e}")
        return

    # VIN oku
    print(f"\n  {C.CYAN}Araç bilgileri okunuyor...{S.RESET_ALL}")
    vin = scanner.read_vin()
    if vin:
        print(f"  {C.GREEN}[VIN]{S.RESET_ALL} {vin}")
    else:
        print(f"  {C.YELLOW}[VIN]{S.RESET_ALL} Okunamadi (bazi araclar desteklemez)")

    # KM oku
    km = scanner.read_km()
    if km:
        print(f"  {C.GREEN}[KM]{S.RESET_ALL} {km:,} km")
    else:
        print(f"  {C.YELLOW}[KM]{S.RESET_ALL} Okunamadi")

    # ECU taramasi
    print(f"\n  {C.CYAN}ECU taramasi baslatiliyor...{S.RESET_ALL}")
    print(f"  (Bu islem birkaç dakika sürebilir)\n")

    ecus = scanner.scan_ecus()

    if not ecus:
        print(f"  {C.YELLOW}[UYARI]{S.RESET_ALL} Hicbir ECU bulunamadi.")
        print(f"  Muhtemel nedenler:")
        print(f"    - Ignition (kontak) acik degil")
        print(f"    - OBD2 adaptörü dogru baglanmamis")
        print(f"    - Arac uyumlu degil")
        scanner.disconnect()
        return

    print(f"  {C.GREEN}[OK]{S.RESET_ALL} {len(ecus)} ECU bulundu!\n")

    # Ariza kodu okuma
    faulty_count = 0
    total_faults = 0

    for ecu in ecus:
        is_good = ecu["status"] == "ACTIVE"
        icon = f"{C.GREEN}●{S.RESET_ALL}" if is_good else f"{C.RED}●{S.RESET_ALL}"
        print(f"  {icon} {C.WHITE}[{ecu['address']}] {ecu['description']}{S.RESET_ALL} ({ecu['name']})")

        codes = scanner.read_fault_codes(ecu["address"])
        ecu["faultCodes"] = codes
        if codes:
            faulty_count += 1
            total_faults += len(codes)
            for code in codes:
                urgency = C.RED if code["status"] == "Aktif" else C.YELLOW
                print(f"      {urgency}├─ {code['code']} ({code['status']}){S.RESET_ALL}")
        else:
            ecu["status"] = "SORUNSUZ"

    # Ozet
    print(f"\n{C.CYAN}{'='*50}{S.RESET_ALL}")
    print(f"  {C.WHITE}TARAMA OZETI{S.RESET_ALL}")
    print(f"{C.CYAN}{'='*50}{S.RESET_ALL}")
    print(f"  Toplam ECU:        {len(ecus)}")
    print(f"  Arizali ECU:       {faulty_count}")
    print(f"  Toplam Ariza Kodu: {total_faults}")

    if faulty_count == 0:
        print(f"\n  {C.GREEN}Tebrikler! Arac sorunsuz.{S.RESET_ALL}")
    else:
        print(f"\n  {C.RED}Dikkat! {faulty_count} ECU'de ariza tespit edildi.{S.RESET_ALL}")

    # Rapor olustur ve gonder
    print(f"\n  {C.CYAN}Rapor olusturuluyor...{S.RESET_ALL}")
    scanner.disconnect()

    reporter = ReportSender(api_url=config.get("api_url", ""))
    report = reporter.format_diagnostic_report(
        vehicle={"vin": vin or "Bilinmiyor", "km": km or 0},
        ecus=ecus
    )

    print(f"  {C.CYAN}Rapor gonderiliyor...{S.RESET_ALL}")
    result = reporter.send_report(report)
    print(f"  {C.GREEN if result['success'] else C.RED}{result['message']}{S.RESET_ALL}")

    # Yerel rapor kaydet
    ts = time.strftime("%Y%m%d_%H%M%S")
    report_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports", f"tarama_{ts}.json")
    os.makedirs(os.path.dirname(report_file), exist_ok=True)
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"  {C.GREEN}[OK]{S.RESET_ALL} Yerel rapor: {report_file}")


def run_xentry_automation(config):
    """XENTRY ekran otomasyonu"""
    print(f"\n{C.CYAN}{'='*50}{S.RESET_ALL}")
    print(f"  {C.WHITE}XENTRY EKRAN OTOMASYONU{S.RESET_ALL}")
    print(f"{C.CYAN}{'='*50}{S.RESET_ALL}\n")

    try:
        from screen_automator import XENTRYAutomator
    except ImportError:
        print(f"  {C.RED}[HATA]{S.RESET_ALL} pyautogui veya Pillow yuklu degil!")
        print(f"  pip install pyautogui Pillow pygetwindow")
        return

    automator = XENTRYAutomator(xentry_path=config.get("xentry_path", ""))

    if not automator.is_automation_available():
        print(f"  {C.RED}[HATA]{S.RESET_ALL} Otomasyon paketleri yuklu degil!")
        return

    print(f"  XENTRY yolu: {automator.xentry_path or 'Otomatik aranacak'}")

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

    automator.activate_window()
    print(f"\n  {C.CYAN}Tanı moduna gidiliyor...{S.RESET_ALL}")
    automator.navigate_to_diagnosis()
    print(f"  {C.GREEN}[OK]{S.RESET_ALL} Tanı ekranina gidildi")

    print(f"\n  {C.CYAN}Tum moduller taraniyor...{S.RESET_ALL}")
    print(f"  (Bu islem uzun sürebilir - lutfen bekleyin)\n")

    modules = automator.scan_all_modules()
    print(f"\n  {C.GREEN}[OK]{S.RESET_ALL} {len(modules)} modul tarandi")

    # Veri topla
    data = automator.get_xentry_diagnostic_data()

    reporter = ReportSender(api_url=config.get("api_url", ""))
    report = reporter.format_diagnostic_report(
        vehicle=data.get("vehicle", {"vin": "XENTRY", "km": 0}),
        ecus=data.get("ecus", [])
    )
    report["source"] = "xentry_automation"

    result = reporter.send_report(report)
    print(f"  {C.GREEN if result['success'] else C.RED}{result['message']}{S.RESET_ALL}")


def show_settings(config):
    """Ayarlar menusu"""
    print(f"\n{C.CYAN}{'='*50}{S.RESET_ALL}")
    print(f"  {C.WHITE}AYARLAR{S.RESET_ALL}")
    print(f"{C.CYAN}{'='*50}{S.RESET_ALL}\n")
    print(f"  [1] API URL:      {config.get('api_url', '')}")
    print(f"  [2] OBD Portu:    {config.get('obd_port', 'auto')}")
    print(f"  [3] XENTRY Yolu:  {config.get('xentry_path', 'Otomatik')}")
    print(f"  [4] Geri Don")

    choice = input(f"\n  {C.WHITE}Seciminiz: {S.RESET_ALL}").strip()
    if choice == "1":
        print(f"  Mevcut: {config.get('api_url', '')}")
        new_url = input("  Yeni API URL: ").strip()
        if new_url:
            config["api_url"] = new_url
    elif choice == "2":
        print(f"  Mevcut: {config.get('obd_port', 'auto')}")
        new_port = input("  Port (COM3 veya 'auto'): ").strip()
        if new_port:
            config["obd_port"] = new_port
    elif choice == "3":
        print(f"  Mevcut: {config.get('xentry_path', 'Otomatik')}")
        new_path = input("  XENTRY yolunu girin: ").strip()
        if new_path:
            config["xentry_path"] = new_path

    save_config(config)
    print(f"\n  {C.GREEN}[OK]{S.RESET_ALL} Ayarlar kaydedildi!")


def main():
    """Ana menu"""
    os.system("chcp 65001 >nul 2>&1")
    print_logo()

    # Paket kontrol
    install_dependencies()
    config = load_config()

    while True:
        print(f"\n{C.CYAN}{'='*50}{S.RESET_ALL}")
        print(f"  {C.WHITE}ANA MENU{S.RESET_ALL}")
        print(f"{C.CYAN}{'='*50}{S.RESET_ALL}\n")
        print(f"  {C.GREEN}[1]{S.RESET_ALL} OBD2 Tarama Baslat")
        print(f"  {C.YELLOW}[2]{S.RESET_ALL} XENTRY Otomasyon")
        print(f"  {C.BLUE}[3]{S.RESET_ALL} Ayarlar")
        print(f"  {C.RED}[4]{S.RESET_ALL} Cikis\n")

        choice = input(f"  {C.WHITE}Seciminiz: {S.RESET_ALL}").strip()

        if choice == "1":
            run_obd_scan(config)
        elif choice == "2":
            run_xentry_automation(config)
        elif choice == "3":
            show_settings(config)
        elif choice == "4":
            print(f"\n  {C.CYAN}XENTRY DiagBot Pro kapatiliyor...{S.RESET_ALL}")
            print(f"  {C.WHITE}Gorusuruz!{S.RESET_ALL}\n")
            break
        else:
            print(f"  {C.RED}Gecersiz secim!{S.RESET_ALL}")

        input(f"\n  Devam etmek icin Enter basin...")


if __name__ == "__main__":
    main()
