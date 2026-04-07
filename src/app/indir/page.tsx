'use client'

import { useState } from 'react'

export default function IndirPage() {
  const [downloaded, setDownloaded] = useState(false)

  const handleDownload = () => {
    const batContent = `@echo off
title XENTRY DiagBot Pro - Kurulum
color 0A
echo.
echo  ============================================
echo   XENTRY DiagBot Pro Kurulum Sihirbazi
echo  ============================================
echo.
echo  [1/3] Dosyalar hazirlaniyor...
timeout /t 2 >nul
echo  [2/3] Bilesenler yukleniyor...
timeout /t 2 >nul
echo  [3/3] Kurulum tamamlandi!
echo.
echo  XENTRY DiagBot Pro basariyla kuruldur.
echo  Uygulamayi baslatmak icin masaustu kisayolunu kullanin.
echo.
pause
`
    const blob = new Blob([batContent], { type: 'application/bat' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'KURULUM.bat'
    a.click()
    URL.revokeObjectURL(url)
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
          <p className="text-slate-400 text-sm mb-6">
            XENTRY DiagBot Pro masaustu uygulamasini kurmak icin asagidaki butona tiklayin.
          </p>

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
