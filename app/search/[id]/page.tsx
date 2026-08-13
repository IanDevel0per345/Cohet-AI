import { redirect } from 'next/navigation'

import { UIMessage } from 'ai'

import { loadChat } from '@/lib/actions/chat'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { getModelSelectorData } from '@/lib/model-selector/get-model-selector-data'

import { Chat } from '@/components/chat'

export const maxDuration = 60

async function safelyLoadChat(id: string, userId?: string) {
  if (!id || id.length < 10) return null

  try {
    return await loadChat(id, userId)
  } catch (error) {
    console.error('[SearchPage] Failed to load chat:', error)
    return null
  }
}

async function safelyGetCurrentUserId() {
  try {
    return await getCurrentUserId()
  } catch (error) {
    console.error('[SearchPage] Failed to load session:', error)
    return undefined
  }
}

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const userId = await safelyGetCurrentUserId()

  const chat = await safelyLoadChat(id, userId)

  if (!chat) {
    return { title: 'Search' }
  }

  return {
    title: chat.title.toString().slice(0, 50) || 'Search'
  }
}

export default async function SearchPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const userId = await safelyGetCurrentUserId()

  const chat = await safelyLoadChat(id, userId)

  if (!chat) {
    redirect('/')
  }

  if (chat.visibility === 'private' && !userId) {
    redirect('/auth/login')
  }

  const messages: UIMessage[] = chat.messages
  const isCloudDeployment = process.env.COHET_CLOUD_DEPLOYMENT === 'true'
  const libraryAvailable = process.env.ENABLE_AUTH !== 'false'
  const modelSelectorData = await getModelSelectorData()

  return (
    <Chat
      id={id}
      savedMessages={messages}
      isGuest={!userId}
      isCloudDeployment={isCloudDeployment}
      libraryAvailable={libraryAvailable}
      modelSelectorData={modelSelectorData}
    />
  )
}
