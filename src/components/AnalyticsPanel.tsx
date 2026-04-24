'use client'
import { useMemo } from 'react'
import { BarChart2, Clock, Users } from 'lucide-react'
import type { Visitor } from '@/types'

interface Props { visitors: Visitor[] }

export default function AnalyticsPanel({ visitors }: Props) {
  const { days, purposes, peakHours } = useMemo(() => {
    // Last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      d.setHours(0, 0, 0, 0)
      const next = new Date(d); next.setDate(d.getDate() + 1)
      const label = i === 6 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' })
      const count = visitors.filter(v => v.checkInTime >= d && v.checkInTime < next).length
      return { label, count }
    })
    const dayMax = Math.max(...days.map(d => d.count), 1)

    // Purpose breakdown
    const purposeMap: Record<string, number> = {}
    visitors.forEach(v => { purposeMap[v.purpose] = (purposeMap[v.purpose] ?? 0) + 1 })
    const purposes = Object.entries(purposeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: Math.round(count / Math.max(visitors.length, 1) * 100) }))

    // Peak hours (0-23)
    const hourMap: Record<number, number> = {}
    visitors.forEach(v => {
      const h = v.checkInTime.getHours()
      hourMap[h] = (hourMap[h] ?? 0) + 1
    })
    const hourMax = Math.max(...Object.values(hourMap), 1)
    const peakHours = Array.from({ length: 24 }, (_, h) => ({
      h,
      count: hourMap[h] ?? 0,
      pct: Math.round((hourMap[h] ?? 0) / hourMax * 100),
    }))

    return { days: { data: days, max: dayMax }, purposes, peakHours }
  }, [visitors])

  const PURPOSE_COLORS: Record<string, string> = {
    Guest: '#3B82F6', Delivery: '#F59E0B', Meeting: '#8B5CF6',
    Maintenance: '#10B981', Other: '#6B7280',
  }
  const PURPOSE_EMOJI: Record<string, string> = {
    Delivery: '📦', Guest: '👤', Meeting: '🤝', Maintenance: '🔧', Other: '•',
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* 7-day trend */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4" style={{ color: '#60A5FA' }} />
          <h3 className="font-semibold text-sm">Visitor Trend — Last 7 Days</h3>
        </div>
        <div className="flex items-end gap-2 h-28">
          {days.data.map(({ label, count }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                {count > 0 ? count : ''}
              </span>
              <div className="w-full rounded-t-md transition-all"
                style={{
                  height: `${Math.max(count / days.max * 96, count > 0 ? 6 : 2)}px`,
                  background: label === 'Today'
                    ? 'linear-gradient(180deg, #3B82F6, #2563EB)'
                    : 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>
          Total: {visitors.length} visitor{visitors.length !== 1 ? 's' : ''} on record
        </p>
      </div>

      {/* Purpose breakdown */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4" style={{ color: '#A78BFA' }} />
          <h3 className="font-semibold text-sm">Visit Purpose Breakdown</h3>
        </div>
        {purposes.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No data yet</p>
        ) : (
          <div className="space-y-3">
            {purposes.map(({ name, count, pct }) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">
                    {PURPOSE_EMOJI[name] ?? ''} {name}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                    {count} <span style={{ color: 'var(--text-3)' }}>({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: PURPOSE_COLORS[name] ?? '#6B7280' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Peak hours */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4" style={{ color: '#34D399' }} />
          <h3 className="font-semibold text-sm">Peak Hours</h3>
        </div>
        <div className="flex items-end gap-0.5 h-14">
          {peakHours.map(({ h, count, pct }) => (
            <div key={h} title={`${h}:00 — ${count} visits`}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${Math.max(pct, count > 0 ? 8 : 2)}%`,
                background: pct > 60
                  ? '#10B981'
                  : pct > 30
                  ? '#3B82F6'
                  : count > 0 ? 'var(--surface)' : 'var(--card)',
                border: '1px solid var(--border)',
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>12 AM</span>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>12 PM</span>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>11 PM</span>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>Hover over bars to see exact counts</p>
      </div>
    </div>
  )
}
