"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { format } from "date-fns";

interface PhotoCaptureProps {
  onCapture: (dataUrl: string) => void;
  label: string;
}

export default function PhotoCapture({ onCapture, label }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "live" | "captured">("idle");

  // iOS Safari fix: assign stream AFTER the video element is mounted
  useEffect(() => {
    if (stream && videoRef.current && mode === "live") {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, mode]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setStream(newStream);
      setMode("live");
    } catch {
      fileInputRef.current?.click();
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const burnTimestamp = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const timestamp = format(new Date(), "dd MMM yyyy, hh:mm a");
    // Scale font to image size so it's always readable
    const fontSize = Math.max(16, Math.floor(canvas.width / 30));
    ctx.font = `bold ${fontSize}px sans-serif`;
    const tw = ctx.measureText(timestamp).width;
    const padding = fontSize * 0.6;
    const boxH = fontSize + padding * 2;
    // Bottom-left corner for timestamp
    ctx.fillStyle = "rgba(0,0,0,0.60)";
    ctx.fillRect(0, canvas.height - boxH, tw + padding * 2, boxH);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(timestamp, padding, canvas.height - padding);
  };

  const captureFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scale to max 960px for Firestore size
    const MAX = 960;
    const scale = Math.min(1, MAX / (video.videoWidth || MAX));
    canvas.width = Math.round((video.videoWidth || MAX) * scale);
    canvas.height = Math.round((video.videoHeight || 720) * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    burnTimestamp(canvas, ctx);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    onCapture(dataUrl);
    setCapturedImage(dataUrl);
    setMode("captured");
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const MAX = 960;
      const scale = Math.min(1, MAX / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      burnTimestamp(canvas, ctx);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      onCapture(dataUrl);
      setCapturedImage(dataUrl);
      setMode("captured");
    };
    img.src = url;
    e.target.value = "";
  };

  const retake = () => {
    setCapturedImage(null);
    setMode("idle");
    stopCamera();
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">{label}</label>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative aspect-[4/3] bg-zinc-100 rounded-2xl overflow-hidden border-2 border-zinc-200">
        {mode === "captured" && capturedImage ? (
          <div className="w-full h-full relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            <button type="button" onClick={retake}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold text-zinc-900 shadow border border-zinc-200">
              Retake
            </button>
          </div>
        ) : mode === "live" ? (
          <div className="w-full h-full relative">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <button type="button" onClick={captureFromVideo}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-indigo-600 shadow-xl flex items-center justify-center p-1">
              <div className="w-full h-full bg-indigo-600 rounded-full active:scale-90 transition-transform" />
            </button>
            <button type="button" onClick={retake}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white text-xs font-bold">✕</button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <button type="button" onClick={startCamera}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100">
              Open Camera
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="text-xs text-zinc-400 font-bold underline">
              or pick from gallery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
