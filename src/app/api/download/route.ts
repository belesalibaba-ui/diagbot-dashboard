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

  // Admin check
  L.push("net session >nul 2>&1");
  L.push("if %errorlevel% neq 0 (");
  L.push("    color 0C");
  L.push("    echo  [HATA] Yonetici hakki gerekiyor!");
  L.push("    echo  Dosyaya SAG TIKLAYIP Yonetici olarak calistir secin.");
  L.push("    echo.");
  L.push("    pause");
  L.push("    exit /b 1");
  L.push(")");
  L.push("echo  [OK] Yonetici hakki var.");
  L.push("echo.");

  // ===== STEP 1: PYTHON =====
  L.push("echo  [1/7] Python kontrol...");
  L.push("set \"PY_DIR=C:\\Python312\"");
  L.push("set \"PYTHON_EXE=\"");
  L.push("if exist \"%PY_DIR%\\python.exe\" set \"PYTHON_EXE=%PY_DIR%\\python.exe\"");
  L.push("if \"%PYTHON_EXE%\"==\"\" if exist \"C:\\Program Files\\Python312\\python.exe\" set \"PYTHON_EXE=C:\\Program Files\\Python312\\python.exe\"");
  L.push("if \"%PYTHON_EXE%\"==\"\" if exist \"C:\\Program Files\\Python311\\python.exe\" set \"PYTHON_EXE=C:\\Program Files\\Python311\\python.exe\"");
  L.push("if not \"%PYTHON_EXE%\"==\"\" goto :py_found");
  L.push("echo  Python bulunamadi - indiriliyor ve kuruluyor...");
  L.push("echo  (3-5 dakika surebilir)");
  L.push("echo.");

  // Write a .ps1 file to handle Python install (avoids escaping issues)
  L.push("set \"PS1=%TEMP%\\install_python.ps1\"");
  L.push("echo $ErrorActionPreference = 'Stop' > \"%PS1%\"");
  L.push("echo [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 >> \"%PS1%\"");
  L.push("echo $url = 'https://www.python.org/ftp/python/3.12.4/python-3.12.4-amd64.exe' >> \"%PS1%\"");
  L.push("echo $exe = Join-Path $env:TEMP 'py3124setup.exe' >> \"%PS1%\"");
  L.push("echo Write-Host '  Indiriliyor...' >> \"%PS1%\"");
  L.push("echo Invoke-WebRequest -Uri $url -OutFile $exe -UseBasicParsing -TimeoutSec 600 >> \"%PS1%\"");
  L.push("echo Write-Host '  Kuruluyor...' >> \"%PS1%\"");
  L.push("echo $proc = Start-Process -FilePath $exe -ArgumentList '/quiet','InstallAllUsers=1','PrependPath=1','Include_pip=1','TargetDir=C:\\Python312' -Wait -PassThru >> \"%PS1%\"");
  L.push("echo Remove-Item $exe -Force -ErrorAction SilentlyContinue >> \"%PS1%\"");
  L.push("echo if (Test-Path 'C:\\Python312\\python.exe') { Write-Host '  [OK] Python kuruldu!' } else { Write-Host '  [HATA] Kurulum basarisiz. Cikis:' $proc.ExitCode } >> \"%PS1%\"");
  L.push("powershell -NoProfile -ExecutionPolicy Bypass -File \"%PS1%\"");
  L.push("del /f /q \"%PS1%\" >nul 2>&1");

  // Check after install
  L.push("if exist \"%PY_DIR%\\python.exe\" (");
  L.push("    set \"PYTHON_EXE=%PY_DIR%\\python.exe\"");
  L.push("    goto :py_found");
  L.push(")");
  L.push("echo.");
  L.push("echo  [HATA] Python kurulamadi.");
  L.push("echo  Manuel: https://www.python.org/downloads/");
  L.push("echo  Kurulumda 'Add Python to PATH' isaretleyin.");
  L.push("echo.");
  L.push("pause");
  L.push("exit /b 1");

  L.push(":py_found");
  L.push("echo  [OK] %PYTHON_EXE%");
  L.push("\"%PYTHON_EXE%\" --version 2>nul");
  L.push("echo.");

  // ===== STEP 2: PIP =====
  L.push("echo  [2/7] Paketler kuruluyor...");
  L.push("\"%PYTHON_EXE%\" -m pip install --quiet --upgrade pip 2>nul");
  L.push("\"%PYTHON_EXE%\" -m pip install --quiet pyserial pyautogui Pillow pygetwindow colorama requests pyperclip 2>nul");
  L.push("if !errorlevel! neq 0 (");
  L.push("    echo  Tekrar deneniyor...");
  L.push("    \"%PYTHON_EXE%\" -m pip install pyserial pyautogui Pillow pygetwindow colorama requests pyperclip");
  L.push(")");
  L.push("echo  [OK]");
  L.push("echo.");

  // ===== STEP 3: FOLDER =====
  L.push("echo  [3/7] Agent klasoru...");
  L.push("set \"ADIR=%LOCALAPPDATA%\\Programs\\XENTRY Agent\"");
  L.push("if not exist \"%ADIR%\" mkdir \"%ADIR%\"");
  L.push("if not exist \"%ADIR%\\reports\" mkdir \"%ADIR%\\reports\"");
  L.push("echo  [OK] %ADIR%");
  L.push("echo.");

  // ===== STEP 4: DOWNLOAD FILES =====
  L.push("echo  [4/7] Dosyalar indiriliyor...");
  const b = appUrl;

  // Write a .ps1 to download all files at once
  L.push("set \"DL1=%TEMP%\\download_files.ps1\"");
  L.push("echo $base = '" + b + "' > \"%DL1%\"");
  L.push("echo $dir = '%ADIR%' >> \"%DL1%\"");
  L.push("echo $files = @('obd_scanner.py','screen_automator.py','reporter.py','xentry_agent.py','config.json') >> \"%DL1%\"");
  L.push("echo foreach ($f in $files) { >> \"%DL1%\"");
  L.push("echo     $url = \"$base/api/agent/files/$f\" >> \"%DL1%\"");
  L.push("echo     $out = Join-Path $dir $f >> \"%DL1%\"");
  L.push("echo     Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 120 >> \"%DL1%\"");
  L.push("echo } >> \"%DL1%\"");
  L.push("echo Write-Host '  [OK]' >> \"%DL1%\"");
  L.push("powershell -NoProfile -ExecutionPolicy Bypass -File \"%DL1%\"");
  L.push("del /f /q \"%DL1%\" >nul 2>&1");
  L.push("echo.");

  // ===== STEP 5: DIAGBOT.BAT =====
  L.push("echo  [5/7] DIAGBOT.bat olusturuluyor...");
  L.push("set \"BAT=%ADIR%\\DIAGBOT.bat\"");
  L.push("> \"%BAT%\" echo @echo off");
  L.push(">> \"%BAT%\" echo chcp 65001 ^>nul 2^>^&1");
  L.push(">> \"%BAT%\" echo title XENTRY DiagBot Pro");
  L.push(">> \"%BAT%\" echo cd /d \"%%~dp0\"");
  L.push(">> \"%BAT%\" echo set \"PY=\"");
  L.push(">> \"%BAT%\" echo if exist \"C:\\Python312\\python.exe\" set \"PY=C:\\Python312\\python.exe\"");
  L.push(">> \"%BAT%\" echo if exist \"C:\\Program Files\\Python312\\python.exe\" set \"PY=C:\\Program Files\\Python312\\python.exe\"");
  L.push(">> \"%BAT%\" echo if exist \"C:\\Program Files\\Python311\\python.exe\" set \"PY=C:\\Program Files\\Python311\\python.exe\"");
  L.push(">> \"%BAT%\" echo if \"%%PY%%\"==\"\" echo HATA: Python bulunamadi");
  L.push(">> \"%BAT%\" echo if \"%%PY%%\"==\"\" pause");
  L.push(">> \"%BAT%\" echo if \"%%PY%%\"==\"\" exit /b 1");
  L.push(">> \"%BAT%\" echo \"%%PY%%\" xentry_agent.py");
  L.push(">> \"%BAT%\" echo pause");
  L.push("echo  [OK]");
  L.push("echo.");

  // ===== STEP 6: SHORTCUTS =====
  L.push("echo  [6/7] Kisayollar...");
  L.push("powershell -NoProfile -Command \"$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\\XENTRY Agent.lnk');$s.TargetPath='%ADIR%\\DIAGBOT.bat';$s.WorkingDirectory='%ADIR%';$s.IconLocation='shell32.dll,21';$s.Save()\"");
  L.push("powershell -NoProfile -Command \"$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\\XENTRY Web Panel.lnk');$s.TargetPath='" + b + "';$s.IconLocation='shell32.dll,14';$s.Save()\"");
  L.push("echo  [OK]");
  L.push("echo.");

  // ===== STEP 7: VERIFY =====
  L.push("echo  [7/7] Dogrulama...");
  L.push("echo.");
  L.push("if exist \"%ADIR%\\DIAGBOT.bat\" (echo  [+] DIAGBOT.bat) else (echo  [-] DIAGBOT.bat)");
  L.push("if exist \"%ADIR%\\xentry_agent.py\" (echo  [+] xentry_agent.py) else (echo  [-] xentry_agent.py)");
  L.push("if exist \"%ADIR%\\obd_scanner.py\" (echo  [+] obd_scanner.py) else (echo  [-] obd_scanner.py)");
  L.push("if exist \"%ADIR%\\screen_automator.py\" (echo  [+] screen_automator.py) else (echo  [-] screen_automator.py)");
  L.push("if exist \"%ADIR%\\reporter.py\" (echo  [+] reporter.py) else (echo  [-] reporter.py)");
  L.push("if exist \"%ADIR%\\config.json\" (echo  [+] config.json) else (echo  [-] config.json)");
  L.push("echo.");
  L.push("if exist \"%PYTHON_EXE%\" (\"%PYTHON_EXE%\" --version 2>nul) else (echo  [!] Python calistirilamiyor)");
  L.push("echo.");
  L.push("echo  ========================================================");
  L.push("echo    KURULUM TAMAMLANDI!");
  L.push("echo  ========================================================");
  L.push("echo.");
  L.push("echo  Masaustu kisayollari:");
  L.push("    1. XENTRY Agent = Arac tarama");
  L.push("    2. XENTRY Web Panel = Web rapor");
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
