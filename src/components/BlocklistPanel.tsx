"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { BlocklistedVisitor } from "@/types/visitor";

export default function BlocklistPanel() {
  const [list, setList] = useState<BlocklistedVisitor[]>([]);
  const [newEntry, setNewEntry] = useState({ name: "", phone: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "blocklist"), orderBy("addedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setList(snap.docs.map(d => ({ id: d.id, ...d.data() } as BlocklistedVisitor)));
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "blocklist"), {
        ...newEntry,
        addedAt: Timestamp.now(),
        addedBy: auth.currentUser?.uid || "admin"
      });
      setNewEntry({ name: "", phone: "", reason: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (confirm("Remove this person from blocklist?")) {
      await deleteDoc(doc(db, "blocklist", id));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 border-r border-zinc-100 pr-8">
        <h3 className="text-sm font-bold text-zinc-900 mb-6 flex items-center gap-2">
           <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
           </div>
           Block New Visitor
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
           <input 
             required
             className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:bg-white transition-all font-medium"
             placeholder="Visitor Name"
             value={newEntry.name}
             onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
           />
           <input 
             required
             className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:bg-white transition-all font-medium"
             placeholder="Phone Number"
             value={newEntry.phone}
             onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
           />
           <textarea 
             required
             className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:bg-white transition-all font-medium resize-none"
             placeholder="Reason for blocking..."
             rows={3}
             value={newEntry.reason}
             onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
           />
           <button 
             disabled={submitting}
             className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
           >
             {submitting ? "Processing..." : "Confirm Block"}
           </button>
        </form>
      </div>

      <div className="md:col-span-2 space-y-4">
        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">Currently Blocked ({list.length})</h3>
        <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden divide-y divide-zinc-50">
           {list.map(v => (
             <div key={v.id} className="p-5 flex items-center justify-between group">
                <div>
                   <p className="text-sm font-bold text-zinc-900">{v.name}</p>
                   <p className="text-xs text-red-600 font-bold">{v.phone}</p>
                   <p className="text-[11px] text-zinc-400 mt-1 italic font-medium">Reason: {v.reason}</p>
                </div>
                <button 
                   onClick={() => removeEntry(v.id)}
                   className="p-3 text-zinc-300 hover:text-emerald-600 transition-all"
                >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
             </div>
           ))}
           {list.length === 0 && <div className="p-10 text-center text-zinc-400 text-xs italic">No blocked visitors found.</div>}
        </div>
      </div>
    </div>
  );
}
