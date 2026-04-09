import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, limit, startAfter, getDocs, onSnapshot, updateDoc, doc, Timestamp, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Visitor } from "@/types/visitor";
import VisitorTable from "./VisitorTable";
import VisitorDetailModal from "./VisitorDetailModal";
import { exportToCSV } from "@/lib/export";

const PAGE_SIZE = 25;

export default function AdminDashboard() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState({ inside: 0, today: 0, total: 0 });
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const fetchVisitors = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    
    try {
      const q = reset 
        ? query(collection(db, "visitors"), orderBy("checkInTime", "desc"), limit(PAGE_SIZE))
        : lastDoc 
          ? query(collection(db, "visitors"), orderBy("checkInTime", "desc"), startAfter(lastDoc), limit(PAGE_SIZE))
          : query(collection(db, "visitors"), orderBy("checkInTime", "desc"), limit(PAGE_SIZE));

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Visitor));
      
      setVisitors(prev => reset ? docs : [...prev, ...docs]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, lastDoc]);

  useEffect(() => {
    fetchVisitors(true);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "visitors"), orderBy("checkInTime", "desc"), limit(500));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Visitor));
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayCount = docs.filter(v => v.checkInTime.toMillis() >= todayStart.getTime()).length;
      const insideCount = docs.filter(v => v.status === "checked-in").length;
      setStats({
        inside: insideCount,
        today: todayCount,
        total: docs.length
      });
    });

    return () => unsubscribe();
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchVisitors(false);
    }
  };

  const handleCheckout = async (id: string) => {
    try {
      const visitorRef = doc(db, "visitors", id);
      await updateDoc(visitorRef, {
        status: "checked-out",
        checkOutTime: Timestamp.now()
      });
      setSelectedVisitor(null);
    } catch (err) {
      console.error("Checkout override failed", err);
    }
  };

  const handleFlag = async (id: string) => {
     const visitorRef = doc(db, "visitors", id);
     await updateDoc(visitorRef, { flagged: true });
     alert("Visitor flagged.");
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between px-1">
         <h2 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em]">Live Overview</h2>
         <button 
           onClick={() => exportToCSV(visitors)}
           className="flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
         >
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
           Export Logs
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
           label="Inside Building" 
           value={stats.inside} 
           color="bg-indigo-600" 
           icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
        />
        <StatsCard 
           label="Checked-in Today" 
           value={stats.today} 
           color="bg-emerald-600"
           icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 shadow-xl flex flex-col justify-between">
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Daily Performance</p>
           <div className="flex items-end gap-3 mt-4">
              <p className="text-3xl font-black text-white">{Math.round((stats.today / (stats.total || 1)) * 100)}%</p>
              <p className="text-[10px] font-bold text-zinc-400 mb-1.5 leading-none">Activity vs Record</p>
           </div>
           <div className="space-y-1.5 mt-4">
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500" style={{ width: `${(stats.today / (stats.total || 1)) * 100}%` }} />
              </div>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Automated Daily Insights</p>
           </div>
        </div>
      </div>

      <VisitorTable 
        visitors={visitors} 
        onViewDetails={(v) => setSelectedVisitor(v)} 
        onCheckout={handleCheckout} 
      />

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-sm font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {selectedVisitor && (
        <VisitorDetailModal 
          visitor={selectedVisitor} 
          onClose={() => setSelectedVisitor(null)} 
          onCheckout={handleCheckout}
          onFlag={handleFlag}
        />
      )}
    </div>
  );
}

function StatsCard({ label, value, color, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-500">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
        <p className="text-4xl font-black text-zinc-900 tabular-nums">{value}</p>
      </div>
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-xl shadow-zinc-100 group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
    </div>
  );
}
