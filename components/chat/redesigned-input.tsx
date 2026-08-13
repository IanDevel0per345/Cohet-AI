'use client'

import { useEffect, useRef, useState } from 'react'

import {
  IconChevronDown as ChevronDown,
  IconCircleDashed as CircleDashed,
  IconMicrophone as Microphone,
  IconSparkles as Sparkles,
  IconVolume as Volume,
  IconX as X
} from '@tabler/icons-react'

import { cn } from '@/lib/utils'

import { ActionPill } from './input-action-pill'
import { InputDropzone } from './input-dropzone'
import { VoiceRecorder } from './voice-recorder'

interface RedesignedInputProps {
  /** Pills de sugestão de ação a renderizar dentro do rodapé do input */
  actionPills?: React.ReactNode
  /** Conteúdo do slot esquerdo (menu de anexos, modo de busca) */
  leftSlot: React.ReactNode
  /** Seletor de modelo (renderizado pelo ModelSelectorClient) */
  modelSlot?: React.ReactNode
  /** Botão novo chat */
  newChatButton?: React.ReactNode
  /** Botão enviar/stop */
  submitButton: React.ReactNode
  /** Se há input pendente (habilita enviar) */
  hasPendingInput?: boolean
  /** Está carregando/streaming */
  isLoading?: boolean
  /** Quando o usuário solta um arquivo na área de drop */
  onFileDrop?: (files: File[]) => void
  /** Quando o usuário conclui uma gravação de voz */
  onVoiceNote?: (file: File) => void
  /** Abre o seletor de arquivos */
  onBrowseFiles: () => void
  /** Abre o menu de anexos */
  onAttach: () => void
  /** Abre o picker da biblioteca */
  onLibrary: () => void
  /** Placeholder do textarea */
  placeholder?: string
  /** Texto atual (para o chip de contexto) */
  inputText?: string
  /** Slot do textarea real (editável) — renderizado no corpo do estado padrão */
  textareaSlot?: React.ReactNode
  /** Chip de contexto (ex.: "@ Onboarding call · Today") */
  contextChip?: { icon?: React.ReactNode; label: string; meta?: string } | null
  className?: string
}

/**
 * Input de chat redesenhado no estilo da referência fornecida:
 * - Card arredondado escuro flutuante
 * - Chip de contexto arredondado no topo (ícone + texto + pill "Today")
 * - Rodapé com botão +, pill do modelo com logo, ícones (áudio/brilho/...),
 *   microfone e botão enviar branco
 * - Pills de ação inline ("Generate a document", "Translate")
 * - Área de drop grande com borda tracejada quando um arquivo é arrastado
 * - Estado de gravação de voz com timer, cancel, pause e check
 */
