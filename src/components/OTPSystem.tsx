"use client";

import { useState } from "react";
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

interface PreApproval {
  id?: string;
  otp: string;
  name: string;
  phone: string;
  apartmentFloor: string;
  hostName: string;
  validUntil: Timestamp;
  createdBy: string;
  used: boolean;
}

// Admin: Create pre-approvals
export function PreApprovalManager() {
  const [form, setForm] = useState({ name: "", phone: "", apartmentFloor: "", hostName: "", validHours: "4" });
  const [saving, setSaving] = useState(false);
  const [lastOTP, setLastOTP] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const user = auth.currentUser;
    if (!user) { setError("Not logged in"); return; }

    setSaving(true);
    try {
      const otp = generateOTP();
      const validUntil = Timestamp.fromDate(new Date(Date.now() + parseInt(form.validHours) * 3600 * 1000));
      await addDoc(collection(db, "preApprovals"), {
        otp,
        name: form.name,
        phone: form.phone,
        apartmentFloor: form.apartmentFloor,
        hostName: form.hostName,
        validUntil,
        createdBy: user.email,
        used: false,
      });
      setLastOTP(otp);
      setForm({ name: "", phone: "", apartmentFloor: "", hostName: "", validHours: "4" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {lastOTP && (
        <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-2">
          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Pre-Approval Created!</p>
          <p className="text-5xl font-black text-emerald-700 tracking-[0.3em]">{lastOTP}</p>
          <p className="text-xs text-emerald-600 font-semibold">Share this OTP with your visitor. Valid for {form.validHours} hours after last save.</p>
          <button onClick={() => setLastOTP(null)} className="text-xs text-emerald-500 underline font-bold mt-2">Create another</button>
        </div>
      )}

      {!lastOTP && (
        <form onSubmit={create} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-zinc-900 text-sm uppercase tracking-widest">New Pre-Approval</h3>
          {error && <div className="text-xs text-red-600 font-bold p-3 bg-red-50 rounded-xl">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Visitor Name *", key: "name", placeholder: "Rahul Sharma", required: true },
              { label: "Phone", key: "phone", placeholder: "+91 99999 88888", required: false },
              { label: "Flat / Floor *", key: "apartmentFloor", placeholder: "C-702", required: true },
              { label: "Host Name", key: "hostName", placeholder: "Your name", required: false },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{f.label}</label>
                <input
                  required={f.required}
                  className="w-full px-3 py-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none text-sm font-medium focus:ring-4 focus:ring-indigo-500/10"
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valid for</label>
            <select
              className="w-full px-3 py-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none text-sm font-medium"
              value={form.validHours}
              onChange={e => setForm(p => ({ ...p, validHours: e.target.value }))}
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="8">8 hours</option>
              <option value="24">24 hours</option>
            </select>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm disabled:opacity-50 active:scale-95 transition-all">
            {saving ? "Generating…" : "Generate OTP Pass"}
          </button>
        </form>
      )}
    </div>
  );
}

// Guard: Verify OTP and get pre-filled data
export function OTPVerifier({ onVerified }: { onVerified: (data: Partial<PreApproval>) => void }) {
  const [otp, setOtp] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    if (otp.length !== 4) { setError("Enter a 4-digit OTP."); return; }
    setChecking(true);
    setError(null);

    try {
      const q = query(
        collection(db, "preApprovals"),
        where("otp", "==", otp.trim()),
        where("used", "==", false)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Invalid or already-used OTP. Please check with the resident.");
        return;
      }

      const data = snap.docs[0].data() as PreApproval;
      const id = snap.docs[0].id;

      // Check if expired
      if (data.validUntil.toDate() < new Date()) {
        setError("This OTP has expired. Ask the resident to generate a new one.");
        return;
      }

      onVerified({ ...data, id });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔑</span>
        <div>
          <p className="text-sm font-black text-indigo-900">Pre-Approved Visitor</p>
          <p className="text-xs text-indigo-600 font-medium">Enter the 4-digit OTP from the resident</p>
        </div>
      </div>

      {error && <div className="text-xs text-red-600 font-bold p-3 bg-red-50 border border-red-200 rounded-xl">{error}</div>}

      <div className="flex gap-3">
        <input
          type="number"
          maxLength={4}
          className="flex-1 px-4 py-3 rounded-xl border border-indigo-300 bg-white text-center text-2xl font-black tracking-[0.4em] outline-none focus:ring-4 focus:ring-indigo-500/20"
          placeholder="0000"
          value={otp}
          onChange={e => setOtp(e.target.value.slice(0, 4))}
          onKeyDown={e => e.key === 'Enter' && verify()}
        />
        <button
          type="button"
          onClick={verify}
          disabled={checking}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm disabled:opacity-50 active:scale-95 transition-all"
        >
          {checking ? "…" : "Verify"}
        </button>
      </div>
    </div>
  );
}
