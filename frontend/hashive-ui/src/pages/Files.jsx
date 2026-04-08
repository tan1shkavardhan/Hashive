import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/authContext'
import axios from 'axios'
import { Trash2, Download, FileText, RefreshCw, Search, Copy, Shield, AlertTriangle, X } from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function compressionRatio(original, compressed) {
  if (!original || !compressed) return '—'
  return (original / compressed).toFixed(2) + ':1'
}

function compressionPercent(original, compressed) {
  if (!original) return 0
  return Math.max(0, ((original - compressed) / original * 100)).toFixed(1)
}

function getFileIcon(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() || ''
  const map = {
    pdf: '📄', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
    mp4: '🎬', mp3: '🎵', wav: '🎵',
    zip: '📦', rar: '📦', gz: '📦',
    txt: '📝', md: '📝', csv: '📊',
    docx: '📘', xlsx: '📗', pptx: '📙',
    json: '🔧', js: '🔧', py: '🔧', ts: '🔧',
  }
  return map[ext] || '📁'
}

export default function FileList() {
  const { API, token } = useAuth()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [filterDupes, setFilterDupes] = useState('all')

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try { const r = await axios.get(`${API}/files`); setFiles(r.data) }
    catch { showNotif('Failed to load files', 'error') }
    setLoading(false)
  }, [API])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const deleteFile = async (id) => {
    setDeleting(id)
    try {
      await axios.delete(`${API}/files/${id}`)
      setFiles(f => f.filter(x => x.id !== id))
      showNotif('File deleted successfully')
    } catch { showNotif('Failed to delete file', 'error') }
    setDeleting(null); setConfirmDelete(null)
  }

  const downloadFile = async (file) => {
    setDownloading(file.id)
    try {
      const response = await fetch(`${API}/files/${file.id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = file.original_filename
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
      showNotif(`Downloaded: ${file.original_filename}`)
    } catch { showNotif('Download failed', 'error') }
    setDownloading(null)
  }

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash)
    showNotif('Hash copied to clipboard')
  }

  const filtered = files.filter(f => {
    const matchSearch = f.original_filename?.toLowerCase().includes(search.toLowerCase()) ||
      f.file_hash?.includes(search)
    const matchFilter = filterDupes === 'all' ||
      (filterDupes === 'unique' && !f.is_duplicate) ||
      (filterDupes === 'dupes' && f.is_duplicate)
    return matchSearch && matchFilter
  })

  const totalOriginal = files.reduce((s, f) => s + (f.original_size || 0), 0)
  const totalCompressed = files.reduce((s, f) => s + (f.compressed_size || 0), 0)
  const totalSaved = totalOriginal - totalCompressed

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-3 border-2 font-mono text-sm font-bold animate-slide-in
          ${notification.type === 'error' ? 'bg-danger/10 border-danger text-danger' : 'bg-accent/10 border-accent text-accent'}`}>
          {notification.msg}
          <button onClick={() => setNotification(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="text-[10px] font-mono text-muted tracking-widest mb-1">// FILE_REGISTRY</div>
        <h1 className="font-display text-3xl font-extrabold text-text">MY FILES</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'TOTAL FILES', value: files.length, color: 'text-text' },
          { label: 'UNIQUE', value: files.filter(f => !f.is_duplicate).length, color: 'text-accent' },
          { label: 'DUPLICATES', value: files.filter(f => f.is_duplicate).length, color: 'text-warn' },
          { label: 'SPACE SAVED', value: formatBytes(totalSaved), color: 'text-info' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-border p-4">
            <div className="text-[9px] font-mono text-muted tracking-widest">{label}</div>
            <div className={`font-display text-2xl font-extrabold ${color} mt-1`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="search by name or hash..."
            className="w-full bg-surface border-2 border-border pl-9 pr-4 py-2.5 text-text font-mono text-xs focus:border-accent transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex border-2 border-border">
          {[['all', 'ALL'], ['unique', 'UNIQUE'], ['dupes', 'DUPES']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilterDupes(val)}
              className={`px-3 py-2 font-mono text-[10px] font-bold tracking-widest transition-colors border-r last:border-0 border-border
                ${filterDupes === val ? 'bg-accent text-void' : 'text-muted hover:text-accent'}`}>
              {lbl}
            </button>
          ))}
        </div>

        <button onClick={fetchFiles}
          className="flex items-center gap-2 px-3 py-2.5 bg-surface border-2 border-border text-text-dim hover:text-accent hover:border-accent transition-all font-mono text-[10px] font-bold">
          <RefreshCw className="w-3.5 h-3.5" /> REFRESH
        </button>
      </div>

      {/* Results count */}
      {search && (
        <div className="text-[10px] font-mono text-muted">
          SHOWING <span className="text-accent font-bold">{filtered.length}</span> of {files.length} files
        </div>
      )}

      {/* File Table */}
      <div className="bg-surface border-2 border-border overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="text-accent font-mono text-sm animate-pulse">LOADING FILE REGISTRY<span className="cursor-blink"></span></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
            <div className="text-muted font-mono text-sm font-bold">
              {search ? 'NO FILES MATCH YOUR SEARCH' : 'NO FILES UPLOADED YET'}
            </div>
            <div className="text-text-dim font-mono text-xs mt-2">
              {search ? 'Try a different search term' : 'Go to Dashboard to upload your first file'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b-2 border-border bg-panel">
                  {[
                    { label: 'FILE', w: 'w-48' },
                    { label: 'STATUS', w: 'w-28' },
                    { label: 'ORIGINAL SIZE', w: 'w-28' },
                    { label: 'COMPRESSED', w: 'w-28' },
                    { label: 'SAVED', w: 'w-20' },
                    { label: 'RATIO', w: 'w-20' },
                    { label: 'HASH', w: 'w-36' },
                    { label: 'UPLOADED', w: 'w-36' },
                    { label: 'ACTIONS', w: 'w-28' },
                  ].map(({ label, w }) => (
                    <th key={label} className={`text-left px-4 py-3 text-muted tracking-widest font-bold text-[9px] whitespace-nowrap ${w}`}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((file, i) => (
                  <tr key={file.id}
                    className={`border-b border-border hover:bg-panel/60 transition-colors group
                      ${i % 2 === 1 ? 'bg-panel/20' : ''}`}>

                    {/* File name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <span className="text-base shrink-0">{getFileIcon(file.original_filename)}</span>
                        <span className="text-text truncate font-bold" title={file.original_filename}>
                          {file.original_filename}
                        </span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      {file.is_duplicate ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-warn/10 border border-warn text-warn text-[9px] font-bold whitespace-nowrap">
                          <Copy className="w-2.5 h-2.5" /> DUPLICATE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent/10 border border-accent text-accent text-[9px] font-bold whitespace-nowrap">
                          <Shield className="w-2.5 h-2.5" /> UNIQUE
                        </span>
                      )}
                    </td>

                    {/* Sizes */}
                    <td className="px-4 py-3 text-text-dim whitespace-nowrap">{formatBytes(file.original_size)}</td>
                    <td className="px-4 py-3 text-text-dim whitespace-nowrap">{formatBytes(file.compressed_size)}</td>

                    {/* Savings */}
                    <td className="px-4 py-3">
                      <span className="text-accent font-bold">{compressionPercent(file.original_size, file.compressed_size)}%</span>
                    </td>

                    {/* Ratio */}
                    <td className="px-4 py-3 text-text-dim whitespace-nowrap">
                      {compressionRatio(file.original_size, file.compressed_size)}
                    </td>

                    {/* Hash */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyHash(file.file_hash)}
                        className="flex items-center gap-1.5 text-muted hover:text-accent transition-colors group/hash"
                        title={file.file_hash}
                      >
                        <span className="font-mono text-[10px]">{file.file_hash.slice(0, 12)}...</span>
                        <Copy className="w-2.5 h-2.5 opacity-0 group-hover/hash:opacity-100 transition-opacity" />
                      </button>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-text-dim text-[10px] whitespace-nowrap">
                      {formatDate(file.uploaded_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {confirmDelete === file.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-danger font-bold mr-1">CONFIRM?</span>
                          <button onClick={() => deleteFile(file.id)} disabled={deleting === file.id}
                            className="px-2 py-1 bg-danger text-void text-[9px] font-bold hover:opacity-80 transition-opacity border border-danger">
                            {deleting === file.id ? '...' : 'YES'}
                          </button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1 border border-border text-muted text-[9px] font-bold hover:text-text transition-colors">
                            NO
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {/* Download */}
                          <button
                            onClick={() => downloadFile(file)}
                            disabled={downloading === file.id}
                            title="Download original file"
                            className="p-2 border-2 border-border text-muted hover:border-info hover:text-info transition-all hover:bg-info/5 disabled:opacity-40"
                          >
                            {downloading === file.id
                              ? <div className="w-3.5 h-3.5 border border-info border-t-transparent rounded-full animate-spin" />
                              : <Download className="w-3.5 h-3.5" />
                            }
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDelete(file.id)}
                            title="Delete file"
                            className="p-2 border-2 border-border text-muted hover:border-danger hover:text-danger transition-all hover:bg-danger/5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="border-t border-border px-4 py-2.5 flex items-center justify-between bg-panel">
            <span className="text-[9px] font-mono text-muted">
              {filtered.length} RECORDS · ORIGINAL: {formatBytes(totalOriginal)} · STORED: {formatBytes(totalCompressed)} · SAVED: {formatBytes(totalSaved)}
            </span>
            <div className="flex items-center gap-4 text-[9px] font-mono">
              <span className="flex items-center gap-1.5 text-accent">
                <span className="w-2 h-2 border border-accent inline-block"></span>UNIQUE
              </span>
              <span className="flex items-center gap-1.5 text-warn">
                <span className="w-2 h-2 border border-warn inline-block"></span>DUPLICATE = no extra storage used
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}