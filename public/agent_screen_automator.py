#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XENTRY DiagBot Pro - XENTRY Ekran Otomasyon Modulu
XENTRY tanı yazilimi otomatik kontrol, ekran okuma, veri cikarma.
"""

import time
import os
import json
from typing import Optional, List, Dict

try:
    import pyautogui
    from PIL import Image, ImageGrab
    import pygetwindow as gw
    AUTOMATION_AVAILABLE = True
except ImportError:
    AUTOMATION_AVAILABLE = False


class XENTRYAutomator:
    """XENTRY tanı yazilimi otomasyon modulu"""

    def __init__(self, xentry_path=None):
        self.xentry_path = xentry_path or self._find_xentry()
        self.window = None
        self.screen_width, self.screen_height = pyautogui.size() if AUTOMATION_AVAILABLE else (1920, 1080)

    def _find_xentry(self):
        """XENTRY kurulum yolunu bul"""
        search_paths = [
            r"C:\Program Files (x86)\Mercedes-Benz\XENTRY\StartDas.exe",
            r"C:\Program Files (x86)\Mercedes-Benz\DAS\StartDas.exe",
            r"C:\Program Files\Mercedes-Benz\XENTRY\StartDas.exe",
            r"C:\Program Files\Mercedes-Benz\DAS\StartDas.exe",
            r"C:\ProgramData\MB\Desktop\XENTRY Start\StartXentry.exe",
        ]
        for path in search_paths:
            if os.path.exists(path):
                return path
        return None

    def is_automation_available(self):
        """Otomasyon paketleri yuklu mu?"""
        return AUTOMATION_AVAILABLE

    def find_xentry_window(self):
        """XENTRY penceresini bul"""
        if not AUTOMATION_AVAILABLE:
            return None
        try:
            windows = gw.getWindowsWithTitle("XENTRY")
            if not windows:
                windows = gw.getWindowsWithTitle("DAS")
            if not windows:
                windows = gw.getWindowsWithTitle("Mercedes")
            if not windows:
                windows = gw.getWindowsWithTitle("Diag")
            if windows:
                self.window = windows[0]
                return self.window
        except Exception:
            pass
        return None

    def launch_xentry(self):
        """XENTRY'yi baslat"""
        if not self.xentry_path:
            print("  [HATA] XENTRY kurulum yolu bulunamadi!")
            return False
        if not os.path.exists(self.xentry_path):
            print(f"  [HATA] Dosya bulunamadi: {self.xentry_path}")
            return False
        try:
            os.startfile(self.xentry_path)
            time.sleep(8)
            return self.find_xentry_window() is not None
        except Exception as e:
            print(f"  [HATA] XENTRY baslatma hatasi: {e}")
            return False

    def activate_window(self):
        """XENTRY penceresini one getir"""
        if not self.window:
            self.find_xentry_window()
        if self.window:
            try:
                self.window.activate()
                time.sleep(0.5)
                return True
            except Exception:
                try:
                    self.window.maximize()
                    time.sleep(0.5)
                    return True
                except Exception:
                    return False
        return False

    def take_screenshot(self, region=None):
        """Ekran goruntusu al"""
        if not AUTOMATION_AVAILABLE:
            return None
        try:
            if region:
                return ImageGrab.grab(bbox=region)
            return ImageGrab.grab()
        except Exception:
            return None

    def click_at(self, x, y, delay=0.5):
        """Belirtilen koordinata tikla"""
        if not AUTOMATION_AVAILABLE:
            return False
        try:
            pyautogui.click(x, y)
            time.sleep(delay)
            return True
        except Exception:
            return False

    def type_text(self, text, delay=0.05):
        """Metin yaz"""
        if not AUTOMATION_AVAILABLE:
            return False
        try:
            pyautogui.write(text, interval=delay)
            return True
        except Exception:
            return False

    def press_key(self, key, delay=0.3):
        """Tusa bas"""
        if not AUTOMATION_AVAILABLE:
            return False
        try:
            pyautogui.press(key)
            time.sleep(delay)
            return True
        except Exception:
            return False

    def wait_for_screen_change(self, timeout=15):
        """Ekran degisikliğini bekle"""
        if not AUTOMATION_AVAILABLE:
            return False
        try:
            img1 = ImageGrab.grab()
            start = time.time()
            while time.time() - start < timeout:
                time.sleep(1)
                img2 = ImageGrab.grab()
                if list(img1.getdata()) != list(img2.getdata()):
                    return True
            return False
        except Exception:
            return False

    def navigate_to_diagnosis(self):
        """XENTRY menulerinden tanı ekranına git"""
        if not AUTOMATION_AVAILABLE:
            return False
        if not self.activate_window():
            return False
        xentry_buttons = [
            {"label": "Tanı", "x_offset": 0.5, "y_offset": 0.3},
            {"label": "Diagnosis", "x_offset": 0.5, "y_offset": 0.3},
            {"label": "Başlat", "x_offset": 0.5, "y_offset": 0.5},
            {"label": "Start", "x_offset": 0.5, "y_offset": 0.5},
        ]
        if self.window:
            w_left = self.window.left
            w_top = self.window.top
            w_w = self.window.width
            w_h = self.window.height
            for btn in xentry_buttons:
                x = w_left + int(w_w * btn["x_offset"])
                y = w_top + int(w_h * btn["y_offset"])
                self.click_at(x, y, delay=2)
                self.wait_for_screen_change(timeout=5)
        return True

    def scan_all_modules(self):
        """Tüm XENTRY tarama modüllerini calistir"""
        results = []
        if not AUTOMATION_AVAILABLE:
            return results
        if not self.activate_window():
            return results
        if self.window:
            w_left = self.window.left
            w_top = self.window.top
            w_w = self.window.width
            w_h = self.window.height
            num_modules = 10
            for i in range(num_modules):
                y_pos = w_top + int(w_h * 0.25) + int(i * w_h * 0.05)
                self.click_at(w_left + w_w // 2, y_pos, delay=3)
                self.wait_for_screen_change(timeout=8)
                results.append({
                    "module_index": i,
                    "scanned": True,
                    "screenshot": bool(self.take_screenshot())
                })
                self.press_key("Escape", delay=1)
        return results

    def extract_text_from_region(self, region):
        """Belirtilen bolgeden metin cikar (temel)"""
        if not AUTOMATION_AVAILABLE:
            return ""
        try:
            import pytesseract
            img = self.take_screenshot(region)
            if img:
                text = pytesseract.image_to_string(img, lang='deu+eng')
                return text.strip()
        except ImportError:
            print("  [BILGI] pytesseract yuklu degil - OCR kullanilamiyor")
        except Exception as e:
            print(f"  [HATA] OCR hatasi: {e}")
        return ""

    def get_xentry_diagnostic_data(self):
        """XENTRY'den tam tanı verisi al (otomasyon)"""
        if not AUTOMATION_AVAILABLE:
            return {"error": "Otomasyon paketleri yuklu degil"}

        data = {
            "source": "xentry_automation",
            "vehicle": {},
            "ecus": [],
            "raw_screenshots": []
        }

        self.find_xentry_window()
        if not self.window:
            success = self.launch_xentry()
            if not success:
                data["error"] = "XENTRY baslatilamadi"
                return data

        self.activate_window()
        time.sleep(2)

        screenshot = self.take_screenshot()
        if screenshot:
            data["raw_screenshots"].append("screenshot_taken")

        self.navigate_to_diagnosis()

        modules = self.scan_all_modules()

        data["ecus"] = modules
        data["status"] = "completed"
        return data
