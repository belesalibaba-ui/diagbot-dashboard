import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appUrl = searchParams.get("url") || process.env.SITE_URL || "https://diagbot-dashboard.onrender.com";

  const batContent = `@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title XENTRY DiagBot Pro - Kurulum Sihirbazi
color 0A
mode con: cols=70 lines=35

echo.
echo  ============================================
echo   XENTRY DiagBot Pro Kurulum Sihirbazi
echo           Surum v2.2.0
echo  ============================================
echo.
echo  Mercedes-Benz Otonom Teshis Sistemi
echo.

set "APP_NAME=XENTRY DiagBot Pro"
set "APP_URL=${appUrl}"
set "SHORTCUT_NAME=XENTRY DiagBot Pro"
set "STARTMENU_FOLDER=XENTRY DiagBot Pro"

net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo  [HATA] Bu kurulum yonetici haklari gerektirir!
    echo.
    echo  Lutfen dosyaya sag tiklayip "Yonetici olarak calistir" secin.
    echo.
    pause
    exit /b 1
)
echo  [OK] Yonetici haklari dogrulandi.
echo.

echo  [1/6] Kurulum klasoru olusturuluyor...
set "INSTALL_DIR=%ProgramFiles%\\XENTRY DiagBot Pro"
if not exist "!INSTALL_DIR!" (
    mkdir "!INSTALL_DIR!"
    echo         [OK] Klasor olusturuldu: !INSTALL_DIR!
) else (
    echo         [OK] Klasor zaten mevcut.
)
echo.

echo  [2/6] Kisayol olusturucu hazirlaniyor...
set "VBS_FILE=%TEMP%\\create_shortcut.vbs"

(
echo Set WshShell = WScript.CreateObject^("WScript.Shell"^)
echo strDesktop = WshShell.SpecialFolders^("Desktop"^)
echo Set oShellLink = WshShell.CreateShortcut^(strDesktop ^& "\\${SHORTCUT_NAME}.lnk"^)
echo oShellLink.TargetPath = "!APP_URL!"
echo oShellLink.Arguments = ""
echo oShellLink.WindowStyle = 1
echo oShellLink.IconLocation = "shell32.dll,14"
echo oShellLink.Description = "${APP_NAME} - Mercedes-Benz Teshis Sistemi"
echo oShellLink.Save
echo.
echo strStartMenu = WshShell.SpecialFolders^("AllUsersStartMenu"^)
echo strSMFolder = strStartMenu ^& "\\${STARTMENU_FOLDER}"
echo.
echo Set fso = CreateObject^("Scripting.FileSystemObject"^)
echo If Not fso.FolderExists^(strSMFolder^) Then
echo     fso.CreateFolder strSMFolder
echo End If
echo.
echo Set oStartLink = WshShell.CreateShortcut^(strSMFolder ^& "\\${SHORTCUT_NAME}.lnk"^)
echo oStartLink.TargetPath = "!APP_URL!"
echo oStartLink.Arguments = ""
echo oStartLink.WindowStyle = 1
echo oStartLink.IconLocation = "shell32.dll,14"
echo oStartLink.Description = "${APP_NAME} - Mercedes-Benz Teshis Sistemi"
echo oStartLink.Save
echo.
echo Set oUninstallLink = WshShell.CreateShortcut^(strSMFolder ^& "\\${APP_NAME} Kaldir.lnk"^)
echo oUninstallLink.TargetPath = "cmd.exe"
echo oUninstallLink.Arguments = "/c \\"%%ProgramFiles%%\\XENTRY DiagBot Pro\\uninstall.bat\\"
echo oUninstallLink.WindowStyle = 1
echo oUninstallLink.IconLocation = "shell32.dll,15"
echo oUninstallLink.Description = "${APP_NAME} Kaldir"
echo oUninstallLink.Save
echo.
echo WScript.Echo "SHORTCUTS_CREATED"
) > "!VBS_FILE!"
echo         [OK] VBS script yazildi.
echo.

echo  [3/6] Masaustu kisayolu olusturuluyor...
cscript //nologo "!VBS_FILE!" > "%TEMP%\\shortcut_result.txt" 2>&1
findstr /C:"SHORTCUTS_CREATED" "%TEMP%\\shortcut_result.txt" >nul 2>&1
if %errorLevel% equ 0 (
    echo         [OK] Masaustu kisayolu basariyla olusturuldu.
) else (
    echo         [UYARI] Kisayol olusturulurken bir sorun olustu.
)
echo.

echo  [4/6] Baslat menusu girisi olusturuluyor...
set "STARTMENU_PATH=%ProgramData%\\Microsoft\\Windows\\Start Menu\\Programs\\${STARTMENU_FOLDER}"
if exist "!STARTMENU_PATH!\\${SHORTCUT_NAME}.lnk" (
    echo         [OK] Baslat menusu girisi basariyla olusturuldu.
) else (
    echo         [UYARI] Baslat menusu girisi olusturulamadi.
)
echo.

echo  [5/6] Uygulama ikonu indiriliyor...
set "ICON_PATH=!INSTALL_DIR!\\favicon.ico"
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '${appUrl}/favicon.ico' -OutFile '!ICON_PATH!' -UseBasicParsing -TimeoutSec 10 } catch {}" >nul 2>&1
echo         [OK] Ikon islemi tamamlandi.
echo.

echo  [6/6] Kaldirma scripti olusturuluyor...
(
echo @echo off
echo chcp 65001 ^>nul 2^>^&1
echo title ${APP_NAME} - Kaldirma
echo echo.
echo echo  ${APP_NAME} kaldiriliyor...
echo echo.
echo timeout /t 2 ^>nul
echo rd /s /q "%%ProgramData%%\\Microsoft\\Windows\\Start Menu\\Programs\\${STARTMENU_FOLDER}" 2^>nul
echo rd /s /q "%ProgramFiles%\\XENTRY DiagBot Pro" 2^>nul
echo echo  [OK] ${APP_NAME} basariyla kaldirildi.
echo echo.
echo pause
) > "!INSTALL_DIR!\\uninstall.bat"
echo         [OK] Kaldirma scripti olusturuldu.
echo.

del /f /q "!VBS_FILE!" >nul 2>&1
del /f /q "%TEMP%\\shortcut_result.txt" >nul 2>&1

echo.
echo  ============================================
echo    KURULUM BASARIYLA TAMAMLANDI!
echo  ============================================
echo.
echo  Masaustu kisayolu: ${SHORTCUT_NAME}.lnk
echo  Baslat Menusu: ${STARTMENU_FOLDER}
echo  Kurulum Dizini: !INSTALL_DIR!
echo.
echo  Simdi uygulamayi acmak ister misiniz? (E/H)
echo.
choice /c EH /n /m "  Seciminiz [E=Ac, H=Kapat]: "
if %errorLevel% equ 1 (
    start "" "${appUrl}"
)
echo.
timeout /t 5 >nul
exit /b 0
`;

  return new NextResponse(batContent, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="KURULUM.bat"',
    },
  });
}
