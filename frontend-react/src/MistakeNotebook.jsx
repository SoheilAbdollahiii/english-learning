import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch, apiUrl } from './api'

const STORAGE_KEY = 'english-learning-saved-writing-mistakes-v2'
const CATEGORY_LABELS = {
  grammar: { en: 'Grammar', fa: 'دستور زبان' },
  word_choice: { en: 'Word choice', fa: 'انتخاب واژه' },
  word_order: { en: 'Word order', fa: 'ترتیب واژه‌ها' },
  punctuation: { en: 'Punctuation', fa: 'نشانه‌گذاری' },
  spelling: { en: 'Spelling', fa: 'املاء' },
  style: { en: 'Style', fa: 'سبک نگارش' },
  other: { en: 'Other', fa: 'سایر' },
  vocabulary: { en: 'My vocabulary', fa: 'واژگان من' },
  reading: { en: 'Reading', fa: 'درک مطلب' },
}

function readSavedIds() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value.map(String) : []
  } catch {
    return []
  }
}

async function readJson(response) {
  try { return await response.json() } catch { return {} }
}

function getMistakes(writing) {
  if (Array.isArray(writing.mistakes)) {
    return writing.mistakes.map((mistake, index) => ({
      ...mistake,
      key: `${writing.id}:mistake:${index}`,
      writing,
      legacy: false,
    }))
  }
  if (writing.original_text && writing.corrected_text) {
    return [{
      key: `${writing.id}:whole-writing`,
      original: writing.original_text,
      correction: writing.corrected_text,
      explanation: writing.feedback || '',
      category: 'other',
      writing,
      legacy: true,
    }]
  }
  return []
}

