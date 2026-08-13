'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react'
import { useRouter } from 'next/navigation'

import { UseChatHelpers } from '@ai-sdk/react'
import {
  IconArrowUp as ArrowUp,
  IconChevronDown as ChevronDown
} from '@tabler/icons-react'
import { toast } from 'sonner'

import { captureClient } from '@/lib/analytics/posthog-client'
import { SHORTCUT_EVENTS } from '@/lib/keyboard-shortcuts'
import {
  isAdaptiveModeAuthBlocked,
  requiresAdaptiveModeAuth
} from '@/lib/search-mode-availability'
import { NoteContext, UploadedFile } from '@/lib/types'
import type { UIDataTypes, UIMessage, UITools } from '@/lib/types/ai'
import type { ModelSelectorData } from '@/lib/types/model-selector'
import type { SearchMode } from '@/lib/types/search'
import { cn } from '@/lib/utils'
import {
  getCookie,
  setCookie,
  subscribeToCookieChange
} from '@/lib/utils/cookies'
import { stripMarkdownText } from '@/lib/utils/markdown'

import { useArtifact } from './artifact/artifact-context'
import { useLibrary } from './library/library-context'
import { LibraryPickerDialog } from './library/library-picker-dialog'
import { PromptInput } from './ui/ai-chat-input'
import { Button } from './ui/button'
import { IconBlinkingLogo } from './ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip'
import { MessageNavigationDots } from './message-navigation-dots'
import { SearchModeSelector } from './search-mode-selector'
import { UploadedFileList } from './uploaded-file-list'

// Constants for timing delays
const INPUT_UPDATE_DELAY_MS = 10 // Delay to ensure input value is updated before form submission
// Only paste events at/over this size become a content card, so short/normal
// pastes stay inline. Sized by chars, not lines — a line-count trigger carded
// short, many-line pastes that read fine inline and were mostly reverted.
const PASTE_CARD_MIN_CHARS = 400
// A paste that is a single bare URL becomes a lightweight favicon chip.
// L0 prototype: client-only, no fetch — the URL rides into the query at send
// time so the existing fetch tool picks it up.
const BARE_URL_RE = /^https?:\/\/\S+$/
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf']

function getSearchModeSnapshot(): SearchMode {
  return getCookie('searchMode') === 'adaptive' ? 'adaptive' : 'quick'
}

