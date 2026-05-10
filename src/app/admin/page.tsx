'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, isYesterday, startOfDay, endOfDay } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import VisitorDetailModal from '@/components/VisitorDetailModal'
import BlocklistPanel from '@/components/BlocklistPanel'
import { subscribeToVisitors, subscribeToBlocklist, checkOutVisitor, flagVisitor, getVisitorsByPhone } from '@/lib/firestore'
import type { Visitor, BlocklistEntry, VisitPurpose } from '@/types'
import * as XLSX from 'xlsx'
import { Search, Download, LogOut, Ban, LayoutDashboard, Shield, ChevronRight, SlidersHorizontal, X, TrendingUp, UserCheck, UserX, AlertTriangle, Clock, Filter, BarChart2 } from 'lucide-react'
import AnalyticsPanel from '@/components/AnalyticsPanel'

type StatusFilter = 'all' | 'checked-in' | 'checked-out'
type DateFilter = 'today' | 'yesterday' | 'all'

function exportCSV(visitors: Visitor[]) {
  const headers = ['Name', 'Phone', 'Purpose', 'Host', 'Apt/Floor', 'Vehicle', 'Check-in', 'Check-out', 'Status', 'Flagged', 'Notes', 'Registered By']
  const rows = visitors.map((v) => [
    v.name,
    v.phone,
    v.purpose,
    v.hostName ?? '',
    v.apartmentFloor ?? '',
    v.vehicleNumber ?? '',
    format(v.checkInTime, 'dd/MM/yyyy HH:mm'),
    v.checkOutTime ? format(v.checkOutTime, 'dd/MM/yyyy HH:mm') : '',
    v.status,
    v.flagged ? 'Yes' : 'No',
    v.notes ?? '',
    v.checkedInByName,
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `checkins-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportExcel(visitors: Visitor[]) {
  const rows = visitors.map((v) => ({
    Name: v.name, Phone: v.phone, Purpose: v.purpose,
    Host: v.hostName ?? '', 'Apt/Floor': v.apartmentFloor ?? '',
    Vehicle: v.vehicleNumber ?? '',
    'Check-in': format(v.checkInTime, 'dd/MM/yyyy HH:mm'),
    'Check-out': v.checkOutTime ? format(v.checkOutTime, 'dd/MM/yyyy HH:mm') : '',
    Status: v.status === 'checked-in' ? 'Inside' : 'Left',
    Flagged: v.flagged ? 'Yes' : 'No',
    Notes: v.notes ?? '', 'Registered By': v.checkedInByName,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Visitors')
  XLSX.writeFile(wb, `vigil-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}

function VisitorSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="w-11 h-11 rounded-lg bg-gray-800 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-800 rounded w-1/3" />
        <div className="h-3 bg-gray-800 rounded w-1/4" />
      </div>
      <div className="h-5 w-16 bg-gray-800 rounded-md" />
    </div>
  )
}

