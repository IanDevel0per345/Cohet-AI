'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'

import {
  IconCheck as Check,
  IconChevronDown as ChevronDown
} from '@tabler/icons-react'

import {
  MODEL_SELECTION_COOKIE,
  serializeModelSelectionCookie
} from '@/lib/config/model-selection-cookie'
import { ModelSelectorData } from '@/lib/types/model-selector'
import { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'
import { setCookie } from '@/lib/utils/cookies'

import { Button } from './ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

function modelKey(model: Model): string {
  return `${model.providerId}:${model.id}`
}

const PROVIDER_LOGO_BY_ID: Record<string, string> = {
  openai: '/providers/logos/openai.svg',
  anthropic: '/providers/logos/anthropic.svg',
  google: '/providers/logos/google.svg',
  gateway: '/providers/logos/gateway.svg',
  'openai-compatible': '/providers/logos/openai-compatible.svg',
  ollama: '/providers/logos/ollama.svg'
}

function ProviderLogo({ providerId }: { providerId: string }) {
  const logoSrc = PROVIDER_LOGO_BY_ID[providerId]
  if (!logoSrc) {
    return <span className="size-4 rounded-full bg-muted-foreground/30" />
  }

  return (
    <Image
      src={logoSrc}
      alt={`${providerId} logo`}
      width={16}
      height={16}
      className="size-4 shrink-0 object-contain"
    />
  )
}

interface ModelSelectorClientProps {
  data?: ModelSelectorData
  className?: string
}

const FALLBACK_MODELS = [
  { providerId: 'openai', id: 'gpt-5.5', name: 'GPT 5.5' },
  { providerId: 'anthropic', id: 'opus-4.8', name: 'Opus 4.8' },
  { providerId: 'google', id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { providerId: 'gateway', id: 'composer-2.5', name: 'Composer 2.5' },
  { providerId: 'openai-compatible', id: 'glm-5.2', name: 'GLM 5.2' }
]

function FallbackModelSelector({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(FALLBACK_MODELS[0])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('h-auto min-w-[220px] justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm hover:bg-muted', className)}
        >
          <span className="flex items-center gap-2">
            <ProviderLogo providerId={selectedModel.providerId} />
            <span className="text-sm font-semibold">{selectedModel.name}</span>
          </span>
          <ChevronDown className={cn('size-4 opacity-50 transition-transform', open && 'rotate-180')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="center" sideOffset={8}>
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup heading="Models">
              {FALLBACK_MODELS.map(model => (
                <CommandItem
                  key={model.id}
                  value={`${model.name} ${model.providerId}`}
                  onSelect={() => {
                    setSelectedModel(model)
                    setCookie(MODEL_SELECTION_COOKIE, serializeModelSelectionCookie({ providerId: model.providerId, modelId: model.id }))
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Check className={cn('size-4', selectedModel.id === model.id ? 'opacity-100' : 'opacity-0')} />
                  <ProviderLogo providerId={model.providerId} />
                  <span>{model.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function DataModelSelector({ data, className }: { data: ModelSelectorData; className?: string }) {
  const [open, setOpen] = useState(false)
  const [selectedModelKey, setSelectedModelKey] = useState<string>(
    data.selectedModelKey
  )

  const providerEntries = useMemo(
    () =>
      Object.entries(data.modelsByProvider).sort(([providerA], [providerB]) =>
        providerA.localeCompare(providerB)
      ),
    [data.modelsByProvider]
  )

  const selectableModels = useMemo(
    () => providerEntries.flatMap(([, models]) => models),
    [providerEntries]
  )

  const selectableByKey = useMemo(
    () =>
      Object.fromEntries(
        selectableModels.map(model => [modelKey(model), model])
      ) as Record<string, Model>,
    [selectableModels]
  )

  const selectedModel = selectableByKey[selectedModelKey]

  if (!data.hasAvailableModels) {
    return (
      <Button
        variant="outline"
        className="h-auto gap-1 rounded-full border-none bg-muted px-3 py-2 text-sm shadow-none transition-[background-color,color,box-shadow,transform]"
        disabled
        title="No enabled models are available"
      >
        <span className="truncate max-w-52 text-xs font-medium">
          No enabled model available
        </span>
      </Button>
    )
  }

  if (!selectedModel) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('h-auto gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm transition-[background-color,color,box-shadow,transform] hover:bg-muted', className)}
        >
          <ProviderLogo providerId={selectedModel.providerId} />
          <span className="truncate max-w-52 text-sm font-semibold">
            {selectedModel.name}
          </span>
          <ChevronDown
            className={cn(
              'ml-0.5 h-3 w-3 opacity-50 transition-transform duration-[160ms] ease-[var(--motion-ease-out)]',
              open && 'rotate-180'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="end" sideOffset={6}>
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            {providerEntries.map(([provider, models]) => (
              <CommandGroup key={provider} heading={provider}>
                {models.map(model => {
                  const value = modelKey(model)
                  const isSelected = selectedModelKey === value
                  return (
                    <CommandItem
                      key={value}
                      value={`${value} ${model.name} ${provider}`}
                      onSelect={() => {
                        const nextModel = selectableByKey[value]
                        if (!nextModel) {
                          return
                        }

                        setSelectedModelKey(value)
                        setCookie(
                          MODEL_SELECTION_COOKIE,
                          serializeModelSelectionCookie({
                            providerId: nextModel.providerId,
                            modelId: nextModel.id
                          })
                        )
                        setOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <ProviderLogo providerId={model.providerId} />
                      <span className="truncate">{model.name}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ModelSelectorClient({ data, className }: ModelSelectorClientProps) {
  if (!data || !data.enabled) {
    return <FallbackModelSelector className={className} />
  }

  return <DataModelSelector data={data} className={className} />
}