interface ChatPanelProps {
  chatId: string
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  status: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  messages: UIMessage[]
  setMessages: (messages: UIMessage[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
  /** Whether to show the scroll to bottom button */
  showScrollToBottomButton: boolean
  /** Reference to the scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  uploadedFiles: UploadedFile[]
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  quotedContexts: string[]
  setQuotedContexts: React.Dispatch<React.SetStateAction<string[]>>
  noteContexts: NoteContext[]
  setNoteContexts: React.Dispatch<React.SetStateAction<NoteContext[]>>
  /** Callback to reset chatId when starting a new chat */
  onNewChat?: () => void
  /** Whether the current session is guest */
  isGuest?: boolean
  /** Whether the deployment is cloud mode */
  isCloudDeployment?: boolean
  onAdaptiveModeAuthRequired?: () => void
  modelSelectorData?: ModelSelectorData
  /** Chat sections for message navigation dots */
  sections?: { id: string; userMessage: UIMessage }[]
}

export function ChatPanel({
  chatId,
  input,
  handleInputChange,
  handleSubmit,
  status,
  messages,
  setMessages,
  query,
  stop,
  append,
  showScrollToBottomButton,
  uploadedFiles,
  setUploadedFiles,
  quotedContexts,
  setQuotedContexts,
  noteContexts,
  setNoteContexts,
  scrollContainerRef,
  onNewChat,
  isGuest = false,
  isCloudDeployment = false,
  onAdaptiveModeAuthRequired,
  modelSelectorData,
  sections = []
}: ChatPanelProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const promptFormRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentMenuRef = useRef<HTMLDivElement>(null)
  const noteContextsRef = useRef(noteContexts)
  const uploadedFilesRef = useRef(uploadedFiles)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false) // Composition state
  const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
  const [isInputFocused, setIsInputFocused] = useState(false) // Track input focus
  // Large pastes become separate "content cards" (the target), keeping the
  // textarea for the instruction. See PASTE_CARD_MIN_CHARS.
  const [contentCards, setContentCards] = useState<string[]>([])
  // A single pasted URL becomes a lightweight favicon chip (see BARE_URL_RE).
  const [urlCards, setUrlCards] = useState<string[]>([])
  // Voice notes recorded inline — sent as base64 file parts on submit.
  const [voiceNoteUrls, setVoiceNoteUrls] = useState<
    { url: string; name: string }[]
  >([])
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false)
  const [isLibraryPickerOpen, setIsLibraryPickerOpen] = useState(false)
  const { close: closeArtifact } = useArtifact()
  const { upsertCachedFile } = useLibrary()
  const isLoading = status === 'submitted' || status === 'streaming'
  const hasPendingInput =
    input.trim().length > 0 ||
    contentCards.length > 0 ||
    quotedContexts.length > 0 ||
    noteContexts.length > 0 ||
    urlCards.length > 0 ||
    uploadedFiles.some(file => file.status === 'uploaded')
  const hasAvailableModels =
    isCloudDeployment || modelSelectorData?.hasAvailableModels !== false
  const searchMode = useSyncExternalStore(
    subscribeToCookieChange,
    getSearchModeSnapshot,
    () => 'quick' as SearchMode
  )
  const isAdaptiveAuthRequired = requiresAdaptiveModeAuth({
    isGuest,
    isCloudDeployment
  })
  const adaptiveModeSubmitBlocked = isAdaptiveModeAuthBlocked({
    mode: searchMode,
    isGuest,
    isCloudDeployment
  })

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    // Brief debounce — the candidate-confirm Enter that fires
    // immediately after compositionend may otherwise be treated as a
    // submit. 50ms is enough to swallow that synchronous event but
    // short enough not to drop a real "finish typing, press Enter".
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 50)
  }

  useEffect(() => {
    noteContextsRef.current = noteContexts
  }, [noteContexts])

  useEffect(() => {
    uploadedFilesRef.current = uploadedFiles
  }, [uploadedFiles])

  const handleVoiceNote = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result ?? '')
      setVoiceNoteUrls(prev => [...prev, { url, name: file.name }])
      toast.success('Voice note attached')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleNewChat = useCallback(() => {
    setMessages([])
    closeArtifact()
    // Reset focus state when clearing chat
    setIsInputFocused(false)
    inputRef.current?.blur()
    // Reset chatId in parent component
    onNewChat?.()
    router.push('/')
  }, [setMessages, closeArtifact, onNewChat, router])

  // Listen for keyboard shortcut events
  // Uses defaultPrevented to prevent duplicate handling
  // when multiple ChatPanel instances are mounted (Next.js component caching)
  const handleNewChatRef = useRef(handleNewChat)
  useEffect(() => {
    handleNewChatRef.current = handleNewChat
  }, [handleNewChat])

  useEffect(() => {
    const handleNewChatShortcut = (e: Event) => {
      if (e.defaultPrevented) return
      e.preventDefault()
      handleNewChatRef.current()
    }

    window.addEventListener(SHORTCUT_EVENTS.newChat, handleNewChatShortcut)
    return () => {
      window.removeEventListener(SHORTCUT_EVENTS.newChat, handleNewChatShortcut)
    }
  }, [])

  const isToolInvocationInProgress = () => {
    if (!messages.length) return false

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant' || !lastMessage.parts) return false

    const parts = lastMessage.parts
    const lastPart = parts[parts.length - 1]

    return (
      (lastPart?.type === 'tool-search' ||
        lastPart?.type === 'tool-fetch' ||
        lastPart?.type === 'tool-askQuestion') &&
      ((lastPart as any)?.state === 'input-streaming' ||
        (lastPart as any)?.state === 'input-available')
    )
  }

  // if query is not empty, submit the query
  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      if (adaptiveModeSubmitBlocked) {
        setCookie('searchMode', 'quick')
        return
      }

      append({
        role: 'user',
        parts: [{ type: 'text', text: query }]
      })
      isFirstRender.current = false
    }
  }, [adaptiveModeSubmitBlocked, append, query])

  const handleFileRemove = useCallback(
    (index: number) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    },
    [setUploadedFiles]
  )

  const uploadSelectedFiles = useCallback(
    async (files: File[]) => {
      const validFiles = files
        .slice(0, 3)
        .filter(file => ALLOWED_FILE_TYPES.includes(file.type))
      const rejected = files.filter(
        file => !ALLOWED_FILE_TYPES.includes(file.type)
      )

      if (rejected.length > 0) {
        toast.error(
          'Some files were not accepted: ' +
            rejected.map(file => file.name).join(', ')
        )
      }

      if (validFiles.length === 0) return

      const newFiles: UploadedFile[] = validFiles.map(file => ({
        file,
        status: 'uploading',
        mediaType: file.type
      }))
      setUploadedFiles(prev => [...prev, ...newFiles])
      await Promise.all(
        newFiles.map(async uf => {
          if (!uf.file) return
          const formData = new FormData()
          formData.append('file', uf.file)
          formData.append('chatId', chatId)
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            })

            if (!res.ok) {
              throw new Error('Upload failed')
            }

            const { file: uploaded } = await res.json()
            if (uploaded.libraryFile) {
              upsertCachedFile(uploaded.libraryFile)
            }
            setUploadedFiles(prev =>
              prev.map(f =>
                f.file === uf.file
                  ? {
                      ...f,
                      status: 'uploaded',
                      url: uploaded.url,
                      name: uploaded.filename,
                      key: uploaded.key,
                      mediaType: uploaded.mediaType,
                      libraryFileId: uploaded.id
                    }
                  : f
              )
            )
          } catch (e) {
            toast.error(`Failed to upload ${uf.file.name}`)
            setUploadedFiles(prev =>
              prev.map(f =>
                f.file === uf.file ? { ...f, status: 'error' } : f
              )
            )
          }
        })
      )
    },
    [chatId, setUploadedFiles, upsertCachedFile]
  )

  const handleAttachNote = useCallback(
    (note: NoteContext) => {
      if (noteContextsRef.current.some(item => item.id === note.id)) {
        return false
      }
      noteContextsRef.current = [...noteContextsRef.current, note]
      setNoteContexts(prev =>
        prev.some(item => item.id === note.id) ? prev : [...prev, note]
      )
      toast.success('Note attached')
      return true
    },
    [setNoteContexts]
  )

  const handleAttachLibraryFile = useCallback(
    (file: UploadedFile) => {
      if (
        file.libraryFileId &&
        uploadedFilesRef.current.some(
          item => item.libraryFileId === file.libraryFileId
        )
      ) {
        return false
      }
      uploadedFilesRef.current = [...uploadedFilesRef.current, file]
      setUploadedFiles(prev =>
        file.libraryFileId &&
        prev.some(item => item.libraryFileId === file.libraryFileId)
          ? prev
          : [...prev, file]
      )
      toast.success('File attached')
      return true
    },
    [setUploadedFiles]
  )

  const openLibraryPicker = useCallback(() => {
    setIsAttachmentMenuOpen(false)
    setIsLibraryPickerOpen(true)
  }, [])

  useEffect(() => {
    if (!isAttachmentMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target as Node)
      ) {
        setIsAttachmentMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAttachmentMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAttachmentMenuOpen])

  // Scroll to the bottom of the container
  const handleScrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div
      className={cn(
        'w-full bg-background group/form-container shrink-0',
        messages.length > 0
          ? 'sticky bottom-0 px-2 pb-2 md:pb-4'
          : 'px-4 md:px-6'
      )}
    >
      {messages.length === 0 && (
        <div className="mb-6 md:mb-10 flex flex-col items-center gap-2 md:gap-4">
          <IconBlinkingLogo className="size-12" />
          <h1 className="text-xl md:text-2xl font-medium text-foreground">
            What would you like to know?
          </h1>
        </div>
      )}
      {uploadedFiles.length > 0 && (
        <UploadedFileList files={uploadedFiles} onRemove={handleFileRemove} />
      )}
      <form
        onSubmit={e => {
          // Pasted attachments (content cards / URL chips) are sent as
          // structured data parts alongside the instruction text part — no
          // in-band markers. The server maps them to the model prompt.
          if (
            contentCards.length > 0 ||
            quotedContexts.length > 0 ||
            noteContexts.length > 0 ||
            urlCards.length > 0 ||
            uploadedFiles.some(file => file.status === 'uploaded')
          ) {
            e.preventDefault()
            if (adaptiveModeSubmitBlocked) {
              onAdaptiveModeAuthRequired?.()
              return
            }
            if (!hasAvailableModels) {
              toast.error('No enabled model is available')
              return
            }
            const uploaded = uploadedFiles.filter(f => f.status === 'uploaded')
            const parts = [
              ...contentCards.map(text => ({
                type: 'data-pastedContent',
                data: { text }
              })),
              ...quotedContexts.map(text => ({
                type: 'data-quotedContext',
                data: { text }
              })),
              ...noteContexts.map(note => ({
                type: 'data-noteContext',
                data: { title: note.title, text: note.content }
              })),
              ...urlCards.map(url => ({
                type: 'data-sourceUrl',
                data: { url }
              })),
              ...voiceNoteUrls.map(v => ({
                type: 'file',
                url: v.url,
                filename: v.name,
                mediaType: 'audio/webm',
                key: undefined
              })),
              ...uploaded.map(f => ({
                type: 'file',
                url: f.url!,
                filename: f.name ?? f.file?.name ?? 'Attached file',
                mediaType:
                  f.mediaType ?? f.file?.type ?? 'application/octet-stream',
                key: f.key
              })),
              ...(input.trim() ? [{ type: 'text', text: input }] : [])
            ]
            if (contentCards.length > 0) {
              captureClient('content_card_submitted', {
                cardCount: contentCards.length,
                chars: contentCards.reduce((sum, c) => sum + c.length, 0)
              })
            }
            if (urlCards.length > 0) {
              captureClient('url_card_submitted', {
                cardCount: urlCards.length
              })
            }
            if (noteContexts.length > 0) {
              captureClient('note_context_submitted', {
                count: noteContexts.length,
                chars: noteContexts.reduce(
                  (sum, note) => sum + note.content.length,
                  0
                )
              })
            }
            const libraryFiles = uploaded.filter(file => file.libraryFileId)
            if (libraryFiles.length > 0) {
              captureClient('library_file_submitted', {
                count: libraryFiles.length
              })
            }
            setContentCards([])
            setQuotedContexts([])
            setNoteContexts([])
            setUrlCards([])
            setVoiceNoteUrls([])
            setUploadedFiles([])
            handleInputChange({
              target: { value: '' }
            } as React.ChangeEvent<HTMLTextAreaElement>)
            append({ role: 'user', parts })
            setIsInputFocused(false)
            inputRef.current?.blur()
            return
          }
          if (adaptiveModeSubmitBlocked) {
            e.preventDefault()
            onAdaptiveModeAuthRequired?.()
            return
          }

          if (!hasAvailableModels) {
            e.preventDefault()
            toast.error('No enabled model is available')
            return
          }
          handleSubmit(e)
          // Reset focus state after submission
          setIsInputFocused(false)
          inputRef.current?.blur()
        }}
        className={cn('max-w-full md:max-w-3xl w-full mx-auto relative')}
      >
        {/* Scroll to bottom button */}
        {messages.length > 0 && (
          <div
            className={cn(
              'transition-opacity duration-[120ms] ease-[var(--motion-ease-out)]',
              showScrollToBottomButton
                ? 'opacity-100'
                : 'pointer-events-none opacity-0'
            )}
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute -top-10 right-0 z-20 size-8 rounded-full shadow-md"
              onClick={handleScrollToBottom}
              title="Scroll to bottom"
            >
              <ChevronDown size={16} />
            </Button>
          </div>
        )}
        {/* Message navigation dots */}
        {sections.length > 0 && (
          <div
            className={cn(
              'transition-opacity duration-[120ms] ease-[var(--motion-ease-out)]',
              !showScrollToBottomButton && status === 'ready'
                ? 'opacity-100'
                : 'pointer-events-none opacity-0'
            )}
          >
            <MessageNavigationDots sections={sections} />
          </div>
        )}

        <PromptInput
          className={cn(
            'relative mx-auto',
            isInputFocused &&
              'ring-1 ring-ring/20 ring-offset-1 ring-offset-background/50'
          )}
          placeholder={messages.length > 0 ? 'Reply...' : 'Ask anything...'}
          value={input}
          onChange={value =>
            handleInputChange({
              target: { value }
            } as React.ChangeEvent<HTMLTextAreaElement>)
          }
          onSubmit={async (value, meta) => {
            handleInputChange({
              target: { value }
            } as React.ChangeEvent<HTMLTextAreaElement>)
            if (meta.attachments.length > 0 && !isGuest) {
              await uploadSelectedFiles(meta.attachments)
            }
            requestAnimationFrame(() => promptFormRef.current?.requestSubmit())
          }}
          models={['GPT 5.5', 'Opus 4.8', 'Gemini 3.5 Flash', 'Composer 2.5', 'GLM 5.2']}
          onPlusClick={() => {
            if (!isGuest) setIsAttachmentMenuOpen(open => !open)
          }}
        />
      </form>
      <LibraryPickerDialog
        open={isLibraryPickerOpen}
        onOpenChange={setIsLibraryPickerOpen}
        onAttachNote={handleAttachNote}
        onAttachFile={handleAttachLibraryFile}
      />
    </div>
  )
}
