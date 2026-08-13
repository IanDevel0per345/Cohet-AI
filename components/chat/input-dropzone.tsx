import {
  IconDownload as UploadIcon,
  IconFolders as Folder,
  IconMicrophone as Microphone,
  IconPaperclip as Paperclip} from '@tabler/icons-react'

import { cn } from '@/lib/utils'

interface InputDropzoneProps {
  onBrowse: () => void
  onRecord: () => void
  onAttach: () => void
  onLibrary: () => void
  className?: string
}

/**
 * Área de drop grande no estilo da referência: borda tracejada arredondada,
 * título "Drop anything here or browse", subtítulo e 4 botões circulares
 * (upload, microfone, anexo, biblioteca).
 */
export function InputDropzone({
  onBrowse,
  onRecord,
  onAttach,
  onLibrary,
  className
}: InputDropzoneProps) {
  const circleButton = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void
  ) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={cn(
        'flex size-10 items-center justify-center rounded-full',
        'border border-border/60 bg-card text-muted-foreground',
        'transition-[background-color,color] duration-150',
        'hover:bg-card-foreground/5 hover:text-foreground',
        'focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring'
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  )

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-primary/50 bg-card/60 px-6 py-10 text-center transition-[background-color] duration-150',
        className
      )}
      onPointerDown={e => e.stopPropagation()}
    >
      <p className="text-base font-medium text-foreground">
        Drop anything here or browse
      </p>
      <p className="text-sm text-muted-foreground">
        Docs, images, videos, audio files, links &amp; more
      </p>
      <div className="flex items-center gap-2.5">
        {circleButton(<UploadIcon className="size-4" />, 'Browse files', onBrowse)}
        {circleButton(<Microphone className="size-4" />, 'Record audio', onRecord)}
        {circleButton(<Paperclip className="size-4" />, 'Attach', onAttach)}
        {circleButton(<Folder className="size-4" />, 'Library', onLibrary)}
      </div>
    </div>
  )
}
