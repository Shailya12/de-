"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Link from "next/link";
import { mathSubject } from "@/data/papers";
import { AdminQuestion } from "@/types/admin";

const SEASONS = ["May/June", "Oct/Nov", "Feb/Mar"] as const;
type Season = (typeof SEASONS)[number];

const allTopics = mathSubject.topics.flatMap((t) => [
  t,
  ...(t.subtopics ?? []),
]);

const defaultForm = {
  topicId: "",
  year: new Date().getFullYear().toString(),
  season: "May/June" as Season,
  paperNumber: "4",
  variant: "1",
  number: "1",
  marks: "3",
  text: "",
  markScheme: "",
};

export default function AdminPage() {
  const [form, setForm] = useState(defaultForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then(setQuestions)
      .catch(() => {});
  }, []);

  function handleImageChange(file: File | null) {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    handleImageChange(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleImageChange(e.dataTransfer.files?.[0] ?? null);
  }

  function setField(key: keyof typeof defaultForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.topicId) {
      setError("Please select a topic.");
      return;
    }
    if (!imageFile && !form.text) {
      setError("Please upload an image or enter question text.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl }),
      });
      if (!res.ok) throw new Error("Failed to save question");
      const saved: AdminQuestion = await res.json();

      setQuestions((q) => [saved, ...q]);
      setForm(defaultForm);
      setImageFile(null);
      setImagePreview(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    setQuestions((q) => q.filter((x) => x.id !== id));
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-zinc-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-bold text-zinc-900">Admin Panel</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Add question form */}
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-bold text-zinc-900">Add New Question</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Upload an image of the question from a past paper</p>
          </div>

          <div className="p-5 space-y-5">
            {/* Image upload */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Question Image
              </label>
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full max-h-72 object-contain" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg border border-zinc-200 text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 h-36 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                    dragging ? "border-indigo-400 bg-indigo-50" : "border-zinc-300 hover:border-indigo-300 hover:bg-zinc-50"
                  }`}
                >
                  <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-zinc-400">Tap to upload or drag image here</p>
                  <p className="text-xs text-zinc-300">PNG, JPG, WEBP</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Topic <span className="text-red-400">*</span>
              </label>
              <select
                value={form.topicId}
                onChange={(e) => setField("topicId", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
              >
                <option value="">Select a topic…</option>
                {mathSubject.topics.map((parent) => (
                  <optgroup key={parent.id} label={parent.name}>
                    {(parent.subtopics ?? []).map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                    {(!parent.subtopics || parent.subtopics.length === 0) && (
                      <option value={parent.id}>{parent.name}</option>
                    )}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Year + Season */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Year</label>
                <input
                  type="number"
                  min="2000"
                  max="2099"
                  value={form.year}
                  onChange={(e) => setField("year", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Season</label>
                <select
                  value={form.season}
                  onChange={(e) => setField("season", e.target.value as Season)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                >
                  {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Paper + Variant + Q number + Marks */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Paper #</label>
                <select
                  value={form.paperNumber}
                  onChange={(e) => setField("paperNumber", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                >
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Paper {n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Variant</label>
                <select
                  value={form.variant}
                  onChange={(e) => setField("variant", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                >
                  {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Q Number</label>
                <input
                  type="number"
                  min="1"
                  value={form.number}
                  onChange={(e) => setField("number", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Marks</label>
                <input
                  type="number"
                  min="1"
                  value={form.marks}
                  onChange={(e) => setField("marks", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                />
              </div>
            </div>

            {/* Optional text */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Question Text <span className="text-zinc-300 font-normal normal-case">(optional if image uploaded)</span>
              </label>
              <textarea
                value={form.text}
                onChange={(e) => setField("text", e.target.value)}
                rows={3}
                placeholder="Type the question text here…"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-none"
              />
            </div>

            {/* Mark scheme */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Mark Scheme <span className="text-zinc-300 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={form.markScheme}
                onChange={(e) => setField("markScheme", e.target.value)}
                rows={3}
                placeholder="Enter the mark scheme…"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-none"
              />
            </div>

            {/* Feedback */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Question added successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving…" : "Add Question"}
            </button>
          </div>
        </form>

        {/* Existing questions */}
        {questions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide px-1">
              Added Questions ({questions.length})
            </h2>
            {questions.map((q) => {
              const topicName = allTopics.find((t) => t.id === q.topicId)?.name ?? q.topicId;
              const label = `${q.year} ${q.season} · P${q.paperNumber}/${q.variant}`;
              return (
                <div key={q.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                  <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  {q.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.imageUrl} alt={`Q${q.number}`} className="w-full max-h-48 object-contain bg-zinc-50" />
                  )}
                  <div className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          Q{q.number}
                        </span>
                        <span className="text-xs text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                          {label}
                        </span>
                        <span className="text-xs text-zinc-400">{q.marks} marks</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{topicName}</p>
                      {q.text && <p className="text-sm text-zinc-700 mt-1 line-clamp-2">{q.text}</p>}
                    </div>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      title="Delete question"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
