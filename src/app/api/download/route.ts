import { NextResponse } from "next/server";

export async function GET() {
  const appUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SITE_URL ||
    "https://diagbot-dashboard.onrender.com";

  const L: string[] = [];

  L.push("@echo off");
  L.push("setlocal");
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
  L.push("REM ===== ADMIN CHECK =====");
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

  // Python check
  L.push("REM ===== PYTHON CHECK =====");
  L.push("echo  [1/7] Python kontrol...");
  L.push("set PYFOUND=0");
  L.push("python --version >nul 2>&1");
  L.push("if %errorlevel% equ 0 set PYFOUND=1");
  L.push("if %PYFOUND%==0 (");
  L.push("    py --version >nul 2>&1");
  L.push("    if %errorlevel% equ 0 set PYFOUND=1");
  L.push(")");
  L.push("if %PYFOUND%==1 (");
  L.push("    echo         Python zaten kurulu.");
  L.push("    goto :step2");
  L.push(")");
  L.push("echo         Python bulunamadi - kuruluyor...");
  L.push("echo         Lutfen bekleyin (3-5 dakika)...");
  L.push("echo.");
  L.push("set PYURL=https://www.python.org/ftp/python/3.12.4/python-3.12.4-amd64.exe");
  L.push("set PYEXE=%TEMP%\\py3124.exe");
  L.push("echo         Indiriliyor...");
  L.push("powershell -NoProfile -ExecutionPolicy Bypass -Command \"[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PYURL%' -OutFile '%PYEXE%' -UseBasicParsing -TimeoutSec 600\"");
  L.push("if not exist \"%PYEXE%\" (");
  L.push("    echo  [HATA] Python indirilemedi!");
  L.push("    echo  Manuel indirin: %PYURL%");
  L.push("    echo  Kurulumda Add Python to PATH isaretleyin.");
  L.push("    echo.");
  L.push("    pause");
  L.push("    exit /b 1");
  L.push(")");
  L.push("echo         Kuruluyor...");
  L.push("\"%PYEXE%\" /quiet InstallAllUsers=1 PrependPath=1 Include_pip=1");
  L.push("del /f /q \"%PYEXE%\" >nul 2>&1");
  L.push("set \"PATH=%PATH%;C:\\Program Files\\Python312;C:\\Program Files\\Python312\\Scripts\"");
  L.push("set \"PATH=%PATH%;C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\"");
  L.push("python --version >nul 2>&1");
  L.push("if %errorlevel% equ 0 (");
  L.push("    echo         [OK] Python kuruldu!");
  L.push(") else (");
  L.push("    py --version >nul 2>&1");
  L.push("    if %errorlevel% equ 0 (");
  L.push("        echo         [OK] Python kuruldu!");
  L.push("    ) else (");
  L.push("        echo  [UYARI] PATH tanimli degil. Bilgisayari yeniden baslatin.");
  L.push("    )");
  L.push(")");
  L.push("");
  L.push(":step2");

  // Pip packages
  L.push("echo.");
  L.push("echo  [2/7] Paketler kuruluyor...");
  L.push("python -m pip install --quiet pyserial pyautogui Pillow pygetwindow colorama requests pyperclip 2>nul");
  L.push("if %errorlevel% neq 0 (");
  L.push("    py -m pip install --quiet pyserial pyautogui Pillow pygetwindow colorama requests pyperclip 2>nul");
  L.push(")");
  L.push("echo         [OK] Paketler tamam.");

  // Agent folder
  L.push("echo.");
  L.push("echo  [3/7] Klasor olusturuluyor...");
  L.push("set \"ADIR=%LOCALAPPDATA%\\Programs\\XENTRY Agent\"");
  L.push("if not exist \"%ADIR%\" mkdir \"%ADIR%\"");
  L.push("mkdir \"%ADIR%\\reports\" >nul 2>&1");
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
  L.push("echo         [OK]");

  // DIAGBOT.bat
  L.push("echo.");
  L.push("echo  [5/7] DIAGBOT.bat olusturuluyor...");
  L.push("echo @echo off> \"%ADIR%\\DIAGBOT.bat\"");
  L.push("echo chcp 65001 ^>nul 2^>^&1>> \"%ADIR%\\DIAGBOT.bat\"");
  L.push("echo title XENTRY DiagBot Pro>> \"%ADIR%\\DIAGBOT.bat\"");
  L.push("echo cd /d \"%%~dp0\">> \"%ADIR%\\DIAGBOT.bat\"");
  L.push("echo python xentry_agent.py>> \"%ADIR%\\DIAGBOT.bat\"");
  L.push("echo pause>> \"%ADIR%\\DIAGBOT.bat\"");
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
  L.push("echo.");
  L.push("python --version 2>nul");
  L.push("py --version 2>nul");
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
