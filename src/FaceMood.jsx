import { useEffect, useMemo, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function FaceMood() {
  const videoRef = useRef(null)
  const latestMoodRef = useRef('neutral')
  const initializedRef = useRef(false)
  const [mood, setMood] = useState('neutral')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [hasDetected, setHasDetected] = useState(false)
  const [songs, setSongs] = useState([])
  const [songsLoading, setSongsLoading] = useState(false)
  const [songsError, setSongsError] = useState('')
  const [currentSongId, setCurrentSongId] = useState(null)
  const playlistRef = useRef(null)
  const autoScrollDoneRef = useRef(false)

  const moodLabel = useMemo(
    () => mood.charAt(0).toUpperCase() + mood.slice(1),
    [mood],
  )

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    async function setup() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (videoRef.current) {
          if (videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream
          }

          await new Promise((resolve) => {
            if (!videoRef.current) return resolve()
            if (videoRef.current.readyState >= 1) return resolve()
            const handler = () => {
              videoRef.current && videoRef.current.removeEventListener('loadedmetadata', handler)
              resolve()
            }
            videoRef.current.addEventListener('loadedmetadata', handler, { once: true })
          })

          try {
            await videoRef.current.play()
          } catch (err) {
            // Autoplay may be blocked; user interaction will start playback
          }
        }
        setReady(true)
      } catch (e) {
        setError(e?.message || 'Camera or model load failed')
      }
    }

    setup()

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          videoRef.current.pause()
        } catch {}
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach((t) => t.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [])

  const detectMood = async () => {
    if (!videoRef.current || !ready) return
    setError('')
    setDetecting(true)
    try {
      const detections = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }),
        )
        .withFaceExpressions()

      if (detections && detections.expressions) {
        const entries = Object.entries(detections.expressions)
        let top = 'neutral'
        let max = -Infinity
        for (const [expr, val] of entries) {
          if (val > max) {
            max = val
            top = expr
          }
        }
        latestMoodRef.current = top
        setMood(top)
        setHasDetected(true)
        autoScrollDoneRef.current = false
      } else {
        setError('No face detected')
      }
    } catch (e) {
      setError(e?.message || 'Mood detection failed')
    } finally {
      setDetecting(false)
    }
  }

  useEffect(() => {
    if (!hasDetected) {
      setSongs([])
      setSongsError('')
      return
    }

    let isCurrent = true
    const controller = new AbortController()

    async function fetchSongs() {
      try {
        setSongsLoading(true)
        setSongsError('')
        const res = await fetch(
          `${API_BASE_URL}/songs?mood=${encodeURIComponent(latestMoodRef.current)}`,
          {
            signal: controller.signal,
          },
        )

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`)
        }

        const data = await res.json()
        if (isCurrent) {
          setSongs(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (err.name === 'AbortError') return
        if (isCurrent) {
          setSongsError(err instanceof Error ? err.message : 'Unable to fetch songs')
          setSongs([])
        }
      } finally {
        if (isCurrent) {
          setSongsLoading(false)
        }
      }
    }

    fetchSongs()

    return () => {
      isCurrent = false
      controller.abort()
    }
  }, [hasDetected, mood])

  useEffect(() => {
    setCurrentSongId(null)
  }, [songs])

  useEffect(() => {
    if (
      !hasDetected ||
      songsLoading ||
      songs.length === 0 ||
      typeof window === 'undefined' ||
      window.innerWidth >= 1024 ||
      autoScrollDoneRef.current
    ) {
      return
    }

    if (playlistRef.current) {
      playlistRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      autoScrollDoneRef.current = true
    }
  }, [hasDetected, songsLoading, songs.length])

  return (
    <div className="flex w-full justify-center px-1 py-4 lg:h-full lg:items-center lg:justify-center lg:overflow-hidden">
      <div className="flex w-full max-w-6xl flex-col gap-8 overflow-visible rounded-[36px] border border-slate-800/60 bg-slate-900/40 p-2 shadow-[0_40px_120px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-4 lg:h-full lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10 lg:p-10">
        <section className="flex w-full flex-col items-center gap-5 overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-950/50 p-3.5 shadow-inner shadow-slate-950/50 sm:p-5 lg:h-full">
          <div className="w-full space-y-3 text-center lg:text-left">
            {/* <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-400">
              Live Mood Feed
            </p> */}
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              DETECT YOUR MOOD AND GET THE PERFECT SONG
            </h2>
            {/* <p className="text-sm text-slate-400">
              Tap <span className="font-semibold text-indigo-300">Detect Mood</span> to analyse your
              expression and unlock a curated playlist from our catalogue.
            </p> */}
          </div>

          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-slate-800/70 bg-slate-900/80 shadow-[0_25px_60px_rgba(8,15,35,0.75)] aspect-[3/4] sm:aspect-[4/5] lg:flex-1">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full -scale-x-100 bg-black object-cover"
            />
            <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-full bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-slate-900/60">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
              Mood: {moodLabel}
            </div>
          </div>

          {!ready && !error && (
            <p className="text-sm text-slate-400">Loading camera stream & models...</p>
          )}

          <button
            type="button"
            onClick={detectMood}
            disabled={!ready || detecting}
            className="w-full max-w-sm rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-8 py-3 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {detecting ? 'Detecting…' : 'Detect Mood'}
          </button>

          {error && (
            <div className="w-full max-w-sm rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          
        </section>

        <section
          ref={playlistRef}
          className="flex w-full flex-col overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-950/40 p-4 shadow-inner shadow-slate-950/40 sm:p-6 lg:h-full"
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-400">
              Curated Playlist
            </p>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold text-white sm:text-3xl">
                Current Mood: <span className="text-indigo-300">{moodLabel}</span>
              </h3>
              <div className="hidden items-center gap-2 rounded-full border border-slate-800/70 px-3 py-1 text-xs font-medium text-slate-300 sm:flex">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                Synced
              </div>
            </div>
            
          </div>

          {!hasDetected && (
            <div className="mt-10 grid flex-1 place-items-center rounded-2xl border border-slate-800/70 bg-slate-950/40 p-10 text-center text-sm text-slate-400">
              <div className="max-w-sm space-y-3">
                <p className="text-base font-medium text-slate-200">Awaiting your first mood scan.</p>
                <p>Hit Detect Mood to Get the perfect soundtrack.</p>
              </div>
            </div>
          )}

          {hasDetected && (
            <div className="mt-6 flex flex-1 flex-col overflow-hidden">
              {songsLoading && (
                <div className="grid place-items-center rounded-2xl border border-slate-800/70 bg-slate-950/60 p-10 text-sm text-slate-300">
                  Pulling the freshest tracks...
                </div>
              )}

              {songsError && !songsLoading && (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
                  {songsError}
                </div>
              )}

              {!songsLoading && !songsError && songs.length === 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
                  No tracks found for your vibe yet. Try another expression or upload new songs via
                  the curator console.
                </div>
              )}

              <div className="mt-4 pr-1 lg:flex-1 lg:overflow-y-auto">
                <ul className="flex flex-col gap-4 pb-2">
                  {songs.map((song) => (
                    <SongCard
                      key={song._id}
                      song={song}
                      isPlaying={currentSongId === song._id}
                      onPlay={() => setCurrentSongId(song._id)}
                      onPause={() => setCurrentSongId(null)}
                    />
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SongCard({ song, isPlaying, onPlay, onPause }) {
  const audioRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setProgress(audio.currentTime || 0)
    const handleLoaded = () => setDuration(audio.duration || 0)
    const handleEnded = () => {
      setProgress(0)
      onPause()
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoaded)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onPause])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch(() => {
        onPause()
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, onPause])

  const handleToggle = () => {
    if (isPlaying) {
      onPause()
    } else {
      onPlay()
    }
  }

  const handleSeek = (event) => {
    const audio = audioRef.current
    if (!audio || !duration) return

    const rect = event.currentTarget.getBoundingClientRect()
    const percent = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
    audio.currentTime = percent * duration
    setProgress(audio.currentTime)
    if (!isPlaying) {
      onPlay()
    }
  }

  const formatTime = (value) => {
    if (!Number.isFinite(value)) return '00:00'
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercent = duration ? Math.min((progress / duration) * 100, 100) : 0

  return (
    <li className="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-3 shadow-inner shadow-slate-950/60 transition hover:border-indigo-500/40 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white sm:text-lg">{song.title}</p>
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-200 sm:px-3 sm:py-1 sm:text-xs">
            {song.mood}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 sm:text-sm">{song.artist}</p>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:mt-5 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleToggle}
            className="grid h-11 w-11 place-items-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 sm:h-12 sm:w-12"
          >
            {isPlaying ? (
              <span className="flex items-center gap-[5px]">
                <span className="block h-4 w-[3px] rounded bg-white" />
                <span className="block h-4 w-[3px] rounded bg-white" />
              </span>
            ) : (
              <span className="ml-[3px] block h-0 w-0 border-y-[9px] border-y-transparent border-l-[14px] border-l-white" />
            )}
          </button>

          <div
            className="relative h-2 flex-1 cursor-pointer overflow-hidden rounded-full bg-slate-800/70"
            onClick={handleSeek}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-[-50%] rounded-full bg-white shadow-lg shadow-indigo-500/40 transition"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 sm:text-[11px]">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio ref={audioRef} src={song.audioUrl} preload="metadata" className="hidden" />
    </li>
  )
}

export default FaceMood
