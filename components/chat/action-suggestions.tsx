'use client'

import { useEffect, useRef, useState } from 'react'

import {
  IconBulb as Bulb,
  IconPencil as Pencil,
  IconScale as Scale,
  IconSearch as Search,
  IconSettings as Settings,
  IconSparkles as Sparkles,
  IconTool as Tool,
  type TablerIcon
} from '@tabler/icons-react'

import { captureClient } from '@/lib/analytics/posthog-client'
import { cn } from '@/lib/utils'

import { ActionPill } from './input-action-pill'

interface ActionCategory {
  icon: TablerIcon
  label: string
  key: string
}

// Categorias de ação exibidas como pills no rodapé do input (referência:
// "Generate a document" / "Translate ..."). Mantidas compatíveis com o
// conjunto existente do ActionButtons.
const actionCategories: ActionCategory[] = [
  { icon: Scale, label: 'Decide', key: 'decide' },
  { icon: Tool, label: 'Troubleshoot', key: 'troubleshoot' },
  { icon: Settings, label: 'How-to', key: 'howto' },
  { icon: Bulb, label: 'Understand', key: 'understand' },
  { icon: Pencil, label: 'Create', key: 'create' }
]

const promptSamples: Record<string, string[]> = {
  troubleshoot: [
    'My car starts then immediately stalls, but the electronics still work',
    'Wi-Fi keeps dropping on one laptop but not my phone — how do I fix it?',
    "My sourdough starter isn't rising after a week — what's wrong?",
    'Next.js build fails with "Module not found" only in production'
  ],
  howto: [
    'Move my photos off Google Photos without losing albums',
    'Set up a Proxmox home server for self-hosting',
    'Convert a folder of .txt files to clean HTML',
    'Set up a Plex media server to stream my movies'
  ],
  decide: [
    'Tesla vs Rivian — which should I buy?',
    'Standing vs sitting desk for lower-back pain — which and why?',
    'A budget mirrorless camera for travel under $1,000',
    'Notion vs Obsidian for a personal knowledge base'
  ],
  understand: [
    'What causes the northern lights?',
    'Why did the dinosaurs really go extinct?',
    'How does a nuclear reactor actually generate electricity?',
    'What did Apple announce at WWDC 2026?'
  ],
  create: [
    'Draft a 5-question Ancient Rome quiz with A–D answers',
    'Outline a peer-support group for a prison setting',
    'Create a high-protein meal plan for a week on a budget',
    'Draft a beginner 3-day-per-week workout split'
  ]
}

interface ActionSuggestionsProps {
  onSelectPrompt: (prompt: string) => void
  onCategoryClick: (category: string) => void
  className?: string
}

/**
 * Sugestões de ação no estilo da referência: pills "Generate a document",
 * "Translate ..." que, ao clicar, abrem um popover com exemplos de prompt.
 * Substitui a lista fixa do ActionButtons mantendo a mesma semântica.
 */
export function ActionSuggestions({
  onSelectPrompt,
  onCategoryClick,
  className
}: ActionSuggestionsProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expanded) setExpanded(null)
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        expanded &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [expanded])

  const handleCategoryClick = (category: ActionCategory) => {
    if (expanded === category.key) {
      setExpanded(null)
      return
    }
    setExpanded(category.key)
    onCategoryClick(category.label)
    captureClient('example_category_opened', { category: category.key })
  }

  const handlePromptClick = (prompt: string) => {
    captureClient('example_prompt_clicked', {
      category: expanded,
      prompt
    })
    setExpanded(null)
    onSelectPrompt(prompt)
  }

  return (
    <div ref={containerRef} className={cn('relative flex items-center gap-2', className)}>
      {actionCategories.map(category => (
        <div key={category.key} className="relative">
          <ActionPill
            icon={<category.icon className="size-4" />}
            label={category.label}
            onClick={() => handleCategoryClick(category)}
          />
          {expanded === category.key && (
            <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border bg-card p-1.5 shadow-lg">
              {promptSamples[category.key]?.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-card-foreground transition-colors duration-150 hover:bg-card-foreground/5"
                  onClick={() => handlePromptClick(prompt)}
                >
                  <Search className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">{prompt}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
