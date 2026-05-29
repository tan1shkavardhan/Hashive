import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/authContext'
import axios from 'axios'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

import {
  TrendingDown,
  Copy,
  HardDrive,
  Zap,
  RefreshCw
} from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
    ' ' +
    sizes[i]
  )
}

const ACCENT = '#c8ff57'
const WARN = '#ffa502'
const MUTED = '#4a4a6a'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-panel border-2 border-border p-3 font-mono text-xs">
      {label && (
        <div className="text-muted mb-1">
          {label}
        </div>
      )}

      {payload.map((p, i) => (
        <div
          key={i}
          style={{ color: p.color || ACCENT }}
        >
          {p.name}:{' '}
          <span className="font-bold">
            {typeof p.value === 'number' && p.value > 1000
              ? formatBytes(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { API } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const res = await axios.get(`${API}/analytics`)
      setData(res.data)
    } catch (err) {
      console.log(err)
    }

    setLoading(false)
  }, [API])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-accent font-mono text-sm animate-pulse">
          LOADING ANALYTICS...
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-danger font-mono text-sm p-8 border-2 border-danger">
        FAILED TO LOAD ANALYTICS
      </div>
    )
  }

  const storageComparison = [
    {
      name: 'ORIGINAL',
      size: data.total_original_size,
      fill: MUTED
    },
    {
      name: 'COMPRESSED',
      size: data.total_compressed_size,
      fill: ACCENT
    }
  ]

  const fileComposition = [
    {
      name: 'Unique Files',
      value: data.unique_files,
      color: ACCENT
    },
    {
      name: 'Deduplicated',
      value: data.duplicate_files,
      color: WARN
    }
  ].filter(d => d.value > 0)

  const typeData = (data.file_types || [])
    .sort((a, b) => b.size - a.size)
    .slice(0, 6)
    .map(t => ({
      ...t,
      name: t.type.toUpperCase()
    }))

  const storageEfficiency =
    data.total_original_size > 0
      ? `${(
          ((data.total_original_size -
            data.total_compressed_size) /
            data.total_original_size) *
          100
        ).toFixed(1)}%`
      : '0%'

  const metricCards = [
    {
      label: 'TOTAL FILES',
      value: data.total_files,
      icon: HardDrive,
      color: 'text-text',
      accent: false
    },

    {
      label: 'DEDUPLICATED FILES',
      value: data.duplicate_files,
      icon: Copy,
      color: 'text-warn',
      accent: false
    },

    {
      label: 'SPACE SAVED',
      value: formatBytes(data.total_savings_bytes),
      icon: TrendingDown,
      color: 'text-accent',
      accent: true
    },

    {
      label: 'STORAGE EFFICIENCY',
      value: storageEfficiency,
      icon: Zap,
      color: 'text-accent',
      accent: true
    }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between">

        <div>
          <div className="text-[10px] font-mono text-muted tracking-widest mb-1">
            STORAGE OVERVIEW
          </div>

          <h1 className="font-display text-3xl font-extrabold text-text">
            STORAGE ANALYTICS
          </h1>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 border-2 border-border text-muted hover:text-accent hover:border-accent font-mono text-[10px] font-bold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          REFRESH
        </button>

      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {metricCards.map(
          ({ label, value, icon: Icon, color, accent }) => (

            <div
              key={label}
              className={`bg-surface border-2 p-4 ${
                accent
                  ? 'border-accent'
                  : 'border-border'
              }`}
            >
              <Icon className={`w-4 h-4 ${color} mb-2`} />

              <div className="text-[9px] font-mono text-muted tracking-widest">
                {label}
              </div>

              <div className={`font-display text-xl font-extrabold ${color} mt-1`}>
                {value}
              </div>
            </div>
          )
        )}

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Storage Comparison */}
        <div className="bg-surface border-2 border-border p-5">

          <div className="text-[10px] font-mono text-muted tracking-widest mb-4">
            STORAGE COMPARISON
          </div>

          <ResponsiveContainer width="100%" height={220}>

            <BarChart
              data={storageComparison}
              barSize={48}
            >

              <XAxis
                dataKey="name"
                stroke={MUTED}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontFamily: 'Space Mono',
                  fontSize: 10,
                  fill: '#8888aa'
                }}
              />

              <YAxis
                stroke={MUTED}
                tickFormatter={formatBytes}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontFamily: 'Space Mono',
                  fontSize: 9,
                  fill: '#8888aa'
                }}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: 'rgba(200,255,87,0.05)'
                }}
              />

              <Bar dataKey="size" name="Size">
                {storageComparison.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.fill}
                  />
                ))}
              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* File Composition */}
        <div className="bg-surface border-2 border-border p-5">

          <div className="text-[10px] font-mono text-muted tracking-widest mb-4">
            FILE COMPOSITION
          </div>

          {fileComposition.length > 0 ? (

            <ResponsiveContainer width="100%" height={220}>

              <PieChart>

                <Pie
                  data={fileComposition}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {fileComposition.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>

                <Tooltip content={<CustomTooltip />} />

                <Legend
                  formatter={value => (
                    <span
                      style={{
                        fontFamily: 'Space Mono',
                        fontSize: 10,
                        color: '#8888aa'
                      }}
                    >
                      {value}
                    </span>
                  )}
                />

              </PieChart>

            </ResponsiveContainer>

          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted font-mono text-xs">
              NO DATA YET
            </div>
          )}

        </div>

      </div>

      {/* File Type Breakdown */}
      <div className="bg-surface border-2 border-border p-5">

        <div className="text-[10px] font-mono text-muted tracking-widest mb-4">
          FILES BY TYPE
        </div>

        {typeData.length > 0 ? (

          <ResponsiveContainer width="100%" height={220}>

            <BarChart
              data={typeData}
              layout="vertical"
              barSize={14}
            >

              <XAxis
                type="number"
                stroke={MUTED}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontFamily: 'Space Mono',
                  fontSize: 9,
                  fill: '#8888aa'
                }}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={55}
                stroke={MUTED}
                axisLine={false}
                tickLine={false}
                tick={{
                  fontFamily: 'Space Mono',
                  fontSize: 9,
                  fill: '#8888aa'
                }}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: 'rgba(200,255,87,0.05)'
                }}
              />

              <Bar
                dataKey="count"
                name="Count"
                fill={ACCENT}
                radius={[0, 2, 2, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted font-mono text-xs">
            NO DATA YET
          </div>
        )}

      </div>

    </div>
  )
}