export function RedesignedInput({
  actionPills = [],
  leftSlot,
  modelSlot,
  newChatButton,
  submitButton,
  hasPendingInput = false,
  isLoading = false,
  onFileDrop,
  onVoiceNote,
  onBrowseFiles,
  onAttach,
  onLibrary,
  placeholder = 'Ask anything...',
  inputText = '',
  textareaSlot,
  contextChip = null,
  className
}: RedesignedInputProps) {
  const [dragging, setDragging] = useState(false)
  const [recording, setRecording] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const dragCountRef = useRef(0)

  // Drag & drop global sobre o card
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCountRef.current++
      setDragging(true)
    }
    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCountRef.current--
      if (dragCountRef.current <= 0) {
        dragCountRef.current = 0
        setDragging(false)
      }
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      dragCountRef.current = 0
      setDragging(false)
      const files = Array.from(e.dataTransfer?.files ?? [])
      if (files.length > 0) onFileDrop?.(files)
    }
    document.addEventListener('dragenter', onDragEnter)
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('dragleave', onDragLeave)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragenter', onDragEnter)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('dragleave', onDragLeave)
      document.removeEventListener('drop', onDrop)
    }
  }, [onFileDrop])

  const handleStartRecording = () => {
    if (
      typeof window !== 'undefined' &&
      !navigator.mediaDevices?.getUserMedia
    ) {
      // O VoiceRecorder trata a negação de permissão internamente.
      return
    }
    setRecording(true)
    setShowRecorder(true)
  }

  const handleVoiceComplete = (file: File) => {
    onVoiceNote?.(file)
    setRecording(false)
    setShowRecorder(false)
  }

  return (
    <div
      className={cn(
        'relative flex w-full flex-col rounded-3xl border border-border/70 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-[box-shadow] duration-150',
        dragging && 'shadow-[0_8px_40px_rgba(0,0,0,0.5)]',
        className
      )}
    >
      {/* Estado de gravação de voz */}
      {recording || showRecorder ? (
        <VoiceRecorder
          compact={showRecorder && !recording}
          onRecordingComplete={handleVoiceComplete}
        />
      ) : dragging ? (
        /* Estado 3 — área de drop grande com borda tracejada */
        <InputDropzone
          className="m-2"
          onBrowse={onBrowseFiles}
          onRecord={() => {
            setDragging(false)
            setRecording(true)
          }}
          onAttach={onAttach}
          onLibrary={onLibrary}
        />
      ) : actionPills ? (
        /* Estado 2 — sugestões de ação inline no rodapé */
        <div className="flex flex-col gap-2 p-2.5 md:p-3">
          <p className="pl-1.5 pt-0.5 text-sm text-muted-foreground">
            {placeholder}
          </p>
          <div className="flex min-h-9 flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Clear"
              onClick={() => setShowRecorder(false)}
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full',
                'border border-border/60 bg-card text-muted-foreground',
                'hover:bg-card-foreground/5 hover:text-foreground'
              )}
            >
              <X className="size-3.5" />
            </button>
            {actionPills}
            <div className="flex-1" />
            <button
              type="button"
              aria-label="Record audio"
              onClick={handleStartRecording}
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full',
                'border border-border/60 bg-card text-muted-foreground',
                'transition-[background-color,color] duration-150',
                'hover:bg-card-foreground/5 hover:text-foreground'
              )}
            >
              <Microphone className="size-4" />
            </button>
            {submitButton}
          </div>
        </div>
      ) : (
        /* Estado 1 — input padrão com chip de contexto e modelo */
        <div className="flex flex-col">
          {contextChip && (
            <div className="flex items-center gap-3 px-3 pt-3">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-foreground/10 px-2.5 text-xs text-muted-foreground">
                <span className="opacity-60">@</span>
                {contextChip.icon}
                <span className="truncate font-medium text-card-foreground/90">
                  {contextChip.label}
                </span>
                {contextChip.meta && (
                  <>
                    <span className="opacity-30">|</span>
                    <span>{contextChip.meta}</span>
                  </>
                )}
              </span>
            </div>
          )}
          <div className="px-3 pt-2.5 md:px-4">
            {textareaSlot ?? (
              <span
                className={cn(
                  'block text-sm text-muted-foreground',
                  inputText ? 'whitespace-pre-wrap break-words text-card-foreground' : ''
                )}
              >
                {inputText || placeholder}
              </span>
            )}
          </div>
          <div className="flex min-h-[52px] items-center justify-between gap-2 p-2 md:p-2.5">
            <div className="flex items-center gap-2">
              {leftSlot}
              <div className="h-4 w-px bg-border/60" />
              {modelSlot ?? (
                <button
                  type="button"
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium',
                    'border border-border/60 bg-card text-card-foreground/80',
                    'hover:bg-card-foreground/5'
                  )}
                >
                  <Sparkles className="size-4 opacity-70" />
                  Model
                  <ChevronDown className="size-3 opacity-50" />
                </button>
              )}
              <button
                type="button"
                aria-label="Voice note"
                onClick={handleStartRecording}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/70',
                  'transition-colors duration-150 hover:bg-card-foreground/5 hover:text-foreground'
                )}
              >
                <Volume className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Sparkle"
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/70',
                  'transition-colors duration-150 hover:bg-card-foreground/5 hover:text-foreground'
                )}
              >
                <Sparkles className="size-4" />
              </button>
              <button
                type="button"
                aria-label="More"
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/70',
                  'transition-colors duration-150 hover:bg-card-foreground/5 hover:text-foreground'
                )}
              >
                <CircleDashed className="size-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {newChatButton}
              {submitButton}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
