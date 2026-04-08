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
  L.push("");
  L.push("REM Tum olasi Python yollarini kontrol et");
  L.push("if exist \"C:\\Python312\\python.exe\" set \"PYTHON_EXE=C:\\Python312\\python.exe\"");
  L.push("if \"%PYTHON_EXE%\"==\"\" if exist \"C:\\Python311\\python.exe\" set \"PYTHON_EXE=C:\\Python311\\python.exe\"");
  L.push("if \"%PYTHON_EXE%\"==\"\" if exist \"C:\\Program Files\\Python312\\python.exe\" set \"PYTHON_EXE=C:\\Program Files\\Python312\\python.exe\"");
  L.push("if \"%PYTHON_EXE%\"==\"\" if exist \"C:\\Program Files\\Python311\\python.exe\" set \"PYTHON_EXE=C:\\Program Files\\Python311\\python.exe\"");
  L.push("if \"%PYTHON_EXE%\"==\"\" if exist \"C:\\Program Files\\Python310\\python.exe\" set \"PYTHON_EXE=C:\\Program Files\\Python310\\python.exe\"");
  L.push("if not \"%PYTHON_EXE%\"==\"\" goto :py_found");
  L.push("");
  L.push("REM PATH uzerinde ara");
  L.push("set \"PYTHON_EXE=\"");
  L.push("for /f \"delims=\" %%i in ('where python 2^>nul') do set \"PYTHON_EXE=%%i\"");
  L.push("if not \"%PYTHON_EXE%\"==\"\" goto :py_found");
  L.push("");
  L.push("REM py launcher kontrol et");
  L.push("py --version >nul 2>&1");
  L.push("if !errorlevel! equ 0 (");
  L.push("    for /f \"delims=\" %%i in ('where py 2^>nul') do (");
  L.push("        set \"PYTHON_EXE=%%i\"");
  L.push("        goto :py_found");
  L.push("    )");
  L.push(")");
  L.push("");
  L.push("REM Python bulunamadi - indir ve kur");
  L.push("echo  Python bulunamadi - kuruluyor...");
  L.push("echo  Lutfen bekleyin (2-3 dakika)...");
  L.push("echo.");
  L.push("");
  L.push("set \"PYURL=https://www.python.org/ftp/python/3.12.4/python-3.12.4-amd64.exe\"");
  L.push("set \"PYTMP=C:\\py3124_setup.exe\"");
  L.push("");
  L.push("REM Eski dosyayi sil");
  L.push("del /f /q \"C:\\py3124_setup.exe\" >nul 2>&1");
  L.push("");
  L.push("echo  Indiriliyor (curl)...");
  L.push("curl.exe --silent --show-error --fail --connect-timeout 30 --max-time 600 -o \"C:\\py3124_setup.exe\" \"%PYURL%\"");
  L.push("");
  L.push("if not exist \"C:\\py3124_setup.exe\" (");
  L.push("    echo.");
  L.push("    echo  [HATA] Python indirilemedi!");
  L.push("    echo  Internet baglantinizi kontrol edin.");
  L.push("    echo.");
  L.push("    pause");
  L.push("    exit /b 1");
  L.push(")");
  L.push("");
  L.push("REM Dosya boyutunu kontrol et (en az 20MB olmali)");
  L.push("for %%A in (\"C:\\py3124_setup.exe\") do set \"PYSIZE=%%~zA\"");
  L.push("if %PYSIZE% LSS 20000000 (");
  L.push("    echo.");
  L.push("    echo  [HATA] Indirilen dosya bozuk (%PYSIZE% byte).");
  L.push("    echo  Tekrar deneyin.");
  L.push("    del /f /q \"C:\\py3124_setup.exe\" >nul 2>&1");
  L.push("    pause");
  L.push("    exit /b 1");
  L.push(")");
  L.push("");
  L.push("echo  Dosya indirildi (%PYSIZE% byte). Kuruluyor...");
  L.push("echo  (Lutfen bekleyin, 1-2 dakika surer...)");
  L.push("echo.");
  L.push("");
  L.push("REM Kurulumu baslat ve bekle");
  L.push("start \"\" /wait \"C:\\py3124_setup.exe\" /quiet InstallAllUsers=1 PrependPath=1 Include_pip=1 TargetDir=C:\\Python312");
  L.push("");
  L.push("REM Kurulum dosyasini sil");
  L.push("del /f /q \"C:\\py3124_setup.exe\" >nul 2>&1");
  L.push("");
  L.push("REM Klasor kontrol et");
  L.push("if exist \"C:\\Python312\\python.exe\" (");
  L.push("    set \"PYTHON_EXE=C:\\Python312\\python.exe\"");
  L.push("    echo  [OK] Python kuruldu!");
  L.push("    goto :py_found");
  L.push(")");
  L.push("");
  L.push("echo.");
  L.push("echo  [HATA] Python kurulamadi.");
  L.push("echo.");
  L.push("echo  LUTFEN SU ADIMLARI MANUEL YAPIN:");
  L.push("echo  1. Tarayicinizi acin");
  L.push("echo  2. Adres cubuguna yazin: python.org/downloads");
  L.push("echo  3. Python 3.12 indirin");
  L.push("echo  4. Kurulumda 'Add Python to PATH' kutusunu isaretleyin");
  L.push("echo  5. Install Now butonuna tiklayin");
  L.push("echo  6. Kurulum bittikten sonra bu KURULUM.bat dosyasini tekrar calistirin");
  L.push("echo.");
  L.push("pause");
  L.push("exit /b 1");
  L.push("");
  L.push(":py_found");
  L.push("echo  [OK] Python: %PYTHON_EXE%");
  L.push("\"%PYTHON_EXE%\" --version 2>nul");
  L.push("echo.");

  // ===== STEP 2: PIP =====
  L.push("echo  [2/7] Paketler kuruluyor...");
  L.push("\"%PYTHON_EXE%\" -m pip install --quiet --upgrade pip 2>nul");
  L.push("\"%PYTHON_EXE%\" -m pip install --quiet pyserial pyautogui Pillow pygetwindow colorama requests pyperclip 2>nul");
  L.push("if !errorlevel! neq 0 (");
  L.push("    echo  Paketler tekrar deneniyor...");
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

  // ===== STEP 4: DOWNLOAD FILES (curl.exe - no PowerShell) =====
  L.push("echo  [4/7] Dosyalar indiriliyor...");
  const b = appUrl;
  const files = [
    "obd_scanner.py", "screen_automator.py", "reporter.py",
    "xentry_agent.py", "config.json"
  ];
  for (const f of files) {
    L.push("curl.exe --silent --fail --connect-timeout 15 --max-time 120 -o \"%ADIR%\\" + f + "\" \"" + b + "/api/agent/files/" + f + "\"");
  }
  L.push("echo  [OK]");
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
  L.push(">> \"%BAT%\" echo if exist \"C:\\Python311\\python.exe\" set \"PY=C:\\Python311\\python.exe\"");
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
  L.push("set \"PSLINK=%TEMP%\\mklink.ps1\"");
  L.push("echo $w = New-Object -ComObject WScript.Shell > \"%PSLINK%\"");
  L.push("echo $s = $w.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\XENTRY Agent.lnk') >> \"%PSLINK%\"");
  L.push("echo $s.TargetPath = '%ADIR%\\DIAGBOT.bat' >> \"%PSLINK%\"");
  L.push("echo $s.WorkingDirectory = '%ADIR%' >> \"%PSLINK%\"");
  L.push("echo $s.IconLocation = 'shell32.dll,21' >> \"%PSLINK%\"");
  L.push("echo $s.Save() >> \"%PSLINK%\"");
  L.push("echo $s2 = $w.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\XENTRY Web Panel.lnk') >> \"%PSLINK%\"");
  L.push("echo $s2.TargetPath = '" + b + "' >> \"%PSLINK%\"");
  L.push("echo $s2.IconLocation = 'shell32.dll,14' >> \"%PSLINK%\"");
  L.push("echo $s2.Save() >> \"%PSLINK%\"");
  L.push("powershell -NoProfile -ExecutionPolicy Bypass -File \"%PSLINK%\"");
  L.push("del /f /q \"%PSLINK%\" >nul 2>&1");
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
