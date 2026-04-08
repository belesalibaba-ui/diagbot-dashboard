'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface Vehicle {
  id: string
  vin: string
  brand: string
  model: string | null
  year: number | null
  engine: string | null
}

interface FaultCodeItem {
  code: string
  description?: string
  severity?: string
}

interface AIAnalysis {
  kod: string
  aciklama: string
  nedenler: string[]
  cozumler: { oneri: string; maliyet: number; zorluk: string }[]
  aciliyet: string
  maliyetTahmini: number
}

interface Report {
  id: string
  title: string
  summary: string
  content: string
  createdAt: string
}

interface DiagnosticViewProps {
  userId: string
  onComplete: () => void
  onBack: () => void
}

const MB_MODELS = [
  'A-Class', 'B-Class', 'C-Class', 'CLA', 'CLE', 'CLK',
  'E-Class', 'EQE', 'EQS', 'G-Class', 'GLA', 'GLB', 'GLC',
  'GLE', 'GLS', 'GT', 'S-Class', 'SL', 'SLC', 'SLS',
  'V-Class', 'X-Class', 'AMG GT', 'Maybach'
]

const COMMON_FAULT_CODES = [
  'P0010', 'P0016', 'P0100', 'P0101', 'P0115', 'P0120',
  'P0171', 'P0172', 'P0174', 'P0175', 'P0200', 'P0300',
  'P0301', 'P0302', 'P0303', 'P0304', 'P0335', 'P0340',
  'P0350', 'P0400', 'P0401', 'P0420', 'P0430', 'P0442',
  'P0500', 'P0507', 'P0600', 'P0601', 'P0700', 'P0715',
  'P0720', 'P0730', 'P0740', 'P0780',
  'B1001', 'B1010', 'B1013', 'B1015', 'B1030', 'B1055',
  'B1070', 'B1085', 'B1100', 'B1105', 'B1125',
  'C1000', 'C1020', 'C1035', 'C1040', 'C1045', 'C1075',
  'C1085', 'C1095',
  'U0001', 'U0100', 'U0101', 'U0121', 'U0122', 'U0124',
  'U0140', 'U0150', 'U0155', 'U0400', 'U0414', 'U1000'
]

const STEP_TITLES = [
  'Araç Bilgileri',
  'Arıza Kodları',
  'AI Analiz',
  'Sonuç'
]

