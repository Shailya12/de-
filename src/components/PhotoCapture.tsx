'use client'

import { useRef, useState, useCallback } from 'react'
import { format } from 'date-fns'

interface PhotoCaptureProps {
  label: string
  onCapture: (blob: Blob, dataUrl: string) => void
  onClear: () => void
  previewUrl: string | null
}

export default function PhotoCapture({ label, onCapture, onClear, previewUrl }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      setProcessing(true)
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)

        // Timestamp overlay
        const timestamp = format(new Date(), 'dd MMM yyyy  HH:mm:ss')
        const fontSize = Math.max(16, Math.round(img.width * 0.03))
        ctx.font = `bold ${fontSize}px monospace`
        const padding = fontSize * 0.5
        const textWidth = ctx.measureText(timestamp).width
        const boxX = img.width - textWidth - padding * 2 - 12
        const boxY = img.height - fontSize - padding * 2 - 12
        // Dark background pill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
        ctx.beginPath()
        ctx.roundRect(boxX, boxY, textWidth + padding * 2, fontSize + padding * 2, 6)
        ctx.fill()
        // White text
        ctx.fillStyle = '#ffffff'
        ctx.fillText(timestamp, boxX + padding, boxY + fontSize + padding * 0.6)

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl)
            if (blob) {
              onCapture(blob, canvas.toDataURL('image/jpeg', 0.92))
            }
            setProcessing(false)
          },
          'image/jpeg',
          0.92
        )
      }
      img.src = objectUrl
    },
    [onCapture]
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so the same file can be re-selected if cleared
    e.target.value = ''
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-300 mb-2">{label}</p>

      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Captured" className="w-full object-cover max-h-60" />
          <button
            type="button"
            onClick={() => { onClear(); if (inputRef.current) inputRef.current.value = '' }}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
            aria-label="Remove photo"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
            Timestamp added
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="w-full h-36 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
        >
          {processing ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Take / Upload Photo</span>
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
