import { Suspense } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

import { IconLogo } from '@/components/ui/icons'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'

import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'
import { NewChatMenuItem } from './sidebar/new-chat-menu-item'
import SidebarFooterCard from './sidebar/sidebar-footer-card'

/**
 * Main application sidebar, fully redesigned per the prompt's demo:
 * - header with the Cohet AI brand (logo + name) and the sidebar trigger
 * - "Search" group with the new-chat button
 * - scrollable chat history
 * - footer with the animated InfoCard promo card and the user identity row
 */
export default function AppSidebar() {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="flex flex-row justify-between items-center">
        <Link href="/" className="flex items-center gap-2 px-2 py-3">
          <IconLogo className={cn('size-5')} />
          <span className="font-semibold text-sm">Cohet AI</span>
        </Link>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="flex flex-col px-2 py-4 h-full">
        <SidebarGroup>
          <SidebarGroupLabel>Search</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NewChatMenuItem />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistorySection />
          </Suspense>
        </div>
      </SidebarContent>
      <SidebarFooter className="px-2 pb-4">
        <Suspense fallback={null}>
          <SidebarFooterCardWrapper />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

/**
 * Client wrapper that fetches the signed-in user from the Supabase client
 * session so the footer can render the InfoCard + user row.
 */
async function SidebarFooterCardWrapper() {
  let user = null

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const {
      data: { user: supabaseUser }
    } = await supabase.auth.getUser()
    user = supabaseUser
  } catch {
    // Render the footer without user data if the session cannot be read.
    return null
  }

  return user ? <SidebarFooterCard user={user} /> : null
}