export default function DiagnosticView({ userId, onComplete, onBack }: DiagnosticViewProps) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Step 1: Vehicle info
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [vehicleForm, setVehicleForm] = useState({
    model: '',
    year: '',
    vin: '',
    km: '',
    fuelType: 'Benzin'
  })
  const [showVehicleForm, setShowVehicleForm] = useState(false)

  // Step 2: Fault codes
  const [manualCode, setManualCode] = useState('')
  const [faultCodes, setFaultCodes] = useState<FaultCodeItem[]>([])
  const [codeSuggestions, setCodeSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mbDatabase, setMbDatabase] = useState<Record<string, { description: string; severity: string; system: string }>>({})
  const codeInputRef = useRef<HTMLInputElement>(null)

  // Step 3: AI Analysis results
  const [analysisResults, setAnalysisResults] = useState<AIAnalysis[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)

  // Load vehicles
  useEffect(() => {
    fetch(`/api/vehicles?userId=${userId}`)
      .then(res => res.json())
      .then(data => setVehicles(data.vehicles || []))
      .catch(() => {})
  }, [userId])

  // Load MB fault codes database for autocomplete
  useEffect(() => {
    fetch('/api/sessions/placeholder/fault-codes')
      .catch(() => {
        // Load suggestions directly
        setCodeSuggestions(COMMON_FAULT_CODES)
      })
    setCodeSuggestions(COMMON_FAULT_CODES)
  }, [])

  const handleCodeInput = useCallback((value: string) => {
    setManualCode(value.toUpperCase())
    if (value.length >= 1) {
      const filtered = COMMON_FAULT_CODES.filter(c =>
        c.toLowerCase().includes(value.toUpperCase())
      ).slice(0, 8)
      setCodeSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [])

  const addFaultCode = useCallback((code: string) => {
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) return
    if (faultCodes.some(fc => fc.code === cleanCode)) {
      toast.warning(`${cleanCode} zaten eklendi`)
      return
    }
    setFaultCodes(prev => [...prev, { code: cleanCode }])
    setManualCode('')
    setShowSuggestions(false)
    codeInputRef.current?.focus()
  }, [faultCodes])

  const removeFaultCode = useCallback((code: string) => {
    setFaultCodes(prev => prev.filter(fc => fc.code !== code))
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addFaultCode(manualCode)
    }
  }

  const selectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    setShowVehicleForm(false)
  }

  // Step 1: Create session
  const handleNextFromStep1 = async () => {
    if (!showVehicleForm && !selectedVehicleId) {
      toast.error('Lütfen bir araç seçin veya yeni araç bilgisi girin')
      return
    }
    if (showVehicleForm && !vehicleForm.model) {
      toast.error('Model bilgisi zorunlu')
      return
    }

    setLoading(true)
    try {
      // Create or use existing vehicle
      let vehicleId = selectedVehicleId
      if (showVehicleForm) {
        const vin = vehicleForm.vin || `VIN-${Date.now()}`
        const existingVehicle = vehicles.find(v => v.vin === vin)
        if (existingVehicle) {
          vehicleId = existingVehicle.id
        } else {
          const res = await fetch('/api/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              vin,
              brand: 'Mercedes-Benz',
              model: vehicleForm.model,
              year: parseInt(vehicleForm.year) || null,
              engine: vehicleForm.fuelType
            })
          })
          if (res.ok) {
            const data = await res.json()
            vehicleId = data.vehicle.id
          }
        }
      }

      // Create session
      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, vehicleId })
      })
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        setSessionId(sessionData.session.id)
        setStep(1)
      } else {
        toast.error('Oturum oluşturulamadı')
      }
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Save fault codes and proceed
  const handleNextFromStep2 = async () => {
    if (faultCodes.length === 0) {
      toast.error('En az bir arıza kodu ekleyin')
      return
    }
    if (!sessionId) {
      toast.error('Oturum bulunamadı')
      return
    }

    setStep(2)
  }

  // Step 3: Run AI analysis
  const runDiagnosis = async () => {
    if (!sessionId) return

    setAnalyzing(true)
    try {
      const vehicleInfo = selectedVehicleId
        ? vehicles.find(v => v.id === selectedVehicleId)
        : null
      const vehicleStr = vehicleInfo
        ? `${vehicleInfo.brand} ${vehicleInfo.model || ''} ${vehicleInfo.year || ''} (${vehicleInfo.vin})`
        : showVehicleForm
          ? `Mercedes-Benz ${vehicleForm.model} ${vehicleForm.year || ''}`
          : 'Bilinmeyen Araç'

      const res = await fetch(`/api/sessions/${sessionId}/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faultCodes,
          vehicleInfo: vehicleStr,
          km: vehicleForm.km || vehicleInfo?.engine || 'Belirtilmemiş',
          fuelType: vehicleForm.fuelType || 'Bilinmiyor'
        })
      })

      if (res.ok) {
        const data = await res.json()
        setAnalysisResults(data.analysis || [])
        setReport(data.report || null)
        setStep(3)
        toast.success('AI analizi tamamlandı!')
      } else {
        const errData = await res.json()
        toast.error(errData.error || 'Analiz başarısız')
      }
    } catch {
      toast.error('Analiz sırasında hata oluştu')
    } finally {
      setAnalyzing(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'KRİTİK':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'UYARI':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'BİLGİ':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'KRİTİK':
        return '🔴'
      case 'UYARI':
        return '🟡'
      case 'BİLGİ':
        return '🟢'
      default:
        return '⚪'
    }
  }

  const totalEstimatedCost = analysisResults.reduce((sum, a) => sum + (a.maliyetTahmini || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={step === 0 ? onBack : () => setStep(s => s - 1)}
          className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-3"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Geri
        </Button>
        <div>
          <h1 className="text-xl font-bold text-white">Yeni Tanı Başlat</h1>
          <p className="text-slate-400 text-xs mt-0.5">XENTRY DiagBot Pro AI Teşhis Sistemi</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEP_TITLES.map((title, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                i === step ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border border-gray-400/30' :
                'bg-slate-800/50 text-slate-500 border border-slate-700/50'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                i <= step ? 'text-white' : 'text-slate-500'
              }`}>
                {title}
              </span>
            </div>
            {i < STEP_TITLES.length - 1 && (
              <div className={`flex-1 h-px transition-all ${
                i < step ? 'bg-emerald-500/30' : 'bg-slate-800'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Vehicle Selection */}
      {step === 0 && (
        <div className="space-y-4">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">1. Araç Seçimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showVehicleForm ? (
                <>
                  {vehicles.length > 0 ? (
                    <div className="grid gap-3">
                      {vehicles.map(v => (
                        <button
                          key={v.id}
                          onClick={() => selectVehicle(v.id)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            selectedVehicleId === v.id
                              ? 'bg-gray-500/10 border-gray-500/30 text-white'
                              : 'bg-slate-900/50 border-slate-700/40 text-slate-300 hover:border-slate-600/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold">{v.brand} {v.model || ''}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {v.year || '-'} • {v.engine || '-'} • VIN: {v.vin}
                              </p>
                            </div>
                            {selectedVehicleId === v.id && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-xs">Seçili</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <Separator className="bg-slate-700/40" />
                  <Button
                    variant="ghost"
                    onClick={() => setShowVehicleForm(true)}
                    className="w-full text-slate-400 hover:text-white hover:bg-slate-700/30 border border-dashed border-slate-700/50 rounded-xl py-6"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Yeni Araç Bilgisi Gir
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Model *</Label>
                      <div className="relative">
                        <Input
                          value={vehicleForm.model}
                          onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                          placeholder="ör: E-Class, C-Class..."
                          className="bg-slate-900 border-slate-600 text-white"
                          list="mb-models"
                        />
                        <datalist id="mb-models">
                          {MB_MODELS.map(m => <option key={m} value={m} />)}
                        </datalist>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Yıl</Label>
                      <Input
                        value={vehicleForm.year}
                        onChange={e => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                        placeholder="2024"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">VIN</Label>
                      <Input
                        value={vehicleForm.vin}
                        onChange={e => setVehicleForm({ ...vehicleForm, vin: e.target.value.toUpperCase() })}
                        placeholder="WDDGF4HB1EA123456"
                        className="bg-slate-900 border-slate-600 text-white font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Kilometre</Label>
                      <Input
                        value={vehicleForm.km}
                        onChange={e => setVehicleForm({ ...vehicleForm, km: e.target.value })}
                        placeholder="125000"
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-slate-300 text-sm">Yakıt Tipi</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['Benzin', 'Dizel', 'Hybrid', 'Elektrik', 'Plug-in Hybrid'].map(fuel => (
                          <button
                            key={fuel}
                            onClick={() => setVehicleForm({ ...vehicleForm, fuelType: fuel })}
                            className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                              vehicleForm.fuelType === fuel
                                ? 'bg-gray-500/15 text-white border-gray-500/30'
                                : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:border-slate-600/50'
                            }`}
                          >
                            {fuel}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowVehicleForm(false)}
                    className="text-slate-500 text-xs hover:text-slate-300"
                  >
                    Kayıtlı araçlardan seç
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleNextFromStep1}
              disabled={loading}
              className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium rounded-xl px-8"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  Devam Et
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Fault Code Entry */}
      {step === 1 && (
        <div className="space-y-4">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">2. Arıza Kodları</CardTitle>
              <p className="text-slate-400 text-xs mt-1">
                XENTRY cihazından okunan veya manuel girilen arıza kodlarını ekleyin
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Manual code input */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={codeInputRef}
                      value={manualCode}
                      onChange={e => handleCodeInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Arıza kodu girin (ör: P0300)"
                      className="bg-slate-900 border-slate-600 text-white font-mono uppercase pr-10"
                      onFocus={() => manualCode.length >= 1 && setShowSuggestions(true)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      Enter
                    </span>
                  </div>
                  <Button
                    onClick={() => addFaultCode(manualCode)}
                    disabled={!manualCode.trim()}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-4"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </Button>
                </div>

                {/* Autocomplete suggestions */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {codeSuggestions.map(code => (
                      <button
                        key={code}
                        onClick={() => {
                          addFaultCode(code)
                          setShowSuggestions(false)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700/50 flex items-center justify-between border-b border-slate-700/50 last:border-0"
                      >
                        <span className="text-sm font-mono text-white">{code}</span>
                        {mbDatabase[code] && (
                          <span className="text-xs text-slate-500 truncate ml-2">{mbDatabase[code].description}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick add common codes */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Sık kullanılan kodlar:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['P0300', 'P0420', 'P0171', 'P0700', 'P0100', 'P0340', 'P0120', 'P0401', 'B1085', 'U0001'].map(code => (
                    <button
                      key={code}
                      onClick={() => addFaultCode(code)}
                      disabled={faultCodes.some(fc => fc.code === code)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-all ${
                        faultCodes.some(fc => fc.code === code)
                          ? 'bg-slate-700/50 text-slate-600 border-slate-700/30 cursor-not-allowed'
                          : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:border-gray-500/40 hover:text-white'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-slate-700/40" />

              {/* Added fault codes list */}
              {faultCodes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-slate-500 text-sm">Henüz arıza kodu eklenmedi</p>
                  <p className="text-slate-600 text-xs mt-1">Yukarıdaki alana kod girin veya sık kullanılan kodlara tıklayın</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {faultCodes.map((fc, i) => (
                    <div
                      key={`${fc.code}-${i}`}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/40 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-xs font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-mono font-semibold text-white">{fc.code}</p>
                          {fc.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{fc.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFaultCode(fc.code)}
                        className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(0)} className="text-slate-400 hover:text-white hover:bg-slate-800/50">
              Geri
            </Button>
            <Button
              onClick={handleNextFromStep2}
              disabled={faultCodes.length === 0}
              className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium rounded-xl px-8"
            >
              AI ile Analiz Et
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: AI Analysis in progress */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/20 flex items-center justify-center">
                  {analyzing ? (
                    <div className="w-8 h-8 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  )}
                </div>
                {analyzing ? (
                  <>
                    <h3 className="text-lg font-semibold text-white">AI Analiz Yapılıyor...</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      {faultCodes.length} arıza kodu Mercedes-Benz yapay zeka motoru tarafından analiz ediliyor. Bu işlem birkaç saniye sürebilir.
                    </p>
                    <div className="flex justify-center gap-1.5 mt-4">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white">Analize Hazır</h3>
                    <p className="text-sm text-slate-400">
                      {faultCodes.length} arıza kodu analiz edilecek
                    </p>
                    <Button
                      onClick={runDiagnosis}
                      className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium rounded-xl px-8 mt-4"
                    >
                      Analizi Başlat
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Analysis Results */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Analiz Tamamlandı</h3>
                  <p className="text-xs text-slate-500">{analysisResults.length} arıza kodu başarıyla analiz edildi</p>
                </div>
              </div>
              {report && (
                <p className="text-sm text-slate-300">{report.summary}</p>
              )}
              {totalEstimatedCost > 0 && (
                <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-500">Tahmini Toplam Onarım Maliyeti</p>
                  <p className="text-lg font-bold text-white mt-0.5">~{totalEstimatedCost.toLocaleString('tr-TR')} TL</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisResults.map((analysis, i) => (
            <Card
              key={`${analysis.kod}-${i}`}
              className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40 overflow-hidden"
            >
              <button
                onClick={() => setExpandedCode(expandedCode === analysis.kod ? null : analysis.kod)}
                className="w-full text-left p-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getUrgencyIcon(analysis.aciliyet)}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-mono font-bold text-white">{analysis.kod}</p>
                        <Badge className={`${getUrgencyColor(analysis.aciliyet)} text-xs border px-2 py-0 h-5`}>
                          {analysis.aciliyet}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{analysis.aciklama}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {analysis.maliyetTahmini > 0 && (
                      <span className="text-xs font-medium text-slate-400">
                        ~{analysis.maliyetTahmini.toLocaleString('tr-TR')} TL
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform ${expandedCode === analysis.kod ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </button>

              {expandedCode === analysis.kod && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-700/30">
                  {/* Causes */}
                  {analysis.nedenler?.length > 0 && (
                    <div className="pt-3">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Olası Nedenler</p>
                      <div className="space-y-1.5">
                        {analysis.nedenler.map((neden, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-700/50 flex items-center justify-center text-xs text-slate-400 shrink-0 mt-0.5">
                              {j + 1}
                            </span>
                            <p className="text-sm text-slate-300">{neden}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solutions */}
                  {analysis.cozumler?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Çözüm Önerileri</p>
                      <div className="space-y-2">
                        {analysis.cozumler.map((cozum, j) => (
                          <div key={j} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center text-xs text-emerald-400 shrink-0 mt-0.5">
                                  {j + 1}
                                </span>
                                <p className="text-sm text-slate-200">{cozum.oneri}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge className={`text-xs border-0 px-2 py-0 h-5 ${
                                  cozum.zorluk === 'Kolay' ? 'bg-emerald-500/10 text-emerald-400' :
                                  cozum.zorluk === 'Orta' ? 'bg-amber-500/10 text-amber-400' :
                                  'bg-red-500/10 text-red-400'
                                }`}>
                                  {cozum.zorluk}
                                </Badge>
                                {cozum.maliyet > 0 && (
                                  <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                                    ~{cozum.maliyet.toLocaleString('tr-TR')} TL
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cost estimate */}
                  {analysis.maliyetTahmini > 0 && (
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-amber-500/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Tahmini Toplam Maliyet</span>
                        <span className="text-sm font-bold text-amber-400">
                          ~{analysis.maliyetTahmini.toLocaleString('tr-TR')} TL
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(2)}
              className="text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              Tekrar Analiz Et
            </Button>
            <div className="flex gap-2">
              {report && (
                <Button
                  onClick={() => {
                    // Open print dialog with report content
                    const printWindow = window.open('', '_blank')
                    if (printWindow) {
                      printWindow.document.write(`
                        <html><head><title>${report.title}</title>
                        <style>
                          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
                          h1 { color: #111; font-size: 20px; margin-bottom: 20px; }
                          h2 { color: #333; font-size: 16px; margin-top: 20px; margin-bottom: 8px; }
                          p { line-height: 1.6; }
                          code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
                          hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
                        </style>
                        </head><body>${report.content?.replace(/\n/g, '<br>') || ''}</body></html>
                      `)
                      printWindow.document.close()
                      printWindow.print()
                    }
                  }}
                  variant="outline"
                  className="border-slate-600/50 text-slate-300 hover:bg-slate-800/50 rounded-xl"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.159 48.159 0 018.5 0m-8.5 0V6.466m8.5 0V6.466m-8.5 0a48.29 48.29 0 018.5 0" />
                  </svg>
                  Yazdır
                </Button>
              )}
              <Button
                onClick={onComplete}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-xl px-6"
              >
                Tamamlandı
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}
