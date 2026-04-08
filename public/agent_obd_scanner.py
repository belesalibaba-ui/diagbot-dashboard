#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
XENTRY DiagBot Pro - OBD2/SD Connect C4 Tarama Modulu
Mercedes-Benz araclar icin OBD2/UDS/ISO-TP tarama, ariza kodu okuma.
SD Connect C4 ve ELM327 adaptörlerini destekler.
"""

import serial
import serial.tools.list_ports
import time
import struct
from typing import Optional, List, Dict

# Mercedes-Benz ECU Adres Haritasi - DETAYLI
MERCEDES_ECUS = {
    "0x01": {"name": "EGS", "desc": "Sanziman Beyni", "group": "sanziman", "priority": 2},
    "0x02": {"name": "ME/ME2", "desc": "Motor Beyni (ECM)", "group": "motor", "priority": 1},
    "0x03": {"name": "AB/ABB", "desc": "Airbag Beyni", "group": "guvenlik", "priority": 4},
    "0x05": {"name": "EGS/722.9", "desc": "9G-Tronic Sanziman", "group": "sanziman", "priority": 2},
    "0x07": {"name": "EIS/EZS", "desc": "Elektronik Ignition Lock", "group": "guvenlik", "priority": 5},
    "0x08": {"name": "EVO", "desc": "Direksiyon Beyni (EPS)", "group": "sasis", "priority": 5},
    "0x0E": {"name": "IRM", "desc": "Arka Aks Surusu", "group": "sasis", "priority": 5},
    "0x10": {"name": "SAM/FL", "desc": "On Sol SAM Modulu", "group": "sam", "priority": 3},
    "0x11": {"name": "SAM/FR", "desc": "On Sag SAM Modulu", "group": "sam", "priority": 3},
    "0x12": {"name": "SAM/RL", "desc": "Arka Sol SAM Modulu", "group": "sam", "priority": 3},
    "0x13": {"name": "SAM/RR", "desc": "Arka Sag SAM Modulu", "group": "sam", "priority": 3},
    "0x14": {"name": "OU", "desc": "Ortam Aydinlatma", "group": "komfor", "priority": 6},
    "0x15": {"name": "ESP/ABS", "desc": "Fren/ESP/ABS Beyni", "group": "fren", "priority": 4},
    "0x16": {"name": "SBC", "desc": "Sensotronic Fren Sistemi", "group": "fren", "priority": 4},
    "0x18": {"name": "RCP", "desc": "Uzak Kilit/Ses Sistemi (KESSY)", "group": "guvenlik", "priority": 5},
    "0x21": {"name": "CGW", "desc": "Merkezi Ag Gecidi (ZGW)", "group": "komunikasyon", "priority": 4},
    "0x25": {"name": "EZW/AB", "desc": "Airbag Kontrol Modulu", "group": "guvenlik", "priority": 4},
    "0x27": {"name": "DRS", "desc": "Arka Aks Diferansiyel", "group": "sasis", "priority": 5},
    "0x2D": {"name": "VAS", "desc": "Seslendirme Sistemi", "group": "komfor", "priority": 6},
    "0x2F": {"name": "HG", "desc": "Kapi Isitmali Ayna", "group": "komfor", "priority": 6},
    "0x30": {"name": "LCL", "desc": "Kapi Kilit Sistemi", "group": "guvenlik", "priority": 5},
    "0x34": {"name": "ICM/KMB", "desc": "Gosterge Paneli (Kombi)", "group": "komfor", "priority": 5},
    "0x36": {"name": "KOMBI", "desc": "Instrument Cluster", "group": "komfor", "priority": 5},
    "0x3D": {"name": "TAA", "desc": "Klima Otomatiği (HVAC)", "group": "komfor", "priority": 6},
    "0x3E": {"name": "KLA", "desc": "Klima Modulu", "group": "komfor", "priority": 6},
    "0x3F": {"name": "TAU", "desc": "Tahrik Otomatiği (4MATIC)", "group": "motor", "priority": 3},
    "0x40": {"name": "SMK", "desc": "Sanziman Modul Kontrol", "group": "sanziman", "priority": 2},
    "0x44": {"name": "EPS", "desc": "Elektrik Direksiyon", "group": "sasis", "priority": 5},
    "0x4C": {"name": "NAG3", "desc": "NAG3 Sanziman (722.6)", "group": "sanziman", "priority": 2},
    "0x4F": {"name": "TEL", "desc": "Telematik/COMAND Online", "group": "komunikasyon", "priority": 6},
    "0x50": {"name": "SMR", "desc": "Radar Sensoru", "group": "adis", "priority": 5},
    "0x52": {"name": "SLR", "desc": "Sol Radar Sensoru", "group": "adis", "priority": 5},
    "0x54": {"name": "MRR", "desc": "On Radar Sensoru", "group": "adis", "priority": 5},
    "0x56": {"name": "ARS", "desc": "Kamera Radar Sistemi", "group": "adis", "priority": 5},
    "0x5A": {"name": "TFL", "desc": "On Kamera (Traffic Sign)", "group": "adis", "priority": 5},
    "0x5C": {"name": "EZS", "desc": "Elektronik Calistirma Kilidi", "group": "guvenlik", "priority": 4},
    "0x61": {"name": "RDKS", "desc": "Lastik Basinci Monitörü (TPMS)", "group": "komfor", "priority": 6},
    "0x6A": {"name": "UBF", "desc": "Arka Kamera", "group": "komfor", "priority": 6},
    "0x6B": {"name": "UCL", "desc": "Sesli Komut (LINGUATRONIC)", "group": "komunikasyon", "priority": 6},
    "0x6D": {"name": "SOS", "desc": "Acil Durum Cagri Sistemi", "group": "komunikasyon", "priority": 5},
    "0x70": {"name": "SAM/H", "desc": "Arka SAM (High)", "group": "sam", "priority": 3},
    "0x73": {"name": "DTR", "desc": "Mesafe Tork Regülasyonü (Distronic)", "group": "adis", "priority": 5},
    "0x76": {"name": "DCA", "desc": "Kapi Kontrol Modülü", "group": "guvenlik", "priority": 5},
    "0x7B": {"name": "UVM", "desc": "Universe Modülü (SGA)", "group": "komunikasyon", "priority": 5},
}

# Tarama sirasi: once kritik, sonra digerleri
SCAN_ORDER = {
    1: ["0x02", "0x3F"],       # Motor beyni + Tahrik
    2: ["0x01", "0x05", "0x40", "0x4C"],  # Sanziman beynleri
    3: ["0x10", "0x11", "0x12", "0x13", "0x70"],  # SAM modulleri
    4: ["0x15", "0x16"],       # ESP/ABS/Fren
    5: ["0x03", "0x25", "0x07"],  # Guvenlik (Airbag, EIS)
    6: ["0x21", "0x18", "0x5C"],  # Ag gecidi, Uzak kilit
}


class OBDScanner:
    """Mercedes-Benz OBD2/UDS/ISO-TP Tarama - SD Connect C4 + ELM327"""

    def __init__(self, port=None, baudrate=115200, adapter_type="auto"):
        self.port = port
        self.baudrate = baudrate
        self.adapter_type = adapter_type  # "sdconnect", "elm327", "auto"
        self.connection = None
        self.ecu_results = []
        self._is_sdconnect = False

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
        """Adaptörü otomatik bul - SD Connect C4 öncelikli"""
        ports = self.find_com_ports()
        # SD Connect C4 önce
        for p in ports:
            desc_lower = p.description.lower()
            hwid_lower = p.hwid.lower()
            if any(kw in desc_lower for kw in ['sd connect', 'sdconnect', 'c4', 'c5', 'c6', 'sd c4', 'multiplexer']):
                self._is_sdconnect = True
                self.adapter_type = "sdconnect"
                return p.port
        # Mercedes/VDI adaptörler
        for p in ports:
            desc_lower = p.description.lower()
            hwid_lower = p.hwid.lower()
            if any(kw in desc_lower for kw in ['mercedes', 'benz', 'vediamo', 'vci', 'passthrough']):
                self._is_sdconnect = True
                self.adapter_type = "sdconnect"
                return p.port
        # FTDI çipler (SD C4 genelde FTDI kullanır)
        for p in ports:
            hwid_lower = p.hwid.lower()
            if 'ftdi' in hwid_lower or 'vid_0403' in hwid_lower:
                self._is_sdconnect = True
                self.adapter_type = "sdconnect"
                return p.port
        # ELM327
        for p in ports:
            desc_lower = p.description.lower()
            if any(kw in desc_lower for kw in ['elm', 'obd', 'can', 'ch340', 'cp210']):
                self._is_sdconnect = False
                self.adapter_type = "elm327"
                return p.port
        # Son çare ilk port
        if ports:
            self.adapter_type = "auto"
            return ports[0].port
        return None

    def connect(self):
        """OBD2/SD C4 portuna bağlan"""
        if self.port is None or self.port == "auto":
            self.port = self.auto_detect_port()
        if self.port is None:
            raise ConnectionError("Hicbir adaptor bulunamadi! SD Connect C4'ü baglayin.")
        try:
            baud = self.baudrate
            if self.adapter_type == "sdconnect":
                baud = 115200
            self.connection = serial.Serial(
                port=self.port,
                baudrate=baud,
                timeout=3,
                write_timeout=3
            )
            if self.adapter_type in ("sdconnect", "auto"):
                self._initialize_sdconnect()
            else:
                self._initialize_elm()
            return True
        except serial.SerialException as e:
            raise ConnectionError(f"Port baglanti hatasi: {e}")

    def _initialize_sdconnect(self):
        """SD Connect C4'ü başlat - ISO-TP over CAN"""
        self.connection.baudrate = 115200
        self.connection.reset_input_buffer()
        self.connection.reset_output_buffer()
        time.sleep(0.5)
        # SD C4 ISO-TP başlatma
        self._send_raw("ATZ\r\n")
        time.sleep(1.0)
        self._send_raw("ATE0\r\n")
        time.sleep(0.2)
        self._send_raw("ATL0\r\n")
        time.sleep(0.2)
        self._send_raw("ATSP6\r\n")  # CAN 500Kbps (Mercedes default)
        time.sleep(0.5)
        # Protokol test
        resp = self._send_raw("22 F1 90\r\n")  # KM okuma denemesi
        if resp and "7F" not in resp:
            self._is_sdconnect = True

    def _initialize_elm(self):
        """ELM327 adaptörünü başlat"""
        self.connection.baudrate = 38400
        self.connection.reset_input_buffer()
        self.connection.reset_output_buffer()
        time.sleep(0.3)
        self._send_raw("ATZ\r\n")
        time.sleep(1.0)
        self._send_raw("ATE0\r\n")
        time.sleep(0.2)
        self._send_raw("ATL0\r\n")
        time.sleep(0.2)
        self._send_raw("ATS0\r\n")
        time.sleep(0.2)
        self._send_raw("ATH1\r\n")
        time.sleep(0.2)
        self._send_raw("ATSP6\r\n")
        time.sleep(0.3)

    def _send_raw(self, cmd: str, timeout: float = 2.0) -> Optional[str]:
        """Ham komut gönder ve yanıt al"""
        if not self.connection or not self.connection.is_open:
            return None
        try:
            self.connection.reset_input_buffer()
            self.connection.write(cmd.encode('ascii'))
            self.connection.flush()
            time.sleep(0.3)
            response = ""
            start_time = time.time()
            while time.time() - start_time < timeout:
                if self.connection.in_waiting:
                    chunk = self.connection.read(self.connection.in_waiting).decode(errors='replace')
                    response += chunk
                    if '>' in response:
                        break
                else:
                    time.sleep(0.05)
            # Temizle
            response = response.replace('>', '').replace('\r', '').replace('\n', '').strip()
            # ELM prompt karakterlerini temizle
            response = response.replace('SEARCHING...', '').replace('OK', '').strip()
            if "ERROR" in response.upper() or "NO DATA" in response.upper() or "?" in response:
                return None
            return response if len(response) > 0 else None
        except Exception:
            return None

    def _send_iso_tp(self, ecu_addr: str, service: str, params: str = "") -> Optional[str]:
        """ISO-TP (ISO 15765) üzerinden UDS komut gönder"""
        addr_int = int(ecu_addr, 16)
        if self._is_sdconnect:
            # SD C4: Dogrudan CAN frame
            cmd = f"{addr_int:02X}{service}{params}"
            return self._send_raw(cmd + "\r\n", timeout=3.0)
        else:
            # ELM327: Header formati
            cmd = f"{addr_int:02X} {service} {params}"
            return self._send_raw(cmd + "\r\n", timeout=3.0)

    def read_vin(self) -> Optional[str]:
        """VIN (Şasi Numarası) oku - Birden fazla yöntem"""
        # Yöntem 1: UDS 22 F1 90 (Mercedes specific)
        resp = self._send_raw("22 F1 90\r\n", timeout=3.0)
        if resp and len(resp) > 10:
            vin = self._extract_vin_from_response(resp)
            if vin and len(vin) == 17:
                return vin
        # Yöntem 2: UDS Service 09
        for service in ["0902", "09 02"]:
            resp = self._send_raw(service + "\r\n", timeout=3.0)
            if resp and len(resp) > 10:
                vin = self._extract_vin_from_response(resp)
                if vin and len(vin) == 17:
                    return vin
        # Yöntem 3: Standard OBD2 Mode 9 PID 2
        resp = self._send_raw("09 02\r\n", timeout=3.0)
        if resp and len(resp) > 10:
            vin = self._extract_vin_from_response(resp)
            if vin and len(vin) == 17:
                return vin
        return None

    def _extract_vin_from_response(self, response: str) -> Optional[str]:
        """Yanıttan VIN çıkar"""
        try:
            # Response format: 49 02 01 VIN...
            # veya: 62 F190 VIN...
            data = response.replace(' ', '')
            # 49 02 veya 62 F190 header'ını atla
            for marker in ['4902', '62F190']:
                idx = data.upper().find(marker)
                if idx >= 0:
                    vin_hex = data[idx + len(marker):]
                    # VIN 17 karakter = 34 hex digit
                    if len(vin_hex) >= 34:
                        vin_hex = vin_hex[:34]
                    vin_bytes = bytes.fromhex(vin_hex)
                    vin = vin_bytes.decode('ascii', errors='ignore').strip()
                    # Sadece ASCII karakterler
                    vin = ''.join(c for c in vin if c.isalnum())
                    if len(vin) >= 17:
                        return vin[:17]
            # Direkt hex decode dene
            clean = ''.join(c for c in response if c in '0123456789ABCDEFabcdef')
            if len(clean) >= 34:
                for offset in range(min(len(clean) - 34, 20)):
                    try:
                        chunk = clean[offset:offset+34]
                        test = bytes.fromhex(chunk).decode('ascii', errors='ignore')
                        if test[0].isupper() and len([c for c in test if c.isalnum()]) >= 14:
                            return test[:17]
                    except:
                        continue
        except:
            pass
        return None

    def read_km(self) -> Optional[int]:
        """Kilometre oku - Mercedes UDS komutları"""
        # Yöntem 1: Service 22 F1 90 (Mercedes specific)
        resp = self._send_raw("22 F1 90\r\n", timeout=3.0)
        if resp:
            km = self._extract_km_from_response(resp)
            if km is not None:
                return km
        # Yöntem 2: Service 22 F1 92
        resp = self._send_raw("22 F1 92\r\n", timeout=3.0)
        if resp:
            km = self._extract_km_from_response(resp)
            if km is not None:
                return km
        return None

    def _extract_km_from_response(self, response: str) -> Optional[int]:
        """Yanıttan km değerini çıkar"""
        try:
            data = response.replace(' ', '').upper()
            for marker in ['62F190', 'F190']:
                idx = data.find(marker)
                if idx >= 0:
                    km_hex = data[idx + len(marker):idx + len(marker) + 8]
                    if len(km_hex) >= 4:
                        km = int(km_hex[:4], 16)
                        if 0 < km < 9999999:
                            return km
            # Dogrudan deneme
            clean = ''.join(c for c in data if c in '0123456789ABCDEF')
            if len(clean) >= 8:
                for i in range(len(clean) - 3):
                    try:
                        val = int(clean[i:i+4], 16)
                        if 1000 < val < 999999:
                            return val
                    except:
                        continue
        except:
            pass
        return None

    def scan_ecus(self) -> List[Dict]:
        """Tüm Mercedes ECU'larını öncelik sırasıyla tara"""
        found_ecus = []
        total = len(MERCEDES_ECUS)
        scanned = 0

        # Öncelik sırasına göre tara
        for priority in sorted(SCAN_ORDER.keys()):
            addrs = SCAN_ORDER[priority]
            for addr in addrs:
                if addr not in MERCEDES_ECUS:
                    continue
                scanned += 1
                info = MERCEDES_ECUS[addr]
                # ECU varlığını test et
                ecu_alive = self._test_ecu_alive(addr)
                if ecu_alive:
                    found_ecus.append({
                        "address": addr,
                        "name": info["name"],
                        "description": info["desc"],
                        "group": info["group"],
                        "priority": info["priority"],
                        "status": "AKTIF",
                        "faultCodes": []
                    })
                # İlerleme göster
                pct = int((scanned / total) * 100)
                bar_len = 30
                filled = int(bar_len * scanned / total)
                bar = "█" * filled + "░" * (bar_len - filled)
                sys.stdout = getattr(self, '_stdout', None) or __import__('sys').stdout
                print(f"\r  [{bar}] {pct}% ({scanned}/{total}) {info['desc']}... ", end="", flush=True)

        # Kalan ECU'ları tara
        for addr, info in MERCEDES_ECUS.items():
            if addr in [a for addrs in SCAN_ORDER.values() for a in addrs]:
                continue
            scanned += 1
            ecu_alive = self._test_ecu_alive(addr)
            if ecu_alive:
                found_ecus.append({
                    "address": addr,
                    "name": info["name"],
                    "description": info["desc"],
                    "group": info["group"],
                    "priority": info["priority"],
                    "status": "AKTIF",
                    "faultCodes": []
                })

        print()  # Newline after progress bar
        # Önceliğe göre sırala
        found_ecus.sort(key=lambda x: x["priority"])
        self.ecu_results = found_ecus
        return found_ecus

    def _test_ecu_alive(self, ecu_addr: str) -> bool:
        """ECU'nun aktif olup olmadığını test et"""
        # Yöntem 1: UDS Service 22 00 00 (read DID)
        addr_int = int(ecu_addr, 16)
        cmd = f"{addr_int:02X}22 00 00"
        resp = self._send_raw(cmd + "\r\n", timeout=1.5)
        if resp and "7F" not in resp:
            return True
        # Yöntem 2: UDS Service 3E (Tester Present)
        cmd2 = f"{addr_int:02X}3E 00"
        resp2 = self._send_raw(cmd2 + "\r\n", timeout=1.0)
        if resp2 and ("7E" in resp2 or "7F" not in resp2):
            return True
        # Yöntem 3: UDS Service 10 (Diagnostic Session Control)
        cmd3 = f"{addr_int:02X}10 01"
        resp3 = self._send_raw(cmd3 + "\r\n", timeout=1.0)
        if resp3 and "50" in resp3:
            return True
        return False

    def read_fault_codes(self, ecu_address: str) -> List[Dict]:
        """Belirtilen ECU'dan ariza kodlarını oku - UDS Service 19"""
        codes = []
        addr_int = int(ecu_address, 16)

        # Yöntem 1: UDS Service 19 02 (readDTCInformation by status mask)
        cmd = f"{addr_int:02X}19 02 0A"
        resp = self._send_raw(cmd + "\r\n", timeout=3.0)
        if resp:
            codes = self._parse_dtc_response(resp)
        if codes:
            return codes

        # Yöntem 2: UDS Service 19 06 (reportDTCByStatusMask)
        cmd2 = f"{addr_int:02X}19 06 0A"
        resp2 = self._send_raw(cmd2 + "\r\n", timeout=3.0)
        if resp2:
            codes = self._parse_dtc_response(resp2)
        if codes:
            return codes

        # Yöntem 3: UDS Service 19 0A (reportSupportedDTC)
        cmd3 = f"{addr_int:02X}19 0A"
        resp3 = self._send_raw(cmd3 + "\r\n", timeout=3.0)
        if resp3:
            codes = self._parse_dtc_response(resp3)
        if codes:
            return codes

        # Yöntem 4: OBD2 Mode 03
        cmd4 = f"{addr_int:02X}03"
        resp4 = self._send_raw(cmd4 + "\r\n", timeout=3.0)
        if resp4 and "NO DATA" not in (resp4 or "").upper():
            codes = self._parse_obd2_dtc(resp4)

        return codes

    def _parse_dtc_response(self, response: str) -> List[Dict]:
        """UDS DTC yanıtını parse et"""
        codes = []
        try:
            data = response.replace(' ', '')
            # UDS yanıt format: 59 02 ... veya 59 06 ...
            idx = data.upper().find('59')
            if idx < 0:
                # Alternatif formatları dene
                idx = data.upper().find('5902')
                if idx < 0:
                    idx = data.upper().find('5906')
                if idx < 0:
                    idx = data.upper().find('590A')
            if idx >= 0:
                # Header atla
                if idx > 0:
                    idx += 2  # "59" skip
                fault_data = data[idx:]
                # DTC format: 6 byte per fault (code + status + snap)
                i = 0
                while i + 6 <= len(fault_data):
                    try:
                        dtc_bytes = fault_data[i:i+6]
                        # Mercedes DTC format: P001234
                        first = int(dtc_bytes[0:2], 16)
                        second = int(dtc_bytes[2:4], 16)
                        third = int(dtc_bytes[4:6], 16)

                        # Prefix: B=Body, C=Chassis, P=Powertrain, U=Network
                        prefix_map = {0: 'P', 1: 'C', 2: 'B', 3: 'U'}
                        prefix = prefix_map.get((first >> 4) & 0x0F, 'P')

                        code_num = f"{(first & 0x0F):X}{second:02X}{third:02X}"
                        dtc = f"{prefix}{code_num}"

                        # Status byte (varsa)
                        status_byte = 0
                        if i + 8 <= len(fault_data):
                            status_byte = int(fault_data[i+6:i+8], 16)

                        # Mercedes status: bit 0 = confirmed, bit 1 = pending, bit 3 = stored
                        is_active = bool(status_byte & 0x01)
                        is_pending = bool(status_byte & 0x02)
                        is_stored = bool(status_byte & 0x08)

                        if is_active:
                            status = "Aktif"
                        elif is_pending:
                            status = "Beklemede"
                        elif is_stored:
                            status = "Depolanan"
                        else:
                            status = "Bilinmiyor"

                        codes.append({
                            "code": dtc,
                            "status": status,
                            "raw": dtc_bytes,
                        })
                    except:
                        pass
                    i += 6
        except:
            pass
        return codes

    def _parse_obd2_dtc(self, response: str) -> List[Dict]:
        """OBD2 standard DTC parse et"""
        codes = []
        try:
            data = response.replace(' ', '').replace('>', '').strip()
            if len(data) < 6:
                return codes
            # Mode 03 response: 43 ...
            if data.upper().startswith('43'):
                data = data[2:]
            i = 0
            while i + 6 <= len(data):
                try:
                    chunk = data[i:i+6]
                    first = int(chunk[0:2], 16)
                    second = int(chunk[2:4], 16)
                    third = int(chunk[4:6], 16)
                    prefix_map = {0: 'P', 1: 'C', 2: 'B', 3: 'U'}
                    prefix = prefix_map.get((first >> 4) & 0x0F, 'P')
                    code_num = f"{(first & 0x0F):X}{second:02X}{third:02X}"
                    codes.append({"code": f"{prefix}{code_num}", "status": "Aktif"})
                except:
                    pass
                i += 6
        except:
            pass
        return codes

    def read_fault_detail(self, ecu_address: str, dtc_code: str) -> Dict:
        """Tek bir ariza kodunun detayını oku (UDS Service 19 06/08)"""
        addr_int = int(ecu_address, 16)
        result = {
            "code": dtc_code,
            "ecu": ecu_address,
            "description": "",
            "freezeFrame": {},
            "environmentData": {}
        }
        # Detay bilgisi dene
        cmd = f"{addr_int:02X}19 08 {dtc_code.replace('P','0').replace('C','1').replace('B','2').replace('U','3')}"
        resp = self._send_raw(cmd + "\r\n", timeout=3.0)
        if resp:
            result["raw_detail"] = resp
        return result

    def clear_fault_codes(self, ecu_address: str) -> bool:
        """ECU'daki ariza kodlarını sil"""
        addr_int = int(ecu_address, 16)
        # UDS Service 14 (clearDiagnosticInformation)
        cmd = f"{addr_int:02X}14 FF FF FF"
        resp = self._send_raw(cmd + "\r\n", timeout=3.0)
        if resp and "54" in resp:
            return True
        # OBD2 Mode 04
        cmd2 = f"{addr_int:02X}04"
        resp2 = self._send_raw(cmd2 + "\r\n", timeout=3.0)
        return resp2 is not None

    def read_live_data(self, ecu_address: str, pid: str) -> Optional[str]:
        """Canli veri oku"""
        addr_int = int(ecu_address, 16)
        cmd = f"{addr_int:02X}22 {pid}"
        resp = self._send_raw(cmd + "\r\n", timeout=2.0)
        return resp

    def get_full_diagnostic(self) -> Dict:
        """Tam tarama yap (VIN + KM + Tüm ECU + Arıza kodları)"""
        vehicle = {
            "vin": self.read_vin() or "Bilinmiyor",
            "km": self.read_km() or 0,
            "chassis": ""
        }

        ecus = self.scan_ecus()
        for ecu in ecus:
            codes = self.read_fault_codes(ecu["address"])
            ecu["faultCodes"] = codes
            if codes:
                ecu["status"] = "ARIZALI"
                # Detayları al
                for code in codes:
                    detail = self.read_fault_detail(ecu["address"], code["code"])
                    code["detail"] = detail.get("raw_detail", "")
            else:
                ecu["status"] = "SORUNSUZ"

        return {
            "vehicle": vehicle,
            "ecus": ecus,
            "adapterType": self.adapter_type,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
        }

    def disconnect(self):
        """Bağlantıyı kapat"""
        if self.connection and self.connection.is_open:
            try:
                self.connection.reset_output_buffer()
            except:
                pass
            self.connection.close()
            self.connection = None
