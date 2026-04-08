"use client";

import { Visitor } from "@/types/visitor";
import { format } from "date-fns";

interface VisitorDetailModalProps {
  visitor: Visitor | null;
  onClose: () => void;
  onFlag: (id: string) => void;
  onCheckout: (id: string) => void;
}

export default function VisitorDetailModal({ visitor, onClose, onFlag, onCheckout }: VisitorDetailModalProps) {
  if (!visitor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="relative h-64 bg-zinc-100 border-b border-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={visitor.photoUrl} alt="Visitor" className="w-full h-full object-cover" />
          <button 
             onClick={onClose}
             className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
             <div>
               <h2 className="text-2xl font-black text-zinc-900 leading-tight">{visitor.name}</h2>
               <div className="flex items-center gap-2 mt-1">
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">{visitor.purpose} • {visitor.phone}</p>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    Trusted Visitor
                  </span>
               </div>
             </div>
             <div className="flex gap-2">
               <button 
                 onClick={() => window.print()}
                 className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-zinc-200 flex items-center gap-2"
               >
                 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 Print Pass
               </button>
               {visitor.status === 'checked-in' && (
                 <button 
                   onClick={() => onCheckout(visitor.id)}
                   className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-100"
                 >
                   Checkout
                 </button>
               )}
             </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
             <Detail label="Flat / Room" value={visitor.apartmentFloor || "N/A"} />
             <Detail label="Host Name" value={visitor.hostName || "N/A"} />
             <Detail label="Vehicle #" value={visitor.vehicleNumber || "N/A"} />
             <Detail label="Check-in" value={format(visitor.checkInTime.toDate(), "p, PP")} />
             <Detail label="Check-out" value={visitor.checkOutTime ? format(visitor.checkOutTime.toDate(), "p, PP") : "Still Inside"} />
             <Detail label="Security Guard" value={visitor.checkedInByName} />
          </div>

          {visitor.idPhotoUrl && (
            <div className="space-y-3">
               <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Identification Document</label>
               <div className="w-full aspect-video rounded-3xl overflow-hidden border-2 border-zinc-200 bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={visitor.idPhotoUrl} alt="ID" className="w-full h-full object-cover" />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-bold text-zinc-900 border-l-2 border-indigo-100 pl-3 py-0.5">{value}</p>
    </div>
  );
}
