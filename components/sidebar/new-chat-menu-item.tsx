'use client'

import Link from 'next/link'

import { IconScoutIcon } from '@/components/ui/iconscout-icon'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

export function NewChatMenuItem() {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href="/" className="flex items-center gap-2">
          <IconScoutIcon name="add" className="size-4" />
          <span>New</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
