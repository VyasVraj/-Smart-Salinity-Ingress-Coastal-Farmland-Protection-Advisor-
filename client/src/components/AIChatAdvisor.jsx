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
      <div className="flex items-center gap-2 p-3 border-b border-gray-800">
        <Bot size={16} className="text-blue-400" />
        <span className="text-sm text-gray-400">Advisory Language:</span>
        <div className="flex gap-1 ml-auto">
          {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                language === code ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
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
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-blue-400" />}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : msg.error
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 rounded-tl-none'
                  : 'bg-gray-800 text-gray-300 rounded-tl-none'
              }`}>
                {msg.content.split('\n').map((line, j) => (
                  <span key={j}>
                    {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                    {j < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
              {msg.isDemo && (
                <span className="text-xs text-yellow-500/70 px-1">⚠ Demo mode — configure IBM credentials for real AI</span>
              )}
            </div>
          </div>
        ))}

        {mutation.isPending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
              <Bot size={14} className="text-blue-400" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
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
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-600 mb-2">{lang.suggestedLabel}</p>
          <div className="flex flex-wrap gap-2">
            {lang.suggested.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-300 px-3 py-1.5 rounded-full border border-gray-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-800 flex gap-3">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          placeholder={lang.placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={mutation.isPending || !farmId}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || mutation.isPending || !farmId}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
