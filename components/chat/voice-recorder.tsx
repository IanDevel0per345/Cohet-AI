'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  IconCheck as Check,
  IconMicrophone as Microphone,
  IconPlayerPause as Pause,
  IconPlayerPlay as Play,
  IconX as X
} from '@tabler/icons-react'

import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
  onRecordingComplete: (file: File) => void
  compact?: boolean
  className?: string
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

type RecorderState = 'idle' | 'recording' | 'paused' | 'playing'

/**
 * Gravação de voz inline no input (referência: "Go ahead, record a quick note"
 * com botão Cancel à esquerda, timer com indicador vermelho, pause e check).
 * Produz um Blob webm que o usuário envia como anexo de áudio.
 */
export function VoiceRecorder({
  onRecordingComplete,
  compact = false,
  className
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [chunks, setChunks] = useState<Blob[]>([])
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const elapsedRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    return () => {
      clearTimer()
      stopStream()
      recorderRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      const collected: Blob[] = []
      recorder.ondataavailable = e => {
        if (e.data.size > 0) collected.push(e.data)
      }
      recorder.onstop = () => {
        setChunks([...collected])
        const blob = new Blob(collected, { type: 'audio/webm' })
        if (blob.size > 0) {
          const file = new File([blob], `voice-note-${Date.now()}.webm`, {
            type: 'audio/webm'
          })
          onRecordingComplete(file)
        }
      }
      recorder.start()
      startRef.current = Date.now()
      elapsedRef.current = 0
      setElapsed(0)
      clearTimer()
      timerRef.current = window.setInterval(() => {
        const next =
          elapsedRef.current + Math.floor((Date.now() - startRef.current) / 1000)
        elapsedRef.current = next
        setElapsed(next)
      }, 500)
      setState('recording')
    } catch {
      setError('Microphone access denied')
    }
  }, [onRecordingComplete])

  const cancelRecording = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
    clearTimer()
    stopStream()
    setChunks([])
    setState('idle')
  }

  const pauseRecording = () => {
    recorderRef.current?.pause()
    clearTimer()
    setState('paused')
  }

  const resumeRecording = () => {
    recorderRef.current?.resume()
    startRef.current = Date.now()
    clearTimer()
    timerRef.current = window.setInterval(() => {
      const next =
        elapsedRef.current + Math.floor((Date.now() - startRef.current) / 1000)
      elapsedRef.current = next
      setElapsed(next)
    }, 500)
    setState('recording')
  }

  const confirmRecording = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
    clearTimer()
    stopStream()
  }

  const togglePlay = () => {
    if (!audioRef.current && chunks.length > 0) {
      const url = URL.createObjectURL(new Blob(chunks))
      const audio = new Audio(url)
      audio.onended = () => setState('paused')
      audioRef.current = audio
    }
    if (state === 'playing') {
      audioRef.current?.pause()
      setState('paused')
    } else {
      audioRef.current?.play().catch(() => setState('paused'))
      setState('playing')
    }
  }

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-3 px-2 py-1.5',
        className
      )}
    >
      {compact ? null : (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Go ahead, record a quick note
          </p>
        </div>
      )}
      <div className="flex items-center gap-3">
        {state === 'idle' ? (
          <button
            type="button"
            onClick={startRecording}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              'border border-border/60 bg-card text-muted-foreground',
              'transition-[background-color,color] duration-150',
              'hover:bg-card-foreground/5 hover:text-foreground',
              error && 'opacity-50'
            )}
            title={error ?? 'Record audio'}
            disabled={!!error}
          >
            <Microphone className="size-4" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={cancelRecording}
              className={cn(
                'h-7 shrink-0 rounded-full px-3 text-xs font-medium',
                'border border-border/60 bg-card text-card-foreground/80',
                'transition-[background-color] duration-150 hover:bg-card-foreground/5'
              )}
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'size-2 rounded-full bg-red-500',
                  state === 'recording' && 'animate-pulse'
                )}
              />
              <span
                className={cn(
                  'font-mono text-sm tabular-nums',
                  state === 'playing' ? 'text-foreground' : 'text-card-foreground/70'
                )}
              >
                {formatDuration(elapsed)}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {state === 'recording' && (
          <button
            type="button"
            onClick={pauseRecording}
            className={cn(
              'flex size-8 items-center justify-center rounded-full',
              'border border-border/60 bg-card text-muted-foreground',
              'hover:bg-card-foreground/5 hover:text-foreground'
            )}
            title="Pause"
          >
            <Pause className="size-4" />
          </button>
        )}
        {state === 'paused' && (
          <button
            type="button"
            onClick={resumeRecording}
            className={cn(
              'flex size-8 items-center justify-center rounded-full',
              'border border-border/60 bg-card text-muted-foreground',
              'hover:bg-card-foreground/5 hover:text-foreground'
            )}
            title="Resume"
          >
            <Play className="size-4" />
          </button>
        )}
        {(state === 'paused' || state === 'playing') && (
          <button
            type="button"
            onClick={togglePlay}
            className={cn(
              'flex size-8 items-center justify-center rounded-full',
              'border border-border/60 bg-card text-muted-foreground',
              'hover:bg-card-foreground/5 hover:text-foreground'
            )}
            title={state === 'playing' ? 'Stop preview' : 'Preview'}
          >
            {state === 'playing' ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </button>
        )}
        {state !== 'idle' && (
          <button
            type="button"
            onClick={confirmRecording}
            disabled={state === 'recording'}
            className={cn(
              'flex size-8 items-center justify-center rounded-full',
              'bg-white text-foreground',
              'transition-[background-color] duration-150 hover:bg-white/90',
              state === 'recording' && 'opacity-40'
            )}
            title="Done"
          >
            <Check className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
