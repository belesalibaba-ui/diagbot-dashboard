'use client'

import { useState } from 'react'

export default function IndirPage() {
  const [downloaded, setDownloaded] = useState(false)

  const handleDownload = () => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://xentry-diagbot-pro.onrender.com'

    const batContent = `@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title XENTRY DiagBot Pro - Kurulum Sihirbazi
color 0A
mode con: cols=70 lines=35

:: ============================================
:: XENTRY DiagBot Pro v2.2.0 Kurulum Scripti
:: ============================================

set "APP_NAME=XENTRY DiagBot Pro"
set "APP_URL=${appUrl}"
set "SHORTCUT_NAME=XENTRY DiagBot Pro"
set "STARTMENU_FOLDER=XENTRY DiagBot Pro"

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     XENTRY DiagBot Pro Kurulum Sihirbazi    ║
echo  ║           Surum v2.2.0                      ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  Mercedes-Benz Otonom Teshis Sistemi
echo.

:: --- ADMiN KONTROLU ---
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo  [HATA] Bu kurulum yonetici haklari gerektirir!
    echo.
    echo  Lutfen dosyaya sag tiklayip ^"Yonetici olarak calistir^" secin.
    echo.
    pause
    exit /b 1
)
echo  [OK] Yonetici haklari dogrulandi.
echo.

:: --- ADIM 1: KLASOR OLUŞTURMA ---
echo  [1/6] Kurulum klasoru olusturuluyor...
set "INSTALL_DIR=%ProgramFiles%\\XENTRY DiagBot Pro"
if not exist "!INSTALL_DIR!" (
    mkdir "!INSTALL_DIR!"
    echo         [OK] Klasor olusturuldu: !INSTALL_DIR!
) else (
    echo         [OK] Klasor zaten mevcut.
)
echo.

:: --- ADIM 2: VBS KISAYOL OLUSTURUCU YAZ ---
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
echo oUninstallLink.Arguments = "/c \\"%%ProgramFiles%%\\XENTRY DiagBot Pro\\uninstall.bat\\"" 
echo oUninstallLink.WindowStyle = 1
echo oUninstallLink.IconLocation = "shell32.dll,15"
echo oUninstallLink.Description = "${APP_NAME} Kaldir"
echo oUninstallLink.Save
echo.
echo WScript.Echo "SHORTCUTS_CREATED"
) > "!VBS_FILE!"
echo         [OK] VBS script yazildi.
echo.

:: --- ADIM 3: MASAUSTU KISAYOLU ---
echo  [3/6] Masaustu kisayolu olusturuluyor...
cscript //nologo "!VBS_FILE!" > "%TEMP%\\shortcut_result.txt" 2>&1
findstr /C:"SHORTCUTS_CREATED" "%TEMP%\\shortcut_result.txt" >nul 2>&1
if %errorLevel% equ 0 (
    echo         [OK] Masaustu kisayolu basariyla olusturuldu.
) else (
    echo         [UYARI] Kisayol olusturulurken bir sorun olustu.
    echo         Manuel olarak: %APP_URL% adresine gidin.
)
echo.

:: --- ADIM 4: BASLAT MENUSU GIRISI ---
echo  [4/6] Baslat menusu girisi olusturuluyor...
set "STARTMENU_PATH=%ProgramData%\\Microsoft\\Windows\\Start Menu\\Programs\\${STARTMENU_FOLDER}"
if exist "!STARTMENU_PATH!\\${SHORTCUT_NAME}.lnk" (
    echo         [OK] Baslat menusu girisi basariyla olusturuldu.
) else (
    echo         [UYARI] Baslat menusu girisi olusturulamadi.
)
echo.

:: --- ADIM 5: FAVICON IKON INDIRME ---
echo  [5/6] Uygulama ikonu indiriliyor...
set "ICON_PATH=!INSTALL_DIR!\\favicon.ico"
powershell -NoProfile -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${appUrl}/favicon.ico' -OutFile '!ICON_PATH!' -UseBasicParsing -TimeoutSec 10; Write-Host 'ICON_OK' } catch { Write-Host 'ICON_FAIL' }" > "%TEMP%\\icon_result.txt" 2>&1
findstr /C:"ICON_OK" "%TEMP%\\icon_result.txt" >nul 2>&1
if %errorLevel% equ 0 (
    echo         [OK] Ikon basariyla indirildi.
) else (
    echo         [INFO] Ikon indirilemedi - varsayilan ikon kullanilacak.
)
echo.

:: --- ADIM 6: KALDIRMA SCRIPTI OLUSTUR ---
echo  [6/6] Kaldirma scripti olusturuluyor...
(
echo @echo off
echo chcp 65001 ^>nul 2^>^&1
echo title ${APP_NAME} - Kaldirma
echo echo.
echo echo  ${APP_NAME} kaldiriliyor...
echo echo.
echo timeout /t 2 ^>nul
echo del /f /q "%%Desktop%%\\${SHORTCUT_NAME}.lnk" 2^>nul
echo rd /s /q "%%ProgramData%%\\Microsoft\\Windows\\Start Menu\\Programs\\${STARTMENU_FOLDER}" 2^>nul
echo rd /s /q "%ProgramFiles%\\XENTRY DiagBot Pro" 2^>nul
echo echo  [OK] ${APP_NAME} basariyla kaldirildi.
echo echo.
echo pause
) > "!INSTALL_DIR!\\uninstall.bat"
echo         [OK] Kaldirma scripti olusturuldu.
echo.

:: --- TEMIZLIK ---
del /f /q "!VBS_FILE!" >nul 2>&1
del /f /q "%TEMP%\\shortcut_result.txt" >nul 2>&1
del /f /q "%TEMP%\\icon_result.txt" >nul 2>&1

:: --- KURULUM TAMAMLANDI ---
echo  ╔══════════════════════════════════════════════╗
echo  ║          KURULUM BASARIYLA TAMAMLANDI!       ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  Olusturulan kisayollar:
echo    [+] Masaustu: ${SHORTCUT_NAME}.lnk
echo    [+] Baslat Menusu: ${STARTMENU_FOLDER}\\
echo    [+] Kurulum Dizini: ${INSTALL_DIR}
echo    [+] Kaldirma: ${INSTALL_DIR}\\uninstall.bat
echo.
echo  Uygulamayi baslatmak icin masaustu kisayoluna
echo  cift tiklayabilirsiniz.
echo.
echo  Simdi uygulamayi acmak ister misiniz? ^(E/H^)
echo.
choice /c EH /n /m "  Seciminiz [E=Ac, H=Kapat]: "
if %errorlevel% equ 1 (
    start "" "${appUrl}"
)
echo.
echo  Tesekkurler! XENTRY DiagBot Pro'yu sectiginiz icin.
echo.
timeout /t 5 >nul
exit /b 0
`
    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'KURULUM.bat'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDownloaded(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          {/* Mercedes star SVG */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none">
              <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 6V18" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6.5 15Q12 4 17.5 15" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6.5 9Q12 20 17.5 9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">XENTRY DiagBot Pro</h1>
          <p className="text-slate-400">Mercedes-Benz Otonom Teshis Sistemi</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">KURULUM DOSYASI</h2>
          <p className="text-slate-400 text-sm mb-4">
            XENTRY DiagBot Pro masaustu uygulamasini kurmak icin asagidaki butona tiklayin.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4 text-amber-300 text-xs text-left">
            <span className="font-semibold">⚠ Onemli:</span> Indirdikten sonra KURULUM.bat dosyasina sag tiklayip <strong>"Yonetici olarak calistir"</strong> secin. Masaustu ve Baslat menusu kisayollari olusturulacaktir.
          </div>

          {!downloaded ? (
            <button
              onClick={handleDownload}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20"
            >
              KURULUM.BAT INDIR
            </button>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm">
              Indirme basladi! Dosya hazirlandiginda calistirin.
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-500 text-xs">
              Surum: v2.2.0 | Boyut: ~2.4 MB | Windows 10/11
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
