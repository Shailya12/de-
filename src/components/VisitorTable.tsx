"use client";

import { useState } from "react";
import { Visitor } from "@/types/visitor";
import { format } from "date-fns";

interface VisitorTableProps {
  visitors: Visitor[];
  onViewDetails: (visitor: Visitor) => void;
  onCheckout: (id: string) => void;
}

export default function VisitorTable({ visitors, onViewDetails, onCheckout }: VisitorTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPurpose, setFilterPurpose] = useState("All");

  const filtered = visitors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.phone.includes(searchTerm) ||
                          v.apartmentFloor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPurpose = filterPurpose === "All" || v.purpose === filterPurpose;
    return matchesSearch && matchesPurpose;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
            placeholder="Search by name, phone, or flat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <select 
          className="bg-white border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-600 outline-none hover:border-zinc-300 transition-colors cursor-pointer"
          value={filterPurpose}
          onChange={(e) => setFilterPurpose(e.target.value)}
        >
          <option value="All">All Purposes</option>
          <option value="Delivery">Delivery Only</option>
          <option value="Guest">Guests Only</option>
          <option value="Maintenance">Maintenance Only</option>
        </select>
      </div>

      <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-xl shadow-zinc-200/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Visitor</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phone</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Flat/House</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-zinc-50/30 transition-colors cursor-pointer" onClick={() => onViewDetails(v)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-bold text-zinc-900 leading-none mb-1">{v.name}</p>
                           {visitors.filter(x => x.phone === v.phone).length > 1 && (
                             <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                               <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" /></svg>
                               Repeat
                             </span>
                           )}
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{v.purpose}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-zinc-600">{v.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                      {v.apartmentFloor}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${v.status === 'checked-in' ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-300'}`} />
                       <p className={`text-[11px] font-bold uppercase tracking-wider ${v.status === 'checked-in' ? 'text-indigo-600' : 'text-zinc-500'}`}>
                         {v.status === 'checked-in' ? 'Inside' : 'Left'}
                       </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                       onClick={(e) => { e.stopPropagation(); onViewDetails(v); }}
                       className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-zinc-400 italic text-sm">
            No matching visitors found.
          </div>
        )}
      </div>
    </div>
  );
}
