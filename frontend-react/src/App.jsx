import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

// Set VITE_API_BASE_URL when the frontend and API are deployed on different origins.
// In production, an empty base uses same-origin routes; local development targets Django.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')).replace(/\/$/, '')
const apiUrl = (path) => `${API_BASE}${path}`

async function apiFetch(url, options = {}) {
  let token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(apiUrl('/api/token/refresh/'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('access_token', data.access);
          
          headers['Authorization'] = `Bearer ${data.access}`;
          response = await fetch(url, { ...options, headers });
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.reload();
        }
      } catch (err) {
        console.error("Token refresh failed", err);
      }
    } else {
      localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
      window.location.reload();
    }
  }

  return response;
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab')
    return ['dashboard', 'reading', 'vocabulary', 'writing', 'quiz'].includes(requestedTab) ? requestedTab : 'dashboard'
  })
  const [words, setWords] = useState([])
  const [articles, setArticles] = useState([])
  const [writings, setWritings] = useState([])
  const [personalWords, setPersonalWords] = useState([])
  const [reviewQueue, setReviewQueue] = useState([])
  const [activeReviewWord, setActiveReviewWord] = useState(null)
  const [reviewAnswerVisible, setReviewAnswerVisible] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [readingProgress, setReadingProgress] = useState([])
  const [quizHistory, setQuizHistory] = useState([])
  const [quizStats, setQuizStats] = useState({ current_streak: 0, quiz_sessions_total: 0, daily_activity: [] })
  const [preferences, setPreferences] = useState({ preferred_level: 'B1', daily_word_goal: 10, learning_goal: 'general' })
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [readingQuery, setReadingQuery] = useState('')
  const [readingLevel, setReadingLevel] = useState('all')
  const [vocabQuery, setVocabQuery] = useState('')
  const [vocabLevel, setVocabLevel] = useState('all')
  const [loading, setLoading] = useState(() => !!localStorage.getItem('access_token'))
  
  const [writingText, setWritingText] = useState('')
  const [submittingWriting, setSubmittingWriting] = useState(false)

  // کوئیز
  const [quizQuestions, setQuizQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [quizType, setQuizType] = useState('vocabulary')
  
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('english-learning-theme') === 'dark')
  
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const streak = quizStats.current_streak || 0
  const chartData = useMemo(() => {
    const daysFa = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const currentDays = i18n.language === 'fa' ? daysFa : daysEn
    const activityByDate = new Map((quizStats.daily_activity || []).map((item) => [item.date, item.count]))
    const data = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
      data.push({ name: currentDays[day.getDay()], activity: activityByDate.get(dayKey) || 0 })
    }
    return data
  }, [i18n.language, quizStats.daily_activity])

  useEffect(() => {
    document.documentElement.lang = i18n.language === 'fa' ? 'fa' : 'en'
    document.documentElement.dir = i18n.language === 'fa' ? 'rtl' : 'ltr'
    localStorage.setItem('english-learning-language', i18n.language)
  }, [i18n.language])

  useEffect(() => {
    localStorage.setItem('english-learning-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(apiUrl('/api/token/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        setLoading(true)
        setIsLoggedIn(true)
      } else {
        alert(t('invalid_login'))
      }
    } catch (err) {
      console.error('Login failed', err)
      alert(t('login_failed'))
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password !== passwordConfirm) {
      alert(t('password_mismatch'))
      return
    }
    try {
      const res = await fetch(apiUrl('/api/register/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, password_confirm: passwordConfirm })
      })
      const data = await res.json()
      if (!res.ok) {
        const details = Object.values(data || {}).flat().filter((value) => typeof value === 'string')
        alert(details[0] || t('registration_failed'))
        return
      }
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setLoading(true)
      setIsLoggedIn(true)
    } catch (err) {
      console.error('Registration failed', err)
      alert(t('registration_failed'))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsLoggedIn(false)
  }

  const changeTab = (tab) => {
    if (tab !== activeTab) setLoading(true)
    setActiveTab(tab)
  }

  const toggleLanguage = () => {
    const nextLanguage = i18n.language === 'en' ? 'fa' : 'en'
    localStorage.setItem('english-learning-language', nextLanguage)
    i18n.changeLanguage(nextLanguage)
  }

  useEffect(() => {
    if (!isLoggedIn) return

    const loadTabData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'dashboard') {
          const [wordsRes, personalRes, articlesRes, writingsRes, preferencesRes, progressRes, historyRes, statsRes] = await Promise.all([
            apiFetch(apiUrl('/vocabulary/api/words/')),
            apiFetch(apiUrl('/vocabulary/api/my-words/')),
            apiFetch(apiUrl('/reading/api/articles/')),
            apiFetch(apiUrl('/writing/api/writings/')),
            apiFetch(apiUrl('/learning/api/preferences/')),
            apiFetch(apiUrl('/reading/api/progress/')),
            apiFetch(apiUrl('/quiz/api/history/')),
            apiFetch(apiUrl('/quiz/api/stats/'))
          ])
          const [wordsData, personalData, articlesData, writingsData, preferencesData, progressData, historyData, statsData] = await Promise.all([
            wordsRes.json(), personalRes.json(), articlesRes.json(), writingsRes.json(),
            preferencesRes.json(), progressRes.json(), historyRes.json(), statsRes.json()
          ])
          setWords(Array.isArray(wordsData) ? wordsData : [])
          setPersonalWords(Array.isArray(personalData) ? personalData : [])
          setArticles(Array.isArray(articlesData) ? articlesData : [])
          setWritings(Array.isArray(writingsData) ? writingsData : [])
          if (preferencesRes.ok) {
            setPreferences(preferencesData)
            setReadingLevel(preferencesData.preferred_level)
            setVocabLevel(preferencesData.preferred_level)
          }
          setReadingProgress(Array.isArray(progressData) ? progressData : [])
          setQuizHistory(Array.isArray(historyData) ? historyData : [])
          if (statsRes.ok) setQuizStats(statsData)
        } else if (activeTab === 'reading') {
          const [articlesRes, progressRes] = await Promise.all([
            apiFetch(apiUrl('/reading/api/articles/')),
            apiFetch(apiUrl('/reading/api/progress/'))
          ])
          const [articlesData, progressData] = await Promise.all([articlesRes.json(), progressRes.json()])
          setArticles(Array.isArray(articlesData) ? articlesData : [])
          setReadingProgress(Array.isArray(progressData) ? progressData : [])
        } else if (activeTab === 'vocabulary') {
          const [wordsRes, personalRes, reviewRes] = await Promise.all([
            apiFetch(apiUrl('/vocabulary/api/words/')),
            apiFetch(apiUrl('/vocabulary/api/my-words/')),
            apiFetch(apiUrl('/vocabulary/api/review/queue/'))
          ])
          const [wordsData, personalData, reviewData] = await Promise.all([
            wordsRes.json(), personalRes.json(), reviewRes.json()
          ])
          setWords(Array.isArray(wordsData) ? wordsData : [])
          setPersonalWords(Array.isArray(personalData) ? personalData : [])
          setReviewQueue(reviewRes.ok && Array.isArray(reviewData) ? reviewData : [])
          setActiveReviewWord(null)
          setReviewAnswerVisible(false)
        } else if (activeTab === 'writing') {
          const res = await apiFetch(apiUrl('/writing/api/writings/'))
          const data = await res.json()
          setWritings(Array.isArray(data) ? data : [])
        } else if (activeTab === 'quiz') {
          const res = await apiFetch(apiUrl('/quiz/api/history/'))
          const data = await res.json()
          setQuizHistory(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Could not load learning data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTabData()
  }, [activeTab, isLoggedIn])

  const startQuiz = async (type = 'vocabulary') => {
    setQuizType(type)
    setLoadingQuiz(true)
    setQuizSubmitted(false)
    setQuizResult(null)
    setCurrentQuestionIndex(0)
    setQuizAnswers({})

    try {
      const res = await apiFetch(apiUrl(`/quiz/api/questions/?type=${type}`))
      const data = await res.json()
      if (res.ok) {
        setQuizQuestions(Array.isArray(data) ? data : [])
      } else {
        setQuizQuestions([])
        alert(data.detail || t('quiz_load_failed'))
      }
    } catch (err) {
      console.error('Error fetching quiz questions:', err)
      alert(t('quiz_load_failed'))
    } finally {
      setLoadingQuiz(false)
    }
  }

  const handleAnswerSelect = (questionId, optionKey) => {
    const updatedAnswers = { ...quizAnswers, [questionId]: optionKey };
    setQuizAnswers(updatedAnswers);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitQuizFinal(updatedAnswers);
    }
  };

  const submitQuizFinal = async (finalAnswers) => {
    setLoadingQuiz(true);
    try {
      const res = await apiFetch(apiUrl('/quiz/api/submit/'), {
        method: 'POST',
        body: JSON.stringify({
          quiz_type: quizType,
          answers: finalAnswers
        })
      });

      const resultData = await res.json()
      if (res.ok) {
        setQuizResult(resultData)
        setQuizSubmitted(true)
        const [historyRes, statsRes] = await Promise.all([
          apiFetch(apiUrl('/quiz/api/history/')),
          apiFetch(apiUrl('/quiz/api/stats/'))
        ])
        const [historyData, statsData] = await Promise.all([historyRes.json(), statsRes.json()])
        setQuizHistory(Array.isArray(historyData) ? historyData : [])
        if (statsRes.ok) setQuizStats(statsData)
      } else {
        alert(resultData.detail || t('quiz_submit_failed'))
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleWordClick = async (word) => {
    const cleanedWord = word.replace(/^[^a-zA-Z'-]+|[^a-zA-Z'-]+$/g, '').toLowerCase()
    if (!cleanedWord) return
    try {
      const res = await apiFetch(apiUrl('/vocabulary/api/my-words/'), {
        method: 'POST',
        body: JSON.stringify({ english_word: cleanedWord, level: preferences.preferred_level || 'B1' })
      })
      const data = await res.json()
      if (res.ok) {
        setPersonalWords((current) => [data, ...current.filter((item) => item.id !== data.id)])
        alert(t('word_saved', { word: cleanedWord }))
      } else {
        alert(t('word_save_failed'))
      }
    } catch (err) {
      console.error('Error saving personal word:', err)
      alert(t('word_save_failed'))
    }
  }

  const savePreferences = async (event) => {
    event.preventDefault()
    setPreferencesSaving(true)
    try {
      const res = await apiFetch(apiUrl('/learning/api/preferences/'), {
        method: 'PATCH',
        body: JSON.stringify(preferences)
      })
      const data = await res.json()
      if (res.ok) {
        setPreferences(data)
        setReadingLevel(data.preferred_level)
        setVocabLevel(data.preferred_level)
        alert(t('preferences_saved'))
      } else {
        alert(t('preferences_failed'))
      }
    } catch (err) {
      console.error('Could not save learning preferences:', err)
      alert(t('preferences_failed'))
    } finally {
      setPreferencesSaving(false)
    }
  }

  const markArticleRead = async (articleId, completed) => {
    try {
      const res = await apiFetch(apiUrl('/reading/api/progress/'), {
        method: 'POST',
        body: JSON.stringify({ article_id: articleId, completed })
      })
      const data = await res.json()
      if (res.ok) {
        setReadingProgress((current) => [data, ...current.filter((item) => item.article_id !== articleId)])
      }
    } catch (err) {
      console.error('Could not save reading progress:', err)
    }
  }

  const saveCuratedWord = async (word) => {
    try {
      const res = await apiFetch(apiUrl('/vocabulary/api/my-words/'), {
        method: 'POST',
        body: JSON.stringify({ english_word: word.english_word, translation: word.translation || '', level: word.level || preferences.preferred_level || 'B1' })
      })
      const data = await res.json()
      if (res.ok) {
        setPersonalWords((current) => [data, ...current.filter((item) => item.id !== data.id)])
        alert(t('word_saved', { word: data.english_word }))
      } else {
        alert(t('word_save_failed'))
      }
    } catch (err) {
      console.error('Could not save curated word:', err)
      alert(t('word_save_failed'))
    }
  }

  const startWordReview = (word) => {
    if (!word?.id) return
    setActiveReviewWord(word)
    setReviewAnswerVisible(false)
  }

  const loadReviewQueue = async () => {
    setReviewBusy(true)
    try {
      const res = await apiFetch(apiUrl('/vocabulary/api/review/queue/'))
      const data = await res.json()
      if (res.ok && Array.isArray(data)) {
        setReviewQueue(data)
        return data
      }
      return []
    } catch (err) {
      console.error('Could not load due vocabulary reviews:', err)
      return []
    } finally {
      setReviewBusy(false)
    }
  }

  const beginDailyReview = async () => {
    const dueWords = await loadReviewQueue()
    if (dueWords.length > 0) startWordReview(dueWords[0])
  }

  const submitWordReview = async (remembered) => {
    if (!activeReviewWord) return
    setReviewBusy(true)
    try {
      const res = await apiFetch(apiUrl(`/vocabulary/api/my-words/${activeReviewWord.id}/review/`), {
        method: 'POST',
        body: JSON.stringify({ remembered })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.detail || t('review_failed'))
        return
      }

      setPersonalWords((current) => current.map((item) => item.id === data.id ? data : item))
      const remaining = reviewQueue.filter((item) => item.id !== data.id)
      setReviewQueue(remaining)
      setActiveReviewWord(remaining[0] || null)
      setReviewAnswerVisible(false)
    } catch (err) {
      console.error('Could not save vocabulary review:', err)
      alert(t('review_failed'))
    } finally {
      setReviewBusy(false)
    }
  }

  const updateWordTranslation = async (word, translation) => {
    try {
      const res = await apiFetch(apiUrl(`/vocabulary/api/my-words/${word.id}/`), {
        method: 'PATCH',
        body: JSON.stringify({ translation })
      })
      const data = await res.json()
      if (res.ok) setPersonalWords((current) => current.map((item) => item.id === data.id ? data : item))
    } catch (err) {
      console.error('Could not update word translation:', err)
    }
  }

  const deletePersonalWord = async (word) => {
    try {
      const res = await apiFetch(apiUrl(`/vocabulary/api/my-words/${word.id}/`), { method: 'DELETE' })
      if (res.ok) setPersonalWords((current) => current.filter((item) => item.id !== word.id))
    } catch (err) {
      console.error('Could not delete saved word:', err)
    }
  };

  const dailyWordsAdded = personalWords.filter((word) => new Date(word.created_at).toDateString() === new Date().toDateString()).length
  const dailyGoalPercent = Math.min(100, Math.round((dailyWordsAdded / Math.max(1, Number(preferences.daily_word_goal) || 1)) * 100))

  const filteredArticles = articles.filter((article) => {
    const matchesQuery = `${article.title} ${article.content}`.toLowerCase().includes(readingQuery.trim().toLowerCase())
    return matchesQuery && (readingLevel === 'all' || article.level === readingLevel)
  })

  const vocabularyItems = [
    ...personalWords.map((word) => ({ ...word, isPersonal: true, key: `personal-${word.id}` })),
    ...words
      .filter((word) => !personalWords.some((saved) => saved.english_word.toLowerCase() === word.english_word.toLowerCase()))
      .map((word) => ({ ...word, isPersonal: false, key: `curated-${word.id}` })),
  ].filter((word) => {
    const matchesQuery = `${word.english_word} ${word.translation || ''}`.toLowerCase().includes(vocabQuery.trim().toLowerCase())
    return matchesQuery && (vocabLevel === 'all' || word.level === vocabLevel)
  })

  const handleWritingSubmit = async (e) => {
    e.preventDefault();
    if (!writingText.trim()) return;

    setSubmittingWriting(true);
    try {
      const res = await apiFetch(apiUrl('/writing/api/writings/'), {
        method: 'POST',
        body: JSON.stringify({ original_text: writingText })
      });

      if (res.ok) {
        const newSubmission = await res.json();
        setWritings([newSubmission, ...writings]);
        setWritingText('');
        alert(newSubmission.corrected_text ? t('writing_analyzed') : t('writing_saved'));
      } else {
        alert(t('writing_failed'));
      }
    } catch (err) {
      console.error('Error submitting writing:', err);
      alert(t('writing_failed'));
    } finally {
      setSubmittingWriting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 font-sans ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`} dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}>
        <div className={`max-w-md w-full space-y-8 p-8 rounded-3xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isRegistering ? t('create_account') : t('login')}</h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={isRegistering ? handleRegister : handleLogin}>
            <div className="space-y-4">
              <input type="text" required autoComplete="username" aria-label={t("username")} value={username} onChange={(e) => setUsername(e.target.value)} className={`appearance-none rounded-xl block w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder={t('username')} />
              {isRegistering && <input type="email" autoComplete="email" aria-label={t("email_optional")} value={email} onChange={(e) => setEmail(e.target.value)} className={`appearance-none rounded-xl block w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder={t('email_optional')} />}
              <input type="password" required autoComplete={isRegistering ? 'new-password' : 'current-password'} aria-label={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} className={`appearance-none rounded-xl block w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder={t('password')} />
              {isRegistering && <input type="password" required autoComplete="new-password" aria-label={t("password_confirm")} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className={`appearance-none rounded-xl block w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder={t('password_confirm')} />}
            </div>
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              {isRegistering ? t('register') : t('login')}
            </button>
          </form>
          <button type="button" onClick={() => setIsRegistering((current) => !current)} className="w-full text-sm font-bold text-indigo-600 hover:text-indigo-800">
            {isRegistering ? t('already_have_account') : t('no_account')}
          </button>
          <div className="flex gap-2 pt-4">
            <button onClick={toggleLanguage} title={t('language_toggle')} aria-label={t('language_toggle')} className="flex-1 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
              {i18n.language === 'en' ? '🇮🇷 فارسی' : '🇬🇧 English'}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} title={t(darkMode ? 'light_mode' : 'dark_mode')} aria-label={t('theme_toggle')} className="flex-1 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`} dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}>
      <nav className={`shadow-sm border-b sticky top-0 z-10 transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-between min-h-16 items-center gap-3 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className={`font-extrabold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('app_title')}</span>
              </div>
              
              <div className="order-3 flex w-full max-w-full gap-3 overflow-x-auto whitespace-nowrap sm:order-none sm:w-auto sm:gap-6">
                <button onClick={() => changeTab('dashboard')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_dashboard')}
                </button>
                <button onClick={() => changeTab('reading')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'reading' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_reading')}
                </button>
                <button onClick={() => changeTab('vocabulary')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'vocabulary' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_vocabulary')}
                </button>
                <button onClick={() => changeTab('writing')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'writing' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_writing')}
                </button>
                <button onClick={() => changeTab('quiz')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'quiz' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_quiz')}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={toggleLanguage} title={t('language_toggle')} aria-label={t('language_toggle')} className="text-lg hover:scale-110 transition-transform p-1">
                  {i18n.language === 'en' ? '🇮🇷' : '🇬🇧'}
                </button>
                <button onClick={() => setDarkMode(!darkMode)} title={t(darkMode ? 'light_mode' : 'dark_mode')} aria-label={t('theme_toggle')} className="text-lg hover:scale-110 transition-transform p-1">
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg transition-colors">
                  {t('logout')}
                </button>
              </div>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 text-center">
          <h1 className={`text-4xl font-black mb-3 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {activeTab === 'reading' ? t('reading_title') : activeTab === 'vocabulary' ? t('vocab_title') : activeTab === 'writing' ? t('writing_title') : activeTab === 'quiz' ? t('quiz_title') : t('dashboard_title')}
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`rounded-2xl p-6 shadow-sm border animate-pulse ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`h-6 rounded w-3/4 mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`h-20 rounded w-full mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center items-center transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-2">{t('vocab_title')}</h3>
                    <p className="text-5xl font-black text-indigo-500">{personalWords.length}</p>
                  </div>
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center items-center transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-2">{t('tab_reading')}</h3>
                    <p className="text-5xl font-black text-green-500">{articles.length}</p>
                  </div>
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center items-center transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-2">{t('daily_streak')}</h3>
                    <p className="text-5xl font-black text-orange-500">{streak} ⚡</p>
                  </div>
                  <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-3">{t('daily_goal_progress')}</h3>
                    <p className="text-2xl font-black text-indigo-500">{dailyWordsAdded} / {preferences.daily_word_goal}</p>
                    <div className={`w-full rounded-full h-2.5 mt-4 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="bg-indigo-600 h-2.5 rounded-full transition-all" style={{ width: `${dailyGoalPercent}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{t('words_added_today')}</p>
                  </div>
                </div>

                <form onSubmit={savePreferences} className={`p-6 rounded-2xl shadow-sm border space-y-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div>
                    <h3 className="text-lg font-bold">{t('learning_preferences')}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t('learning_preferences_desc')}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="block text-sm font-semibold">
                      <span className="block mb-2">{t('preferred_level')}</span>
                      <select value={preferences.preferred_level} onChange={(event) => setPreferences((current) => ({ ...current, preferred_level: event.target.value }))} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <option value="A1">A1 — Beginner</option><option value="B1">B1 — Intermediate</option><option value="C1">C1 — Advanced</option>
                      </select>
                    </label>
                    <label className="block text-sm font-semibold">
                      <span className="block mb-2">{t('daily_word_goal')}</span>
                      <input type="number" min="1" max="100" value={preferences.daily_word_goal} onChange={(event) => setPreferences((current) => ({ ...current, daily_word_goal: Number(event.target.value) }))} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                    </label>
                    <label className="block text-sm font-semibold">
                      <span className="block mb-2">{t('learning_goal')}</span>
                      <select value={preferences.learning_goal} onChange={(event) => setPreferences((current) => ({ ...current, learning_goal: event.target.value }))} className={`w-full rounded-xl border p-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <option value="general">{t('goal_general')}</option><option value="travel">{t('goal_travel')}</option><option value="work">{t('goal_work')}</option><option value="exam">{t('goal_exam')}</option>
                      </select>
                    </label>
                  </div>
                  <button type="submit" disabled={preferencesSaving} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">{preferencesSaving ? t('saving') : t('save_preferences')}</button>
                </form>

                <div className={`p-6 rounded-2xl shadow-sm border h-96 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t('quiz_activity_last_7_days')}
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f3f4f6'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{backgroundColor: darkMode ? '#1f2937' : '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Area type="monotone" dataKey="activity" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorWords)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'reading' && (
              <div className="space-y-5">
                <div className={`grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <input value={readingQuery} onChange={(event) => setReadingQuery(event.target.value)} placeholder={t('search_articles')} className={`w-full rounded-xl border px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                  <select value={readingLevel} onChange={(event) => setReadingLevel(event.target.value)} aria-label={t('filter_by_level')} className={`rounded-xl border px-3 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <option value="all">{t('all_levels')}</option><option value="A1">A1</option><option value="B1">B1</option><option value="C1">C1</option>
                  </select>
                </div>
                {filteredArticles.length === 0 ? <EmptyState message={t('no_articles')} darkMode={darkMode} /> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredArticles.map((article) => (
                    <article key={article.id} className={`rounded-2xl shadow-sm border flex flex-col overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className="h-2 bg-indigo-500"></div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{article.title}</h2>
                          <span className="shrink-0 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">{article.level}</span>
                        </div>
                        <div className="mb-6 flex-grow text-sm">
                          <InteractiveText text={article.content} onWordClick={handleWordClick} darkMode={darkMode} />
                        </div>
                        <div className="mt-auto border-t pt-4 dark:border-gray-700">
                          {readingProgress.some((item) => item.article_id === article.id && item.completed) ? (
                            <button onClick={() => markArticleRead(article.id, false)} className="w-full rounded-xl border border-green-500 px-4 py-2 text-sm font-bold text-green-600">{t('mark_unread')}</button>
                          ) : (
                            <button onClick={() => markArticleRead(article.id, true)} className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">{t('mark_read')}</button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                )}
              </div>
            )}

            {activeTab === 'vocabulary' && (
              <div className="space-y-5">
                <section className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-extrabold">{t('spaced_review')}</h3>
                      <p className={`text-sm mt-1 max-w-2xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('spaced_review_desc')}</p>
                    </div>
                    <span className="text-sm font-bold rounded-full px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {t('due_count', { count: reviewQueue.length })}
                    </span>
                  </div>
                  {activeReviewWord ? (
                    <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
                      <h4 className="text-2xl font-black mb-3" dir="ltr">{activeReviewWord.english_word}</h4>
                      {!reviewAnswerVisible ? (
                        <button type="button" onClick={() => setReviewAnswerVisible(true)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2">{t('reveal_answer')}</button>
                      ) : (
                        <>
                          <p className="text-indigo-500 font-bold mb-4">{activeReviewWord.translation || t('translation_missing')}</p>
                          <div className="flex flex-wrap gap-3">
                            <button type="button" disabled={reviewBusy} onClick={() => submitWordReview(true)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 disabled:opacity-50">{t('remembered')}</button>
                            <button type="button" disabled={reviewBusy} onClick={() => submitWordReview(false)} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 disabled:opacity-50">{t('forgot')}</button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{reviewQueue.length ? t('due_words_ready') : t('review_complete')}</p>
                      <button type="button" disabled={reviewBusy} onClick={beginDailyReview} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 disabled:opacity-50">
                        {reviewQueue.length ? t('start_review') : t('refresh_review_queue')}
                      </button>
                    </div>
                  )}
                </section>
                <div className={`grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <input value={vocabQuery} onChange={(event) => setVocabQuery(event.target.value)} placeholder={t('search_words')} className={`w-full rounded-xl border px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                  <select value={vocabLevel} onChange={(event) => setVocabLevel(event.target.value)} aria-label={t('filter_by_level')} className={`rounded-xl border px-3 py-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                    <option value="all">{t('all_levels')}</option><option value="A1">A1</option><option value="B1">B1</option><option value="C1">C1</option>
                  </select>
                </div>
                {vocabularyItems.length === 0 ? <EmptyState message={t('no_words')} darkMode={darkMode} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vocabularyItems.map((word) => (
                    <div key={word.key} className={`rounded-2xl shadow-sm p-6 border flex flex-col relative overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -z-10 ${darkMode ? 'bg-indigo-950/50' : 'bg-indigo-50'}`}></div>
                      
                      <div className="flex justify-between items-start mb-1">
                        <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>{word.english_word}</h2>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                          {word.level || 'B1'}
                        </span>
                      </div>
                      
                      {word.isPersonal ? (
                        <input aria-label={t('translation')} defaultValue={word.translation} onBlur={(event) => { if (event.target.value !== word.translation) updateWordTranslation(word, event.target.value) }} placeholder={t('add_translation')} className={`w-full rounded-lg border px-3 py-2 text-sm text-indigo-500 mb-6 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`} />
                      ) : <p className="text-indigo-500 font-bold mb-6">{word.translation}</p>}
                      
                      <div className="mt-auto">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-gray-400">{t('mastery')}</span>
                          <span className="text-indigo-500">{word.proficiency || 0}%</span>
                        </div>
                        <div className={`w-full rounded-full h-2.5 mb-4 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${word.proficiency || 0}%` }}
                          ></div>
                        </div>
                        
                        {word.isPersonal ? (
                          <div className="flex gap-2">
                            <button onClick={() => startWordReview(word)} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">{t('review')}</button>
                            <button onClick={() => deletePersonalWord(word)} aria-label={t('delete_word')} className="px-3 py-2 rounded-xl border border-red-300 text-red-500">{t('delete')}</button>
                          </div>
                        ) : (
                          <button onClick={() => saveCuratedWord(word)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">{t('save_to_my_words')}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {activeTab === 'writing' && (
              <div className="space-y-8">
                <div className={`p-6 rounded-3xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t('writing_prompt')}
                  </h3>
                  <form onSubmit={handleWritingSubmit} className="space-y-4">
                    <textarea 
                      rows="4" 
                      value={writingText}
                      onChange={(e) => setWritingText(e.target.value)}
                      placeholder={t('writing_placeholder')}
                      className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`}
                      dir="ltr"
                      required
                    ></textarea>
                    <button 
                      type="submit" 
                      disabled={submittingWriting}
                      className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                    >
                      {submittingWriting ? t('analyzing') : t('analyze_with_ai')}
                    </button>
                  </form>
                </div>

                <div className="space-y-6">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t('writing_history')}
                  </h3>
                  
                  {writings.length === 0 ? (
                    <EmptyState message={t('no_writings')} darkMode={darkMode} />
                  ) : (
                    writings.map((item) => (
                      <div key={item.id} className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400 font-bold">{new Date(item.created_at).toLocaleDateString(i18n.language === 'fa' ? 'fa-IR' : 'en-US')}</span>
                          <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-black text-sm px-3 py-1 rounded-full">
                            {t('score_value', { score: item.score })}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <span className="block text-xs font-bold text-gray-400 mb-1">{t('original_text')}:</span>
                            <p className="font-medium text-justify" dir="ltr">{item.original_text}</p>
                          </div>
                          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-indigo-950/20 border-indigo-900/50' : 'bg-indigo-50/50 border-indigo-100'}`}>
                            <span className="block text-xs font-bold text-indigo-500 mb-1">{t('corrected_text')}:</span>
                            {item.corrected_text ? <p className="font-medium text-justify text-indigo-600 dark:text-indigo-300" dir="ltr">{item.corrected_text}</p> : <p className="text-sm text-amber-600">{t('correction_unavailable')}</p>}
                          </div>
                        </div>
                        {item.feedback && <div className={`p-4 rounded-xl border text-sm ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}><strong>{t('feedback')}:</strong> {item.feedback}</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ---------------- تب کوئیز همراه با نمایش توضیحات ---------------- */}
            {activeTab === 'quiz' && (
              <div className="max-w-2xl mx-auto space-y-6">
                {!quizQuestions.length && !quizSubmitted && (
                  <div className={`p-8 rounded-3xl shadow-sm border text-center space-y-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="text-5xl">🎯</div>
                    <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t('ready_quiz')}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {t('quiz_intro')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        ['vocabulary', 'quiz_vocabulary'],
                        ['reading', 'quiz_reading'],
                        ['grammar', 'quiz_grammar'],
                      ].map(([type, label]) => (
                        <button key={type} onClick={() => startQuiz(type)} disabled={loadingQuiz} className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-sm disabled:opacity-50">
                          {loadingQuiz && quizType === type ? t('loading') : t(label)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!quizQuestions.length && !quizSubmitted && quizHistory.length > 0 && (
                  <div className={`p-6 rounded-2xl border space-y-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h4 className="font-bold">{t('quiz_history')}</h4>
                    {quizHistory.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center justify-between gap-4 border-b last:border-0 border-gray-200 dark:border-gray-700 py-2 text-sm">
                        <span>{t(`quiz_${session.quiz_type}`)} · {new Date(session.created_at).toLocaleDateString(i18n.language === 'fa' ? 'fa-IR' : 'en-US')}</span>
                        <span className="font-bold text-indigo-500">{session.score}/{session.total_questions} ({session.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                )}

                {quizQuestions.length > 0 && !quizSubmitted && (
                  <div className={`p-8 rounded-3xl shadow-sm border space-y-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                      <span>{t('question_counter', { current: currentQuestionIndex + 1, total: quizQuestions.length })}</span>
                      <span>{quizQuestions[currentQuestionIndex].level}</span>
                    </div>

                    <h4 className={`text-xl font-bold text-justify ${darkMode ? 'text-white' : 'text-gray-900'}`} dir="ltr">
                      {quizQuestions[currentQuestionIndex].question_text}
                    </h4>

                    <div className="space-y-3" dir="ltr">
                      {['A', 'B', 'C', 'D'].map((optKey) => {
                        const optText = quizQuestions[currentQuestionIndex][`option_${optKey.toLowerCase()}`];
                        if (!optText) return null;
                        return (
                          <button
                            key={optKey}
                            onClick={() => handleAnswerSelect(quizQuestions[currentQuestionIndex].id, optKey)}
                            className={`w-full text-left p-4 rounded-2xl border font-bold transition-all ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 hover:bg-indigo-900/50 hover:border-indigo-500 text-white' 
                                : 'bg-gray-50 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 text-gray-800'
                            }`}
                          >
                            <span className="inline-block w-8 text-indigo-500">{optKey}.</span> {optText}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {quizSubmitted && quizResult && (
                  <div className={`p-8 rounded-3xl shadow-sm border space-y-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="text-center space-y-4">
                      <div className="text-5xl">🏆</div>
                      <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('quiz_completed')}
                      </h3>
                      <div className="flex justify-center gap-8 py-2">
                        <div>
                          <span className="block text-gray-400 text-xs font-bold">{t('score')}</span>
                          <span className="text-2xl font-black text-indigo-500">{quizResult.score} / {quizResult.total}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-xs font-bold">{t('percentage')}</span>
                          <span className="text-2xl font-black text-green-500">{quizResult.percentage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* بخش مرور پاسخ‌ها و توضیحات آموزشی */}
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className={`font-bold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('explanations_review')}: 
                      </h4>
                      {quizResult.details.map((item, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border text-sm space-y-2 ${
                          item.is_correct 
                            ? (darkMode ? 'bg-green-950/20 border-green-900/50' : 'bg-green-50 border-green-200')
                            : (darkMode ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50 border-red-200')
                        }`}>
                          <div className="flex justify-between font-bold" dir="ltr">
                            <span className={darkMode ? 'text-white' : 'text-gray-800'}>{idx + 1}. {item.question_text}</span>
                            <span className={item.is_correct ? 'text-green-500' : 'text-red-500'}>
                              {item.is_correct ? `✓ ${t('correct')}` : `✗ ${t('correct_was', { answer: item.correct_answer })}`}
                            </span>
                          </div>
                          <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            💡 <span className="font-bold">{t('explanation')}:</span> {item.explanation}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="text-center pt-2">
                      <button 
                        onClick={() => { setQuizQuestions([]); setQuizSubmitted(false); setQuizResult(null); setCurrentQuestionIndex(0); setQuizAnswers({}) }}
                        className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-sm"
                      >
                        {t('take_another_quiz')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function InteractiveText({ text, onWordClick, darkMode }) {
  return (
    <div className={`leading-relaxed text-justify font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} dir="ltr">
      {text.split(' ').map((word, index) => {
        const cleanWord = word.replace(/[.,!?]/g, ''); 
        return (
          <span key={index}>
            <button
              type="button"
              onClick={() => onWordClick(cleanWord)}
              className={`cursor-pointer transition-colors rounded px-0.5 bg-transparent border-0 p-0 align-baseline ${darkMode ? 'hover:bg-indigo-950 hover:text-indigo-300' : 'hover:bg-indigo-100 hover:text-indigo-800'}`}
              title="Add to Vocabulary"
              aria-label={`Save word ${cleanWord}`}
            >
              {word}
            </button>
            {' '}
          </span>
        );
      })}
    </div>
  );
}

function EmptyState({ message, darkMode }) {
  return (
    <div className={`border border-dashed p-10 rounded-3xl text-center max-w-xl mx-auto ${darkMode ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-500'}`}>
      <div className="text-4xl mb-4">📂</div>
      <p className="font-bold">{message}</p>
    </div>
  )
}