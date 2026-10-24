import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch, apiUrl } from './api'

const SCENARIOS = [
  { id: 'restaurant', icon: '🍽️', title: 'conversation_scenario_restaurant', description: 'conversation_scenario_restaurant_desc', starter: 'Hi, could I see the menu, please?' },
  { id: 'interview', icon: '💼', title: 'conversation_scenario_interview', description: 'conversation_scenario_interview_desc', starter: 'Thank you for meeting with me. Could you tell me about the role?' },
  { id: 'travel', icon: '✈️', title: 'conversation_scenario_travel', description: 'conversation_scenario_travel_desc', starter: 'Excuse me, could you help me find the train station?' },
  { id: 'daily', icon: '☕', title: 'conversation_scenario_daily', description: 'conversation_scenario_daily_desc', starter: 'Hi! How is your day going?' },
]
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

export default function ConversationLab({ darkMode }) {
  const { t } = useTranslation()
  const [level, setLevel] = useState('A2')
  const [scenario, setScenario] = useState('daily')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const panel = darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
  const muted = darkMode ? 'text-gray-300' : 'text-gray-600'

  async function sendTurn(text, history = messages) {
    const content = text.trim()
    if (!content || loading) return
    const nextMessages = [...history, { role: 'user', content }]
    setMessages(nextMessages)
    setDraft('')
    setFeedback(null)
    setError('')
    setLoading(true)
    try {
      const response = await apiFetch(apiUrl('/api/conversation/turn/'), {
        method: 'POST',
        body: JSON.stringify({ level, scenario, messages: nextMessages.slice(-12) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || t('conversation_error'))
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
      setFeedback({
        correctedText: data.corrected_text || '',
        explanation: data.feedback || '',
        phrases: Array.isArray(data.useful_phrases) ? data.useful_phrases : [],
      })
    } catch (err) {
      setMessages(history)
      setDraft(content)
      setError(err.message || t('conversation_error'))
    } finally {
      setLoading(false)
    }
  }

  function startSession() {
    setMessages([])
    setFeedback(null)
    setError('')
    const selected = SCENARIOS.find((item) => item.id === scenario)
    sendTurn(selected.starter, [])
  }

  function resetSession() {
    setMessages([])
    setFeedback(null)
    setDraft('')
    setError('')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className={`rounded-3xl border p-6 shadow-sm sm:p-8 ${panel}`}>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-500">{t('conversation_eyebrow')}</p>
            <h2 className={`text-2xl font-black sm:text-3xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('conversation_title')}</h2>
            <p className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}>{t('conversation_description')}</p>
          </div>
          {messages.length > 0 && <button type="button" onClick={resetSession} className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700">{t('conversation_new_session')}</button>}
        </div>

        <div className="mb-6">
          <h3 className={`mb-3 text-sm font-extrabold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t('conversation_choose_level')}</h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('conversation_choose_level')}>
            {LEVELS.map((item) => <button key={item} type="button" onClick={() => setLevel(item)} disabled={messages.length > 0 || loading} aria-pressed={level === item} className={`rounded-xl border px-4 py-2 text-sm font-black transition ${level === item ? 'border-indigo-600 bg-indigo-600 text-white' : darkMode ? 'border-gray-600 text-gray-300 hover:border-indigo-400' : 'border-gray-200 text-gray-600 hover:border-indigo-400'} disabled:cursor-not-allowed disabled:opacity-50`}>{item}</button>)}
          </div>
        </div>

        <div>
          <h3 className={`mb-3 text-sm font-extrabold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t('conversation_choose_scenario')}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SCENARIOS.map((item) => <button key={item.id} type="button" onClick={() => setScenario(item.id)} disabled={messages.length > 0 || loading} aria-pressed={scenario === item.id} className={`rounded-2xl border p-4 text-left transition ${scenario === item.id ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500' : darkMode ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-indigo-200'} disabled:cursor-not-allowed disabled:opacity-60`}>
              <span className="text-2xl" aria-hidden="true">{item.icon}</span>
              <span className={`mt-2 block font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(item.title)}</span>
              <span className={`mt-1 block text-sm leading-5 ${muted}`}>{t(item.description)}</span>
            </button>)}
          </div>
        </div>
        {messages.length === 0 && <button type="button" onClick={startSession} disabled={loading} className="mt-6 w-full rounded-2xl bg-indigo-600 px-5 py-3.5 font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60 sm:w-auto">{t('conversation_start')}</button>}
      </section>

      {messages.length > 0 && <section className={`overflow-hidden rounded-3xl border shadow-sm ${panel}`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700 sm:px-7">
          <div><h3 className={`font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('conversation_live_title')}</h3><p className={`mt-1 text-xs ${muted}`}>{t('conversation_level_scenario', { level, scenario: t(SCENARIOS.find((item) => item.id === scenario)?.title || 'conversation_scenario_daily') })}</p></div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">{t('conversation_practice_badge')}</span>
        </div>
        <div className="max-h-[440px] space-y-4 overflow-y-auto p-5 sm:p-7" aria-live="polite">
          {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[78%] ${message.role === 'user' ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
              <p className="mb-1 text-[11px] font-black uppercase tracking-wide opacity-70">{message.role === 'user' ? t('conversation_you') : t('conversation_character')}</p>
              <p dir="ltr" className="text-sm leading-6">{message.content}</p>
            </div>
          </div>)}
          {loading && <p className={`animate-pulse text-sm font-semibold ${muted}`}>{t('conversation_thinking')}</p>}
        </div>
        {error && <p role="alert" className="mx-5 mb-4 rounded-xl bg-red-500/10 p-3 text-sm font-semibold text-red-500 sm:mx-7">{error}</p>}
        <form onSubmit={(event) => { event.preventDefault(); sendTurn(draft) }} className="flex flex-col gap-3 border-t border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:p-5">
          <label className="sr-only" htmlFor="conversation-reply">{t('conversation_input_label')}</label>
          <input id="conversation-reply" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1200} placeholder={t('conversation_input_placeholder')} disabled={loading} className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${darkMode ? 'border-gray-600 bg-gray-900 text-white placeholder:text-gray-500' : 'border-gray-200 bg-white text-gray-900'}`} />
          <button type="submit" disabled={loading || !draft.trim()} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{t('conversation_send')}</button>
        </form>
      </section>}

      {feedback && <section className={`grid grid-cols-1 gap-4 lg:grid-cols-2`}>
        {(feedback.correctedText || feedback.explanation) && <article className={`rounded-2xl border p-5 ${panel}`}>
          <h3 className={`mb-3 font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>✍️ {t('conversation_correction_title')}</h3>
          {feedback.correctedText && <p dir="ltr" className="rounded-xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{feedback.correctedText}</p>}
          {feedback.explanation && <p className={`mt-3 text-sm leading-6 ${muted}`}>{feedback.explanation}</p>}
        </article>}
        {feedback.phrases.length > 0 && <article className={`rounded-2xl border p-5 ${panel}`}>
          <h3 className={`mb-3 font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>💡 {t('conversation_phrases_title')}</h3>
          <ul className="space-y-3">{feedback.phrases.map((item, index) => <li key={`${item.phrase}-${index}`} className={`rounded-xl p-3 ${darkMode ? 'bg-gray-900/70' : 'bg-gray-50'}`}>
            <p dir="ltr" className="font-bold text-indigo-500">{item.phrase}</p><p className={`mt-1 text-sm ${muted}`}>{item.meaning}</p>
          </li>)}</ul>
        </article>}
      </section>}
    </div>
  )
}
