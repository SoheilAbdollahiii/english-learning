import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiFetch, apiUrl } from './api'

/**
 * A practical replacement for Conversation Lab: one place to revisit reading
 * articles and saved vocabulary. Reading progress remains backed by the existing
 * reading API, and vocabulary review is delegated to the app's spaced-repetition
 * flow so that scheduling and scoring stay consistent.
 */
export default function ConversationLab({ darkMode, onStartWordReview }) {
  const { t, i18n } = useTranslation()
  const isPersian = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('fa')
  const [articles, setArticles] = useState([])
  const [progress, setProgress] = useState([])
  const [words, setWords] = useState([])
  const [filter, setFilter] = useState('unread')
  const [expandedArticle, setExpandedArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingArticle, setSavingArticle] = useState(null)
  const [error, setError] = useState('')

  const darkPanel = darkMode ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
  const muted = darkMode ? 'text-gray-300' : 'text-gray-600'
  const completedIds = useMemo(() => new Set(progress.filter((item) => item.completed).map((item) => item.article_id)), [progress])
  const unreadArticles = useMemo(() => articles.filter((article) => !completedIds.has(article.id)), [articles, completedIds])
  const shownArticles = filter === 'unread' ? unreadArticles : filter === 'read' ? articles.filter((article) => completedIds.has(article.id)) : articles

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [articlesRes, progressRes, wordsRes] = await Promise.all([
        apiFetch(apiUrl('/reading/api/articles/')),
        apiFetch(apiUrl('/reading/api/progress/')),
        apiFetch(apiUrl('/vocabulary/api/my-words/')),
      ])
      const results = await Promise.all([articlesRes.json(), progressRes.json(), wordsRes.json()])
      if (!articlesRes.ok) throw new Error(results[0]?.detail || (isPersian ? 'بارگذاری متن‌ها ناموفق بود.' : 'Could not load reading articles.'))
      setArticles(Array.isArray(results[0]) ? results[0] : [])
      setProgress(progressRes.ok && Array.isArray(results[1]) ? results[1] : [])
      setWords(wordsRes.ok && Array.isArray(results[2]) ? results[2] : [])
    } catch (err) {
      setError(err.message || (isPersian ? 'خطا در دریافت اطلاعات.' : 'Could not load your review items.'))
    } finally {
      setLoading(false)
    }
  }, [isPersian])

  useEffect(() => { loadData() }, [loadData])

  const markArticle = async (article, completed) => {
    setSavingArticle(article.id)
    setError('')
    try {
      const response = await apiFetch(apiUrl('/reading/api/progress/'), {
        method: 'POST',
        body: JSON.stringify({ article_id: article.id, completed }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || (isPersian ? 'ذخیرهٔ وضعیت مطالعه ناموفق بود.' : 'Could not save reading status.'))
      setProgress((current) => [data, ...current.filter((item) => item.article_id !== article.id)])
    } catch (err) {
      setError(err.message || (isPersian ? 'ذخیره انجام نشد.' : 'Changes could not be saved.'))
    } finally {
      setSavingArticle(null)
    }
  }

  const titleOf = (article) => article.title || article.name || (isPersian ? 'متن خواندنی' : 'Reading article')
  const wordOf = (word) => word.english_word || word.word || word.term || ''
  const translationOf = (word) => word.translation || word.persian_translation || word.meaning || ''

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <header className={`rounded-3xl border p-6 sm:p-8 ${darkPanel}`}>
        <div className="mb-3 text-4xl" aria-hidden="true">📚</div>
        <h2 className="text-2xl font-black">{isPersian ? 'مرور و یادگیری مجدد' : 'Review & Learn Again'}</h2>
        <p className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}>
          {isPersian ? 'متن‌های خواندنی را دوباره بخوان، آن‌ها را خوانده‌نشده علامت بزن و واژه‌های ذخیره‌شده را برای مرور باز کن.' : 'Revisit reading articles, mark them unread when you want to return, and open saved vocabulary in your review flow.'}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-900' : 'bg-indigo-50'}`}><div className="text-2xl font-black">{unreadArticles.length}</div><div className={`mt-1 text-xs ${muted}`}>{isPersian ? 'متن خوانده‌نشده' : 'Unread articles'}</div></div>
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-900' : 'bg-green-50'}`}><div className="text-2xl font-black">{completedIds.size}</div><div className={`mt-1 text-xs ${muted}`}>{isPersian ? 'متن خوانده‌شده' : 'Read articles'}</div></div>
          <div className={`col-span-2 rounded-2xl p-4 sm:col-span-1 ${darkMode ? 'bg-gray-900' : 'bg-amber-50'}`}><div className="text-2xl font-black">{words.length}</div><div className={`mt-1 text-xs ${muted}`}>{isPersian ? 'واژهٔ ذخیره‌شده' : 'Saved words'}</div></div>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-xl font-black">{isPersian ? 'متن‌های خواندنی' : 'Reading library'}</h3><p className={`mt-1 text-sm ${muted}`}>{isPersian ? 'هر زمان خواستی وضعیت مطالعه را تغییر بده.' : 'Change an article’s reading status whenever you like.'}</p></div>
          <div className={`flex rounded-xl border p-1 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`} role="group" aria-label={isPersian ? 'فیلتر متن‌ها' : 'Filter articles'}>
            {[
              ['unread', isPersian ? 'خوانده‌نشده' : 'Unread'],
              ['read', isPersian ? 'خوانده‌شده' : 'Read'],
              ['all', isPersian ? 'همه' : 'All'],
            ].map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-lg px-3 py-2 text-sm font-bold ${filter === value ? 'bg-indigo-600 text-white' : muted}`}>{label}</button>)}
          </div>
        </div>
        {loading ? <p className={muted}>{isPersian ? 'در حال بارگذاری…' : 'Loading your review library…'}</p> : shownArticles.length === 0 ? (
          <div className={`rounded-2xl border border-dashed p-6 text-center ${darkPanel}`}><p className="font-bold">{isPersian ? 'متنی در این بخش نیست.' : 'No articles in this section yet.'}</p><p className={`mt-1 text-sm ${muted}`}>{isPersian ? 'فیلتر دیگری را انتخاب کن یا از بخش مطالعه متن جدیدی باز کن.' : 'Try another filter or visit Reading to discover an article.'}</p></div>
        ) : <div className="grid gap-4 md:grid-cols-2">
          {shownArticles.map((article) => {
            const isRead = completedIds.has(article.id)
            const expanded = expandedArticle === article.id
            return <article key={article.id} className={`flex flex-col rounded-2xl border p-5 shadow-sm ${darkPanel}`}>
              <div className="mb-3 flex items-start justify-between gap-3"><h4 className="text-lg font-extrabold">{titleOf(article)}</h4><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${isRead ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{isRead ? (isPersian ? 'خوانده‌شده' : 'Read') : (isPersian ? 'خوانده‌نشده' : 'Unread')}</span></div>
              {article.level && <span className={`mb-3 text-xs font-bold ${muted}`}>{article.level}</span>}
              <p className={`mb-4 text-sm leading-6 ${muted}`}>{article.description || article.summary || (article.content || '').slice(0, 180)}{!article.description && !article.summary && (article.content || '').length > 180 ? '…' : ''}</p>
              {expanded && <div className={`mb-4 whitespace-pre-wrap rounded-xl p-4 text-sm leading-7 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>{article.content || (isPersian ? 'محتوایی برای این متن ثبت نشده است.' : 'No article text is available.')}</div>}
              <div className="mt-auto flex flex-wrap gap-2 border-t border-gray-200/60 pt-4">
                <button type="button" onClick={() => setExpandedArticle(expanded ? null : article.id)} aria-expanded={expanded} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">{expanded ? (isPersian ? 'بستن متن' : 'Hide article') : (isPersian ? 'خواندن دوباره' : 'Read again')}</button>
                <button type="button" disabled={savingArticle === article.id} onClick={() => markArticle(article, !isRead)} className={`rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50 ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}>{savingArticle === article.id ? '…' : isRead ? (isPersian ? 'علامت‌گذاری خوانده‌نشده' : 'Mark unread') : (isPersian ? 'علامت‌گذاری خوانده‌شده' : 'Mark read')}</button>
              </div>
            </article>
          })}
        </div>}
      </section>

      <section className="space-y-4">
        <div><h3 className="text-xl font-black">{isPersian ? 'واژه‌های ذخیره‌شده برای مرور' : 'Saved vocabulary to review'}</h3><p className={`mt-1 text-sm ${muted}`}>{isPersian ? 'برای باز کردن کارت مرور هر واژه روی آن بزن.' : 'Open any saved word in the existing vocabulary review flow.'}</p></div>
        {!loading && words.length === 0 ? <div className={`rounded-2xl border border-dashed p-6 text-center ${darkPanel}`}><p className="font-bold">{isPersian ? 'هنوز واژه‌ای ذخیره نکرده‌ای.' : 'No saved words yet.'}</p><p className={`mt-1 text-sm ${muted}`}>{isPersian ? 'هنگام مطالعه، واژه‌ها را ذخیره کن تا اینجا برای مرور نمایش داده شوند.' : 'Save words while studying and they will appear here for review.'}</p></div> : <div className="grid gap-3 sm:grid-cols-2">
          {words.map((word) => <div key={word.id} className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${darkPanel}`}><div className="min-w-0"><p className="break-words font-extrabold">{wordOf(word) || (isPersian ? 'واژه' : 'Vocabulary word')}</p><p className={`mt-1 break-words text-sm ${muted}`}>{translationOf(word) || (isPersian ? 'بدون معنی ثبت‌شده' : 'No translation saved')}</p>{word.next_review && <p className={`mt-1 text-xs ${muted}`}>{isPersian ? 'مرور بعدی: ' : 'Next review: '}{new Date(word.next_review).toLocaleDateString(isPersian ? 'fa-IR' : 'en-US')}</p>}</div><button type="button" onClick={() => onStartWordReview?.(word)} disabled={!word.id || !onStartWordReview} className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50">{isPersian ? 'مرور' : 'Review'}</button></div>)}
        </div>}
      </section>
      <div className="flex justify-end"><button type="button" onClick={loadData} disabled={loading} className={`rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{isPersian ? 'تازه‌سازی' : 'Refresh'}</button></div>
    </main>
  )
}
