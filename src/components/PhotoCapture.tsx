'use client'

import { useRef, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Camera, X, CheckCircle } from 'lucide-react'

interface PhotoCaptureProps {
  label: string
  onCapture: (blob: Blob, dataUrl: string) => void
  onClear: () => void
  previewUrl: string | null
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

export default function PhotoCapture({ label, onCapture, onClear, previewUrl }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      setProcessing(true)
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        setProcessing(false)
      }

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)

          // Timestamp overlay — uses manual roundRect for broad compatibility
          const timestamp = format(new Date(), 'dd MMM yyyy  HH:mm:ss')
          const fontSize = Math.max(14, Math.round(img.width * 0.028))
          ctx.font = `bold ${fontSize}px monospace`
          const padding = fontSize * 0.5
          const textWidth = ctx.measureText(timestamp).width
          const boxX = img.width - textWidth - padding * 2 - 12
          const boxY = img.height - fontSize - padding * 2 - 12

          ctx.fillStyle = 'rgba(0,0,0,0.65)'
          drawRoundRect(ctx, boxX, boxY, textWidth + padding * 2, fontSize + padding * 2, 5)
          ctx.fill()

          ctx.fillStyle = '#ffffff'
          ctx.fillText(timestamp, boxX + padding, boxY + fontSize + padding * 0.6)

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl)
              if (blob) onCapture(blob, canvas.toDataURL('image/jpeg', 0.92))
              setProcessing(false)
            },
            'image/jpeg',
            0.92
          )
        } catch {
          URL.revokeObjectURL(objectUrl)
          setProcessing(false)
        }
      }

      img.src = objectUrl
    },
    [onCapture]
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div>
      {label ? <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-2)' }}>{label}</p> : null}

      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--card)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Captured" className="w-full object-cover max-h-64" />
          <button
            type="button"
            onClick={() => { onClear(); if (inputRef.current) inputRef.current.value = '' }}
            className="absolute top-2 right-2 rounded-full p-1.5 transition-colors"
            style={{ background: 'rgba(0,0,0,0.65)' }}
            aria-label="Remove photo"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <span className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: 'rgba(0,0,0,0.65)', color: '#4ADE80' }}>
            <CheckCircle className="w-3 h-3" /> Timestamp added
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="w-full h-36 flex flex-col items-center justify-center gap-2 rounded-xl transition-colors border-2 border-dashed"
          style={{ borderColor: 'var(--border-hi)', color: 'var(--text-3)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3B82F6'; (e.currentTarget as HTMLButtonElement).style.color = '#3B82F6' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hi)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)' }}
        >
          {processing ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">Tap to take photo</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
