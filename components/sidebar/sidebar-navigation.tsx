'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { captureClient } from '@/lib/analytics/posthog-client'

import { IconScoutIcon } from '@/components/ui/iconscout-icon'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

import { useLibrary } from '@/components/library/library-context'

import { NewChatMenuItem } from './new-chat-menu-item'

const navigationItems = [
  { href: '/search', label: 'Search', icon: 'search' as const },
  { href: '/calendar', label: 'Calendar', icon: 'calendar' as const }
]

export function SidebarNavigation() {
  const pathname = usePathname()
  const { openLibrary } = useLibrary()

  return (
    <SidebarMenu>
      <NewChatMenuItem />
      {navigationItems.map(item => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link href={item.href} className="flex items-center gap-2">
                <IconScoutIcon name={item.icon} className="size-4" />
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
          <IconScoutIcon name="library" className="size-4" />
          <span>Library</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