export default function AdminPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()

  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([])
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [visitCountMap, setVisitCountMap] = useState<Record<string, number>>({})
  const [blocklistPrefill, setBlocklistPrefill] = useState<{ name: string; phone: string }>({ name: '', phone: '' })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [purposeFilter, setPurposeFilter] = useState<VisitPurpose | 'all'>('all')
  const [visitorsLoading, setVisitorsLoading] = useState(true)
  const [activeView, setActiveView] = useState<'visitors' | 'analytics' | 'blocklist'>('visitors')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.replace(user ? '/checkin' : '/login')
    }
  }, [user, role, loading, router])

  useEffect(() => {
    if (!user || role !== 'admin') return
    const unsub1 = subscribeToVisitors(
      (all) => { setVisitors(all); setVisitorsLoading(false) },
      (err) => { console.error('Visitor feed error:', err); setActionError('Live feed disconnected. Refresh to reconnect.') },
      500
    )
    const unsub2 = subscribeToBlocklist(setBlocklist)
    return () => { unsub1(); unsub2() }
  }, [user, role])

  // Fetch visit counts when a visitor is selected
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
    try {
      await checkOutVisitor(id)
      if (selectedVisitor?.id === id) {
        setSelectedVisitor((v) => v ? { ...v, status: 'checked-out', checkOutTime: new Date() } : v)
      }
    } catch {
      setActionError('Check-out failed. Please try again.')
    }
  }

  async function handleFlag(id: string, flagged: boolean) {
    try {
      await flagVisitor(id, flagged)
      if (selectedVisitor?.id === id) {
        setSelectedVisitor((v) => v ? { ...v, flagged } : v)
      }
    } catch {
      setActionError('Action failed. Please try again.')
    }
  }

  function handleAddToBlocklist(visitor: Visitor) {
    setBlocklistPrefill({ name: visitor.name, phone: visitor.phone })
    setActiveView('blocklist')
    setSelectedVisitor(null)
  }

  function navigateTo(view: 'visitors' | 'analytics' | 'blocklist') {
    if (view !== 'blocklist') setBlocklistPrefill({ name: '', phone: '' })
    setSidebarOpen(false)
    setActiveView(view)
  }

  function labelDate(d: Date): string {
    if (isToday(d)) return `Today ${format(d, 'HH:mm')}`
    if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
    return format(d, 'dd MMM, HH:mm')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const adminName = user.email?.split('@')[0] || 'Admin'

  return (
    <div className="min-h-screen flex bg-gray-950 text-white">

      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 w-64 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 lg:z-auto bg-gray-900 border-r border-gray-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Vigil</p>
              <p className="text-xs leading-tight text-gray-500">Admin Console</p>
            </div>
          </div>
          <button className="lg:hidden p-1 text-gray-500" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <SideNavItem icon={<LayoutDashboard className="w-4 h-4" />} label="Visitors"
            count={stats.currentlyInside > 0 ? stats.currentlyInside : undefined}
            active={activeView === 'visitors'}
            onClick={() => navigateTo('visitors')} />
          <SideNavItem icon={<BarChart2 className="w-4 h-4" />} label="Analytics"
            active={activeView === 'analytics'}
            onClick={() => navigateTo('analytics')} />
          <SideNavItem icon={<Ban className="w-4 h-4" />} label="Blocklist"
            count={blocklist.length > 0 ? blocklist.length : undefined}
            active={activeView === 'blocklist'}
            onClick={() => navigateTo('blocklist')} />
        </nav>

        {/* Admin info */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 bg-gray-800">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              {adminName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate capitalize">{adminName}</p>
              <p className="text-xs text-gray-500 truncate">Administrator</p>
            </div>
          </div>
          <button onClick={() => signOut().then(() => router.replace('/login'))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 px-4 lg:px-6 py-3.5 flex items-center gap-3 bg-gray-950/90 backdrop-blur border-b border-gray-800">
          <button className="lg:hidden p-1.5 rounded-lg text-gray-400" onClick={() => setSidebarOpen(true)}>
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <div className="flex-1 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitors…"
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
              style={{ paddingLeft: '2.25rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingRight: '0.75rem' }} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {stats.currentlyInside > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-950 text-green-400 border border-green-900">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {stats.currentlyInside} inside
              </div>
            )}
            {/* Export dropdown */}
            <div className="relative">
              <button onClick={() => setExportOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-32 rounded-xl overflow-hidden shadow-lg z-20 bg-gray-900 border border-gray-700">
                    <button onClick={() => { exportCSV(filtered); setExportOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-gray-800 text-gray-300">
                      <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                    <button onClick={() => { exportExcel(filtered); setExportOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-gray-800 text-gray-300">
                      <Download className="w-3.5 h-3.5" /> Excel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 p-4 lg:p-6">
          {actionError && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-red-950 border border-red-900 text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {actionError}
              <button onClick={() => setActionError('')} className="ml-auto text-red-500 hover:text-red-300">✕</button>
            </div>
          )}
          {activeView === 'analytics' ? (
            <AnalyticsPanel visitors={visitors} />
          ) : activeView === 'blocklist' ? (
            <BlocklistPanel inline entries={blocklist}
              prefillName={blocklistPrefill.name} prefillPhone={blocklistPrefill.phone} />
          ) : (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Today's Visitors" value={stats.todayTotal} accent="#3B82F6" />
                <StatCard icon={<UserCheck className="w-4 h-4" />} label="Currently Inside" value={stats.currentlyInside} accent="#22C55E" />
                <StatCard icon={<UserX className="w-4 h-4" />} label="Checked Out" value={stats.checkedOutToday} accent="#6B7280" />
                <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Flagged" value={stats.flagged} accent="#EF4444" />
              </div>

              {/* Filters */}
              <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Date</span>
                  {(['today', 'yesterday', 'all'] as DateFilter[]).map((d) => (
                    <FilterChip key={d} label={d === 'all' ? 'All time' : d.charAt(0).toUpperCase() + d.slice(1)} active={dateFilter === d} onClick={() => setDateFilter(d)} />
                  ))}
                  <div className="w-px h-4 bg-gray-700 mx-1" />
                  <span className="text-xs font-semibold text-gray-500">Status</span>
                  {(['all', 'checked-in', 'checked-out'] as StatusFilter[]).map((s) => (
                    <FilterChip key={s} label={s === 'all' ? 'Any' : s === 'checked-in' ? '● Inside' : '○ Left'} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
                  ))}
                  <div className="w-px h-4 bg-gray-700 mx-1 hidden sm:block" />
                  {(['all', 'Delivery', 'Guest', 'Meeting', 'Maintenance', 'Other'] as Array<VisitPurpose | 'all'>).map((p) => (
                    <FilterChip key={p} label={p === 'all' ? 'All' : p} active={purposeFilter === p} onClick={() => setPurposeFilter(p)} />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
                  {(search || statusFilter !== 'all' || dateFilter !== 'today' || purposeFilter !== 'all') && (
                    <button onClick={() => { setSearch(''); setStatusFilter('all'); setDateFilter('today'); setPurposeFilter('all') }}
                      className="text-xs px-2.5 py-1 rounded-lg text-red-400 bg-red-950/50 border border-red-900 hover:bg-red-950 transition-colors">
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* Visitor table */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                {visitorsLoading ? (
                  <>{[...Array(6)].map((_, i) => <VisitorSkeleton key={i} />)}</>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-sm">No visitors found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {filtered.map((v) => (
                      <button key={v.id} onClick={() => setSelectedVisitor(v)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 relative">
                          {v.photoUrl && v.photoUrl !== '__pending__' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                              {v.name[0]?.toUpperCase()}
                            </div>
                          )}
                          {v.flagged && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-gray-900" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-sm">{v.name}</span>
                            <PurposeBadge purpose={v.purpose} />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{v.phone}{v.apartmentFloor ? ` · ${v.apartmentFloor}` : ''}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-400">{labelDate(v.checkInTime)}</p>
                          <span className={`text-xs font-medium ${v.status === 'checked-in' ? 'text-green-400' : 'text-gray-500'}`}>
                            {v.status === 'checked-in' ? '● Inside' : '○ Left'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedVisitor && (
        <VisitorDetailModal visitor={selectedVisitor} visitCount={visitCountMap[selectedVisitor.phone] ?? 1}
          onClose={() => setSelectedVisitor(null)} onCheckout={handleCheckout}
          onFlag={handleFlag} onAddToBlocklist={handleAddToBlocklist} />
      )}
    </div>
  )
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="bg-gray-900 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: accent }}>{icon}</span>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
    </div>
  )
}

function SideNavItem({ icon, label, count, active, onClick }: { icon: React.ReactNode; label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
      style={{
        background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
        color: active ? 'white' : 'rgb(107,114,128)',
        border: active ? '1px solid rgba(37,99,235,0.2)' : '1px solid transparent',
      }}>
      <span style={{ color: active ? '#60A5FA' : 'inherit' }}>{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400">{count}</span>
      )}
    </button>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  )
}

function PurposeBadge({ purpose }: { purpose: string }) {
  const colors: Record<string, string> = {
    Delivery: 'bg-yellow-900 text-yellow-300',
    Guest: 'bg-blue-900 text-blue-300',
    Meeting: 'bg-purple-900 text-purple-300',
    Maintenance: 'bg-orange-900 text-orange-300',
    Other: 'bg-gray-800 text-gray-400',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${colors[purpose] ?? colors.Other}`}>
      {purpose}
    </span>
  )
}
