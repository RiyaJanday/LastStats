import { getSession } from './auth'

const STORAGE_PREFIX = 'laststats_ai_conversations_'

export const welcomeMessage = {
  role: 'assistant',
  content: 'Hello! I am LastStats AI. Ask me anything — SIPs, mutual funds, taxes, and portfolio strategy are my specialty, but I can also help with general questions, writing, coding, explanations, and everyday advice.',
  time: new Date().toLocaleTimeString(),
}

function storageKey() {
  const session = getSession()
  const userKey = session?.id || session?.email || 'guest'
  return `${STORAGE_PREFIX}${userKey}`
}

export function getConversations() {
  try {
    const raw = localStorage.getItem(storageKey())
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : []
  } catch {
    return []
  }
}

function persist(conversations) {
  localStorage.setItem(storageKey(), JSON.stringify(conversations))
}

export function createConversation() {
  const conversation = {
    id: crypto.randomUUID(),
    title: 'New chat',
    messages: [welcomeMessage],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const conversations = [conversation, ...getConversations()]
  persist(conversations)
  return conversation
}

export function saveConversation(id, messages) {
  const conversations = getConversations()
  const index = conversations.findIndex((item) => item.id === id)
  if (index === -1) return

  const existing = conversations[index]
  const firstUserMessage = messages.find((message) => message.role === 'user')
  const title = firstUserMessage
    ? firstUserMessage.content.trim().slice(0, 42) + (firstUserMessage.content.trim().length > 42 ? '...' : '')
    : existing.title

  conversations[index] = { ...existing, messages, title, updatedAt: Date.now() }
  persist(conversations)
}

export function deleteConversation(id) {
  const conversations = getConversations().filter((item) => item.id !== id)
  persist(conversations)
  return conversations
}

export function renderRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp
  const diffMins = Math.round(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(timestamp).toLocaleDateString()
}
