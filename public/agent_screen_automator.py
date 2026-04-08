#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XENTRY DiagBot Pro - XENTRY Ekran Otomasyon Modulu (v3.0)
SD Connect C4 ile XENTRY/DAS yazilimini otomatik kontrol eder.
VIN, KM, sase bilgisi okur. Tum ECU'lari tarar. Ariza detaylarina iner.
"""

import time
import os
import sys
import json
from typing import Optional, List, Dict, Tuple

try:
    import pyautogui
    from PIL import Image, ImageGrab, ImageOps
    import pygetwindow as gw
    AUTOMATION_AVAILABLE = True
except ImportError:
    AUTOMATION_AVAILABLE = False

# XENTRY EKRAN KOORDINATLARI (1920x1080 referans)
# Not: Gercek koordinatlar XENTRY surumune gore degisebilir
# Agirlikli (relative) koordinatlar kullanilir
XENTRY_COORDS = {
    "tanı_start": (0.35, 0.45),      # Tani baslat butonu
    "diagnosis_start": (0.35, 0.50),  # Diagnosis start
    "vehicle_ident": (0.20, 0.30),     # Arac tanimlama
    "quick_test": (0.30, 0.40),       # Hizli test
    "all_modules": (0.40, 0.50),      # Tum moduller
    "fault_codes": (0.25, 0.35),      # Ariza kodlari
    "detail_view": (0.50, 0.60),      # Detay gorunumu
    "back_button": (0.05, 0.05),      # Geri butonu
    "next_button": (0.85, 0.90),      # Ileri butonu
    "close_popup": (0.50, 0.55),      # Popup kapat
    "vin_display": (0.15, 0.25),      # VIN goruntulenen alan
    "km_display": (0.15, 0.30),       # KM goruntulenen alan
    "ecu_list_start": (0.10, 0.20),   # ECU listesi baslangici
    "ecu_list_end": (0.90, 0.80),     # ECU listesi sonu
}

# Mercedes ariza kodu on ekleri
MB_FAULT_PREFIXES = ['P', 'C', 'B', 'U', 'S', 'E', 'N', 'F', 'A']


class XENTRYAutomator:
    """XENTRY tanı yazilimi otomasyon modulu - SD Connect C4 uyumlu"""

    def __init__(self, xentry_path=None):
        self.xentry_path = xentry_path or self._find_xentry()
        self.window = None
        self.screen_width, self.screen_height = (1920, 1080)
        self.scan_results = []
        self._ocr_available = False
        self._ocr_lang = None

        if AUTOMATION_AVAILABLE:
            self.screen_width, self.screen_height = pyautogui.size()
            # OCR kontrol
            try:
                import pytesseract
                self._ocr_available = True
                self._ocr_lang = 'deu+eng'  # Almanca + Ingilizce (XENTRY Almanca)
            except ImportError:
                self._ocr_available = False

    def _find_xentry(self) -> Optional[str]:
        """XENTRY/DAS kurulum yolunu bul"""
        search_paths = [
            r"C:\Program Files (x86)\Mercedes-Benz\XENTRY\StartDas.exe",
            r"C:\Program Files (x86)\Mercedes-Benz\DAS\StartDas.exe",
            r"C:\Program Files\Mercedes-Benz\XENTRY\StartDas.exe",
            r"C:\Program Files\Mercedes-Benz\DAS\StartDas.exe",
            r"C:\ProgramData\MB\Desktop\XENTRY Start\StartXentry.exe",
            r"C:\Program Files (x86)\Mercedes-Benz\XENTRY Diagnostics\StartDas.exe",
            r"C:\Program Files (x86)\DAS\StartDas.exe",
            r"C:\DAS\StartDas.exe",
            r"C:\Program Files (x86)\StarDiagnosis\SDcontrol\StartSDcontrol.exe",
        ]
        # Windows registry'de de ara
        import winreg
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Mercedes-Benz\DAS", 0, winreg.KEY_READ)
            path, _ = winreg.QueryValueEx(key, "InstallPath")
            winreg.CloseKey(key)
            if path:
                exe = os.path.join(path, "StartDas.exe")
                if os.path.exists(exe):
                    return exe
        except:
            pass

        for path in search_paths:
            if os.path.exists(path):
                return path
        return None

    def is_automation_available(self) -> bool:
        """Otomasyon paketleri yüklü mü?"""
        return AUTOMATION_AVAILABLE

    def find_xentry_window(self):
        """XENTRY penceresini bul"""
        if not AUTOMATION_AVAILABLE:
            return None
        search_terms = ["XENTRY", "DAS", "Mercedes", "Diag", "Star", "SDControl", "Diagnostic"]
        try:
            all_windows = gw.getAllWindows()
            for term in search_terms:
                matches = gw.getWindowsWithTitle(term)
                if matches:
                    for w in matches:
                        if w.visible and w.width > 400 and w.height > 300:
                            self.window = w
                            return self.window
        except Exception:
            pass
        return None

    def launch_xentry(self) -> bool:
        """XENTRY'yi başlat"""
        if not self.xentry_path:
            # Daha geniş arama
            self.xentry_path = self._find_xentry()
        if not self.xentry_path:
            # Masaustunde XENTRY kisayolu ara
            desktop = os.path.join(os.path.expanduser("~"), "Desktop")
            for f in os.listdir(desktop):
                if 'xentry' in f.lower() or 'das' in f.lower() or 'star' in f.lower():
                    if f.endswith('.lnk'):
                        try:
                            import win32com.client
                            shell = win32com.client.Dispatch("WScript.Shell")
                            shortcut = shell.CreateShortCut(os.path.join(desktop, f))
                            if shortcut.TargetPath and os.path.exists(shortcut.TargetPath):
                                self.xentry_path = shortcut.TargetPath
                                break
                        except:
                            pass

        if not self.xentry_path:
            print("  [HATA] XENTRY kurulum yolu bulunamadi!")
            print("  XENTRY'nin yuklu oldugundan emin olun.")
            return False
        if not os.path.exists(self.xentry_path):
            print(f"  [HATA] Dosya bulunamadi: {self.xentry_path}")
            return False
        try:
            os.startfile(self.xentry_path)
            print(f"  XENTRY baslatiliyor... ({self.xentry_path})")
            # XENTRY baslangic suresi uzun olabilir (30-120 sn)
            print(f"  Lutfen bekleyin, XENTRY yukleniyor...")
            for i in range(30):
                time.sleep(3)
                w = self.find_xentry_window()
                if w:
                    print(f"  XENTRY acildi ({i*3} saniye)")
                    return True
            print(f"  [UYARI] XENTRY acilmasi uzun surdu, devam ediliyor...")
            return self.find_xentry_window() is not None
        except Exception as e:
            print(f"  [HATA] XENTRY baslatma hatasi: {e}")
            return False

    def activate_window(self) -> bool:
        """XENTRY penceresini öne getir"""
        if not self.window:
            self.find_xentry_window()
        if not self.window:
            return False
        try:
            if not self.window.isActive:
                self.window.activate()
                time.sleep(0.5)
            if not self.window.isActive:
                self.window.maximize()
                time.sleep(0.5)
            return self.window.isActive
        except Exception:
            try:
                self.window.maximize()
                time.sleep(0.5)
                return True
            except:
                return False

    def get_relative_coords(self, key: str) -> Tuple[int, int]:
        """Ekran koordinatını hesapla (pencere boyutuna göre)"""
        if key not in XENTRY_COORDS:
            return (self.screen_width // 2, self.screen_height // 2)
        rx, ry = XENTRY_COORDS[key]
        if self.window:
            x = self.window.left + int(self.window.width * rx)
            y = self.window.top + int(self.window.height * ry)
        else:
            x = int(self.screen_width * rx)
            y = int(self.screen_height * ry)
        return (x, y)

    def click_at(self, x: int, y: int, delay: float = 0.5) -> bool:
        """Belirtilen koordinata tıkla"""
        try:
            pyautogui.click(x, y)
            time.sleep(delay)
            return True
        except:
            return False

    def click_relative(self, key: str, delay: float = 0.8) -> bool:
        """XENTRY koordinatlarına göre tıkla"""
        x, y = self.get_relative_coords(key)
        return self.click_at(x, y, delay)

    def type_text(self, text: str, delay: float = 0.05) -> bool:
        """Metin yaz (XENTRY için)"""
        try:
            # XENTRY bazen ingilizce klavye bekler
            pyautogui.write(text, interval=delay)
            return True
        except:
            # Fallback: clipboard
            try:
                import pyperclip
                pyperclip.copy(text)
                pyautogui.hotkey('ctrl', 'v')
                return True
            except:
                return False

    def press_key(self, key: str, delay: float = 0.3) -> bool:
        """Tuşa bas"""
        try:
            pyautogui.press(key)
            time.sleep(delay)
            return True
        except:
            return False

    def take_screenshot(self, region=None) -> Optional[object]:
        """Ekran görüntüsü al"""
        try:
            if region:
                return ImageGrab.grab(bbox=region)
            return ImageGrab.grab()
        except:
            return None

    def wait_for_screen_change(self, timeout: int = 15) -> bool:
        """Ekran değişikliğini bekle"""
        try:
            img1 = self.take_screenshot()
            if not img1:
                time.sleep(timeout)
                return True
            start = time.time()
            while time.time() - start < timeout:
                time.sleep(1)
                img2 = self.take_screenshot()
                if img2 and not self._images_equal(img1, img2):
                    return True
            return False
        except:
            time.sleep(timeout)
            return True

    def _images_equal(self, img1, img2, threshold=0.01) -> bool:
        """İki görüntüyü karşılaştır"""
        try:
            # Boyut aynı değilse farklı
            if img1.size != img2.size:
                return False
            # Basit piksel karşılaştırma (örnekleme)
            w, h = img1.size
            step = max(w, h) // 50
            diff_count = 0
            total = 0
            for x in range(0, w, step):
                for y in range(0, h, step):
                    if img1.getpixel((x, y)) != img2.getpixel((x, y)):
                        diff_count += 1
                    total += 1
            if total == 0:
                return True
            return (diff_count / total) < threshold
        except:
            return False

    def extract_text_from_region(self, region: Tuple[int, int, int, int]) -> str:
        """Belirtilen bölgeden metin çıkar (OCR)"""
        if not self._ocr_available:
            return ""
        try:
            import pytesseract
            img = self.take_screenshot(region)
            if img:
                # Gri tonlama ve kontrast artır
                img = ImageOps.grayscale(img)
                img = ImageOps.autocontrast(img, cutoff=5)
                text = pytesseract.image_to_string(img, lang='deu+eng', config='--psm 6')
                return text.strip()
        except Exception as e:
            pass
        return ""

    def find_text_on_screen(self, search_text: str, region=None) -> Optional[Tuple[int, int]]:
        """Ekranda metin ara ve koordinatlarını döndür"""
        if not self._ocr_available:
            return None
        try:
            import pytesseract
            img = self.take_screenshot(region)
            if not img:
                return None
            data = pytesseract.image_to_data(img, lang='deu+eng', output_type=pytesseract.Output.DICT)
            for i, word in enumerate(data['text']):
                if word and search_text.lower() in word.lower():
                    x = data['left'][i] + data['width'][i] // 2
                    y = data['top'][i] + data['height'][i] // 2
                    if region:
                        x += region[0]
                        y += region[1]
                    return (x, y)
        except:
            pass
        return None

    def navigate_to_diagnosis(self) -> bool:
        """XENTRY menülerinden tanı ekranına git"""
        if not AUTOMATION_AVAILABLE or not self.activate_window():
            return False

        print("  XENTRY tanı moduna gidiliyor...")

        # Arama terimleri - XENTRY versiyonuna göre farklı olabilir
        menu_items = [
            ("Diagnose", "Tanı", "Diagnosis", "Fahrzeug"),
            ("Start", "Başlat", "Starten", "OK"),
            ("Quick Test", "Schnelltest", "Hızlı Test", "Rapid Test"),
        ]

        for search_terms in menu_items:
            clicked = False
            for term in search_terms:
                # Ekranda metin ara
                pos = self.find_text_on_screen(term)
                if pos:
                    self.click_at(pos[0], pos[1], delay=2.0)
                    clicked = True
                    self.wait_for_screen_change(timeout=8)
                    break
            if not clicked:
                # Koordinat ile dene
                self.click_relative("tanı_start", delay=2.0)
                self.wait_for_screen_change(timeout=5)

        return True

    def read_vehicle_info_from_xentry(self) -> Dict:
        """XENTRY ekranından araç bilgilerini oku (VIN, KM, Şasi)"""
        info = {"vin": "", "km": "", "chassis": "", "model": ""}

        if not self.activate_window():
            return info

        # VIN okuma - ekranın üst bölgesinde genelde görünür
        vin_region = self.get_region("vin_display")
        vin_text = self.extract_text_from_region(vin_region)
        if vin_text:
            # VIN 17 karakter - regex ile çıkar
            import re
            vin_match = re.findall(r'[A-HJ-NPR-Z0-9]{17}', vin_text.replace(' ', ''))
            if vin_match:
                info["vin"] = vin_match[0]

        # KM okuma
        km_region = self.get_region("km_display")
        km_text = self.extract_text_from_region(km_region)
        if km_text:
            km_match = re.findall(r'[\d.,]+\s*km', km_text, re.IGNORECASE)
            if km_match:
                km_str = km_match[0].replace('.', '').replace(',', '').replace('km', '').replace('KM', '').strip()
                try:
                    info["km"] = int(km_str)
                except:
                    pass

        # Şasi numarası (aynı VIN olabilir veya farklı)
        chassis_match = re.findall(r'[A-Z]{1,3}[\d]{6,8}', vin_text)
        if chassis_match and not info["chassis"]:
            info["chassis"] = chassis_match[0]

        # Model bilgisi
        model_match = re.findall(r'[A-Z]?\d{3}\s*[A-Z]*', vin_text)
        if model_match:
            for m in model_match:
                if len(m) >= 3 and m not in info["vin"]:
                    info["model"] = m
                    break

        return info

    def get_region(self, key: str) -> Tuple[int, int, int, int]:
        """Ekran bölgesi hesapla (x1, y1, x2, y2)"""
        rx, ry = XENTRY_COORDS[key]
        if self.window:
            x1 = self.window.left + int(self.window.width * rx) - 200
            y1 = self.window.top + int(self.window.height * ry) - 30
            x2 = x1 + 400
            y2 = y1 + 60
        else:
            x1 = int(self.screen_width * rx) - 200
            y1 = int(self.screen_height * ry) - 30
            x2 = x1 + 400
            y2 = y1 + 60
        # Sınırları kontrol et
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(self.screen_width, x2)
        y2 = min(self.screen_height, y2)
        return (x1, y1, x2, y2)

    def scan_all_modules(self) -> List[Dict]:
        """XENTRY'de tüm modülleri tara"""
        results = []
        if not AUTOMATION_AVAILABLE or not self.activate_window():
            return results

        print("  XENTRY tüm moduller taraniyor...")
        print("  (Lutfen XENTRY ekranina dokunmayin!)")
        print()

        if self.window:
            w_left = self.window.left
            w_top = self.window.top
            w_w = self.window.width
            w_h = self.window.height

            # Tarama ekranına git
            self.navigate_to_diagnosis()
            time.sleep(2)

            # Tüm modüller tarama butonuna tıkla
            pos = self.find_text_on_screen("Schnelltest") or self.find_text_on_screen("Quick Test") or self.find_text_on_screen("Hizli Test")
            if pos:
                self.click_at(pos[0], pos[1], delay=3)
            else:
                self.click_relative("quick_test", delay=3)

            self.wait_for_screen_change(timeout=15)
            time.sleep(3)

            # Ekran görüntüsü al ve oku
            screenshot = self.take_screenshot()
            if screenshot:
                self._save_screenshot(screenshot, "scan_overview")

            # ECU listesi bölgesini tara
            list_start_y = w_top + int(w_h * XENTRY_COORDS["ecu_list_start"][1])
            list_end_y = w_top + int(w_h * XENTRY_COORDS["ecu_list_end"][1])
            list_x = w_left + w_w // 2
            item_height = int(w_h * 0.035)

            # ECU'ları tıklayarak tara
            y = list_start_y
            ecu_count = 0
            while y < list_end_y:
                self.click_at(list_x, y, delay=2.5)
                time.sleep(1)

                # Ekrandaki metni oku
                ecu_region = (w_left + 50, y - 15, w_left + w_w - 50, y + item_height)
                ecu_text = self.extract_text_from_region(ecu_region)

                ecu_info = {
                    "module_index": ecu_count,
                    "text_found": ecu_text[:200] if ecu_text else "",
                    "scanned": True,
                    "screenshot": False,
                    "fault_codes": []
                }

                # Arıza kodu var mı kontrol et
                if ecu_text:
                    import re
                    fault_pattern = r'[PCBUSNFEA]\d{4,5}'
                    faults = re.findall(fault_pattern, ecu_text)
                    if faults:
                        ecu_info["fault_codes"] = faults

                    # ECU ismini çıkar
                    ecu_info["name"] = ecu_text.split('\n')[0].strip()[:80]

                results.append(ecu_info)
                ecu_count += 1

                # Ekran görüntüsü al (her 5 modülde bir)
                if ecu_count % 5 == 0:
                    ss = self.take_screenshot()
                    if ss:
                        self._save_screenshot(ss, f"ecu_scan_{ecu_count}")

                # Detaya in ve geri dön
                time.sleep(1)
                self.press_key("Escape", delay=0.5)
                time.sleep(0.5)

                y += item_height

            # Son ekran görüntüsü
            final_ss = self.take_screenshot()
            if final_ss:
                self._save_screenshot(final_ss, "scan_complete")

        return results

    def drill_into_fault_detail(self, ecu_name: str) -> Dict:
        """Tek bir ECU'nun arıza detayına in"""
        detail = {
            "ecu": ecu_name,
            "fault_codes": [],
            "descriptions": [],
            "screenshots": []
        }

        if not self.activate_window():
            return detail

        # ECU adını ekranda bul ve tıkla
        pos = self.find_text_on_screen(ecu_name)
        if pos:
            self.click_at(pos[0], pos[1], delay=2.0)
            self.wait_for_screen_change(timeout=8)
            time.sleep(2)

            # Ekran görüntüsü
            ss = self.take_screenshot()
            if ss:
                fname = self._save_screenshot(ss, f"detail_{ecu_name.replace('/','_').replace(' ', '_')}")
                detail["screenshots"].append(fname)

            # Detay metnini oku
            if self.window:
                detail_region = (
                    self.window.left + 50,
                    self.window.top + 50,
                    self.window.left + self.window.width - 50,
                    self.window.top + self.window.height - 100
                )
                detail_text = self.extract_text_from_region(detail_region)
                if detail_text:
                    detail["full_text"] = detail_text
                    # Arıza kodlarını çıkar
                    import re
                    faults = re.findall(r'[PCBUSNFEA]\d{4,5}', detail_text)
                    detail["fault_codes"] = faults

                    # Satır satır parse et
                    lines = detail_text.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line and any(line.startswith(p) for p in MB_FAULT_PREFIXES):
                            detail["descriptions"].append(line)

            # Geri dön
            self.press_key("Escape", delay=0.5)
            time.sleep(1)

        return detail

    def get_xentry_diagnostic_data(self) -> Dict:
        """XENTRY'den tam tanı verisi al - SD Connect C4 ile"""
        data = {
            "source": "xentry_automation",
            "adapter": "sd_connect_c4",
            "vehicle": {},
            "ecus": [],
            "status": "pending"
        }

        if not AUTOMATION_AVAILABLE:
            data["error"] = "Otomasyon paketleri yuklu degil (pyautogui, Pillow)"
            data["status"] = "error"
            return data

        # XENTRY'yi bul/başlat
        self.find_xentry_window()
        if not self.window:
            success = self.launch_xentry()
            if not success:
                data["error"] = "XENTRY baslatilamadi"
                data["status"] = "error"
                return data

        self.activate_window()
        time.sleep(2)

        # Araç bilgilerini oku
        print("  Arac bilgileri XENTRY ekranindan okunuyor...")
        vehicle_info = self.read_vehicle_info_from_xentry()
        data["vehicle"] = vehicle_info
        if vehicle_info.get("vin"):
            print(f"  VIN: {vehicle_info['vin']}")
        if vehicle_info.get("km"):
            print(f"  KM: {vehicle_info['km']}")

        # Tanı moduna git
        self.navigate_to_diagnosis()

        # Tüm modülleri tara
        modules = self.scan_all_modules()

        # Arızalı ECU'ların detayına in
        faulty_modules = [m for m in modules if m.get("fault_codes")]
        if faulty_modules:
            print(f"\n  {len(faulty_modules)} arizali modul detaylaniyor...")
            for module in faulty_modules[:10]:  # Max 10 detay
                name = module.get("name", f"Module_{module['module_index']}")
                detail = self.drill_into_fault_detail(name)
                module["detail"] = detail

        data["ecus"] = modules
        data["status"] = "completed"

        return data

    def _save_screenshot(self, img, name: str) -> Optional[str]:
        """Ekran görüntüsünü kaydet"""
        try:
            reports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports", "screenshots")
            os.makedirs(reports_dir, exist_ok=True)
            ts = time.strftime("%Y%m%d_%H%M%S")
            filepath = os.path.join(reports_dir, f"{name}_{ts}.png")
            img.save(filepath, "PNG")
            return filepath
        except:
            return None
