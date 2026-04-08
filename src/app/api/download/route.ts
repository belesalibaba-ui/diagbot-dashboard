import { NextResponse } from "next/server";

export async function GET() {
  const appUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SITE_URL ||
    "https://diagbot-dashboard.onrender.com";

  const L: string[] = [];

  L.push("@echo off");
  L.push("setlocal EnableDelayedExpansion");
  L.push("chcp 65001 >nul 2>&1");
  L.push("title XENTRY DiagBot Pro v3.0");
  L.push("color 0A");
  L.push("");
  L.push("echo.");
  L.push("echo  ========================================================");
  L.push("echo   XENTRY DiagBot Pro v3.0 - Kurulum");
  L.push("echo   Mercedes-Benz AI Teshis Ajan Sistemi");
  L.push("echo   SD Connect C4 + XENTRY Otomasyon");
  L.push("echo  ========================================================");
  L.push("echo.");
  L.push("echo  [BILGI] Islem basliyor...");
  L.push("echo.");

  // Admin check
  L.push("REM ===== YONETICI CHECK =====");
  L.push("net session >nul 2>&1");
  L.push("if %errorlevel% neq 0 (");
  L.push("    color 0C");
  L.push("    echo  [HATA] Yonetici hakki gerekiyor!");
  L.push("    echo  Dosyaya SAG TIKLAYIP:");
  L.push("    echo  Yonetici olarak calistir secin.");
  L.push("    echo.");
  L.push("    pause");
  L.push("    exit /b 1");
  L.push(")");
  L.push("echo  [OK] Yonetici hakki var.");
  L.push("echo.");

  // Python check - try all possible locations
  L.push("REM ===== PYTHON BUL =====");
  L.push("echo  [1/7] Python kontrol...");
  L.push("set \"PYTHON_EXE=\"");
  L.push("");
  L.push("REM Varsayilan kurulum yollarini kontrol et");
  L.push("if exist \"C:\\Program Files\\Python312\\python.exe\" (");
  L.push("    set \"PYTHON_EXE=C:\\Program Files\\Python312\\python.exe\"");
  L.push("    set \"PIP_DIR=C:\\Program Files\\Python312\\Scripts\"");
  L.push(")");
  L.push("if exist \"C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Python\\Python312\\python.exe\" (");
  L.push("    set \"PYTHON_EXE=C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Python\\Python312\\python.exe\"");
  L.push("    set \"PIP_DIR=C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\"");
  L.push(")");
  L.push("if exist \"C:\\Python312\\python.exe\" (");
  L.push("    set \"PYTHON_EXE=C:\\Python312\\python.exe\"");
  L.push("    set \"PIP_DIR=C:\\Python312\\Scripts\"");
  L.push(")");
  L.push("");
  L.push("REM PATH uzerinden bul");
  L.push("if \"%PYTHON_EXE%\"==\"\" (");
  L.push("    where python >nul 2>&1");
  L.push("    if !errorlevel! equ 0 (");
  L.push("        for /f \"delims=\" %%i in ('where python') do (");
  L.push("            set \"PYTHON_EXE=%%i\"");
  L.push("            goto :pyfound");
  L.push("        )");
  L.push("    )");
  L.push(")");
  L.push(":pyfound");
  L.push("");
  L.push("if not \"%PYTHON_EXE%\"==\"\" (");
  L.push("    echo         Python bulundu: %PYTHON_EXE%");
  L.push("    \"%PYTHON_EXE%\" --version");
  L.push("    goto :step2");
  L.push(")");
  L.push("");
  L.push("REM Python yok - indir ve kur");
  L.push("echo         Python bulunamadi - kuruluyor...");
  L.push("echo         Lutfen bekleyin (3-5 dakika)...");
  L.push("echo.");
  L.push("set \"PYURL=https://www.python.org/ftp/python/3.12.4/python-3.12.4-amd64.exe\"");
  L.push("set \"PYINSTALLER=%TEMP%\\py3124.exe\"");
  L.push("echo         Indiriliyor...");
  L.push("powershell -NoProfile -ExecutionPolicy Bypass -Command \"[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PYURL%' -OutFile '%PYINSTALLER%' -UseBasicParsing -TimeoutSec 600\"");
  L.push("if not exist \"%PYINSTALLER%\" (");
  L.push("    echo  [HATA] Python indirilemedi!");
  L.push("    echo  Manuel indirin: %PYURL%");
  L.push("    echo  Kurulumda 'Add Python to PATH' isaretleyin.");
  L.push("    echo.");
  L.push("    pause");
  L.push("    exit /b 1");
  L.push(")");
  L.push("echo         Kuruluyor...");
  L.push("echo         (Bu islem 1-2 dakika surebilir)");
  L.push("\"%PYINSTALLER%\" /quiet InstallAllUsers=1 PrependPath=1 Include_pip=1");
  L.push("del /f /q \"%PYINSTALLER%\" >nul 2>&1");
  L.push("");
  L.push("REM Kuruldu mu kontrol et - tum olasi yollari kontrol et");
  L.push("set \"PYTHON_EXE=\"");
  L.push("if exist \"C:\\Program Files\\Python312\\python.exe\" (");
  L.push("    set \"PYTHON_EXE=C:\\Program Files\\Python312\\python.exe\"");
  L.push("    set \"PIP_DIR=C:\\Program Files\\Python312\\Scripts\"");
  L.push(")");
  L.push("if exist \"C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Python\\Python312\\python.exe\" (");
  L.push("    set \"PYTHON_EXE=C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Python\\Python312\\python.exe\"");
  L.push("    set \"PIP_DIR=C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\"");
  L.push(")");
  L.push("if exist \"C:\\Python312\\python.exe\" (");
  L.push("    set \"PYTHON_EXE=C:\\Python312\\python.exe\"");
  L.push("    set \"PIP_DIR=C:\\Python312\\Scripts\"");
  L.push(")");
  L.push("");
  L.push("if not \"%PYTHON_EXE%\"==\"\" (");
  L.push("    echo         [OK] Python kuruldu!");
  L.push("    \"%PYTHON_EXE%\" --version");
  L.push(") else (");
  L.push("    echo  [HATA] Python kurulamadi veya PATH bulunamadi.");
  L.push("    echo  Manuel olarak python.org adresinden indirin.");
  L.push("    echo.");
  L.push("    pause");
  L.push("    exit /b 1");
  L.push(")");
  L.push("");
  L.push(":step2");

  // Pip packages - use PYTHON_EXE directly
  L.push("REM ===== PIP PAKETLER =====");
  L.push("echo.");
  L.push("echo  [2/7] Paketler kuruluyor...");
  L.push("\"%PYTHON_EXE%\" -m pip install --quiet pyserial pyautogui Pillow pygetwindow colorama requests pyperclip 2>nul");
  L.push("if !errorlevel! neq 0 (");
  L.push("    echo         Paket kurulumu yeniden deneniyor...");
  L.push("    \"%PYTHON_EXE%\" -m pip install pyserial pyautogui Pillow pygetwindow colorama requests pyperclip");
  L.push(")");
  L.push("echo         [OK] Paketler tamam.");

  // Agent folder
  L.push("echo.");
  L.push("echo  [3/7] Klasor olusturuluyor...");
  L.push("set \"ADIR=%LOCALAPPDATA%\\Programs\\XENTRY Agent\"");
  L.push("if not exist \"%ADIR%\" mkdir \"%ADIR%\"");
  L.push("mkdir \"%ADIR%\\reports\" >nul 2>&1");
  L.push("mkdir \"%ADIR%\\reports\\screenshots\" >nul 2>&1");
  L.push("echo         [OK] %ADIR%");

  // Agent files
  L.push("echo.");
  L.push("echo  [4/7] Dosyalar indiriliyor...");
  const b = appUrl;
  L.push("powershell -NoProfile -ExecutionPolicy Bypass -Command \"Invoke-WebRequest -Uri '" + b + "/api/agent/files/obd_scanner.py' -OutFile '%ADIR%\\obd_scanner.py' -UseBasicParsing -TimeoutSec 120\"");
  L.push("powershell -NoProfile -ExecutionPolicy Bypass -Command \"Invoke-WebRequest -Uri '" + b + "/api/agent/files/screen_automator.py' -OutFile '%ADIR%\\screen_automator.py' -UseBasicParsing -TimeoutSec 120\"");
  L.push("powershell -NoProfile -ExecutionPolicy Bypass -Command \"Invoke-WebRequest -Uri '" + b + "/api/agent/files/reporter.py' -OutFile '%ADIR%\\reporter.py' -UseBasicParsing -TimeoutSec 120\"");
  L.push("powershell -NoProfile -ExecutionPolicy Bypass -Command \"Invoke-WebRequest -Uri '" + b + "/api/agent/files/xentry_agent.py' -OutFile '%ADIR%\\xentry_agent.py' -UseBasicParsing -TimeoutSec 120\"");
  L.push("powershell -NoProfile -ExecutionPolicy Bypass -Command \"Invoke-WebRequest -Uri '" + b + "/api/agent/files/config.json' -OutFile '%ADIR%\\config.json' -UseBasicParsing -TimeoutSec 120\"");

  // Check files
  L.push("set DLERR=0");
  L.push("if not exist \"%ADIR%\\obd_scanner.py\" (echo         [!] obd_scanner.py indirilemedi & set DLERR=1)");
  L.push("if not exist \"%ADIR%\\screen_automator.py\" (echo         [!] screen_automator.py indirilemedi & set DLERR=1)");
  L.push("if not exist \"%ADIR%\\reporter.py\" (echo         [!] reporter.py indirilemedi & set DLERR=1)");
  L.push("if not exist \"%ADIR%\\xentry_agent.py\" (echo         [!] xentry_agent.py indirilemedi & set DLERR=1)");
  L.push("if not exist \"%ADIR%\\config.json\" (echo         [!] config.json indirilemedi & set DLERR=1)");
  L.push("if !DLERR! equ 0 (echo         [OK])");
  L.push("if !DLERR! equ 1 (echo         [UYARI] Bazı dosyalar indirilemedi. Internet baglantinizi kontrol edin.)");

  // DIAGBOT.bat - use full Python path
  L.push("echo.");
  L.push("echo  [5/7] DIAGBOT.bat olusturuluyor...");
  L.push("REM DIAGBOT.bat - Python tam yol ile olustur");
  L.push("> \"%ADIR%\\DIAGBOT.bat\" echo @echo off");
  L.push(">> \"%ADIR%\\DIAGBOT.bat\" echo chcp 65001 ^>nul 2^>^&1");
  L.push(">> \"%ADIR%\\DIAGBOT.bat\" echo title XENTRY DiagBot Pro");
  L.push(">> \"%ADIR%\\DIAGBOT.bat\" echo cd /d \"%%~dp0\"");
  L.push(">> \"%ADIR%\\DIAGBOT.bat\" echo set \"PYTHON_EXE=%PYTHON_EXE%\"");
  L.push(">> \"%ADIR%\\DIAGBOT.bat\" echo if not exist \"%%PYTHON_EXE%%\" set \"PYTHON_EXE=python\"");
  L.push(">> \"%ADIR%\\DIAGBOT.bat\" echo \"%%PYTHON_EXE%%\" xentry_agent.py");
  L.push(">> \"%ADIR%\\DIAGBOT.bat\" echo pause");
  L.push("echo         [OK]");

  // Shortcuts
  L.push("echo.");
  L.push("echo  [6/7] Kisayollar olusturuluyor...");
  L.push("powershell -NoProfile -Command \"$w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\\XENTRY Agent.lnk'); $s.TargetPath='%ADIR%\\DIAGBOT.bat'; $s.WorkingDirectory='%ADIR%'; $s.IconLocation='shell32.dll,21'; $s.Save()\"");
  L.push("powershell -NoProfile -Command \"$w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\\XENTRY Web Panel.lnk'); $s.TargetPath='" + b + "'; $s.IconLocation='shell32.dll,14'; $s.Save()\"");
  L.push("echo         [OK]");

  // Verify
  L.push("echo.");
  L.push("echo  [7/7] Dogrulama...");
  L.push("echo.");
  L.push("if exist \"%ADIR%\\DIAGBOT.bat\" (echo  [+] DIAGBOT.bat) else (echo  [-] DIAGBOT.bat)");
  L.push("if exist \"%ADIR%\\xentry_agent.py\" (echo  [+] xentry_agent.py) else (echo  [-] xentry_agent.py)");
  L.push("if exist \"%ADIR%\\obd_scanner.py\" (echo  [+] obd_scanner.py) else (echo  [-] obd_scanner.py)");
  L.push("if exist \"%ADIR%\\screen_automator.py\" (echo  [+] screen_automator.py) else (echo  [-] screen_automator.py)");
  L.push("if exist \"%ADIR%\\reporter.py\" (echo  [+] reporter.py) else (echo  [-] reporter.py)");
  L.push("if exist \"%ADIR%\\config.json\" (echo  [+] config.json) else (echo  [-] config.json)");
  L.push("echo.");
  L.push("Python: \"%PYTHON_EXE%\"");
  L.push("if exist \"%PYTHON_EXE%\" (");
  L.push("    \"%PYTHON_EXE%\" --version 2>nul");
  L.push(") else (");
  L.push("    python --version 2>nul");
  L.push("    py --version 2>nul");
  L.push(")");
  L.push("echo.");
  L.push("echo  ========================================================");
  L.push("echo    KURULUM TAMAMLANDI!");
  L.push("echo  ========================================================");
  L.push("echo.");
  L.push("echo  Masaustunuzde 2 kisayol var:");
  L.push("echo    1. XENTRY Agent = Arac tarama (terminal)");
  L.push("echo    2. XENTRY Web Panel = Web rapor (tarayici)");
  L.push("echo.");
  L.push("echo  Agent calistirmak icin XENTRY Agent tiklayin.");
  L.push("echo  SD Connect C4 USB takili ve kontak acik olmali.");
  L.push("echo.");
  L.push("pause");

  const content = L.join("\r\n");
  const buf = Buffer.from(content, "ascii");

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/x-bat",
      "Content-Disposition": "attachment; filename=\"KURULUM.bat\"",
      "Content-Length": String(buf.length),
      "Cache-Control": "no-cache",
    },
  });
}
