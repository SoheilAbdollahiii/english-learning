import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch, apiUrl } from './api'

const STORAGE_KEY = 'english-learning-saved-writing-mistakes'

function readSavedIds() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value.map(String) : []
  } catch {
    return []
  }
}

export default function MistakeNotebook({ darkMode }) {
  const { i18n } = useTranslation()
  const isPersian = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('fa')
  const [writings, setWritings] = useState([])
  const [savedIds, setSavedIds] = useState(readSavedIds)
  const [filter, setFilter] = useState('all')
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
      if (!response.ok) throw new Error(data.detail || (isPersian ? 'بارگذاری نوشته‌ها ناموفق بود.' : 'Could not load your writing history.'))
      setWritings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || (isPersian ? 'دریافت نوشته‌ها انجام نشد.' : 'Could not load your writing history.'))
    } finally {
      setLoading(false)
    }
  }, [isPersian])

  useEffect(() => { loadWritings() }, [loadWritings])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds)) } catch { /* Storage may be unavailable in private browsing. */ }
  }, [savedIds])

  const entries = useMemo(() => writings
    .filter((item) => item.corrected_text && item.original_text)
    .filter((item) => filter !== 'saved' || savedIds.includes(String(item.id)))
    .filter((item) => {
      const haystack = [item.original_text, item.corrected_text, item.feedback].join(' ').toLowerCase()
      return haystack.includes(query.trim().toLowerCase())
    }), [writings, filter, savedIds, query])

  const toggleSaved = (id) => setSavedIds((current) => current.includes(String(id))
    ? current.filter((saved) => saved !== String(id))
    : [String(id), ...current])

  const startPractice = (id) => setRevealed((current) => ({ ...current, [id]: !current[id] }))

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <header className={`rounded-3xl border p-6 sm:p-8 ${panel}`}>
        <div className="mb-3 text-4xl" aria-hidden="true">📒</div>
        <h2 className="text-2xl font-black">{isPersian ? 'دفترچهٔ خطاهای شخصی' : 'My Mistake Notebook'}</h2>
        <p className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}>{isPersian
          ? 'اصلاح‌های واقعی نوشته‌هایت را ذخیره کن، پاسخ درست را پنهان کن و بعداً خودت را دوباره بیازما. این بخش از تاریخچهٔ خصوصی رایتینگ استفاده می‌کند.'
          : 'Save real corrections from your writing, hide the corrected version, and test yourself again later. Entries come from your private writing history.'}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-900' : 'bg-indigo-50'}`}><div className="text-2xl font-black">{writings.filter((item) => item.corrected_text).length}</div><div className={`mt-1 text-xs ${muted}`}>{isPersian ? 'تصحیح آماده' : 'Corrections available'}</div></div>
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-900' : 'bg-amber-50'}`}><div className="text-2xl font-black">{savedIds.length}</div><div className={`mt-1 text-xs ${muted}`}>{isPersian ? 'مورد نشان‌شده' : 'Saved for practice'}</div></div>
          <div className={`col-span-2 rounded-2xl p-4 sm:col-span-1 ${darkMode ? 'bg-gray-900' : 'bg-green-50'}`}><div className="text-2xl font-black">{writings.length}</div><div className={`mt-1 text-xs ${muted}`}>{isPersian ? 'کل نوشته‌ها' : 'Writing submissions'}</div></div>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isPersian ? 'جست‌وجو در متن و توضیحات…' : 'Search original text and feedback…'} className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'}`} />
          <div className={`flex rounded-xl border p-1 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`} role="group" aria-label={isPersian ? 'فیلتر دفترچه' : 'Notebook filter'}>
            {[
              ['all', isPersian ? 'همهٔ اصلاح‌ها' : 'All corrections'],
              ['saved', isPersian ? 'برای تمرین' : 'Saved'],
            ].map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-lg px-3 py-2 text-sm font-bold ${filter === value ? 'bg-indigo-600 text-white' : muted}`}>{label}</button>)}
          </div>
        </div>

        {loading ? <p className={muted}>{isPersian ? 'در حال بارگذاری دفترچه…' : 'Loading your notebook…'}</p> : entries.length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-8 text-center ${panel}`}><p className="font-bold">{isPersian ? 'هنوز اصلاحی برای نمایش نیست.' : 'No corrections to show yet.'}</p><p className={`mt-2 text-sm ${muted}`}>{isPersian ? 'پس از تصحیح موفق یک نوشته، آن را اینجا برای مرور ذخیره کن.' : 'After a writing is successfully corrected, save it here for later practice.'}</p></div>
        ) : entries.map((item) => {
          const isRevealed = Boolean(revealed[item.id])
          const isSaved = savedIds.includes(String(item.id))
          return <article key={item.id} className={`space-y-4 rounded-2xl border p-5 shadow-sm ${panel}`}>
            <div className="flex flex-wrap items-center justify-between gap-3"><span className={`text-xs ${muted}`}>{new Date(item.created_at).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}</span><div className="flex gap-2">{item.score != null && <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-800">{isPersian ? 'امتیاز' : 'Score'}: {item.score}/100</span>}<button type="button" onClick={() => toggleSaved(item.id)} className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${isSaved ? 'border-amber-400 bg-amber-100 text-amber-900' : darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{isSaved ? (isPersian ? '★ ذخیره‌شده' : '★ Saved') : (isPersian ? '☆ ذخیره برای تمرین' : '☆ Save for practice')}</button></div></div>
            <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}><p className={`mb-2 text-xs font-bold ${muted}`}>{isPersian ? 'نوشتهٔ اولیه' : 'Original writing'}</p><p dir="ltr" className="whitespace-pre-wrap text-sm leading-7">{item.original_text}</p></div>
            {isRevealed ? <div className={`rounded-xl border p-4 ${darkMode ? 'border-indigo-900 bg-indigo-950/30' : 'border-indigo-100 bg-indigo-50'}`}><p className="mb-2 text-xs font-bold text-indigo-500">{isPersian ? 'نسخهٔ اصلاح‌شده' : 'Corrected version'}</p><p dir="ltr" className="whitespace-pre-wrap text-sm leading-7">{item.corrected_text}</p>{item.feedback && <p className="mt-3 border-t border-gray-300/50 pt-3 text-sm leading-6">{item.feedback}</p>}</div> : <div className={`rounded-xl border border-dashed p-4 text-center text-sm ${muted}`}>{isPersian ? 'نسخهٔ درست پنهان است؛ خودت متن را اصلاح کن.' : 'The answer is hidden. Try correcting the text yourself first.'}</div>}
            <button type="button" onClick={() => startPractice(item.id)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">{isRevealed ? (isPersian ? 'پنهان‌کردن پاسخ' : 'Hide answer') : (isPersian ? 'نمایش پاسخ و توضیح' : 'Reveal correction and feedback')}</button>
          </article>
        })}
      </section>
      <div className="flex justify-end"><button type="button" onClick={loadWritings} disabled={loading} className={`rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{isPersian ? 'تازه‌سازی' : 'Refresh'}</button></div>
    </main>
  )
}
