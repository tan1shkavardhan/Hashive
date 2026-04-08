import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../context/authContext'
import axios from 'axios'
import { Upload, CheckCircle2, Copy, AlertCircle, Zap, HardDrive, GitMerge, TrendingDown, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'


function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function StatCard({ label, value, sub, accent, }) {
  return (
    <div className={`bg-surface border-2 ${accent ? 'border-accent shadow-brutal' : 'border-border shadow-brutal-muted'} p-5`}>
      <div className="text-[10px] font-mono font-bold text-muted tracking-widest mb-2">{label}</div>
      <div className={`font-display text-3xl font-extrabold ${accent ? 'text-accent' : 'text-text'}`}>{value}</div>
      {sub && <div className="text-text-dim font-mono text-xs mt-1">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { user, API } = useAuth()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const fetchAnalytics = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/analytics`)
      setAnalytics(r.data)
    } catch {}
  }, [API])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const uploadFile = async (file) => {
    setUploading(true)
    setResult(null)
    setError('')
    const steps=['READING FILE...','COMPUTING HASH...','CHECKING DUPLICATES...','APPLYING COMPRESSION...','STORING METADATE...']
    let i=0
    const interval = setInterval(() => {
      setUploadProgress(steps[i % steps.length]); i++},500)

    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await axios.post(`${API}/files/upload`, fd)
      setResult(r.data)
      fetchAnalytics()
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed.')
    } finally {
      clearInterval(interval)
      setUploading(false)
      setUploadProgress('')
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <div className="text-[10px] font-mono text-muted tracking-widest mb-1">// MAIN_TERMINAL</div>
        <h1 className="font-display text-3xl font-extrabold text-text">
          WELCOME, <span className="text-accent">{user?.username?.toUpperCase()}</span>
        </h1>
      </div>

      {/* Stats */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="TOTAL FILES" value={analytics.total_files} sub="uploaded" accent />
          <StatCard label="UNIQUE FILES" value={analytics.unique_files} sub="stored on disk" />
          <StatCard label="DUPLICATES BLOCKED" value={analytics.duplicate_files} sub="zero extra storage" />
          <StatCard label="TOTAL SAVINGS" value={`${analytics.total_savings_percent}%`} sub={formatBytes(analytics.total_savings_bytes)} 
          onClick={() => navigate('/analytics')} />
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-surface border-2 border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-mono text-muted tracking-widest mb-4">// FILE_UPLOAD_TERMINAL</div>
          <button onClick={() => navigate('/files')}
            className="flex items-center gap-1 text-[10px] font-mono text accent hover:underline">
              View all files <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`
            border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200
            ${dragging ? 'drop-zone-active' : 'border-border hover:border-accent/50'}
            ${uploading ? 'cursor-wait opacity-60' : ''}
          `}
        >
          <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files[0] && uploadFile(e.target.files[0])} />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${dragging ? 'text-accent' : 'text-muted'} transition-colors`} />
          {uploading ? (
            <div>
              <div className="font-mono text-accent text-sm font-bold animate-pulse">
                {uploadProgress}<span className="cursor-blink"></span>
              </div>
              <div className="text-muted text-xs mt-1">Processing pipeline active</div>
            </div>
          ) : (
            <div>
              <div className="font-mono text-text text-sm font-bold mb-1">DROP FILE HERE</div>
              <div className="text-muted text-xs">or click to select · any file type</div>
            </div>
          )}
        </div>

        {/* Upload Result */}
        {result && (
          <div className={`mt-4 border-2 p-5 animate-slide-in ${result.is_duplicate ? 'border-warn bg-warn/5' : 'border-accent bg-accent/5'}`}>
            <div className="flex items-start gap-3">
              {result.is_duplicate
                ? <AlertCircle className="w-5 h-5 text-warn shrink-0 mt-0.5" />
                : <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              }
              <div className="flex-1">
                <div className={`font-mono text-sm font-bold ${result.is_duplicate ? 'text-warn' : 'text-accent'}`}>
                  {result.is_duplicate ? 'DUPLICATE DETECTED' : 'FILE STORED'}
                </div>
                <div className="text-text-dim font-mono text-xs mt-1">{result.message}</div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { label: 'FILENAME', value: result.filename },
                    { label: 'ORIGINAL', value: formatBytes(result.original_size) },
                    { label: 'COMPRESSED', value: formatBytes(result.compressed_size) },
                    { label: 'SAVED', value: `${result.savings_percent}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-panel p-3 border border-border">
                      <div className="text-[9px] text-muted font-mono tracking-widest">{label}</div>
                      <div className="text-text font-mono text-xs font-bold mt-1 truncate">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-2 bg-panel border border-border">
                  <div className="text-[9px] text-muted font-mono tracking-widest">SHA-256 HASH</div>
                  <div className="text-accent font-mono text-[10px] mt-1 break-all">{result.file_hash}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 bg-danger/10 border-2 border-danger px-4 py-3 text-danger text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-surface border-2 border-border p-6">
        <div className="text-[10px] font-mono text-muted tracking-widest mb-4">// SYSTEM_PIPELINE</div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-0">
          {[
            { step: '01', label: 'UPLOAD', desc: 'File received via REST API endpoint', icon: Upload },
            { step: '02', label: 'HASH', desc: 'SHA-256 fingerprint computed', icon: Zap },
            { step: '03', label: 'DEDUP', desc: 'Hash checked against DB for duplicates', icon: GitMerge },
            { step: '04', label: 'COMPRESS', desc: 'Gzip compression applied to unique files', icon: TrendingDown },
          ].map(({ step, label, desc, icon: Icon }, i) => (
            <div key={step} className="relative flex sm:flex-col items-start sm:items-center text-center gap-4 sm:gap-2 p-4 border-b sm:border-b-0 sm:border-r border-border last:border-0">
              <div className="shrink-0 w-10 h-10 bg-panel border-2 border-accent flex items-center justify-center">
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="text-[9px] text-muted font-mono">{step}</div>
                <div className="text-accent font-mono text-xs font-bold">{label}</div>
                <div className="text-text-dim font-mono text-[10px] mt-1">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}