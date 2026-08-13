'use client'

import { useEffect, useMemo, useState } from 'react'

import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const storageKey = 'cohet-calendar-events'

type CalendarEvents = Record<string, string[]>

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfCalendarGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  return new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay())
}

export default function CalendarPage() {
  const today = new Date()
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selectedDate, setSelectedDate] = useState(dateKey(today))
  const [events, setEvents] = useState<CalendarEvents>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const saved = window.localStorage.getItem(storageKey)
      return saved ? (JSON.parse(saved) as CalendarEvents) : {}
    } catch {
      return {}
    }
  })
  const [eventText, setEventText] = useState('')

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(events))
  }, [events])

  const days = useMemo(() => {
    const start = startOfCalendarGrid(month)
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [month])

  const selectedEvents = events[selectedDate] ?? []
  const monthLabel = month.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  function changeMonth(offset: number) {
    setMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  function addEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = eventText.trim()
    if (!value) return
    setEvents(current => ({
      ...current,
      [selectedDate]: [...(current[selectedDate] ?? []), value]
    }))
    setEventText('')
  }

  return (
    <main className="min-h-full overflow-y-auto bg-background px-4 py-20 md:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize reminders and important dates alongside your research.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
              setSelectedDate(dateKey(today))
            }}
          >
            Today
          </Button>
        </div>

        <section className="rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-medium">{monthLabel}</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} aria-label="Previous month">
                <IconChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} aria-label="Next month">
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-border/60 pb-2 text-center text-xs font-medium text-muted-foreground">
            {weekdayLabels.map(label => <span key={label}>{label}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {days.map(day => {
              const key = dateKey(day)
              const inMonth = day.getMonth() === month.getMonth()
              const selected = key === selectedDate
              const hasEvents = (events[key] ?? []).length > 0
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={`relative min-h-16 rounded-xl p-2 text-left text-sm transition-colors hover:bg-muted ${
                    inMonth ? 'text-foreground' : 'text-muted-foreground/40'
                  } ${selected ? 'bg-[#0F4032] text-white hover:bg-[#0F4032]' : ''}`}
                >
                  <span>{day.getDate()}</span>
                  {hasEvents && <span className={`absolute bottom-2 left-2 size-1.5 rounded-full ${selected ? 'bg-white' : 'bg-[#0F4032]'}`} />}
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card/60 p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-medium">Events</h2>
              <p className="text-sm text-muted-foreground">{selectedDate}</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          <div className="space-y-2">
            {selectedEvents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No events for this day yet.
              </p>
            ) : selectedEvents.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-xl bg-muted/60 px-4 py-3 text-sm">
                {item}
              </div>
            ))}
          </div>
          <form onSubmit={addEvent} className="mt-4 flex gap-2">
            <Input value={eventText} onChange={event => setEventText(event.target.value)} placeholder="Add an event..." aria-label="Event name" />
            <Button type="submit" size="icon" aria-label="Add event" disabled={!eventText.trim()}>
              <IconPlus className="size-4" />
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
