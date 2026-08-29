import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Send, Bot, User } from 'lucide-react'
import { api } from '../lib/api.js'

const LANG_CONFIG = {
  en: {
    label: 'English',
    placeholder: 'Ask about your farm...',
    suggested: [
      'Can I continue growing my current crop?',
      'Why is my farm at high risk?',
      'What should I do first?',
      'Which crop is suitable for current conditions?',
    ],
    suggestedLabel: 'Suggested questions:',
    welcome: (farmName) => `Hello! I'm **Salinity Shield AI**, your agricultural advisor for ${farmName || 'your farm'}.\n\nAsk me anything about your farm's salinity conditions, crop choices, irrigation, or land management.`,
  },
  hi: {
    label: 'हिंदी',
    placeholder: 'अपने खेत के बारे में पूछें...',
    suggested: [
      'क्या मैं अपनी मौजूदा फसल उगाना जारी रख सकता हूँ?',
      'मेरा खेत उच्च जोखिम में क्यों है?',
      'मुझे पहले क्या करना चाहिए?',
      'मौजूदा हालात में कौन सी फसल उपयुक्त है?',
    ],
    suggestedLabel: 'सुझाए गए प्रश्न:',
    welcome: (farmName) => `नमस्ते! मैं **Salinity Shield AI** हूँ, ${farmName || 'आपके खेत'} के लिए आपका कृषि सलाहकार।\n\nखेत की लवणता, फसल चयन, सिंचाई या भूमि प्रबंधन के बारे में कुछ भी पूछें।`,
  },
  gu: {
    label: 'ગુજરાતી',
    placeholder: 'તમારા ખેતર વિશે પૂછો...',
    suggested: [
      'શું હું મારો હાલનો પાક ઉગાડવાનું ચાલુ રાખી શકું?',
      'મારું ખેતર ઉચ્ચ જોખમમાં કેમ છે?',
      'મારે પ્રથમ શું કરવું જોઈએ?',
      'હાલની પરિસ્થિતિ માટે કયો પાક યોગ્ય છે?',
    ],
    suggestedLabel: 'સૂચવેલ પ્રશ્નો:',
    welcome: (farmName) => `નમસ્તે! હું **Salinity Shield AI** છું, ${farmName || 'તમારા ખેતર'} માટે તમારો કૃષિ સલાહકાર.\n\nખેતરની ક્ષારતા, પાક પસંદગી, સિંચાઈ અથવા જમીન વ્યવસ્થાપન વિશે ગમે તે પૂછો।`,
  },
}

function makeWelcomeMessage(lang, farmName) {
  const cfg = LANG_CONFIG[lang] || LANG_CONFIG.en
  return { role: 'assistant', content: cfg.welcome(farmName), isDemo: false }
}

export function AIChatAdvisor({ farmId, farmName }) {
  const [language, setLanguage] = useState('en')
  const [messages, setMessages] = useState(() => [makeWelcomeMessage('en', farmName)])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  const lang = LANG_CONFIG[language] || LANG_CONFIG.en

  // When language changes, update the welcome message (first message only)
  useEffect(() => {
    setMessages(prev => [makeWelcomeMessage(language, farmName), ...prev.slice(1)])
  }, [language, farmName])

  const mutation = useMutation({
    mutationFn: (data) => api.chat.ask(data),
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        isDemo: data.isDemo,
      }])
    },
    onError: (err) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}`,
        isDemo: false,
        error: true,
      }])
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (text) => {
    const q = text || input.trim()
    if (!q || !farmId) return
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setInput('')
    mutation.mutate({ farmId, question: q, language })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Language selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <Bot size={16} style={{ color: 'var(--accent-seafoam)' }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Advisory Language:</span>
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
          {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              style={{
                padding: '0.25rem 0.625rem',
                borderRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 500,
                border: '1px solid transparent',
                cursor: 'pointer',
                transition: 'colors 0.15s',
                background: language === code ? 'var(--accent-seafoam)' : 'var(--bg-elevated)',
                color: language === code ? '#fff' : 'var(--text-muted)',
                borderColor: language === code ? 'var(--accent-seafoam)' : 'var(--border)',
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-elevated)',
            }}>
              {msg.role === 'user'
                ? <User size={14} style={{ color: '#ffffff' }} />
                : <Bot size={14} style={{ color: 'var(--accent-seafoam)' }} />}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div style={{
                borderRadius: 16,
                padding: '0.625rem 1rem',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                ...(msg.role === 'user'
                  ? { background: 'var(--accent-blue)', color: '#ffffff', borderTopRightRadius: 4 }
                  : msg.error
                  ? { background: 'rgba(228,87,86,0.1)', color: 'var(--risk-high)', border: '1px solid rgba(228,87,86,0.3)', borderTopLeftRadius: 4 }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderTopLeftRadius: 4 }),
              }}>
                {msg.content.split('\n').map((line, j) => (
                  <span key={j}>
                    {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                    {j < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
              {msg.isDemo && (
                <span style={{ fontSize: '0.75rem', color: 'var(--risk-medium)', opacity: 0.7, paddingLeft: 4 }}>⚠ Demo mode — configure IBM credentials for real AI</span>
              )}
            </div>
          </div>
        ))}

        {mutation.isPending && (
          <div className="flex gap-3">
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} style={{ color: 'var(--accent-seafoam)' }} />
            </div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 16, borderTopLeftRadius: 4, padding: '0.75rem 1rem' }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions — shown in the selected language */}
      {messages.length <= 2 && (
        <div style={{ padding: '0 1rem 0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{lang.suggestedLabel}</p>
          <div className="flex flex-wrap gap-2">
            {lang.suggested.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                style={{
                  fontSize: '0.75rem',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem' }}>
        <input
          style={{
            flex: 1,
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            borderRadius: 12,
            padding: '0.625rem 1rem',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          placeholder={lang.placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={mutation.isPending || !farmId}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || mutation.isPending || !farmId}
          style={{
            background: 'var(--accent-blue)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 12,
            padding: '0.625rem 0.75rem',
            cursor: 'pointer',
            opacity: (!input.trim() || mutation.isPending || !farmId) ? 0.4 : 1,
            transition: 'opacity 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
