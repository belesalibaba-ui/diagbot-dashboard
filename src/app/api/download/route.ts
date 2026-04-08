import { NextResponse } from "next/server";

export async function GET() {
  const appUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SITE_URL ||
    "https://diagbot-dashboard.onrender.com";

  // ASCII-safe batch file - no special chars, no BOM issues
  const bat = String.raw`

@echo off
setlocal
chcp 65001 >nul 2>&1
title XENTRY DiagBot Pro v3.0
color 0A

echo.
echo  ========================================================
echo   XENTRY DiagBot Pro v3.0 - Kurulum
echo   Mercedes-Benz AI Teshis Ajan Sistemi
echo   SD Connect C4 + XENTRY Otomasyon
echo  ========================================================
echo.
echo  [BILGI] Islem basliyor...
echo.

REM ===== ADMIN CHECK =====
net session >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [HATA] Yonetici hakki gerekiyor!
    echo  Dosyaya SAG TIKLAYIP:
    echo  "Yonetici olarak calistir" secin.
    echo.
    pause
    exit /b 1
)
echo  [OK] Yonetici hakki var.
echo.

REM ===== PYTHON CHECK =====
echo  [1/7] Python kontrol...
set PYFOUND=0
python --version >nul 2>&1
if %errorlevel% equ 0 set PYFOUND=1
if %PYFOUND%==0 (
    py --version >nul 2>&1
    if %errorlevel% equ 0 set PYFOUND=1
)

if %PYFOUND%==1 (
    echo         Python zaten kurulu.
    goto :step2
)

echo         Python bulunamadi - kuruluyor...
echo         Lutfen bekleyin (3-5 dakika)...
echo.

set PYURL=https://www.python.org/ftp/python/3.12.4/python-3.12.4-amd64.exe
set PYEXE=%TEMP%\py3124.exe

echo         Indiriliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PYURL%' -OutFile '%PYEXE%' -UseBasicParsing -TimeoutSec 600"

if not exist "%PYEXE%" (
    echo  [HATA] Python indirilemedi!
    echo  Manuel indirin: %PYURL%
    echo  Kurulumda "Add Python to PATH" isaretleyin.
    echo.
    pause
    exit /b 1
)

echo         Kuruluyor...
"%PYEXE%" /quiet InstallAllUsers=1 PrependPath=1 Include_pip=1
del /f /q "%PYEXE%" >nul 2>&1

set "PATH=%PATH%;C:\Program Files\Python312;C:\Program Files\Python312\Scripts"
set "PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python312\Scripts"

python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo         [OK] Python kuruldu!
) else (
    py --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo         [OK] Python kuruldu!
    ) else (
        echo  [UYARI] Python kuruldu ama PATH tanimli degil.
        echo           Bilgisayari YENIDEN BASLATIP tekrar deneyin.
    )
)

:step2
echo.
echo  [2/7] Paketler kuruluyor...
python -m pip install --quiet pyserial pyautogui Pillow pygetwindow colorama requests pyperclip 2>nul
if %errorlevel% neq 0 (
    py -m pip install --quiet pyserial pyautogui Pillow pygetwindow colorama requests pyperclip 2>nul
)
echo         [OK] Paketler tamam.

echo.
echo  [3/7] Klasor olusturuluyor...
set "ADIR=%LOCALAPPDATA%\Programs\XENTRY Agent"
if not exist "%ADIR%" mkdir "%ADIR%"
mkdir "%ADIR%\reports" >nul 2>&1
echo         [OK] %ADIR%

echo.
echo  [4/7] Dosyalar indiriliyor...
set BASE=` + appUrl + `
powershell -NoProfile -ExecutionPolicy Bypass -Command "$b='%BASE%'; $d='%ADIR%'; Invoke-WebRequest -Uri ($b+'/api/agent/files/obd_scanner.py') -OutFile ($d+'\obd_scanner.py') -UseBasicParsing -TimeoutSec 120"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$b='%BASE%'; $d='%ADIR%'; Invoke-WebRequest -Uri ($b+'/api/agent/files/screen_automator.py') -OutFile ($d+'\screen_automator.py') -UseBasicParsing -TimeoutSec 120"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$b='%BASE%'; $d='%ADIR%'; Invoke-WebRequest -Uri ($b+'/api/agent/files/reporter.py') -OutFile ($d+'\reporter.py') -UseBasicParsing -TimeoutSec 120"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$b='%BASE%'; $d='%ADIR%'; Invoke-WebRequest -Uri ($b+'/api/agent/files/xentry_agent.py') -OutFile ($d+'\xentry_agent.py') -UseBasicParsing -TimeoutSec 120"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$b='%BASE%'; $d='%ADIR%'; Invoke-WebRequest -Uri ($b+'/api/agent/files/config.json') -OutFile ($d+'\config.json') -UseBasicParsing -TimeoutSec 120"
echo         [OK]

echo.
echo  [5/7] DIAGBOT.bat olusturuluyor...
echo @echo off> "%ADIR%\DIAGBOT.bat"
echo chcp 65001 ^>nul 2^>^&1>> "%ADIR%\DIAGBOT.bat"
echo title XENTRY DiagBot Pro>> "%ADIR%\DIAGBOT.bat"
echo cd /d "%%~dp0">> "%ADIR%\DIAGBOT.bat"
echo python xentry_agent.py>> "%ADIR%\DIAGBOT.bat"
echo pause>> "%ADIR%\DIAGBOT.bat"
echo         [OK]

echo.
echo  [6/7] Kisayollar olusturuluyor...
powershell -NoProfile -Command "$w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\XENTRY Agent.lnk'); $s.TargetPath='%ADIR%\DIAGBOT.bat'; $s.WorkingDirectory='%ADIR%'; $s.IconLocation='shell32.dll,21'; $s.Save()"
powershell -NoProfile -Command "$w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\XENTRY Web Panel.lnk'); $s.TargetPath='%BASE%'; $s.IconLocation='shell32.dll,14'; $s.Save()"
echo         [OK]

echo.
echo  [7/7] Dogrulama...
echo.
if exist "%ADIR%\DIAGBOT.bat" (echo  [+] DIAGBOT.bat) else (echo  [-] DIAGBOT.bat)
if exist "%ADIR%\xentry_agent.py" (echo  [+] xentry_agent.py) else (echo  [-] xentry_agent.py)
if exist "%ADIR%\obd_scanner.py" (echo  [+] obd_scanner.py) else (echo  [-] obd_scanner.py)
if exist "%ADIR%\screen_automator.py" (echo  [+] screen_automator.py) else (echo  [-] screen_automator.py)
if exist "%ADIR%\reporter.py" (echo  [+] reporter.py) else (echo  [-] reporter.py)
echo.
python --version 2>nul || py --version 2>nul
echo.
echo  ========================================================
echo    KURULUM TAMAMLANDI!
echo  ========================================================
echo.
echo  Masaustunuzde 2 kisayol var:
echo    1. XENTRY Agent = Arac tarama (terminal)
echo    2. XENTRY Web Panel = Web rapor (tarayici)
echo.
echo  Agent calistirmak icin XENTRY Agent tiklayin.
echo  SD Connect C4 USB takili ve kontak acik olmali.
echo.
pause
`;

  // Remove BOM and ensure clean ASCII
  let content = bat.replace(/^\uFEFF/, '').replace(/\r\n/g, '\r\n');
  // Remove any non-ASCII characters that could break cmd.exe
  content = content.replace(/[^\x00-\x7F\u0130\u0131\u00DC\u00FC\u00D6\u00F6\u015E\u015F\u00C7\u00E7\u011E\u011F\r\n\t ]/g, '');

  const buf = Buffer.from(content, 'utf-8');

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/x-bat",
      "Content-Disposition": 'attachment; filename="KURULUM.bat"',
      "Content-Length": String(buf.length),
      "Cache-Control": "no-cache",
    },
  });
}