export default function MistakeNotebook({ darkMode }) {
  const { i18n } = useTranslation()
  const isPersian = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('fa')
  const [writings, setWritings] = useState([])
  const [vocabularyWords, setVocabularyWords] = useState([])
  const [quizMistakes, setQuizMistakes] = useState([])
  const [savedIds, setSavedIds] = useState(readSavedIds)
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [revealed, setRevealed] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const panel = darkMode ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-slate-200 bg-white text-slate-900'
  const muted = darkMode ? 'text-gray-300' : 'text-slate-600'
  const field = darkMode ? 'border-gray-700 bg-gray-900 text-white placeholder:text-gray-500' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'

  const loadWritings = useCallback(async () => {
    setLoading(true)
    setError('')
    const problems = []
    try {
      const [writingResult, vocabularyResult, quizResult] = await Promise.allSettled([
        apiFetch(apiUrl('/writing/api/writings/')),
        apiFetch(apiUrl('/vocabulary/api/my-words/')),
        apiFetch(apiUrl('/quiz/api/mistakes/')),
      ])

      if (writingResult.status === 'fulfilled') {
        const response = writingResult.value
        const data = await readJson(response)
        if (response.ok && Array.isArray(data)) {
          setWritings(data)
        } else {
          problems.push(data.detail || (isPersian ? 'خطاهای نوشتاری بارگذاری نشدند.' : 'Writing mistakes could not be loaded.'))
        }
      } else {
        problems.push(isPersian ? 'ارتباط با بخش نوشته‌ها برقرار نشد.' : 'Could not connect to writing history.')
      }

      if (vocabularyResult.status === 'fulfilled') {
        const response = vocabularyResult.value
        const data = await readJson(response)
        // Support both a plain DRF list and a paginated response.
        const words = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : null
        if (response.ok && words) {
          setVocabularyWords(words)
        } else {
          problems.push(data.detail || (isPersian ? 'واژگان ذخیره‌شده بارگذاری نشدند.' : 'Saved vocabulary could not be loaded.'))
        }
      } else {
        problems.push(isPersian ? 'ارتباط با واژگان من برقرار نشد.' : 'Could not connect to My Vocabulary.')
      }

      if (quizResult.status === 'fulfilled') {
        const response = quizResult.value
        const data = await readJson(response)
        if (response.ok && Array.isArray(data)) setQuizMistakes(data)
        else problems.push(data.detail || (isPersian ? 'خطاهای آزمون بارگذاری نشدند.' : 'Quiz mistakes could not be loaded.'))
      } else {
        problems.push(isPersian ? 'ارتباط با خطاهای آزمون برقرار نشد.' : 'Could not connect to quiz mistakes.')
      }

      setError(problems.join(' '))
      setLastUpdated(new Date())
    } catch (err) {
      setError(err?.message || (isPersian ? 'بارگذاری دفترچه ناموفق بود.' : 'Could not load your notebook.'))
    } finally {
      setLoading(false)
    }
  }, [isPersian])

  useEffect(() => {
    loadWritings()
  }, [loadWritings])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds)) } catch { /* Storage may be unavailable. */ }
  }, [savedIds])

  const vocabularyEntries = useMemo(() => vocabularyWords.map((word) => {
    const forgotten = Number(word.incorrect_count) > 0
    const example = (word.example || '').trim()
    const reviewHistory = isPersian
      ? `تعداد مرور: ${word.review_count || 0}؛ دفعات فراموشی: ${word.incorrect_count || 0}.`
      : `Reviews: ${word.review_count || 0}; forgotten: ${word.incorrect_count || 0}.`
    return {
      key: `vocabulary:${word.id}`,
      original: word.english_word,
      correction: word.translation || (isPersian ? 'هنوز ترجمه‌ای ثبت نشده است.' : 'No translation saved yet.'),
      explanation: [example, reviewHistory].filter(Boolean).join('\n\n'),
      category: 'vocabulary',
      word,
      vocabulary: true,
      forgotten,
      writing: { id: `vocabulary-${word.id}`, original_text: word.english_word, created_at: word.created_at, score: null },
    }
  }), [vocabularyWords, isPersian])

  const quizEntries = useMemo(() => quizMistakes.filter((item) => item && item.question_id).map((item) => {
    const category = ['grammar', 'vocabulary', 'reading'].includes(item.quiz_type) ? item.quiz_type : 'other'
    const correctAnswer = item.correct_answer_text || item.correct_answer || ''
    const chosenAnswer = item.user_answer_text || item.selected_answer_text || item.user_answer || ''
    const explanation = [
      chosenAnswer ? (isPersian ? `پاسخ انتخابی: ${chosenAnswer}` : `Your selected answer: ${chosenAnswer}`) : '',
      item.explanation || '', item.common_mistake || '', item.example_sentence || '', item.example_translation || '',
    ].filter(Boolean).join('\n\n')
    return {
      key: `quiz:${item.session_id || 'session'}:${item.question_id}`,
      original: item.question_text || '',
      correction: correctAnswer,
      explanation,
      category,
      quiz: true,
      writing: { id: `quiz-${item.session_id}-${item.question_id}`, created_at: item.created_at, score: null },
    }
  }), [quizMistakes, isPersian])

  const mistakes = useMemo(() => [
    ...writings.flatMap(getMistakes),
    ...vocabularyEntries,
    ...quizEntries,
  ], [writings, vocabularyEntries, quizEntries])

  const entries = useMemo(() => mistakes
    .filter((item) => filter !== 'saved' || savedIds.includes(item.key))
    .filter((item) => category === 'all' || item.category === category)
    .filter((item) => {
      const haystack = [item.original, item.correction, item.explanation, item.category, item.writing.original_text].join(' ').toLowerCase()
      return haystack.includes(query.trim().toLowerCase())
    }), [mistakes, filter, category, savedIds, query])

  const forgottenCount = vocabularyEntries.filter((item) => item.forgotten).length
  const quizMistakeCount = quizEntries.length
  const savedCount = mistakes.filter((item) => savedIds.includes(item.key)).length
  const toggleSaved = (key) => setSavedIds((current) => current.includes(key)
    ? current.filter((saved) => saved !== key)
    : [key, ...current])
  const toggleReveal = (key) => setRevealed((current) => ({ ...current, [key]: !current[key] }))
  const label = (value) => (CATEGORY_LABELS[value] || CATEGORY_LABELS.other)[isPersian ? 'fa' : 'en']

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className={`relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 ${panel}`}>
        <div className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-extrabold text-indigo-500">
              <span aria-hidden="true">✦</span>{isPersian ? 'مرور هوشمند و شخصی' : 'YOUR PERSONAL REVIEW SPACE'}
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{isPersian ? 'دفترچهٔ خطاهای من' : 'My mistake notebook'}</h2>
            <p className={`mt-3 max-w-xl text-sm leading-7 sm:text-base ${muted}`}>{isPersian
              ? 'پاسخ‌های اشتباه آزمون، اصلاح‌های نوشتاری و واژه‌های فراموش‌شده‌ات اینجا کنار هم جمع می‌شوند. اول خودت جواب را به یاد بیاور؛ بعد پاسخ درست را ببین.'
              : 'Wrong quiz answers, writing corrections, and forgotten vocabulary live together here. Recall the answer first, then reveal the correction and explanation.'}</p>
          </div>
          <button type="button" onClick={loadWritings} disabled={loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50">
            <span aria-hidden="true">↻</span>{isPersian ? 'همگام‌سازی دوباره' : 'Sync notebook'}
          </button>
        </div>
        <div className="relative mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '✎', value: mistakes.length, title: isPersian ? 'مورد برای مرور' : 'Items to review', tone: darkMode ? 'bg-gray-900/70' : 'bg-white/75' },
            { icon: '⚑', value: quizMistakeCount, title: isPersian ? 'پاسخ اشتباه آزمون' : 'Wrong quiz answers', tone: darkMode ? 'bg-gray-900/70' : 'bg-rose-50/90' },
            { icon: '↻', value: forgottenCount, title: isPersian ? 'واژهٔ فراموش‌شده' : 'Forgotten words', tone: darkMode ? 'bg-gray-900/70' : 'bg-amber-50/90' },

            { icon: '★', value: savedCount, title: isPersian ? 'نشان‌شده برای بعد' : 'Saved for later', tone: darkMode ? 'bg-gray-900/70' : 'bg-amber-50/90' },
          ].map((stat) => (
            <div key={stat.title} className={`flex items-center gap-4 rounded-2xl border border-black/5 p-4 ${stat.tone}`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-xl text-indigo-500">{stat.icon}</span>
              <div><div className="text-2xl font-black tabular-nums">{stat.value}</div><div className={`mt-0.5 text-xs font-semibold ${muted}`}>{stat.title}</div></div>
            </div>
          ))}
        </div>
      </header>

      {error && <div role="alert" className={`rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900 `}>
        <strong>{isPersian ? 'بخشی از دفترچه بارگذاری نشد: ' : 'Some notebook items could not load: '}</strong>{error}
        <p className="mt-1">{isPersian ? 'بخش‌هایی که با موفقیت دریافت شده‌اند همچنان نمایش داده می‌شوند.' : 'Items that loaded successfully are still shown.'}</p>
      </div>}

      <section className={`rounded-3xl border p-4 sm:p-5 ${panel}`}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative block">
            <span className="sr-only">{isPersian ? 'جست‌وجو در دفترچه' : 'Search notebook'}</span>
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isPersian ? 'جست‌وجوی واژه، خطا یا معنی…' : 'Search words, mistakes, or meanings…'} className={`w-full rounded-xl border py-3 pl-9 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 ${field}`} />
          </label>
          <div className={`flex rounded-xl border p-1 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-slate-50'}`} role="group" aria-label={isPersian ? 'نمایش موارد' : 'Show items'}>
            {[['all', isPersian ? 'همه' : 'All'], ['saved', isPersian ? 'نشان‌شده‌ها' : 'Saved']].map(([value, text]) => (
              <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${filter === value ? 'bg-indigo-600 text-white shadow-sm' : muted}`}>{text}</button>
            ))}
          </div>
          <label>
            <span className="sr-only">{isPersian ? 'دسته‌بندی' : 'Category'}</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={`w-full rounded-xl border px-3 py-3 text-sm outline-none focus:border-indigo-500 ${field}`}>
              <option value="all">{isPersian ? 'همهٔ دسته‌ها' : 'All categories'}</option>
              {Object.keys(CATEGORY_LABELS).map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </select>
          </label>
        </div>
        <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 text-xs ${muted}`}>
          <span>{isPersian ? `${entries.length} مورد نمایش داده می‌شود` : `Showing ${entries.length} items`}</span>
          {lastUpdated && <span>{isPersian ? 'آخرین همگام‌سازی: ' : 'Last synced: '}{lastUpdated.toLocaleTimeString(isPersian ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
      </section>

      {loading ? (
        <div className={`rounded-3xl border p-12 text-center ${panel}`}><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /><p className={muted}>{isPersian ? 'دفترچه در حال همگام‌سازی است…' : 'Syncing your notebook…'}</p></div>
      ) : entries.length === 0 ? (
        <div className={`rounded-3xl border border-dashed p-10 text-center ${panel}`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-3xl">📚</div>
          <h3 className="text-lg font-black">{filter === 'saved' ? (isPersian ? 'هنوز موردی نشان‌گذاری نکرده‌ای' : 'Nothing saved for later yet') : (isPersian ? 'موردی برای نمایش پیدا نشد' : 'No matching items found')}</h3>
          <p className={`mx-auto mt-2 max-w-lg text-sm leading-6 ${muted}`}>{isPersian
            ? 'هر واژه‌ای را به «واژگان من» اضافه کنی، اینجا نمایش داده می‌شود؛ پاسخ‌های اشتباه آزمون و اصلاح‌های نوشتاری هم برای مرور کنار آن قرار می‌گیرند.'
            : 'Every word saved to My Vocabulary appears here too. When you choose “Forgot” during review, its forgotten count is recorded and shown here.'}</p>
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2" aria-label={isPersian ? 'موارد دفترچه' : 'Notebook items'}>
          {entries.map((item) => {
            const isRevealed = Boolean(revealed[item.key])
            const isSaved = savedIds.includes(item.key)
            const created = item.writing.created_at ? new Date(item.writing.created_at) : null
            const dateLabel = created && !Number.isNaN(created.getTime()) ? created.toLocaleDateString(isPersian ? 'fa-IR' : 'en-US') : ''
            return (
              <article key={item.key} className={`flex min-w-0 flex-col gap-4 rounded-3xl border p-4 shadow-sm transition hover:shadow-md sm:p-5 ${panel}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-extrabold text-indigo-500">{label(item.category)}</span>
                    {item.vocabulary && item.forgotten && <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-extrabold text-rose-500">{isPersian ? `فراموش‌شده · ${item.word.incorrect_count} بار` : `Forgotten · ${item.word.incorrect_count}×`}</span>}
                  </div>
                  <button type="button" onClick={() => toggleSaved(item.key)} aria-pressed={isSaved} className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${isSaved ? 'border-amber-400 bg-amber-100 text-amber-900' : darkMode ? 'border-gray-600 hover:border-amber-400' : 'border-slate-200 hover:border-amber-400'}`}>{isSaved ? (isPersian ? '★ نشان‌شده' : '★ Saved') : (isPersian ? '☆ برای بعد' : '☆ Save for later')}</button>
                </div>

                <div className={`rounded-2xl p-4 sm:p-5 ${darkMode ? 'bg-gray-900/80' : 'bg-slate-50'}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className={`text-[11px] font-extrabold uppercase tracking-wider ${muted}`}>{item.vocabulary ? (isPersian ? 'واژه برای یادآوری' : 'Recall this word') : item.quiz ? (isPersian ? 'سؤال آزمون' : 'Quiz question') : (isPersian ? 'جمله یا عبارت اولیه' : 'Original phrase')}</p>
                    {dateLabel && <span className={`text-[11px] ${muted}`}>{dateLabel}</span>}
                  </div>
                  <p dir="ltr" className="break-words whitespace-pre-wrap text-base font-bold leading-7 sm:text-lg">{item.original}</p>
                </div>

                {isRevealed ? (
                  <div className={`rounded-2xl border p-4 sm:p-5 ${darkMode ? 'border-indigo-900 bg-indigo-950/30' : 'border-indigo-100 bg-indigo-50/80'}`}>
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-indigo-500">{item.vocabulary ? (isPersian ? 'معنی واژه' : 'Meaning') : item.quiz ? (isPersian ? 'پاسخ درست آزمون' : 'Correct quiz answer') : (isPersian ? 'اصلاح پیشنهادی' : 'Suggested correction')}</p>
                    <p dir={item.vocabulary ? 'auto' : 'ltr'} className="break-words whitespace-pre-wrap text-base font-bold leading-7">{item.correction}</p>
                    {item.explanation && <p className={`mt-3 whitespace-pre-wrap border-t border-gray-300/50 pt-3 text-sm leading-6 ${muted}`}>{item.explanation}</p>}
                  </div>
                ) : (
                  <div className={`flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-5 text-center ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                    <span className="mb-2 text-2xl" aria-hidden="true">🧠</span>
                    <p className={`text-sm ${muted}`}>{isPersian ? 'قبل از دیدن جواب، معنی یا اصلاح را از حافظه‌ات به یاد بیاور.' : 'Try to recall the meaning or correction before revealing it.'}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 pt-3 dark:border-gray-700">
                  {item.vocabulary ? <span className={`text-xs ${muted}`}>{isPersian ? 'تسلط' : 'Mastery'}: {item.word.proficiency || 0}/100</span> : item.writing.score != null ? <span className={`text-xs ${muted}`}>{isPersian ? 'امتیاز نوشته' : 'Writing score'}: {item.writing.score}/100</span> : <span />}
                  <button type="button" onClick={() => toggleReveal(item.key)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">{isRevealed ? (isPersian ? 'پنهان‌کردن جواب' : 'Hide answer') : (isPersian ? 'دیدن جواب و توضیح' : 'Reveal answer')}</button>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
