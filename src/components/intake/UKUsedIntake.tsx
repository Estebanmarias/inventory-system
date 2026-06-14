'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle, AlertCircle, RotateCcw, Scan } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import ProductSelector from './ProductSelector'
import { useRouter } from 'next/navigation'

const COLORS = ['Black', 'White', 'Gold', 'Silver', 'Blue', 'Purple', 'Red', 'Green', 'Pink', 'Yellow', 'Starlight', 'Midnight', 'Space Grey', 'Natural Titanium', 'Rose Gold']

interface OCRResult {
  imei: string
  serial: string
  model: string
  storage: string
}

type ScanMode = 'about' | 'imei'

export default function UKUsedIntake() {
  const supabase = createClient()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [step, setStep] = useState<'camera' | 'confirm' | 'details' | 'success'>('camera')
  const [scanMode, setScanMode] = useState<ScanMode>('about')
  const [streaming, setStreaming] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<OCRResult>({ imei: '', serial: '', model: '', storage: '' })
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [form, setForm] = useState({
    color: '', grade: '', cost_price: '', selling_price: '', imei: '', serial_number: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [debugText, setDebugText] = useState('')

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setStreaming(true)
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions.')
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream
    stream?.getTracks().forEach(t => t.stop())
    setStreaming(false)
  }

  async function captureAndOCR(mode: ScanMode) {
    if (!videoRef.current || !canvasRef.current) return
    setProcessing(true)
    setError('')

    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    const base64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1]

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      })

      const { text, error: ocrError } = await res.json()

      if (ocrError) {
        setError(`OCR error: ${ocrError}`)
        setProcessing(false)
        return
      }

      setDebugText(text)

      if (mode === 'imei') {
        // Just extract IMEI from *#06# screen
        const imeiMatches = text.match(/\b(\d{15})\b/g)
        const imei = imeiMatches?.[0] ?? ''
        if (imei) {
          setForm(f => ({ ...f, imei }))
          setOcrResult(r => ({ ...r, imei }))
          stopCamera()
          setStep('confirm')
          setError('')
        } else {
          setError('No IMEI found in scan. Try again or enter manually.')
        }
        setProcessing(false)
        return
      }

      // About Phone scan
      const imeiMatch = text.match(/\b(\d{15})\b/)
      const serialMatch = text.match(/Serial\s*Number\s*([A-Z0-9]{8,20})/i)
      const storageMatch = text.match(/(\d+)\s*GB/i)
      const storage = storageMatch ? `${storageMatch[1]}GB` : ''

      const modelPatterns = [
        { pattern: /iPhone\s+\d+\s*(?:Pro\s*Max|Pro|Plus|mini)?/i },
        { pattern: /Samsung\s+Galaxy\s+[\w\s]+?(?=\n|Storage|IMEI|Serial|$)/i },
        { pattern: /iPad\s+(?:Pro|Air|mini)?\s*[\w\s]*?(?=\n|Storage|IMEI|Serial|$)/i },
        { pattern: /MacBook\s+(?:Pro|Air)?\s*[\w\s]*?(?=\n|Storage|IMEI|Serial|$)/i },
        { pattern: /Pixel\s+\d[\w\s]*?(?=\n|Storage|IMEI|Serial|$)/i },
      ]

      let model = ''
      for (const { pattern } of modelPatterns) {
        const match = text.match(pattern)
        if (match) { model = match[0].trim().replace(/\s+/g, ' '); break }
      }

      const imeiValue = imeiMatch?.[1] ?? ''
      const serialValue = serialMatch?.[1] ?? ''
      const isIphone = /iphone/i.test(text)

      stopCamera()
      setOcrResult({ imei: imeiValue, serial: serialValue, model, storage })
      setForm(f => ({ ...f, imei: imeiValue, serial_number: serialValue }))

      if (isIphone && !imeiValue) {
        setError('iPhone detected — IMEI not found. Use "Scan IMEI" button below after dialling *#06# on the device.')
      }

      setStep('confirm')
    } catch {
      setError('OCR request failed. Check your connection.')
    }
    setProcessing(false)
  }

  async function startIMEIScan() {
    setScanMode('imei')
    setStep('camera')
    setError('')
    await startCamera()
  }

  async function handleSubmit() {
    if (!selectedProduct) { setError('Select a product first'); return }
    if (!form.cost_price) { setError('Cost price is required'); return }

    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertError } = await supabase.from('devices').insert({
      product_id: selectedProduct.id,
      imei: form.imei || null,
      serial_number: form.serial_number || null,
      color: form.color || null,
      condition_grade: form.grade || null,
      stock_type: 'UK_USED',
      status: 'IN_STOCK',
      cost_price: parseFloat(form.cost_price),
      selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
      received_by: user?.id,
    })

    if (insertError) {
  if (insertError.code === '23505' && insertError.message.includes('imei')) {
    setError('This IMEI already exists in inventory. Device may already be stocked.')
  } else if (insertError.code === '23505' && insertError.message.includes('serial')) {
    setError('This serial number already exists in inventory.')
  } else {
    setError(insertError.message)
  }
  setSaving(false)
  return
}

    setStep('success')
    setSaving(false)
  }

  const cameraInstructions = scanMode === 'about'
    ? 'Frame the About Phone / General > About screen. Ensure Serial Number is clearly visible.'
    : 'Dial *#06# on the device. Frame the IMEI number on screen clearly.'

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">

        {/* CAMERA */}
        {step === 'camera' && (
          <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {scanMode === 'imei' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
                <p className="text-blue-300 text-sm font-semibold">IMEI Scan Mode</p>
                <p className="text-[#888888] text-xs mt-1">Dial <span className="text-white font-mono font-bold">*#06#</span> on the device first, then scan the screen showing the IMEI.</p>
              </div>
            )}

            <p className="text-[#888888] text-sm">{cameraInstructions}</p>

            <div className="relative bg-[#141414] border border-white/8 rounded-3xl overflow-hidden aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />

              {!streaming && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera size={40} className="text-[#333333] mx-auto mb-3" />
                    <p className="text-[#555555] text-sm">Camera not started</p>
                  </div>
                </div>
              )}

              {streaming && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`border-2 rounded-2xl w-3/4 h-1/2 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] ${scanMode === 'imei' ? 'border-green-500/70' : 'border-blue-500/70'}`} />
                </div>
              )}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              {!streaming ? (
                <motion.button whileTap={{ scale: 0.97 }} onClick={startCamera}
                  className="flex-1 bg-blue-500 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2">
                  <Camera size={18} /> Start Camera
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => captureAndOCR(scanMode)} disabled={processing}
                  className="flex-1 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm">
                  {processing ? 'Scanning...' : 'Capture & Scan'}
                </motion.button>
              )}
            </div>

            {scanMode === 'imei' && (
              <button onClick={() => { stopCamera(); setStep('confirm'); setScanMode('about') }}
                className="w-full text-[#555555] text-sm py-2">
                Cancel — enter IMEI manually
              </button>
            )}

            {scanMode === 'about' && (
              <button onClick={() => setStep('confirm')} className="w-full text-[#555555] text-sm py-2">
                Skip scanning — enter manually
              </button>
            )}
          </motion.div>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" />
              <p className="text-white font-semibold">Review Extracted Data</p>
            </div>

            {/* IMEI field with scan button */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">IMEI</label>
              <div className="flex gap-2">
                <input
                  value={form.imei}
                  onChange={(e) => setForm(f => ({ ...f, imei: e.target.value }))}
                  placeholder="15-digit IMEI"
                  className="flex-1 bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-[#444444] outline-none focus:border-blue-500"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startIMEIScan}
                  className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-3 flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Scan size={14} /> Scan
                </motion.button>
              </div>
              {!form.imei && (
                <p className="text-yellow-400 text-xs">Dial *#06# on device → tap Scan to capture IMEI</p>
              )}
            </div>

            {/* Serial Number */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Serial Number</label>
              <input
                value={form.serial_number}
                onChange={(e) => setForm(f => ({ ...f, serial_number: e.target.value }))}
                placeholder="Serial number"
                className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-[#444444] outline-none focus:border-blue-500"
              />
            </div>

            {/* OCR detected info */}
            {(ocrResult.model || ocrResult.storage) && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3">
                <p className="text-blue-300 text-xs font-semibold mb-1">Detected from scan</p>
                {ocrResult.model && <p className="text-white text-sm">{ocrResult.model}</p>}
                {ocrResult.storage && <p className="text-[#888888] text-xs">{ocrResult.storage}</p>}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
                <AlertCircle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-yellow-300 text-sm">{error}</p>
              </div>
            )}

            {/* Product selector — pre-searched with detected model */}
            <div className="space-y-2">
              <p className="text-xs text-[#888888] uppercase tracking-wider font-medium">Product</p>
              <ProductSelector
                onSelect={(p) => setSelectedProduct(p)}
                initialSearch={ocrResult.model}
              />
              {selectedProduct && (
                <p className="text-blue-400 text-xs">✓ {selectedProduct.brands?.name} {selectedProduct.model_name} {selectedProduct.storage_capacity}</p>
              )}
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('details')}
              disabled={!selectedProduct}
              className="w-full bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl py-3 text-sm">
              Continue to Details
            </motion.button>

            <button onClick={() => { setStep('camera'); setScanMode('about'); startCamera() }}
              className="w-full flex items-center justify-center gap-2 text-[#555555] text-sm py-2">
              <RotateCcw size={14} /> Rescan About Screen
            </button>
          </motion.div>
        )}

        {/* DETAILS */}
        {step === 'details' && (
          <motion.div key="details" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-white font-semibold">
              {selectedProduct?.brands?.name} {selectedProduct?.model_name} {selectedProduct?.storage_capacity}
            </p>

            <div className="space-y-2">
              <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <motion.button key={color} whileTap={{ scale: 0.95 }}
                    onClick={() => setForm(f => ({ ...f, color }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.color === color ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/8 text-[#888888] bg-[#1C1C1C]'
                    }`}>
                    {color}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">Condition Grade</label>
              <div className="flex gap-3">
                {['A', 'B', 'C'].map(grade => (
                  <motion.button key={grade} whileTap={{ scale: 0.95 }}
                    onClick={() => setForm(f => ({ ...f, grade }))}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
                      form.grade === grade ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/8 text-[#888888] bg-[#1C1C1C]'
                    }`}>
                    Grade {grade}
                  </motion.button>
                ))}
              </div>
            </div>

            {['cost_price', 'selling_price'].map(field => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">
                  {field === 'cost_price' ? 'Cost Price (₦) *' : 'Selling Price (₦)'}
                </label>
                <input
                  type="number"
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444444] outline-none focus:border-blue-500"
                />
              </div>
            ))}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
              className="w-full bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm">
              {saving ? 'Saving...' : 'Add to Inventory'}
            </motion.button>
          </motion.div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-10 space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
              <CheckCircle size={64} className="text-green-400" />
            </motion.div>
            <p className="text-white text-xl font-bold">Device Added</p>
            <p className="text-[#888888] text-sm">
              {selectedProduct?.brands?.name} {selectedProduct?.model_name} is now in stock.
            </p>
            <div className="flex gap-3 w-full mt-4">
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setStep('camera')
                  setScanMode('about')
                  setForm({ color: '', grade: '', cost_price: '', selling_price: '', imei: '', serial_number: '' })
                  setSelectedProduct(null)
                  setOcrResult({ imei: '', serial: '', model: '', storage: '' })
                  setError('')
                }}
                className="flex-1 border border-white/8 text-white font-semibold rounded-xl py-3 text-sm">
                Add Another
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/inventory')}
                className="flex-1 bg-blue-500 text-white font-semibold rounded-xl py-3 text-sm">
                View Inventory
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}