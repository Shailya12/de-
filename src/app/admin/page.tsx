"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "@/components/AdminDashboard";
import BlocklistPanel from "@/components/BlocklistPanel";
import { PreApprovalManager } from "@/components/OTPSystem";
import VisitorDetailModal from "@/components/VisitorDetailModal";
import { Visitor } from "@/types/visitor";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";

type Tab = "logs" | "blocklist" | "preapprovals";

export default function AdminPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab ] = useState<Tab>("logs");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.push("/login");
    }
  }, [user, role, loading, router]);

  const handleCheckout = async (id: string) => {
    const visitorRef = doc(db, "visitors", id);
    await updateDoc(visitorRef, { status: "checked-out", checkOutTime: Timestamp.now() });
    setSelectedVisitor(null);
  };

  if (loading) return <div className="p-12 text-center text-zinc-400 font-bold animate-pulse">Loading Command Center...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
             <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 0a10.003 10.003 0 0110 10c0 1.033-.155 2.03-.44 2.962m-1.29 2.14a9.901 9.901 0 01-4.099 3.098m-3.167-1.474L12.85 20M12 3v18" />
             </svg>
           </div>
           <h1 className="font-black text-zinc-900 text-lg uppercase tracking-tight">Security Command</h1>
        </div>
        <button onClick={() => auth.signOut()} className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-red-600 transition-all border border-zinc-200">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <nav className="flex gap-1 p-1 bg-zinc-200/50 rounded-2xl w-fit">
           {[
             { id: "logs", label: "Visitor Logs" },
             { id: "preapprovals", label: "Pre-Approvals" },
             { id: "blocklist", label: "Blocklist" },
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as Tab)}
               className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
             >
               {tab.label}
             </button>
           ))}
        </nav>

        {activeTab === "logs" && <AdminDashboard />}
        {activeTab === "preapprovals" && <div className="max-w-2xl"><PreApprovalManager /></div>}
        {activeTab === "blocklist" && <BlocklistPanel />}
      </main>

      <VisitorDetailModal visitor={selectedVisitor} onClose={() => setSelectedVisitor(null)} onCheckout={handleCheckout} onFlag={() => {}} />
    </div>
  );
}
