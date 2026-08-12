'use client'

import Link from 'next/link'

import type { User } from '@supabase/supabase-js'
import { ChevronsUpDown,ExternalLink } from 'lucide-react'

import {
  InfoCard,
  InfoCardAction,
  InfoCardContent,
  InfoCardDescription,
  InfoCardDismiss,
  InfoCardFooter,
  InfoCardMedia,
  InfoCardTitle} from '@/components/ui/info-card'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem} from '@/components/ui/sidebar'

import UserMenu from '@/components/user-menu'

/**
 * Sidebar footer implementing the prompt's InfoCard demo: an animated
 * promotional card (title, description, hover-expanded media stack,
 * dismiss/action footer) followed by the signed-in user's identity row.
 */
export default function SidebarFooterCard({ user }: { user: User }) {
  const userName =
    user.user_metadata?.full_name || user.user_metadata?.name || 'User'
  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture

  return (
    <div className="flex flex-col gap-2">
      <InfoCard
        storageKey="cohet-sidebar-promo-card"
        dismissType="once"
        className="dark:!bg-sidebar dark:text-sidebar-foreground"
      >
        <InfoCardContent>
          <InfoCardTitle>Introducing New Dashboard</InfoCardTitle>
          <InfoCardDescription>
            New Feature. New Platform. Same Feel.
          </InfoCardDescription>
          <InfoCardMedia
            media={[
              {
                src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop',
                alt: 'Dashboard preview 1'
              },
              {
                src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop',
                alt: 'Dashboard preview 2'
              },
              {
                src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop',
                alt: 'Dashboard preview 3'
              }
            ]}
          />
          <InfoCardFooter>
            <InfoCardDismiss>Dismiss</InfoCardDismiss>
            <InfoCardAction>
              <Link
                href="/"
                className="flex flex-row items-center gap-1 underline"
              >
                Try it out <ExternalLink size={12} />
              </Link>
            </InfoCardAction>
          </InfoCardFooter>
        </InfoCardContent>
      </InfoCard>
      <SidebarGroup className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-full justify-between gap-3 h-12"
              asChild
            >
              <div>
                <UserMenu
                  user={user}
                  compact
                  name={userName}
                  avatarUrl={avatarUrl}
                />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </div>
  )
}
