import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/authContext'
import axios from 'axios'
import {
  Trash2, Download, RefreshCw, Search
} from 'lucide-react'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

function percentSaved(original, compressed) {
  if (!original) return 0
  return ((original - compressed) / original * 100).toFixed(1)
}

function ratio(original, compressed) {
  if (!original || !compressed) return '-'
  return (original / compressed).toFixed(2) + ':1'
}

export default function Files() {
  const { API } = useAuth()

  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // 🔹 Fetch files (WITH TOKEN FIX)
  const fetchFiles = useCallback(async () => {
    try {
      const token = localStorage.getItem("hashive_token")

      const res = await axios.get(`${API}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setFiles(res.data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }, [API])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // 🔹 Delete
  const deleteFile = async (id) => {
    const token = localStorage.getItem("hashive_token")

    await axios.delete(`${API}/files/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    setFiles(f => f.filter(x => x.id !== id))
  }

  // 🔹 Download
  const downloadFile = async (file) => {
    const token = localStorage.getItem("hashive_token")

    const res = await fetch(`${API}/files/${file.id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = file.original_filename
    a.click()
  }

  

  const filtered = files.filter(f =>
    f.original_filename.toLowerCase().includes(search.toLowerCase())
  )

  // 📊 Stats
  const total = files.length
  const unique = files.filter(f => !f.is_duplicate).length
  const dupes = files.filter(f => f.is_duplicate).length
  const saved = files.reduce(
    (acc, f) => acc + (f.original_size - f.compressed_size), 0
  )

  return (
    <div className="p-6 space-y-6">

      {/* TITLE */}
      <h1 className="text-3xl font-bold tracking-wide">MY FILES</h1>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border border-gray-700 bg-[#0f0f0f] p-5">
          <div className="text-xs text-gray-400">TOTAL FILES</div>
          <div className="text-2xl">{total}</div>
        </div>

        <div className="border border-gray-700 bg-[#0f0f0f] p-5">
          <div className="text-xs text-gray-400">UNIQUE</div>
          <div className="text-2xl text-green-400">{unique}</div>
        </div>

        <div className="border border-gray-700 bg-[#0f0f0f] p-5">
          <div className="text-xs text-gray-400">DEDUPLICATED FILES</div>
          <div className="text-2xl text-yellow-400">{dupes}</div>
        </div>

        <div className="border border-gray-700 bg-[#0f0f0f] p-5">
          <div className="text-xs text-gray-400">SPACE SAVED</div>
          <div className="text-2xl text-blue-400">{formatBytes(saved)}</div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="border border-gray-700 bg-[#0f0f0f] p-3 flex items-center gap-2">
        <Search size={16} />
        <input
          className="bg-transparent outline-none w-full text-sm"
          placeholder="search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={fetchFiles}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* TABLE PANEL */}
      <div className="border border-gray-700 bg-[#0f0f0f] p-4 overflow-x-auto">

        {loading ? (
          <div className="p-6 text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">

            <thead className="border-b border-gray-700 text-gray-400 text-xs">
              <tr>
                <th className="p-2 text-left">FILE</th>
                <th>STATUS</th>
                <th>ORIGINAL</th>
                <th>COMPRESSED</th>
                <th>SAVED</th>
                <th>RATIO</th>
                <th>HASH</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(file => (
                <tr key={file.id} className="border-b border-gray-800">

                  <td className="p-2">
                    {file.original_filename}

                  </td>

                  <td>
                    {file.is_duplicate ? (
                      <span className="text-yellow-400">DEDUPLICATED</span>
                    ) : (
                      <span className="text-green-400">STORED</span>
                    )}
                  </td>

                  <td>{formatBytes(file.original_size)}</td>
                  <td>{formatBytes(file.compressed_size)}</td>

                  <td className="text-green-400">
                    {percentSaved(file.original_size, file.compressed_size)}%
                  </td>

                  <td>
                    {ratio(file.original_size, file.compressed_size)}
                  </td>

                  <td>
                    {file.file_hash?.slice(0, 10)}...
                  </td>

                  <td className="flex gap-3 justify-center">
                    <Download size={16} onClick={() => downloadFile(file)} />
                    <Trash2 size={16} onClick={() => deleteFile(file.id)} />
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>
    </div>
  )
}