import { useEffect, useRef, useState } from 'react'
import { Bot, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Send, Trash2, User, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Sidebar from '../components/Sidebar'
import { marketApi } from '../lib/api'
import {
  createConversation,
  deleteConversation,
  getConversations,
  renderRelativeTime,
  saveConversation,
  welcomeMessage,
} from '../lib/aiHistory'

const systemPrompt = 'You are LastStats AI, a helpful, knowledgeable assistant. You can answer any question the user asks — general knowledge, coding, writing, explanations, everyday advice, and so on — not just investing topics. You have particular expertise in personal finance and investing for Indian investors: use simple language and practical numbers there. Only add the line "Educational only. Consult a SEBI-registered advisor." when you actually give specific investment, tax, or financial advice — never after answers to unrelated questions.'

const MARKET_KEYWORDS = /market|nifty|sensex|nasdaq|s&p|index|indices|stock|share|quote|price of|trading at/i
const NON_TICKER_WORDS = new Set(['SIP', 'ELSS', 'PPF', 'LTCG', 'XIRR', 'CAGR', 'AI', 'NIFTY', 'SENSEX', 'NASDAQ'])

async function fetchMarketContext(userText) {
  try {
    const { data } = await marketApi.get('/api/market/indices')
    const indices = data.data || data || []
    if (!Array.isArray(indices) || indices.length === 0) return null

    const lines = indices.map((index) => {
      const value = Number(index.value ?? index.lastPrice ?? 0).toFixed(2)
      const change = Number(index.changePercent ?? index.percentChange ?? 0)
      const sign = change >= 0 ? '+' : ''
      return `${index.name || index.symbol}: ${value} (${sign}${change.toFixed(2)}%)`
    })

    const tickerMatch = userText.match(/\b[A-Z]{2,10}\b/g)?.find((word) => !NON_TICKER_WORDS.has(word))
    if (tickerMatch) {
      try {
        const search = await marketApi.get(`/api/market/search?q=${encodeURIComponent(tickerMatch)}`)
        const results = search.data.data || search.data || []
        results.slice(0, 3).forEach((stock) => {
          lines.push(`${stock.symbol} (${stock.name}): Rs ${Number(stock.price || stock.lastPrice || 0).toFixed(2)}, change ${Number(stock.changePercent || 0).toFixed(2)}%`)
        })
      } catch {
        // stock search unavailable — indices context is still useful on its own
      }
    }

    return `Live market data from LastStats' own market-data-service, fetched at ${new Date().toLocaleTimeString()}:\n${lines.join('\n')}\n\nUse these real figures directly to answer the user's question. Do not say you lack access to live market data — you have it above.`
  } catch {
    return null
  }
}

const quickQuestions = [
  'Best SIP strategy for Rs 10,000/month?',
  'ELSS vs PPF: which is better for tax saving?',
  "Today's Nifty and Sensex levels",
  'Explain a concept to me simply',
  'Help me write or debug something',
  'What is expense ratio and why does it matter?',
]

export default function AiPage() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [historyOpen, setHistoryOpen] = useState(() => (typeof window === 'undefined' || window.innerWidth > 900))
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    let existing = getConversations()
    if (existing.length === 0) {
      existing = [createConversation()]
    }
    setConversations(existing)
    setActiveId(existing[0].id)
    setMessages(existing[0].messages)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectConversation = (id) => {
    if (id === activeId || isLoading) return
    const conversation = conversations.find((item) => item.id === id)
    if (!conversation) return
    setActiveId(id)
    setMessages(conversation.messages)
  }

  const newChat = () => {
    if (isLoading) return
    const created = createConversation()
    setConversations((prev) => [created, ...prev])
    setActiveId(created.id)
    setMessages(created.messages)
  }

  const deleteChat = (id, event) => {
    event.stopPropagation()
    const remaining = deleteConversation(id)
    if (id !== activeId) {
      setConversations(remaining)
      return
    }

    if (remaining.length > 0) {
      setConversations(remaining)
      setActiveId(remaining[0].id)
      setMessages(remaining[0].messages)
    } else {
      const created = createConversation()
      setConversations([created])
      setActiveId(created.id)
      setMessages(created.messages)
    }
  }

  const clearActiveChat = () => {
    const reset = [welcomeMessage]
    setMessages(reset)
    if (activeId) {
      saveConversation(activeId, reset)
      setConversations(getConversations())
    }
  }

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading || !activeId) return

    const userMessage = { role: 'user', content: text.trim(), time: new Date().toLocaleTimeString() }
    const historyBeforeReply = [...messages, userMessage]
    setMessages([...historyBeforeReply, { role: 'assistant', content: '', loading: true }])
    saveConversation(activeId, historyBeforeReply)
    setConversations(getConversations())
    setInputText('')
    setIsLoading(true)

    let assistantMessage
    let marketContext = null

    if (MARKET_KEYWORDS.test(userMessage.content)) {
      marketContext = await fetchMarketContext(userMessage.content)
    }

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey || apiKey === 'your_groq_key_here') {
        throw new Error('Add VITE_GROQ_API_KEY to the .env file to enable AI chat.')
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemPrompt },
            ...(marketContext ? [{ role: 'system', content: marketContext }] : []),
            ...historyBeforeReply.map((message) => ({ role: message.role, content: message.content })),
          ],
          max_tokens: 1024,
          temperature: 0.7,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error?.message || `Groq API error (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const payload = trimmed.slice(5).trim()
          if (payload === '[DONE]') continue

          try {
            const parsed = JSON.parse(payload)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullText += delta
              setMessages([...historyBeforeReply, { role: 'assistant', content: fullText, streaming: true }])
            }
          } catch {
            // ignore partial/malformed SSE chunks
          }
        }
      }

      assistantMessage = { role: 'assistant', content: fullText || 'No response received.', time: new Date().toLocaleTimeString() }
    } catch (error) {
      assistantMessage = { role: 'assistant', content: `Error: ${error.message}`, time: new Date().toLocaleTimeString() }
    } finally {
      setIsLoading(false)
    }

    const finalHistory = [...historyBeforeReply, assistantMessage]
    setMessages(finalHistory)
    saveConversation(activeId, finalHistory)
    setConversations(getConversations())
  }

  return (
    <div className="page-wrapper">
      <Sidebar />

      {historyOpen && <div className="sidebar-backdrop ai-history-backdrop" onClick={() => setHistoryOpen(false)} />}

      {historyOpen && (
        <div className="ai-history-panel">
          <div style={{ padding: 14, flexShrink: 0 }}>
            <button onClick={newChat} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={15} /> New Chat
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {conversations.length === 0 && (
              <div className="empty-state" style={{ minHeight: 120 }}>
                <MessageSquare size={20} />
                <p style={{ fontSize: 12 }}>No conversations yet</p>
              </div>
            )}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => { selectConversation(conversation.id); if (window.innerWidth <= 900) setHistoryOpen(false) }}
                title={conversation.title}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  background: conversation.id === activeId ? 'var(--lp-surface-strong)' : 'transparent',
                  color: 'var(--lp-text)',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ overflow: 'hidden', minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: conversation.id === activeId ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conversation.title}
                  </span>
                  <span style={{ display: 'block', fontSize: 10, color: 'var(--lp-text-muted)', marginTop: 2 }}>
                    {renderRelativeTime(conversation.updatedAt)}
                  </span>
                </span>
                <Trash2
                  size={13}
                  onClick={(event) => deleteChat(conversation.id, event)}
                  style={{ flexShrink: 0, opacity: 0.5, color: 'var(--lp-text-muted)' }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--lp-bg)' }}>
        <div className="top-bar" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setHistoryOpen((prev) => !prev)}
              className="btn-ghost"
              style={{ padding: 8 }}
              title={historyOpen ? 'Hide history' : 'Show history'}
            >
              {historyOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
            <div style={{ width: 38, height: 38, background: 'var(--lp-accent-soft, var(--lp-surface))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="var(--lp-accent)" />
            </div>
            <div>
              <p className="top-bar-title">AI Assistant</p>
              <p className="top-bar-sub">Finance expert · answers anything · Powered by Groq - GPT-OSS 120B</p>
            </div>
          </div>
          <button onClick={clearActiveChat} className="btn-ghost"><Trash2 size={13} /> Clear</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} style={{ display: 'flex', gap: 10, marginBottom: 18, flexDirection: message.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: message.role === 'user' ? 'var(--lp-accent)' : 'var(--lp-accent-soft, var(--lp-surface))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {message.role === 'user' ? <User size={13} color="#0a0912" /> : <Bot size={13} color="var(--lp-accent)" />}
              </div>
              <div className={message.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
                {message.loading ? (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 20 }}>
                    {[0, 1, 2].map((item) => <div key={item} className="typing-dot" style={{ animationDelay: `${item * 0.2}s` }} />)}
                  </div>
                ) : message.role === 'assistant' ? (
                  <>
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || ' '}</ReactMarkdown>
                    </div>
                    {message.streaming && <span className="stream-caret" />}
                    {message.time && <p style={{ fontSize: 10, opacity: 0.45, marginTop: 8 }}>{message.time}</p>}
                  </>
                ) : (
                  <>
                    {message.content.split('\n').map((line, lineIndex) => <p key={lineIndex} style={{ marginBottom: 4, lineHeight: 1.65 }}>{line}</p>)}
                    {message.time && <p style={{ fontSize: 10, opacity: 0.45, marginTop: 8 }}>{message.time}</p>}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div style={{ padding: '0 24px 12px', display: 'flex', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
            {quickQuestions.map((question) => (
              <button key={question} onClick={() => sendMessage(question)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--lp-border)', background: 'var(--lp-surface)', color: 'var(--lp-text)', fontSize: 12, cursor: 'pointer' }}>
                {question}
              </button>
            ))}
          </div>
        )}

        <div style={{ background: 'var(--lp-bg-2)', borderTop: '1px solid var(--lp-border)', padding: '16px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="input"
              placeholder="Ask anything — SIPs, taxes, coding, writing, general questions..."
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendMessage(inputText)
                }
              }}
              disabled={isLoading}
            />
            <button onClick={() => sendMessage(inputText)} disabled={isLoading || !inputText.trim()} className="btn-primary" style={{ padding: '10px 18px', flexShrink: 0 }}>
              <Send size={15} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', textAlign: 'center', marginTop: 8 }}>Educational only - not financial advice</p>
        </div>
      </main>
    </div>
  )
}
