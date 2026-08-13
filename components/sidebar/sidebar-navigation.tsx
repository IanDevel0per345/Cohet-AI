'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  IconCalendar,
  IconLibrary,
  IconSearch
} from '@tabler/icons-react'

import { captureClient } from '@/lib/analytics/posthog-client'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

import { useLibrary } from '@/components/library/library-context'

import { NewChatMenuItem } from './new-chat-menu-item'

const navigationItems = [
  { href: '/search', label: 'Search', icon: IconSearch },
  { href: '/calendar', label: 'Calendar', icon: IconCalendar }
]

export function SidebarNavigation() {
  const pathname = usePathname()
  const { openLibrary } = useLibrary()

  return (
    <SidebarMenu>
      <NewChatMenuItem />
      {navigationItems.map(item => {
        const Icon = item.icon
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link href={item.href} className="flex items-center gap-2">
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          tooltip="Library"
          onClick={() => {
            openLibrary()
            captureClient('library_opened', { source: 'sidebar' })
          }}
        >
          <IconLibrary className="size-4" />
          <span>Library</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
