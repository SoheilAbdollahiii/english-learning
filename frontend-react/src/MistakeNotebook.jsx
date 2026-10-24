import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch, apiUrl } from './api'

const STORAGE_KEY = 'english-learning-saved-writing-mistakes-v2'
const CATEGORY_LABELS = {
  grammar: { en: 'Grammar', fa: 'دستور زبان' },
  vocabulary: { en: 'Vocabulary', fa: 'واژگان' },
  word_choice: { en: 'Word choice', fa: 'انتخاب واژه' },
  word_order: { en: 'Word order', fa: 'ترتیب واژه‌ها' },
  punctuation: { en: 'Punctuation', fa: 'نشانه‌گذاری' },
  spelling: { en: 'Spelling', fa: 'املاء' },
  style: { en: 'Style', fa: 'سبک نگارش' },
  other: { en: 'Other', fa: 'سایر' },
}

function readSavedIds() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value.map(String) : []
  } catch {
    return []
  }
}

function getMistakes(writing) {
  if (Array.isArray(writing.mistakes) && writing.mistakes.length) {
    return writing.mistakes.map((mistake, index) => ({
      ...mistake,
      key: `${writing.id}:mistake:${index}`,
      writing,
      legacy: false,
    }))
  }
  // Keep older submissions usable after the structured-mistake feature is deployed.
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
  const [savedIds, setSavedIds] = useState(readSavedIds)
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [revealed, setRevealed] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const panel = darkMode ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
  const muted = darkMode ? 'text-gray-300' : 'text-gray-600'

  const loadWritings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch(apiUrl('/writing/api/writings/'))
      const data = await response.json()
      if (!response.ok) {
        const message = data.detail || (isPersian ? 'بارگذاری نوشته‌ها ناموفق بود.' : 'Could not load your writing history.')
        throw new Error(message)
      }
      setWritings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || (isPersian ? 'دریافت نوشته‌ها انجام نشد.' : 'Could not load your writing history.'))
    } finally {
      setLoading(false)
    }
  }, [isPersian])

  useEffect(() => {
    const task = window.setTimeout(() => { loadWritings() }, 0)
    return () => window.clearTimeout(task)
  }, [loadWritings])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds)) } catch { /* Storage may be unavailable. */ }
  }, [savedIds])

  const mistakes = useMemo(() => writings.flatMap(getMistakes), [writings])
  const entries = useMemo(() => mistakes
    .filter((item) => filter !== 'saved' || savedIds.includes(item.key))
    .filter((item) => category === 'all' || item.category === category)
    .filter((item) => {
      const haystack = [item.original, item.correction, item.explanation, item.category, item.writing.original_text].join(' ').toLowerCase()
      return haystack.includes(query.trim().toLowerCase())
    }), [mistakes, filter, category, savedIds, query])

  const toggleSaved = (key) => setSavedIds((current) => current.includes(key)
    ? current.filter((saved) => saved !== key)
    : [key, ...current])

  const toggleReveal = (key) => setRevealed((current) => ({ ...current, [key]: !current[key] }))

  const label = (value) => {
    const item = CATEGORY_LABELS[value] || CATEGORY_LABELS.other
    return item[isPersian ? 'fa' : 'en']
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <header className={`rounded-3xl border p-6 sm:p-8 ${panel}`}>
        <div className="mb-3 text-4xl" aria-hidden="true">📒</div>
        <h2 className="text-2xl font-black">{isPersian ? 'دفترچهٔ خطاهای شخصی' : 'My Mistake Notebook'}</h2>
        <p className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}>{isPersian
          ? 'هر خطا را جداگانه مرور کن: اول خودت اصلاحش کن، بعد پاسخ و دلیل را ببین و فقط موارد مهم را برای مرور بعدی ذخیره کن.'
          : 'Review one mistake at a time: try to correct it first, reveal the answer and reason, then save the items you want to revisit.'}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-900' : 'bg-indigo-50'}`}>
            <div className="text-2xl font-black">{mistakes.length}</div>
            <div className={`mt-1 text-xs ${muted}`}>{isPersian ? 'خطاهای قابل مرور' : 'Reviewable mistakes'}</div>
          </div>
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-900' : 'bg-amber-50'}`}>
            <div className="text-2xl font-black">{savedIds.length}</div>
            <div className={`mt-1 text-xs ${muted}`}>{isPersian ? 'ذخیره‌شده برای مرور' : 'Saved for review'}</div>
          </div>
          <div className={`col-span-2 rounded-2xl p-4 sm:col-span-1 ${darkMode ? 'bg-gray-900' : 'bg-green-50'}`}>
            <div className="text-2xl font-black">{writings.length}</div>
            <div className={`mt-1 text-xs ${muted}`}>{isPersian ? 'نوشته‌های بررسی‌شده' : 'Writing submissions'}</div>
          </div>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isPersian ? 'جست‌وجوی خطا، اصلاح یا توضیح…' : 'Search mistake, correction, or explanation…'} className={`min-w-0 rounded-xl border px-4 py-3 text-sm ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'}`} />
          <div className={`flex rounded-xl border p-1 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`} role="group" aria-label={isPersian ? 'فیلتر دفترچه' : 'Notebook filter'}>
            {[
              ['all', isPersian ? 'همه' : 'All'],
              ['saved', isPersian ? 'برای مرور' : 'Saved'],
            ].map(([value, text]) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-lg px-3 py-2 text-sm font-bold ${filter === value ? 'bg-indigo-600 text-white' : muted}`}>{text}</button>)}
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label={isPersian ? 'دسته خطا' : 'Mistake category'} className={`rounded-xl border px-3 py-2 text-sm ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'}`}>
            <option value="all">{isPersian ? 'همهٔ دسته‌ها' : 'All categories'}</option>
            {Object.keys(CATEGORY_LABELS).map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </div>

        {loading ? <p className={muted}>{isPersian ? 'در حال بارگذاری دفترچه…' : 'Loading your notebook…'}</p> : entries.length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-8 text-center ${panel}`}>
            <p className="font-bold">{filter === 'saved' ? (isPersian ? 'هنوز موردی برای مرور ذخیره نکرده‌ای.' : 'You have not saved any mistakes for review yet.') : (isPersian ? 'خطایی برای نمایش پیدا نشد.' : 'No mistakes match these filters.')}</p>
            <p className={`mt-2 text-sm ${muted}`}>{isPersian ? 'یک نوشته را با موفقیت تصحیح کن؛ خطاهای مشخص‌شده به‌صورت کارت‌های جداگانه در اینجا نمایش داده می‌شوند.' : 'Correct a writing successfully. Identified mistakes will appear here as separate review cards.'}</p>
          </div>
        ) : entries.map((item) => {
          const isRevealed = Boolean(revealed[item.key])
          const isSaved = savedIds.includes(item.key)
          const created = new Date(item.writing.created_at)
          return <article key={item.key} className={`space-y-4 rounded-2xl border p-5 shadow-sm ${panel}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-900">{label(item.category)}</span>
                <span className={`text-xs ${muted}`}>{Number.isNaN(created.getTime()) ? '' : created.toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}</span>
              </div>
              <button type="button" onClick={() => toggleSaved(item.key)} aria-pressed={isSaved} className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${isSaved ? 'border-amber-400 bg-amber-100 text-amber-900' : darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{isSaved ? (isPersian ? '★ ذخیره‌شده' : '★ Saved') : (isPersian ? '☆ ذخیره برای مرور' : '☆ Save for review')}</button>
            </div>
            <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <p className={`mb-2 text-xs font-bold ${muted}`}>{isPersian ? 'عبارت اولیه' : 'Original phrase'}</p>
              <p dir="ltr" className="whitespace-pre-wrap text-sm leading-7">{item.original}</p>
            </div>
            {isRevealed ? (
              <div className={`rounded-xl border p-4 ${darkMode ? 'border-indigo-900 bg-indigo-950/30' : 'border-indigo-100 bg-indigo-50'}`}>
                <p className="mb-2 text-xs font-bold text-indigo-500">{isPersian ? 'اصلاح پیشنهادی' : 'Correction'}</p>
                <p dir="ltr" className="whitespace-pre-wrap text-sm leading-7">{item.correction}</p>
                {item.explanation && <p className="mt-3 border-t border-gray-300/50 pt-3 text-sm leading-6">{item.explanation}</p>}
              </div>
            ) : <div className={`rounded-xl border border-dashed p-4 text-center text-sm ${muted}`}>{isPersian ? 'پاسخ پنهان است؛ پیش از دیدن اصلاح، خودت تلاش کن.' : 'Answer hidden. Try to correct it before revealing the answer.'}</div>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {item.writing.score != null && <span className={`text-xs ${muted}`}>{isPersian ? 'امتیاز نوشته' : 'Writing score'}: {item.writing.score}/100</span>}
              <button type="button" onClick={() => toggleReveal(item.key)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">{isRevealed ? (isPersian ? 'پنهان‌کردن پاسخ' : 'Hide answer') : (isPersian ? 'نمایش اصلاح و دلیل' : 'Reveal correction and reason')}</button>
            </div>
          </article>
        })}
      </section>
      <div className="flex justify-end"><button type="button" onClick={loadWritings} disabled={loading} className={`rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{isPersian ? 'تازه‌سازی' : 'Refresh'}</button></div>
    </main>
  )
}
