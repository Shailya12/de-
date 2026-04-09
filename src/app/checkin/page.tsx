"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, Timestamp, where, getDocs, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import CheckinForm from "@/components/CheckinForm";
import DeliveryCheckin from "@/components/DeliveryCheckin";
import { OTPVerifier } from "@/components/OTPSystem";
import { Visitor } from "@/types/visitor";
import { format } from "date-fns";

type CheckinMode = "standard" | "delivery" | "otp" | "none";

export default function CheckinPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [allVisitors, setAllVisitors] = useState<Visitor[]>([]);
  const [mode, setMode] = useState<CheckinMode>("none");
  const [otpData, setOtpData] = useState<any>(null);
  
  // Vehicle Search
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [searchResult, setSearchResult] = useState<Visitor | null>(null);

  useEffect(() => {
    if (!loading && (!user || role === "admin")) {
      router.push(role === "admin" ? "/admin" : "/login");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "visitors"),
      orderBy("checkInTime", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Visitor));
      setAllVisitors(docs);
    }, (err) => {
      console.error("Firestore listener error:", err);
    });

    return () => unsub();
  }, [user]);

  const currentlyInside = allVisitors.filter(v => v.status === "checked-in");

  const handleCheckout = async (id: string) => {
    try {
      const visitorRef = doc(db, "visitors", id);
      await updateDoc(visitorRef, {
        status: "checked-out",
        checkOutTime: Timestamp.now()
      });
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Checkout failed.");
    }
  };

  const handleVehicleSearch = async () => {
    if (vehicleSearch.length < 3) return;
    try {
      // Find the most recent visitor with this vehicle number (last 4 digits match or exact match)
      const q = query(
        collection(db, "visitors"),
        where("vehicleNumber", ">=", vehicleSearch.toUpperCase()),
        where("vehicleNumber", "<=", vehicleSearch.toUpperCase() + "\uf8ff"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSearchResult({ id: snap.docs[0].id, ...snap.docs[0].data() } as Visitor);
      } else {
        setSearchResult(null);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-28">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50 shadow-sm px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="font-bold text-zinc-900 leading-tight">Security Portal</h1>
        </div>
        <button onClick={() => auth.signOut()} className="text-xs font-bold text-zinc-400 hover:text-red-500">Log Out</button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Entry Actions */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900">Entrance Controls</h2>
            <div className="flex gap-2">
              <button onClick={() => setMode("delivery")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'delivery' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'}`}>⚡ Delivery</button>
              <button onClick={() => setMode("otp")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'otp' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>🔑 Use OTP</button>
              <button onClick={() => setMode(mode === 'standard' ? 'none' : 'standard')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'standard' ? 'bg-zinc-200 text-zinc-600' : 'bg-indigo-600 text-white shadow-lg'}`}>+ Add Visitor</button>
            </div>
          </div>

          <div className="grid gap-6">
            {mode === "otp" && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <OTPVerifier onVerified={(data) => { setOtpData(data); setMode("standard"); }} />
              </div>
            )}
            
            {mode === "delivery" && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <DeliveryCheckin onComplete={() => setMode("none")} />
              </div>
            )}

            {mode === "standard" && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <CheckinForm onComplete={() => { setMode("none"); setOtpData(null); }} prefill={otpData} />
              </div>
            )}
          </div>
        </section>

        {/* Vehicle Search */}
        <section className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm space-y-4">
           <div className="flex items-center gap-3">
              <span className="text-xl">🚗</span>
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Find Vehicle/Owner</h2>
           </div>
           <div className="flex gap-2">
              <input 
                className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10"
                placeholder="Enter last 4 digits (e.g. 1234)"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVehicleSearch()}
              />
              <button onClick={handleVehicleSearch} className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold">Search</button>
           </div>
           
           {searchResult && (
             <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">👤</div>
                   <div>
                      <p className="font-bold text-zinc-900">{searchResult.name}</p>
                      <p className="text-[11px] text-zinc-500">Lives/Visiting: <span className="font-bold text-zinc-900">{searchResult.apartmentFloor || "N/A"}</span></p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-indigo-600 uppercase">Last Seen</p>
                   <p className="text-xs font-bold text-zinc-400">{format(searchResult.checkInTime.toDate(), "dd MMM")}</p>
                </div>
             </div>
           )}
        </section>

        {/* List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Currently Inside ({currentlyInside.length})</h2>
          </div>
          <div className="grid gap-3">
            {currentlyInside.map(v => (
              <div key={v.id} className="bg-white border border-zinc-200 p-4 rounded-2xl flex items-center justify-between group hover:border-indigo-300 transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                    <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 truncate">{v.name}</p>
                    <p className="text-[11px] text-zinc-400 font-medium">{v.phone} • {v.apartmentFloor}</p>
                  </div>
                </div>
                <button onClick={() => handleCheckout(v.id!)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm">✓ Check-out</button>
              </div>
            ))}
            {currentlyInside.length === 0 && <p className="text-center py-8 text-zinc-400 text-sm">No visitors inside.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
