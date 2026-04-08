#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XENTRY DiagBot Pro - OBD2 Tarama Modulu
Mercedes-Benz araclar icin OBD2/UDS tarama, ariza kodu okuma, canli veri izleme.
"""

import serial
import serial.tools.list_ports
import time
import struct
from typing import Optional

# Mercedes-Benz ECU Adres Haritasi
MERCEDES_ECUS = {
    "0x01": {"name": "EGS", "desc": "Sanziman Beyni", "group": "sanziman"},
    "0x02": {"name": "ME/ME2", "desc": "Motor Beyni", "group": "motor"},
    "0x03": {"name": "AB/ABB", "desc": "Airbag Beyni", "group": "guvenlik"},
    "0x05": {"name": "EGS/722.9", "desc": "9G-Tronic Sanziman", "group": "sanziman"},
    "0x08": {"name": "EVO", "desc": "Direksiyon Beyni", "group": "sasis"},
    "0x0E": {"name": "IRM", "desc": "Arka Aks Surusu", "group": "sasis"},
    "0x10": {"name": "SAM/FL", "desc": "On Sol SAM Modulu", "group": "sam"},
    "0x11": {"name": "SAM/FR", "desc": "On Sag SAM Modulu", "group": "sam"},
    "0x12": {"name": "SAM/RL", "desc": "Arka Sol SAM Modulu", "group": "sam"},
    "0x13": {"name": "SAM/RR", "desc": "Arka Sag SAM Modulu", "group": "sam"},
    "0x14": {"name": "OU", "desc": "Ortam Aydinlatma", "group": "komfor"},
    "0x15": {"name": "ESP", "desc": "Fren/ESP/ABS Beyni", "group": "fren"},
    "0x16": {"name": "SBC", "desc": "Sensotronic Fren", "group": "fren"},
    "0x18": {"name": "RCP", "desc": "Uzak Kilit/Ses Sistemi", "group": "guvenlik"},
    "0x21": {"name": "CGW", "desc": "Merkezi Ag Geçidi", "group": "komunikasyon"},
    "0x25": {"name": "EZW/AB", "desc": "Airbag", "group": "guvenlik"},
    "0x27": {"name": "DRS", "desc": "Arka Aks Diferansiyel", "group": "sasis"},
    "0x2D": {"name": "VAS", "desc": "Seslendirme Sistemi", "group": "komfor"},
    "0x2F": {"name": "HG", "desc": "Kapi Isitmali Ayna", "group": "komfor"},
    "0x30": {"name": "LCL", "desc": "Kapi Kilit Sistemi", "group": "guvenlik"},
    "0x34": {"name": "ICM/KMB", "desc": "Gosterge Paneli", "group": "komfor"},
    "0x36": {"name": "KOMBI", "desc": "Instrument Cluster", "group": "komfor"},
    "0x3D": {"name": "TAA", "desc": "Klima Otomatiği", "group": "komfor"},
    "0x3E": {"name": "KLA", "desc": "Klima", "group": "komfor"},
    "0x3F": {"name": "TAU", "desc": "Tahrik Otomatiği", "group": "motor"},
    "0x40": {"name": "SMK", "desc": "Sanziman Modül Kontrol", "group": "sanziman"},
    "0x44": {"name": "EPS", "desc": "Elektrik Direksiyon", "group": "sasis"},
    "0x4C": {"name": "NAG3", "desc": "NAG3 Sanziman", "group": "sanziman"},
    "0x4F": {"name": "TEL", "desc": "Telematik/COMAND", "group": "komunikasyon"},
    "0x50": {"name": "SMR", "desc": "Radar Sensoru", "group": "adis"},
    "0x52": {"name": "SLR", "desc": "Sol Radar Sensoru", "group": "adis"},
    "0x54": {"name": "MRR", "desc": "On Radar Sensoru", "group": "adis"},
    "0x56": {"name": "ARS", "desc": "Kamera Radar Sistemi", "group": "adis"},
    "0x5A": {"name": "TFL", "desc": "On Kamera", "group": "adis"},
    "0x5C": {"name": "EZS", "desc": "Elektronik Çaliştirma Kilidi", "group": "guvenlik"},
    "0x61": {"name": "RDKS", "desc": "Lastik Basinci Monitörü", "group": "komfor"},
    "0x6A": {"name": "UBF", "desc": "Arka Kamera", "group": "komfor"},
    "0x6B": {"name": "UCL", "desc": "Sesli Komut", "group": "komunikasyon"},
    "0x6D": {"name": "SOS", "desc": "Acil Durum Çagri Sistemi", "group": "komunikasyon"},
    "0x70": {"name": "SAM/H", "desc": "Arka SAM (High)", "group": "sam"},
    "0x73": {"name": "DTR", "desc": "Mesafe Tork Regülasyonu", "group": "adis"},
    "0x76": {"name": "DCA", "desc": "Kapi Kontrol Modülü", "group": "guvenlik"},
    "0x7B": {"name": "UVM", "desc": "Universe Modülü", "group": "komunikasyon"},
}


class OBDScanner:
    """Mercedes-Benz OBD2/UDS Tarama Modulu"""

    def __init__(self, port=None, baudrate=38400):
        self.port = port
        self.baudrate = baudrate
        self.connection = None
        self.ecu_results = []

    def find_com_ports(self):
        """Tüm COM portlarını bul"""
        ports = serial.tools.list_ports.comports()
        result = []
        for p in ports:
            result.append({
                "port": p.device,
                "desc": p.description,
                "hwid": p.hwid
            })
        return result

    def auto_detect_port(self):
        """ELM327 adaptörünü otomatik bul"""
        ports = self.find_com_ports()
        for p in ports:
            desc_lower = p.description.lower()
            if any(kw in desc_lower for kw in ['elm', 'obd', 'can', 'ftdi', 'ch340', 'cp210', 'stlink']):
                return p.port
        if ports:
            return ports[0].port
        return None

    def connect(self):
        """OBD2 portuna bağlan"""
        if self.port is None or self.port == "auto":
            self.port = self.auto_detect_port()
        if self.port is None:
            raise ConnectionError("OBD2 adaptörü bulunamadi!")
        try:
            self.connection = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=2,
                write_timeout=2
            )
            self._initialize_elm()
            return True
        except serial.SerialException as e:
            raise ConnectionError(f"Port baglanti hatasi: {e}")

    def _send_command(self, cmd, expected_prefix=None):
        """ELM327 komut gönder"""
        if not self.connection or not self.connection.is_open:
            raise ConnectionError("Baglanti yok!")
        full_cmd = cmd + "\r\n"
        self.connection.write(full_cmd.encode())
        time.sleep(0.5)
        response = ""
        while True:
            if self.connection.in_waiting:
                chunk = self.connection.read(self.connection.in_waiting).decode(errors='replace')
                response += chunk
                if '>' in response:
                    break
            else:
                break
        response = response.replace('>', '').replace('\r', '').replace('\n', '').strip()
        if "ERROR" in response.upper() or "NO DATA" in response.upper():
            return None
        return response

    def _initialize_elm(self):
        """ELM327 adaptörünü başlat"""
        self._send_command("ATZ")
        time.sleep(1)
        self._send_command("ATE0")
        self._send_command("ATL0")
        self._send_command("ATS0")
        self._send_command("ATH1")
        self._send_command("ATSP6")
        self._send_command("ATDP")

    def read_vin(self):
        """VIN (Şasi Numarasi) oku"""
        response = self._send_command("0902")
        if response and len(response) > 10:
            vin_hex = response[10:28]
            try:
                return bytes.fromhex(vin_hex).decode('ascii').replace('\x00', '')
            except:
                pass
        response = self._send_command("09 02")
        if response and len(response) > 10:
            vin_hex = response[10:28]
            try:
                return bytes.fromhex(vin_hex).decode('ascii').replace('\x00', '')
            except:
                pass
        return None

    def read_km(self):
        """Kilometre oku"""
        response = self._send_command("22 F190")
        if response:
            try:
                data = response.replace(' ', '')
                if 'F190' in data:
                    idx = data.index('F190') + 4
                    km_hex = data[idx:idx+8]
                    km = int(km_hex, 16)
                    return km
            except:
                pass
        response = self._send_command("22 F192")
        if response:
            try:
                data = response.replace(' ', '')
                if 'F192' in data:
                    idx = data.index('F192') + 4
                    km_hex = data[idx:idx+8]
                    km = int(km_hex, 16)
                    return km
            except:
                pass
        return None

    def scan_ecus(self):
        """Tüm Mercedes ECU'larini tara"""
        found_ecus = []
        for addr, info in MERCEDES_ECUS.items():
            addr_int = int(addr, 16)
            cmd = f"{addr_int:02X}22 00 00"
            response = self._send_command(cmd)
            if response is not None:
                found_ecus.append({
                    "address": addr,
                    "name": info["name"],
                    "description": info["desc"],
                    "group": info["group"],
                    "status": "ACTIVE"
                })
        self.ecu_results = found_ecus
        return found_ecus

    def read_fault_codes(self, ecu_address):
        """Belirtilen ECU'dan ariza kodlarini oku"""
        addr_int = int(ecu_address, 16)
        cmd = f"{addr_int:02X}19 02"
        response = self._send_command(cmd)
        codes = []
        if response:
            try:
                data = response.replace(' ', '')
                if '62' in data:
                    idx = data.index('62')
                    fault_data = data[idx+2:]
                    i = 0
                    while i + 8 <= len(fault_data):
                        code_bytes = fault_data[i:i+6]
                        try:
                            first_byte = int(code_bytes[0:2], 16)
                            second_byte = int(code_bytes[2:4], 16)
                            third_byte = int(code_bytes[4:6], 16)
                            prefix = chr(64 + ((first_byte >> 4) & 0x0F))
                            code_num = f"{(first_byte & 0x0F):X}{second_byte:02X}{third_byte:02X}"
                            dtc = f"{prefix}{code_num}"
                            status = "Aktif" if (sixth_byte := int(fault_data[i+6:i+8], 16) if i+8 <= len(fault_data) else 0) & 0x01 else "Depolanan"
                            codes.append({
                                "code": dtc,
                                "status": status
                            })
                        except:
                            pass
                        i += 6
            except:
                pass
        if not codes:
            cmd = f"{addr_int:02X}03"
            response = self._send_command(cmd)
            if response and "NO DATA" not in response.upper():
                try:
                    data = response.replace(' ', '')
                    i = 0
                    while i + 6 <= len(data):
                        try:
                            code_part = data[i:i+6]
                            first = int(code_part[0:2], 16)
                            second = int(code_part[2:4], 16)
                            third = int(code_part[4:6], 16)
                            prefix = chr(64 + ((first >> 4) & 0x0F))
                            code_num = f"{(first & 0x0F):X}{second:02X}{third:02X}"
                            codes.append({"code": f"{prefix}{code_num}", "status": "Aktif"})
                        except:
                            pass
                        i += 6
                except:
                    pass
        return codes

    def clear_fault_codes(self, ecu_address):
        """Belirtilen ECU'daki ariza kodlarini sil"""
        addr_int = int(ecu_address, 16)
        cmd = f"{addr_int:02X}14"
        response = self._send_command(cmd)
        return response is not None

    def read_live_data(self, ecu_address, pid):
        """Canli veri oku"""
        addr_int = int(ecu_address, 16)
        cmd = f"{addr_int:02X}22 {pid}"
        response = self._send_command(cmd)
        if response:
            return response
        cmd = f"{addr_int:02X}01{pid}"
        response = self._send_command(cmd)
        return response

    def get_full_diagnostic(self):
        """Tam tarama yap"""
        vehicle = {
            "vin": self.read_vin() or "Bilinmiyor",
            "km": self.read_km() or 0
        }
        ecus = self.scan_ecus()
        for ecu in ecus:
            codes = self.read_fault_codes(ecu["address"])
            ecu["faultCodes"] = codes
            ecu["status"] = "ARIZALI" if codes else "SORUNSUZ"
        return {
            "vehicle": vehicle,
            "ecus": ecus,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
        }

    def disconnect(self):
        """Baglantiyi kapat"""
        if self.connection and self.connection.is_open:
            self.connection.close()
            self.connection = None
