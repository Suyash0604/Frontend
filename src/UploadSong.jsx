import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const moods = ['happy', 'sad', 'angry', 'surprised', 'disgusted', 'fearful', 'neutral']

function UploadSong() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    artist: '',
    mood: moods[0],
    audio: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ type: 'idle', message: '' })

  const isDisabled = useMemo(() => {
    return !form.title || !form.artist || !form.audio || submitting
  }, [form, submitting])

  const handleChange = (evt) => {
    const { name, value, files } = evt.target
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }))
    setToast({ type: 'idle', message: '' })
  }

  const handleSubmit = async (evt) => {
    evt.preventDefault()
    if (isDisabled) return

    const payload = new FormData()
    payload.append('title', form.title)
    payload.append('artist', form.artist)
    payload.append('mood', form.mood)
    payload.append('audio', form.audio)

    try {
      setSubmitting(true)
      const res = await fetch(`${API_BASE_URL}/create`, {
        method: 'POST',
        body: payload,
      })

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`)
      }

      setToast({ type: 'success', message: 'Song uploaded successfully.' })
      // setTimeout(() => navigate('/', { replace: true }), 1400)
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to upload song',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <section className="h-full w-full max-h-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-900/70 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur">
        <header className="mb-8 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            Private Console
          </p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Upload a New Track</h1>
          <p className="text-sm text-slate-400">
            This endpoint is intentionally hidden. Only share with trusted curators.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
              Title
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter song title"
                className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-base text-white shadow-inner shadow-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
              Artist
              <input
                type="text"
                name="artist"
                value={form.artist}
                onChange={handleChange}
                placeholder="Enter artist name"
                className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-base text-white shadow-inner shadow-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
            Mood
            <select
              name="mood"
              value={form.mood}
              onChange={handleChange}
              className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-base text-white shadow-inner shadow-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {moods.map((mood) => (
                <option key={mood} value={mood}>
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label
            className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-500/5 p-6 text-center text-sm text-slate-200 transition hover:border-indigo-400 hover:bg-indigo-500/10"
            htmlFor="audio"
          >
            <span className="font-semibold uppercase tracking-[0.25em] text-indigo-200/80">
              Audio File
            </span>
            <span className="text-xs text-slate-400">
              Drop a track, or click to select a high-quality audio file
            </span>
            <input
              id="audio"
              type="file"
              name="audio"
              accept="audio/*"
              onChange={handleChange}
              className="hidden"
            />
            {form.audio && (
              <span className="text-xs font-medium text-indigo-200/80">{form.audio.name}</span>
            )}
          </label>

          <button
            type="submit"
            disabled={isDisabled}
            className="w-full rounded-xl bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-glow-brand transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/40 disabled:text-indigo-200/60"
          >
            {submitting ? 'Uploading…' : 'Upload Track'}
          </button>

          {toast.message && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                toast.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
              }`}
            >
              {toast.message}
            </div>
          )}
        </form>
      </section>
    </div>
  )
}

export default UploadSong

