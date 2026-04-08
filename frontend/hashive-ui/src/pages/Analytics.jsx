import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/authContext'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts'
import { TrendingDown, Copy, Shield, HardDrive, Zap, RefreshCw } from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const ACCENT = '#c8ff57'
const WARN = '#ffa502'
const INFO = '#3dc5ff'
const DANGER = '#ff4757'
const MUTED = '#4a4a6a'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-panel border-2 border-border p-3 font-mono text-xs">
      {label && <div className="text-muted mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || ACCENT }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' && p.value > 1000 ? formatBytes(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { API } = useAuth()
  const [data, setData] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [a, f] = await Promise.all([axios.get(`${API}/analytics`), axios.get(`${API}/files`)])
      setData(a.data); setFiles(f.data)
    } catch {}
    setLoading(false)
  }, [API])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-accent font-mono text-sm animate-pulse">LOADING ANALYTICS ENGINE<span className="cursor-blink"></span></div>
    </div>
  )

  if (!data) return (
    <div className="text-danger font-mono text-sm p-8 border-2 border-danger">FAILED TO LOAD ANALYTICS</div>
  )

  // Chart data
  const storageComparison = [
    { name: 'ORIGINAL', size: data.total_original_size, fill: MUTED },
    { name: 'COMPRESSED', size: data.total_compressed_size, fill: ACCENT },
  ]

  const fileComposition = [
    { name: 'Unique Files', value: data.unique_files, color: ACCENT },
    { name: 'Duplicates', value: data.duplicate_files, color: WARN },
  ].filter(d => d.value > 0)

  const savingsBreakdown = [
    { name: 'COMPRESSION', bytes: data.compression_savings_bytes, fill: ACCENT },
    { name: 'DEDUPLICATION', bytes: data.deduplication_savings_bytes, fill: INFO },
  ]

  // Timeline: group files by date
  const timeline = files.reduce((acc, f) => {
    const date = new Date(f.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    if (!acc[date]) acc[date] = { date, count: 0, size: 0 }
    acc[date].count++; acc[date].size += f.original_size
    return acc
  }, {})
  const timelineData = Object.values(timeline).slice(-10)

  // File type breakdown
  const typeData = (data.file_types || [])
    .sort((a, b) => b.size - a.size)
    .slice(0, 6)
    .map(t => ({ ...t, name: t.type.toUpperCase() }))

  const metricCards = [
    { label: 'TOTAL FILES', value: data.total_files, icon: HardDrive, color: 'text-text', accent: false },
    { label: 'UNIQUE STORED', value: data.unique_files, icon: Shield, color: 'text-accent', accent: true },
    { label: 'DUPLICATES BLOCKED', value: data.duplicate_files, icon: Copy, color: 'text-warn', accent: false },
    { label: 'ORIGINAL SIZE', value: formatBytes(data.total_original_size), icon: HardDrive, color: 'text-text', accent: false },
    { label: 'STORED SIZE', value: formatBytes(data.total_compressed_size), icon: Zap, color: 'text-accent', accent: false },
    { label: 'TOTAL SAVED', value: formatBytes(data.total_savings_bytes), icon: TrendingDown, color: 'text-accent', accent: true },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono text-muted tracking-widest mb-1">// ANALYTICS_ENGINE</div>
          <h1 className="font-display text-3xl font-extrabold text-text">STORAGE ANALYTICS</h1>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 border-2 border-border text-muted hover:text-accent hover:border-accent font-mono text-[10px] font-bold transition-all">
          <RefreshCw className="w-3.5 h-3.5" /> REFRESH
        </button>
      </div>

      {/* Big Savings Banner */}
      <div className="bg-surface border-2 border-accent shadow-brutal p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono text-muted tracking-widest mb-1">TOTAL OPTIMIZATION EFFICIENCY</div>
          <div className="font-display text-6xl font-extrabold text-accent">{data.total_savings_percent}%</div>
          <div className="text-text-dim font-mono text-sm mt-1">
            {formatBytes(data.total_savings_bytes)} saved through compression + deduplication
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-panel border border-border p-4">
            <div className="text-[9px] text-muted font-mono tracking-widest">COMPRESSION</div>
            <div className="text-accent font-display text-2xl font-bold mt-1">{data.compression_savings_percent}%</div>
            <div className="text-text-dim font-mono text-[10px]">{formatBytes(data.compression_savings_bytes)}</div>
          </div>
          <div className="bg-panel border border-border p-4">
            <div className="text-[9px] text-muted font-mono tracking-widest">DEDUPLICATION</div>
            <div className="text-info font-display text-2xl font-bold mt-1">
              {data.total_original_size > 0 ? ((data.deduplication_savings_bytes / data.total_original_size) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-text-dim font-mono text-[10px]">{formatBytes(data.deduplication_savings_bytes)}</div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricCards.map(({ label, value, icon: Icon, color, accent }) => (
          <div key={label} className={`bg-surface border-2 p-4 ${accent ? 'border-accent' : 'border-border'}`}>
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <div className="text-[9px] font-mono text-muted tracking-widest">{label}</div>
            <div className={`font-display text-xl font-extrabold ${color} mt-1`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Storage Comparison Bar */}
        <div className="bg-surface border-2 border-border p-5">
          <div className="text-[10px] font-mono text-muted tracking-widest mb-4">STORAGE: BEFORE vs AFTER OPTIMIZATION</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={storageComparison} barSize={48}>
              <XAxis dataKey="name" stroke={MUTED} tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: '#8888aa' }} axisLine={false} tickLine={false} />
              <YAxis stroke={MUTED} tickFormatter={formatBytes} tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: '#8888aa' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(200,255,87,0.05)' }} />
              <Bar dataKey="size" name="Size">
                {storageComparison.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* File Composition Pie */}
        <div className="bg-surface border-2 border-border p-5">
          <div className="text-[10px] font-mono text-muted tracking-widest mb-4">FILE COMPOSITION</div>
          {fileComposition.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={fileComposition} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={85} innerRadius={45} paddingAngle={3}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: '#8888aa' }}
                >
                  {fileComposition.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#8888aa' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted font-mono text-xs">NO DATA YET</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Savings Breakdown */}
        <div className="bg-surface border-2 border-border p-5">
          <div className="text-[10px] font-mono text-muted tracking-widest mb-4">SAVINGS BREAKDOWN (BYTES)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={savingsBreakdown} barSize={40}>
              <XAxis dataKey="name" stroke={MUTED} tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: '#8888aa' }} axisLine={false} tickLine={false} />
              <YAxis stroke={MUTED} tickFormatter={formatBytes} tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: '#8888aa' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(200,255,87,0.05)' }} />
              <Bar dataKey="bytes" name="Saved">
                {savingsBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* File Type Breakdown */}
        <div className="bg-surface border-2 border-border p-5">
          <div className="text-[10px] font-mono text-muted tracking-widest mb-4">FILES BY TYPE</div>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeData} layout="vertical" barSize={14}>
                <XAxis type="number" stroke={MUTED} tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: '#8888aa' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
                <YAxis type="category" dataKey="name" width={55} stroke={MUTED} tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: '#8888aa' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(200,255,87,0.05)' }} />
                <Bar dataKey="count" name="Count" fill={ACCENT} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted font-mono text-xs">NO DATA YET</div>
          )}
        </div>
      </div>

      {/* Upload Timeline */}
      {timelineData.length > 1 && (
        <div className="bg-surface border-2 border-border p-5">
          <div className="text-[10px] font-mono text-muted tracking-widest mb-4">UPLOAD ACTIVITY TIMELINE</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="date" stroke={MUTED} tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: '#8888aa' }} axisLine={false} tickLine={false} />
              <YAxis stroke={MUTED} tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: '#8888aa' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Files Uploaded" stroke={ACCENT} strokeWidth={2} dot={{ fill: ACCENT, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Raw Metrics Table */}
      <div className="bg-surface border-2 border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-panel">
          <div className="text-[10px] font-mono text-muted tracking-widest">RAW METRICS DUMP</div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
          {[
            ['total_files', data.total_files],
            ['unique_files', data.unique_files],
            ['duplicate_files', data.duplicate_files],
            ['total_original_size', formatBytes(data.total_original_size)],
            ['total_compressed_size', formatBytes(data.total_compressed_size)],
            ['compression_savings_bytes', formatBytes(data.compression_savings_bytes)],
            ['compression_savings_percent', `${data.compression_savings_percent}%`],
            ['deduplication_savings_bytes', formatBytes(data.deduplication_savings_bytes)],
            ['total_savings_bytes', formatBytes(data.total_savings_bytes)],
            ['total_savings_percent', `${data.total_savings_percent}%`],
          ].map(([key, val]) => (
            <div key={key} className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-muted text-[10px]">{key}</span>
              <span className="text-accent font-bold">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}