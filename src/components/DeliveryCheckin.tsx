"use client";

import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import PhotoCapture from "./PhotoCapture";

const DELIVERY_COMPANIES = [
  { id: "swiggy", label: "🛵 Swiggy" },
  { id: "zomato", label: "🛵 Zomato" },
  { id: "amazon", label: "📦 Amazon" },
  { id: "flipkart", label: "📦 Flipkart" },
  { id: "bigbasket", label: "🛒 BigBasket" },
  { id: "blinkit", label: "⚡ Blinkit" },
  { id: "dunzo", label: "🚴 Dunzo" },
  { id: "other", label: "📬 Other" },
];

export default function DeliveryCheckin({ onComplete }: { onComplete: () => void }) {
  const [company, setCompany] = useState("");
  const [flat, setFlat] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!company) { setError("Please select the delivery company."); return; }
    if (!photo) { setError("Please capture a photo of the delivery person."); return; }

    const user = auth.currentUser;
    if (!user) { setError("You are not logged in."); return; }

    setSubmitting(true);
    try {
      const label = DELIVERY_COMPANIES.find(c => c.id === company)?.label || company;
      await addDoc(collection(db, "visitors"), {
        name: `Delivery — ${label}`,
        phone: "0000000000",
        photoUrl: photo,
        idPhotoUrl: "",
        purpose: "Delivery",
        hostName: "",
        apartmentFloor: flat,
        vehicleNumber: "",
        notes: `Quick delivery check-in`,
        checkInTime: Timestamp.now(),
        status: "checked-in",
        checkedInBy: user.uid,
        checkedInByName: user.displayName || user.email || "Security Guard",
        flagged: false,
        isQuickDelivery: true,
      });
      onComplete();
    } catch (err: any) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-amber-100">
          ⚡
        </div>
        <div>
          <h3 className="font-black text-zinc-900 text-base">Quick Delivery Check-in</h3>
          <p className="text-xs text-zinc-500 font-medium">Fast track for deliveries — done in 10 seconds</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-semibold">{error}</div>
      )}

      {/* Company selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Delivery Company *</label>
        <div className="grid grid-cols-4 gap-2">
          {DELIVERY_COMPANIES.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCompany(c.id)}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center transition-all border ${
                company === c.id
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-amber-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Flat / Floor</label>
          <input
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-white outline-none text-sm font-medium focus:ring-4 focus:ring-amber-500/10"
            placeholder="C-702"
            value={flat}
            onChange={(e) => setFlat(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] ml-1">Photo *</label>
          <div className="text-xs text-zinc-400 font-medium pt-1">Use camera below ↓</div>
        </div>
      </div>

      <PhotoCapture label="Delivery Person Photo *" onCapture={setPhoto} />

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-[1.25rem] font-black transition-all shadow-xl shadow-amber-100 disabled:opacity-50 active:scale-95 text-base"
      >
        {submitting ? "Saving…" : "⚡ Quick Check-in"}
      </button>
    </form>
  );
}
