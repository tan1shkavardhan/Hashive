import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/authContext'
import axios from 'axios'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

export default function Dashboard() {
  const { user, API, loading } = useAuth()

  const [analytics, setAnalytics] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/analytics`)
      setAnalytics(res.data)
    } catch (err) {
      console.log(err)
    }
  }, [API])

  useEffect(() => {
    if (!loading && user) {
      fetchAnalytics()
    }
  }, [loading, user, fetchAnalytics])

  const uploadFile = async (file) => {
    setUploading(true)
    setError('')
    setResult(null)

    const steps = [
      'READING FILE...',
      'HASHING...',
      'CHECKING DUPLICATES...',
      'COMPRESSING...',
      'FINALIZING...'
    ]

    let i = 0
    const interval = setInterval(() => {
      setUploadProgress(steps[i % steps.length])
      i++
    }, 500)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await axios.post(`${API}/files/upload`, fd)

      setResult(res.data)
      fetchAnalytics()

    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed')
    } finally {
      clearInterval(interval)
      setUploading(false)
      setUploadProgress('')
    }
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (file) uploadFile(file)
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <div className="p-6 text-red-500">Login required</div>

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide">
          WELCOME, <span className="text-lime-400">{user.username.toUpperCase()}</span>
        </h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-6">

        {/* TOTAL */}
        <div className="border border-border p-5 md:p-6 bg-panel">
          <div className="text-xs text-gray-400">TOTAL FILES</div>
          <div className="text-3xl mt-1 font-bold">
            {analytics?.total_files ?? 0}
          </div>
          <div className="text-[10px] text-muted mt-1 tracking-wide">uploaded</div>
        </div>

        {/* UNIQUE */}
        <div className="border border-border p-5 md:p-6 bg-panel">
          <div className="text-xs text-gray-400">UNIQUE FILES</div>
          <div className="text-3xl mt-1 font-bold text-green-400">
            {analytics?.unique_files ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">stored on disk</div>
        </div>

        {/* DUPES */}
        <div className="border border-border p-5 md:p-6 bg-panel">
          <div className="text-xs text-gray-400">DUPLICATES BLOCKED</div>
          <div className="text-3xl mt-1 font-bold">
            {analytics?.duplicate_files ?? 0}
          </div>
          <div className="text-[10px] text-muted mt-1 tracking-wide">zero extra storage</div>
        </div>

        {/* SAVINGS */}
        <div className="border border-border p-5 md:p-6 bg-panel">
          <div className="text-xs text-gray-400">TOTAL SAVINGS</div>
          <div className="text-3xl mt-1 font-bold">
            {analytics?.total_savings_percent ?? 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatBytes(analytics?.space_saved ?? 0)}
          </div>
        </div>
      </div>

      {/* UPLOAD SECTION */}
      <div className="border border-border p-6 bg-panel">
        <div className="text-xs text-gray-400 mb-4">// FILE_UPLOAD_TERMINAL</div>

        <div
          className="border border-dashed p-16 text-center cursor-pointer"
          onClick={() => fileRef.current.click()}
        >
          <input
            type="file"
            ref={fileRef}
            className="hidden"
            onChange={handleFile}
          />

          {uploading ? (
            <div>{uploadProgress}</div>
          ) : (
            <div>
              <div className="text-gray-400">DROP FILE HERE</div>
              <div className="text-xs text-gray-500">
                or click to upload
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div className="border border-border p-6 bg-panel">
          <div className="text-green-400 mb-2">
            {result.is_duplicate ? 'Duplicate detected' : 'File stored'}
          </div>

          <div>{result.filename}</div>
          <div className="text-sm text-gray-400">
            {formatBytes(result.original_size)}
          </div>
        </div>
      )}

      {/* PIPELINE */}
      <div className="border border-border p-6 bg-panel">
        <div className="text-xs text-gray-400 mb-6">// SYSTEM_PIPELINE</div>

        <div className="grid grid-cols-4 text-center gap-6">

          <div>
            <div className="text-lime-400">↑</div>
            <div>UPLOAD</div>
            <div className="text-xs text-gray-500">
              File received via API
            </div>
          </div>

          <div>
            <div className="text-lime-400">⚡</div>
            <div>HASH</div>
            <div className="text-xs text-gray-500">
              SHA-256 computed
            </div>
          </div>

          <div>
            <div className="text-lime-400">↘</div>
            <div>DEDUP</div>
            <div className="text-xs text-gray-500">
              Checked against DB
            </div>
          </div>

          <div>
            <div className="text-lime-400">📉</div>
            <div>COMPRESS</div>
            <div className="text-xs text-gray-500">
              Gzip applied
            </div>
          </div>

        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}
    </div>
  )
}