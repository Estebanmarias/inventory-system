'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import ProductSelector from './ProductSelector'
import { useRouter } from 'next/navigation'

const COLORS = ['Black', 'White', 'Gold', 'Silver', 'Blue', 'Purple', 'Red', 'Green', 'Pink', 'Yellow', 'Starlight', 'Midnight', 'Space Grey', 'Natural Titanium', 'Rose Gold']

interface OCRResult {
  imei: string
  serial: string
  model: string
}

export default function UKUsedIntake() {
  const supabase = createClient()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [step, setStep] = useState<'camera' | 'confirm' | 'details' | 'success'>('camera')
  const [streaming, setStreaming] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<OCRResult>({ imei: '', serial: '', model: '' })
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [form, setForm] = useState({
    color: '', grade: '', cost_price: '', selling_price: '', imei: '', serial_number: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
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

  async function captureAndOCR() {
    if (!videoRef.current || !canvasRef.current) return
    setProcessing(true)

    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    try {
      const Tesseract = (await import('tesseract.js')).default
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
        logger: () => {}
      })

      console.log('OCR RAW TEXT:', text)

      const imeiMatch = text.match(/\b(\d{15})\b/)
      const serialMatch = text.match(/(?:serial|s\/n|sn)[:\s#]*([A-Z0-9]{8,20})/i)
      const modelPatterns = [
        /iPhone\s[\w\s]+(?:Pro(?:\s*Max)?|Plus|mini)?/i,
        /Samsung\s+Galaxy\s+[\w\s]+/i,
        /iPad\s+[\w\s]+/i,
        /MacBook\s+[\w\s]+/i,
        /Pixel\s+\d[\w\s]*/i,
      ]
      let model = ''
      for (const pattern of modelPatterns) {
        const match = text.match(pattern)
        if (match) { model = match[0].trim(); break }
      }

      stopCamera()
      setOcrResult({
        imei: imeiMatch?.[1] ?? '',
        serial: serialMatch?.[1] ?? '',
        model,
      })
      setForm(f => ({
        ...f,
        imei: imeiMatch?.[1] ?? '',
        serial_number: serialMatch?.[1] ?? '',
      }))
      setStep('confirm')
    } catch {
      setError('OCR failed. Try again with better lighting.')
    }
    setProcessing(false)
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
      setError(insertError.message)
      setSaving(false)
      return
    }

    setStep('success')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">

        {/* STEP 1: CAMERA */}
        {step === 'camera' && (
          <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-[#888888] text-sm">Point the camera at the device's <span className="text-white font-medium">About Phone</span> screen to extract details automatically.</p>

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
                  <div className="border-2 border-blue-500/70 rounded-2xl w-3/4 h-1/2 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
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
                <motion.button whileTap={{ scale: 0.97 }} onClick={captureAndOCR} disabled={processing}
                  className="flex-1 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm">
                  {processing ? 'Scanning...' : 'Capture & Scan'}
                </motion.button>
              )}
            </div>

            <button onClick={() => setStep('confirm')} className="w-full text-[#555555] text-sm py-2">
              Skip scanning — enter manually
            </button>
          </motion.div>
        )}

        {/* STEP 2: CONFIRM OCR */}
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" />
              <p className="text-white font-semibold">Review Extracted Data</p>
            </div>

            {['imei', 'serial_number'].map(field => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs text-[#888888] uppercase tracking-wider font-medium">
                  {field === 'imei' ? 'IMEI' : 'Serial Number'}
                </label>
                <input
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field === 'imei' ? '15-digit IMEI' : 'Serial number'}
                  className="w-full bg-[#1C1C1C] border border-white/8 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-[#444444] outline-none focus:border-blue-500"
                />
              </div>
            ))}

            <div className="space-y-2">
              <p className="text-xs text-[#888888] uppercase tracking-wider font-medium">Product</p>
              <ProductSelector onSelect={(p) => { setSelectedProduct(p); }} />
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('details')}
              disabled={!selectedProduct}
              className="w-full bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl py-3 text-sm">
              Continue to Details
            </motion.button>

            <button onClick={() => { setStep('camera'); startCamera() }} className="w-full flex items-center justify-center gap-2 text-[#555555] text-sm py-2">
              <RotateCcw size={14} /> Retake
            </button>
          </motion.div>
        )}

        {/* STEP 3: DETAILS */}
        {step === 'details' && (
          <motion.div key="details" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-white font-semibold">
              {selectedProduct?.brands?.name} {selectedProduct?.model_name}
            </p>

            {/* Color */}
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

            {/* Grade */}
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

            {/* Prices */}
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

        {/* STEP 4: SUCCESS */}
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
                onClick={() => { setStep('camera'); setForm({ color: '', grade: '', cost_price: '', selling_price: '', imei: '', serial_number: '' }); setSelectedProduct(null); setOcrResult({ imei: '', serial: '', model: '' }) }}
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