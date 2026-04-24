'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, isYesterday } from 'date-fns'
import {
  Shield, Search, Download, UserCheck, UserX, AlertTriangle,
  LogOut, Ban, LayoutDashboard, ChevronRight, SlidersHorizontal, X,
  Clock, TrendingUp, Filter, BarChart2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import VisitorDetailModal from '@/components/VisitorDetailModal'
import BlocklistPanel from '@/components/BlocklistPanel'
import AnalyticsPanel from '@/components/AnalyticsPanel'
import { subscribeToVisitors, subscribeToBlocklist, checkOutVisitor, flagVisitor, getVisitorsByPhone } from '@/lib/firestore'
import type { Visitor, BlocklistEntry, VisitPurpose } from '@/types'
import * as XLSX from 'xlsx'

type StatusFilter = 'all' | 'checked-in' | 'checked-out'
type DateFilter = 'today' | 'yesterday' | 'all'

function exportCSV(visitors: Visitor[]) {
  const headers = ['Name', 'Phone', 'Purpose', 'Host', 'Apt/Floor', 'Vehicle', 'Check-in', 'Check-out', 'Status', 'Flagged', 'Notes', 'Registered By']
  const rows = visitors.map((v) => [
    v.name, v.phone, v.purpose, v.hostName ?? '', v.apartmentFloor ?? '',
    v.vehicleNumber ?? '',
    format(v.checkInTime, 'dd/MM/yyyy HH:mm'),
    v.checkOutTime ? format(v.checkOutTime, 'dd/MM/yyyy HH:mm') : '',
    v.status, v.flagged ? 'Yes' : 'No', v.notes ?? '', v.checkedInByName,
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vigil-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportExcel(visitors: Visitor[]) {
  const rows = visitors.map((v) => ({
    Name: v.name,
    Phone: v.phone,
    Purpose: v.purpose,
    Host: v.hostName ?? '',
    'Apt/Floor': v.apartmentFloor ?? '',
    Vehicle: v.vehicleNumber ?? '',
    'Check-in': format(v.checkInTime, 'dd/MM/yyyy HH:mm'),
    'Check-out': v.checkOutTime ? format(v.checkOutTime, 'dd/MM/yyyy HH:mm') : '',
    Status: v.status === 'checked-in' ? 'Inside' : 'Left',
    Flagged: v.flagged ? 'Yes' : 'No',
    Notes: v.notes ?? '',
    'Registered By': v.checkedInByName,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Visitors')
  XLSX.writeFile(wb, `vigil-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

const PURPOSE_EMOJI: Record<string, string> = {
  Delivery: '📦', Guest: '👤', Meeting: '🤝', Maintenance: '🔧', Other: '•',
}

function VisitorSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="w-10 h-10 rounded-full" style={{ background: 'var(--surface)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded w-1/3" style={{ background: 'var(--surface)' }} />
        <div className="h-3 rounded w-1/4" style={{ background: 'var(--surface)' }} />
      </div>
      <div className="h-5 w-16 rounded-full" style={{ background: 'var(--surface)' }} />
      <div className="h-5 w-14 rounded-full" style={{ background: 'var(--surface)' }} />
    </div>
  )
}

export default function AdminPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()

  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [visitorsLoading, setVisitorsLoading] = useState(true)
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([])
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [visitCountMap, setVisitCountMap] = useState<Record<string, number>>({})
  const [showBlocklistModal, setShowBlocklistModal] = useState(false)
  const [blocklistPrefill, setBlocklistPrefill] = useState({ name: '', phone: '' })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<'visitors' | 'analytics'>('visitors')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [purposeFilter, setPurposeFilter] = useState<VisitPurpose | 'all'>('all')

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.replace(user ? '/checkin' : '/login')
    }
  }, [user, role, loading, router])

  useEffect(() => {
    if (!user || role !== 'admin') return
    // Limit to 500 most recent records to avoid loading all data at once
    const unsub1 = subscribeToVisitors((all) => {
      setVisitors(all)
      setVisitorsLoading(false)
    }, 500)
    const unsub2 = subscribeToBlocklist(setBlocklist)
    return () => { unsub1(); unsub2() }
  }, [user, role])

  useEffect(() => {
    if (!selectedVisitor) return
    const phone = selectedVisitor.phone
    if (visitCountMap[phone] !== undefined) return
    getVisitorsByPhone(phone).then((visits) => {
      setVisitCountMap((prev) => ({ ...prev, [phone]: visits.length }))
    })
  }, [selectedVisitor, visitCountMap])

  const filtered = useMemo(() => {
    return visitors.filter((v) => {
      if (search) {
        const q = search.toLowerCase()
        if (!v.name.toLowerCase().includes(q) && !v.phone.includes(q)) return false
      }
      if (statusFilter !== 'all' && v.status !== statusFilter) return false
      if (purposeFilter !== 'all' && v.purpose !== purposeFilter) return false
      if (dateFilter === 'today' && !isToday(v.checkInTime)) return false
      if (dateFilter === 'yesterday' && !isYesterday(v.checkInTime)) return false
      return true
    })
  }, [visitors, search, statusFilter, dateFilter, purposeFilter])

  const stats = useMemo(() => {
    const todayAll = visitors.filter((v) => isToday(v.checkInTime))
    return {
      todayTotal: todayAll.length,
      currentlyInside: visitors.filter((v) => v.status === 'checked-in').length,
      checkedOutToday: todayAll.filter((v) => v.status === 'checked-out').length,
      flagged: visitors.filter((v) => v.flagged).length,
    }
  }, [visitors])

  async function handleCheckout(id: string) {
    await checkOutVisitor(id)
    if (selectedVisitor?.id === id) {
      setSelectedVisitor((v) => v ? { ...v, status: 'checked-out', checkOutTime: new Date() } : v)
    }
  }

  async function handleFlag(id: string, flagged: boolean) {
    await flagVisitor(id, flagged)
    if (selectedVisitor?.id === id) {
      setSelectedVisitor((v) => v ? { ...v, flagged } : v)
    }
  }

  function handleAddToBlocklist(visitor: Visitor) {
    setBlocklistPrefill({ name: visitor.name, phone: visitor.phone })
    setShowBlocklistModal(true)
  }

  function labelDate(d: Date): string {
    if (isToday(d)) return `Today ${format(d, 'HH:mm')}`
    if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
    return format(d, 'dd MMM, HH:mm')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const adminName = user.email?.split('@')[0] ?? 'Admin'

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 w-64 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Vigil</p>
              <p className="text-xs leading-tight" style={{ color: 'var(--text-3)' }}>Admin Console</p>
            </div>
          </div>
          <button className="lg:hidden p-1" style={{ color: 'var(--text-3)' }} onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <NavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Visitors" count={stats.currentlyInside > 0 ? stats.currentlyInside : undefined}
            active={!showBlocklistModal && activeView === 'visitors'} onClick={() => { setSidebarOpen(false); setActiveView('visitors'); setShowBlocklistModal(false) }} />
          <NavItem icon={<Ban className="w-4 h-4" />} label="Blocklist" count={blocklist.length > 0 ? blocklist.length : undefined}
            active={showBlocklistModal} onClick={() => { setSidebarOpen(false); setShowBlocklistModal(true); setActiveView('visitors') }} />
          <NavItem icon={<BarChart2 className="w-4 h-4" />} label="Analytics"
            active={activeView === 'analytics'} onClick={() => { setSidebarOpen(false); setActiveView('analytics') }} />
        </nav>

        {/* Admin info + sign out */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1" style={{ background: 'var(--card)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              {adminName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate capitalize">{adminName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>Administrator</p>
            </div>
          </div>
          <button onClick={() => signOut().then(() => router.replace('/login'))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-1)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 px-4 lg:px-6 py-3.5 flex items-center gap-3"
          style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>

          {/* Hamburger (mobile) */}
          <button className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-2)' }}
            onClick={() => setSidebarOpen(true)}>
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitors…"
              className="input-field text-sm w-full"
              style={{ paddingLeft: '2.25rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Live badge */}
            {stats.currentlyInside > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {stats.currentlyInside} inside
              </div>
            )}
            <div className="relative group">
              <button className="btn-secondary flex items-center gap-1.5 py-2 text-xs">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <div className="absolute right-0 top-full mt-1 w-36 rounded-xl overflow-hidden shadow-lg z-10 hidden group-hover:block"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <button onClick={() => exportCSV(filtered)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-colors hover:bg-white/5">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={() => exportExcel(filtered)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-colors hover:bg-white/5">
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 lg:p-6 space-y-5">
          {activeView === 'analytics' ? (
            <AnalyticsPanel visitors={visitors} />
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Today's Visitors" value={stats.todayTotal} accent="#3B82F6" />
                <StatCard icon={<UserCheck className="w-4 h-4" />} label="Currently Inside" value={stats.currentlyInside} accent="#22C55E" />
                <StatCard icon={<UserX className="w-4 h-4" />} label="Checked Out" value={stats.checkedOutToday} accent="#6B7280" />
                <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Flagged Visitors" value={stats.flagged} accent="#EF4444" />
              </div>

              {/* Filter bar */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                    <Filter className="w-3.5 h-3.5" /> Date
                  </span>
                  {(['today', 'yesterday', 'all'] as DateFilter[]).map((d) => (
                    <Chip key={d} label={d === 'all' ? 'All time' : d.charAt(0).toUpperCase() + d.slice(1)}
                      active={dateFilter === d} onClick={() => setDateFilter(d)} />
                  ))}

                  <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

                  <span className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Status</span>
                  {(['all', 'checked-in', 'checked-out'] as StatusFilter[]).map((s) => (
                    <Chip key={s}
                      label={s === 'all' ? 'Any' : s === 'checked-in' ? '● Inside' : '○ Left'}
                      active={statusFilter === s} onClick={() => setStatusFilter(s)} />
                  ))}

                  <div className="w-px h-4 mx-1 hidden sm:block" style={{ background: 'var(--border)' }} />

                  <span className="text-xs font-semibold hidden sm:inline" style={{ color: 'var(--text-3)' }}>Purpose</span>
                  {(['all', 'Delivery', 'Guest', 'Meeting', 'Maintenance', 'Other'] as Array<VisitPurpose | 'all'>).map((p) => (
                    <Chip key={p} label={p === 'all' ? 'All' : `${PURPOSE_EMOJI[p] ?? ''} ${p}`}
                      active={purposeFilter === p} onClick={() => setPurposeFilter(p)} />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                  </p>
                  {(search || statusFilter !== 'all' || dateFilter !== 'today' || purposeFilter !== 'all') && (
                    <button
                      onClick={() => { setSearch(''); setStatusFilter('all'); setDateFilter('today'); setPurposeFilter('all') }}
                      className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                      style={{ color: '#F87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* Visitor table */}
              <div className="card overflow-hidden">
                {visitorsLoading ? (
                  <>
                    {[...Array(6)].map((_, i) => <VisitorSkeleton key={i} />)}
                  </>
                ) : filtered.length === 0 ? (
                  <div className="py-16 text-center" style={{ color: 'var(--text-3)' }}>
                    <p className="text-sm">No visitors found</p>
                  </div>
                ) : (
                  <>
                    {/* Table header — desktop */}
                    <div className="hidden md:grid grid-cols-[3fr_1.5fr_1.5fr_1.2fr_1fr] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                      style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)', background: 'var(--surface)' }}>
                      <span>Visitor</span>
                      <span>Purpose</span>
                      <span>Check-in</span>
                      <span>Location</span>
                      <span className="text-right">Status</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      {filtered.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVisitor(v)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors group"
                          style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative"
                            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                            {v.photoUrl && v.photoUrl !== '__pending__' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-sm"
                                style={{ color: 'var(--text-3)' }}>
                                {v.name[0]?.toUpperCase()}
                              </div>
                            )}
                            {v.flagged && (
                              <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 border-2"
                                style={{ borderColor: 'var(--bg)' }} />
                            )}
                          </div>

                          {/* Name + phone */}
                          <div className="flex-1 min-w-0 md:grid md:grid-cols-[3fr_1.5fr_1.5fr_1.2fr_1fr] md:items-center">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{v.name}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{v.phone}</p>
                            </div>
                            <div className="hidden md:block">
                              <PurposeBadge purpose={v.purpose} />
                            </div>
                            <div className="hidden md:block">
                              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {labelDate(v.checkInTime)}
                              </p>
                            </div>
                            <div className="hidden md:block">
                              <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                                {v.apartmentFloor ?? v.hostName ?? '—'}
                              </p>
                            </div>
                            <div className="hidden md:flex justify-end">
                              <StatusBadge status={v.status} />
                            </div>
                          </div>

                          {/* Mobile right side */}
                          <div className="md:hidden text-right flex-shrink-0">
                            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{labelDate(v.checkInTime)}</p>
                            <StatusBadge status={v.status} />
                          </div>

                          <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--text-3)' }} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedVisitor && (
        <VisitorDetailModal
          visitor={selectedVisitor}
          visitCount={visitCountMap[selectedVisitor.phone] ?? 1}
          onClose={() => setSelectedVisitor(null)}
          onCheckout={handleCheckout}
          onFlag={handleFlag}
          onAddToBlocklist={handleAddToBlocklist}
        />
      )}
      {showBlocklistModal && (
        <BlocklistPanel
          entries={blocklist}
          prefillName={blocklistPrefill.name}
          prefillPhone={blocklistPrefill.phone}
          onClose={() => { setShowBlocklistModal(false); setBlocklistPrefill({ name: '', phone: '' }) }}
        />
      )}
    </div>
  )
}

function NavItem({ icon, label, count, active, onClick }: {
  icon: React.ReactNode; label: string; count?: number; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
      style={{
        background: active ? 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.15))' : 'transparent',
        color: active ? 'var(--text-1)' : 'var(--text-3)',
        border: active ? '1px solid rgba(37,99,235,0.2)' : '1px solid transparent',
      }}
    >
      <span style={{ color: active ? '#60A5FA' : 'inherit' }}>{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: active ? 'rgba(37,99,235,0.3)' : 'var(--card)', color: active ? '#93C5FD' : 'var(--text-3)' }}>
          {count}
        </span>
      )}
    </button>
  )
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="card px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}18`, color: accent }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: accent === '#6B7280' ? 'var(--text-2)' : accent }}>{value}</p>
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
      style={{
        background: active ? 'rgba(37,99,235,0.15)' : 'var(--card)',
        color: active ? '#93C5FD' : 'var(--text-3)',
        border: `1px solid ${active ? 'rgba(37,99,235,0.3)' : 'var(--border)'}`,
      }}
    >
      {label}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const inside = status === 'checked-in'
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        background: inside ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
        color: inside ? '#4ADE80' : '#6B7280',
        border: `1px solid ${inside ? 'rgba(34,197,94,0.2)' : 'rgba(107,114,128,0.2)'}`,
      }}>
      <span className={`w-1.5 h-1.5 rounded-full ${inside ? 'bg-green-400' : 'bg-gray-500'}`} />
      {inside ? 'Inside' : 'Left'}
    </span>
  )
}

function PurposeBadge({ purpose }: { purpose: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Delivery: { bg: 'rgba(234,179,8,0.1)', color: '#FDE047' },
    Guest: { bg: 'rgba(59,130,246,0.1)', color: '#93C5FD' },
    Meeting: { bg: 'rgba(168,85,247,0.1)', color: '#D8B4FE' },
    Maintenance: { bg: 'rgba(249,115,22,0.1)', color: '#FDB47A' },
    Other: { bg: 'rgba(107,114,128,0.1)', color: '#9CA3AF' },
  }
  const style = map[purpose] ?? map.Other
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: style.bg, color: style.color }}>
      {PURPOSE_EMOJI[purpose] && <span>{PURPOSE_EMOJI[purpose]}</span>}
      {purpose}
    </span>
  )
}
