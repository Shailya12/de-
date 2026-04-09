"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import PhotoCapture from "./PhotoCapture";
import { Visitor } from "@/types/visitor";

const PURPOSES = ['Delivery', 'Guest', 'Meeting', 'Maintenance', 'Other'] as const;

const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Phone number is required";
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  if (cleaned.length < 10 || cleaned.length > 15) return "Phone must be 10-15 digits";
  if (!/^\+?[0-9]+$/.test(cleaned)) return "Invalid phone format";
  return null;
}

function validateName(name: string): string | null {
  if (!name.trim()) return "Name is required";
  if (name.trim().length < NAME_MIN_LENGTH) return `Name must be at least ${NAME_MIN_LENGTH} characters`;
  if (name.trim().length > NAME_MAX_LENGTH) return `Name must be less than ${NAME_MAX_LENGTH} characters`;
  if (!/^[a-zA-Z][a-zA-Z\s\.\-']+$/.test(name.trim())) return "Name can only contain letters, spaces, dots, and hyphens";
  return null;
}

function sanitizeInput(input: string): string {
  return input.trim().slice(0, 500);
}

interface KnownVisitor {
  name: string;
  phone: string;
  apartmentFloor: string;
  hostName: string;
  vehicleNumber: string;
  visitCount: number;
}

export default function CheckinForm({ onComplete, prefill }: { 
  onComplete: () => void;
  prefill?: Partial<Visitor>;
}) {
  const [form, setForm] = useState({
    name: prefill?.name || "",
    phone: prefill?.phone || "",
    purpose: (prefill?.purpose || "Guest") as Visitor['purpose'],
    hostName: prefill?.hostName || "",
    apartmentFloor: prefill?.apartmentFloor || "",
    vehicleNumber: prefill?.vehicleNumber || "",
    notes: "",
  });
  
  const [photos, setPhotos] = useState<{ visitor: string | null; id: string | null }>({ visitor: null, id: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [knownVisitor, setKnownVisitor] = useState<KnownVisitor | null>(null);
  const phoneDebounce = useRef<any>(null);

  // Real-time blocklist + known visitor check
  useEffect(() => {
    if (form.phone.length >= 10) {
      clearTimeout(phoneDebounce.current);
      phoneDebounce.current = setTimeout(async () => {
        try {
          // Blocklist check
          const blQ = query(collection(db, "blocklist"), where("phone", "==", form.phone));
          const blSnap = await getDocs(blQ);
          setBlocked(!blSnap.empty);

          // Known visitor lookup — find last visit with this phone
          const visQ = query(
            collection(db, "visitors"),
            where("phone", "==", form.phone),
            orderBy("checkInTime", "desc"),
            limit(5)
          );
          const visSnap = await getDocs(visQ);
          if (!visSnap.empty && !form.name) {
            // Only auto-fill if name not already entered
            const lastVisit = visSnap.docs[0].data();
            setKnownVisitor({
              name: lastVisit.name,
              phone: lastVisit.phone,
              apartmentFloor: lastVisit.apartmentFloor || "",
              hostName: lastVisit.hostName || "",
              vehicleNumber: lastVisit.vehicleNumber || "",
              visitCount: visSnap.size,
            });
          } else {
            setKnownVisitor(null);
          }
        } catch {
          setBlocked(false);
        }
      }, 600);
    } else {
      setBlocked(false);
      setKnownVisitor(null);
    }
  }, [form.phone, form.name]);

  const applyKnownVisitor = () => {
    if (!knownVisitor) return;
    setForm(f => ({
      ...f,
      name: knownVisitor.name,
      apartmentFloor: knownVisitor.apartmentFloor,
      hostName: knownVisitor.hostName,
      vehicleNumber: knownVisitor.vehicleNumber,
    }));
    setKnownVisitor(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!photos.visitor) {
      setSubmitError("Please capture a photo of the visitor first.");
      return;
    }
    if (blocked) {
      setSubmitError("⛔ This phone number is on the blocklist!");
      return;
    }

    const phoneError = validatePhone(form.phone);
    if (phoneError) {
      setSubmitError(phoneError);
      return;
    }

    const nameError = validateName(form.name);
    if (nameError) {
      setSubmitError(nameError);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setSubmitError("You are not logged in. Please sign in again.");
      return;
    }

    setSubmitting(true);
    try {
      const visitorData = {
        name: sanitizeInput(form.name),
        phone: sanitizeInput(form.phone.replace(/[\s\-\(\)\.]/g, "")),
        photoUrl: photos.visitor,
        idPhotoUrl: photos.id || "",
        purpose: form.purpose,
        hostName: sanitizeInput(form.hostName),
        apartmentFloor: sanitizeInput(form.apartmentFloor),
        vehicleNumber: sanitizeInput(form.vehicleNumber).toUpperCase(),
        notes: sanitizeInput(form.notes),
        checkInTime: Timestamp.now(),
        status: "checked-in",
        checkedInBy: user.uid,
        checkedInByName: user.displayName || user.email || "Security Guard",
        flagged: false,
      };

      await addDoc(collection(db, "visitors"), visitorData);
      onComplete();
    } catch (err: any) {
      console.error("Check-in error:", err);
      setSubmitError(`Save failed: ${err.message}. Check Firestore rules.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 font-semibold flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <PhotoCapture label="Visitor Face Photo *" onCapture={(dataUrl) => setPhotos(p => ({ ...p, visitor: dataUrl }))} />
          <PhotoCapture label="ID Document (Optional)" onCapture={(dataUrl) => setPhotos(p => ({ ...p, id: dataUrl }))} />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-200/40 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900">Registration Details</h3>
          </div>
          
          <div className="space-y-5">
            {/* Phone first for auto-fill */}
            <Field label={<>Phone * {blocked && <span className="text-red-600 font-black animate-pulse ml-2">– BLOCKED</span>}</>}>
              <input required type="tel"
                className={`${inputCls} ${blocked ? 'border-red-500 bg-red-50 text-red-900 ring-4 ring-red-500/10' : ''}`}
                placeholder="+91 99999 88888" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>

            {/* Known visitor auto-fill banner */}
            {knownVisitor && (
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👋</span>
                  <div>
                    <p className="text-xs font-black text-indigo-800">Known Visitor ({knownVisitor.visitCount} past visits)</p>
                    <p className="text-xs text-indigo-600 font-semibold">{knownVisitor.name} · {knownVisitor.apartmentFloor}</p>
                  </div>
                </div>
                <button type="button" onClick={applyKnownVisitor}
                  className="text-xs font-black text-white bg-indigo-600 px-3 py-1.5 rounded-xl shrink-0">
                  Auto-fill
                </button>
              </div>
            )}

            <Field label="Full Name *">
              <input required className={inputCls}
                placeholder="Ex: Rajesh Kumar" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Purpose *">
                <select className={inputCls} value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value as any })}>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Flat / Floor">
                <input className={inputCls} placeholder="C-702"
                  value={form.apartmentFloor}
                  onChange={(e) => setForm({ ...form, apartmentFloor: e.target.value })} />
              </Field>
            </div>

            <Field label="Host Name">
              <input className={inputCls} placeholder="Who are they visiting?"
                value={form.hostName}
                onChange={(e) => setForm({ ...form, hostName: e.target.value })} />
            </Field>

            <Field label="Vehicle Info">
              <input className={inputCls} placeholder="MH-12-AB-1234"
                value={form.vehicleNumber}
                onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
            </Field>
          </div>

          <button type="submit" disabled={submitting || blocked}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] font-bold transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 mt-4 active:scale-95 text-base">
            {submitting ? "Saving…" : "Submit Check-in"}
          </button>
        </div>
      </div>
    </form>
  );
}

const inputCls = "w-full px-4 py-4 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium";

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">{label}</label>
      {children}
    </div>
  );
}
