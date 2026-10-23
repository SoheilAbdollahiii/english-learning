import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

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
        const refreshRes = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
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
          localStorage.clear();
          window.location.reload();
        }
      } catch (err) {
        console.error("Token refresh failed", err);
      }
    } else {
      localStorage.clear();
      window.location.reload();
    }
  }

  return response;
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [words, setWords] = useState([])
  const [articles, setArticles] = useState([])
  const [writings, setWritings] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [writingText, setWritingText] = useState('')
  const [submittingWriting, setSubmittingWriting] = useState(false)

  // کوئیز
  const [quizQuestions, setQuizQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  
  const [darkMode, setDarkMode] = useState(false)
  
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [streak, setStreak] = useState(0)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    document.dir = i18n.language === 'fa' ? 'rtl' : 'ltr'
  }, [i18n.language])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('http://127.0.0.1:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        setIsLoggedIn(true)
      } else {
        alert(t('invalid_login'))
      }
    } catch (err) {
      console.error('Login failed', err)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fa' : 'en')
  }

  useEffect(() => {
    if (!isLoggedIn) return

    setLoading(true)

    if (activeTab === 'dashboard') {
      Promise.all([
        apiFetch('http://127.0.0.1:8000/vocabulary/api/words/').then(res => res.json()),
        apiFetch('http://127.0.0.1:8000/reading/api/articles/').then(res => res.json()),
        apiFetch('http://127.0.0.1:8000/writing/api/writings/').then(res => res.json())
      ]).then(([wordsData, articlesData, writingsData]) => {
        setWords(wordsData || [])
        setArticles(articlesData || [])
        setWritings(writingsData || [])
        setLoading(false)
      }).catch(() => setLoading(false))
      return;
    }

    let endpoint = 'http://127.0.0.1:8000/reading/api/articles/'
    if (activeTab === 'vocabulary') endpoint = 'http://127.0.0.1:8000/vocabulary/api/words/'
    else if (activeTab === 'writing') endpoint = 'http://127.0.0.1:8000/writing/api/writings/'

    apiFetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (activeTab === 'vocabulary') setWords(data || [])
        else if (activeTab === 'reading') setArticles(data || [])
        else if (activeTab === 'writing') setWritings(data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error("API Error:", err)
        setLoading(false)
      })
  }, [activeTab, isLoggedIn])

  const startQuiz = async (type = 'vocabulary') => {
    setLoadingQuiz(true)
    setQuizSubmitted(false)
    setQuizResult(null)
    setCurrentQuestionIndex(0)
    setQuizAnswers({})

    try {
      const res = await apiFetch(`http://127.0.0.1:8000/quiz/api/questions/?type=${type}`)
      if (res.ok) {
        const data = await res.json()
        setQuizQuestions(data || [])
      }
    } catch (err) {
      console.error('Error fetching quiz questions:', err)
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
      const res = await apiFetch('http://127.0.0.1:8000/quiz/api/submit/', {
        method: 'POST',
        body: JSON.stringify({
          quiz_type: 'vocabulary',
          answers: finalAnswers
        })
      });

      if (res.ok) {
        const resultData = await res.json();
        setQuizResult(resultData);
        setQuizSubmitted(true);
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('last_login_date');
    let currentStreak = parseInt(localStorage.getItem('user_streak') || '0', 10);

    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLogin === yesterday.toDateString()) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      localStorage.setItem('last_login_date', today);
      localStorage.setItem('user_streak', currentStreak.toString());
    }
    setStreak(currentStreak);

    const daysFa = ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDays = i18n.language === 'fa' ? daysFa : daysEn;
    
    const newChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      newChartData.push({
        name: currentDays[d.getDay()],
        words: i === 0 ? words.length : Math.max(0, words.length - (i * 2))
      });
    }
    setChartData(newChartData);
  }, [isLoggedIn, i18n.language, words.length]);

  const handleWordClick = async (word) => {
    const mockTranslation = "ترجمه: " + word; 
    try {
      const res = await apiFetch('http://127.0.0.1:8000/vocabulary/api/words/', {
        method: 'POST',
        body: JSON.stringify({
          english_word: word,
          translation: mockTranslation,
          level: 'B1',
          proficiency: 10
        })
      });
      if (res.ok) {
        alert(i18n.language === 'fa' ? `لغت "${word}" ذخیره شد.` : `Word "${word}" saved!`);
      }
    } catch (err) {
      console.error('Error saving word:', err);
    }
  };

  const handleWritingSubmit = async (e) => {
    e.preventDefault();
    if (!writingText.trim()) return;

    setSubmittingWriting(true);
    try {
      const res = await apiFetch('http://127.0.0.1:8000/writing/api/writings/', {
        method: 'POST',
        body: JSON.stringify({ original_text: writingText })
      });

      if (res.ok) {
        const newSubmission = await res.json();
        setWritings([newSubmission, ...writings]);
        setWritingText('');
        alert(i18n.language === 'fa' ? 'متن شما با موفقیت توسط هوش مصنوعی بررسی شد!' : 'Writing analyzed successfully!');
      }
    } catch (err) {
      console.error('Error submitting writing:', err);
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
            <h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('login')}</h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className={`appearance-none rounded-xl block w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder={t('username')} />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`appearance-none rounded-xl block w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder={t('password')} />
            </div>
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              {t('login')}
            </button>
          </form>
          <div className="flex gap-2 pt-4">
            <button onClick={toggleLanguage} className="flex-1 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
              {i18n.language === 'en' ? '🇮🇷 فارسی' : '🇬🇧 English'}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="flex-1 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
              {darkMode ? '☀️ روشن' : '🌙 تاریک'}
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
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className={`font-extrabold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('app_title')}</span>
              </div>
              
              <div className="flex gap-3 sm:gap-6">
                <button onClick={() => setActiveTab('dashboard')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {i18n.language === 'en' ? 'Dashboard' : 'داشبورد'}
                </button>
                <button onClick={() => setActiveTab('reading')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'reading' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_reading')}
                </button>
                <button onClick={() => setActiveTab('vocabulary')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'vocabulary' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t('tab_vocabulary')}
                </button>
                <button onClick={() => setActiveTab('writing')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'writing' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {i18n.language === 'en' ? 'AI Writing' : 'رایتینگ'}
                </button>
                <button onClick={() => setActiveTab('quiz')} className={`px-1 pt-1 border-b-2 text-sm font-bold transition-colors ${activeTab === 'quiz' ? 'border-indigo-600 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {i18n.language === 'en' ? 'Quiz' : 'آزمون'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={toggleLanguage} className="text-lg hover:scale-110 transition-transform p-1">
                  {i18n.language === 'en' ? '🇮🇷' : '🇬🇧'}
                </button>
                <button onClick={() => setDarkMode(!darkMode)} className="text-lg hover:scale-110 transition-transform p-1">
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
            {activeTab === 'reading' ? t('reading_title') : activeTab === 'vocabulary' ? t('vocab_title') : activeTab === 'writing' ? (i18n.language === 'en' ? 'AI Writing Assistant' : 'دستیار رایتینگ هوشمند') : activeTab === 'quiz' ? (i18n.language === 'en' ? 'Skill Assessment Quiz' : 'آزمون سنجش مهارت') : (i18n.language === 'en' ? 'Your Dashboard' : 'داشبورد شما')}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center items-center transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-2">{t('vocab_title')}</h3>
                    <p className="text-5xl font-black text-indigo-500">{words.length}</p>
                  </div>
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center items-center transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-2">{t('tab_reading')}</h3>
                    <p className="text-5xl font-black text-green-500">{articles.length}</p>
                  </div>
                  <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-center items-center transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="text-gray-400 font-bold mb-2">{i18n.language === 'en' ? 'Daily Streak' : 'روزهای متوالی'}</h3>
                    <p className="text-5xl font-black text-orange-500">{streak} ⚡</p>
                  </div>
                </div>
                
                <div className={`p-6 rounded-2xl shadow-sm border h-96 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {i18n.language === 'en' ? 'Activity (Last 7 Days)' : 'فعالیت ۷ روز گذشته'}
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
                      <Area type="monotone" dataKey="words" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorWords)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'reading' && (
              articles.length === 0 ? <EmptyState message={t('no_articles')} darkMode={darkMode} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articles.map((article) => (
                    <article key={article.id} className={`rounded-2xl shadow-sm border flex flex-col overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className="h-2 bg-indigo-500"></div>
                      <div className="p-6 flex flex-col flex-grow">
                        <h2 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{article.title}</h2>
                        <div className="mb-6 flex-grow text-sm">
                          <InteractiveText text={article.content} onWordClick={handleWordClick} darkMode={darkMode} />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )
            )}

            {activeTab === 'vocabulary' && (
              words.length === 0 ? <EmptyState message={t('no_words')} darkMode={darkMode} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {words.map((word) => (
                    <div key={word.id} className={`rounded-2xl shadow-sm p-6 border flex flex-col relative overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -z-10 ${darkMode ? 'bg-indigo-950/50' : 'bg-indigo-50'}`}></div>
                      
                      <div className="flex justify-between items-start mb-1">
                        <h2 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>{word.english_word}</h2>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                          {word.level || 'B1'}
                        </span>
                      </div>
                      
                      <p className="text-indigo-500 font-bold mb-6">{word.translation}</p>
                      
                      <div className="mt-auto">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-gray-400">{i18n.language === 'en' ? 'Mastery' : 'میزان تسلط'}</span>
                          <span className="text-indigo-500">{word.proficiency || 0}%</span>
                        </div>
                        <div className={`w-full rounded-full h-2.5 mb-4 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${word.proficiency || 0}%` }}
                          ></div>
                        </div>
                        
                        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                          {t('practice')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'writing' && (
              <div className="space-y-8">
                <div className={`p-6 rounded-3xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {i18n.language === 'en' ? 'Write something in English for AI analysis:' : 'متن انگلیسی خود را برای بررسی هوش مصنوعی بنویسید:'}
                  </h3>
                  <form onSubmit={handleWritingSubmit} className="space-y-4">
                    <textarea 
                      rows="4" 
                      value={writingText}
                      onChange={(e) => setWritingText(e.target.value)}
                      placeholder={i18n.language === 'en' ? 'Type your paragraph here...' : 'پاراگراف خود را اینجا بنویسید...'}
                      className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 text-gray-900 placeholder-gray-400'}`}
                      dir="ltr"
                      required
                    ></textarea>
                    <button 
                      type="submit" 
                      disabled={submittingWriting}
                      className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                    >
                      {submittingWriting ? (i18n.language === 'en' ? 'Analyzing...' : 'در حال تحلیل...') : (i18n.language === 'en' ? 'Analyze with AI' : 'ارسال برای تحلیل هوش مصنوعی')}
                    </button>
                  </form>
                </div>

                <div className="space-y-6">
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {i18n.language === 'en' ? 'Your Writing History' : 'تاریخچه رایتینگ‌های شما'}
                  </h3>
                  
                  {writings.length === 0 ? (
                    <EmptyState message={i18n.language === 'en' ? 'No writing submissions yet.' : 'هنوز رایتینگی ثبت نشده است.'} darkMode={darkMode} />
                  ) : (
                    writings.map((item) => (
                      <div key={item.id} className={`p-6 rounded-2xl shadow-sm border space-y-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400 font-bold">{new Date(item.created_at).toLocaleDateString()}</span>
                          <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-black text-sm px-3 py-1 rounded-full">
                            {i18n.language === 'en' ? `Score: ${item.score}/100` : `امتیاز: ${item.score} از ۱۰۰`}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <span className="block text-xs font-bold text-gray-400 mb-1">Original Text:</span>
                            <p className="font-medium text-justify" dir="ltr">{item.original_text}</p>
                          </div>
                          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-indigo-950/20 border-indigo-900/50' : 'bg-indigo-50/50 border-indigo-100'}`}>
                            <span className="block text-xs font-bold text-indigo-500 mb-1">AI Corrected Version:</span>
                            <p className="font-medium text-justify text-indigo-600 dark:text-indigo-300" dir="ltr">{item.corrected_text}</p>
                          </div>
                        </div>
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
                      {i18n.language === 'en' ? 'Ready to test your knowledge?' : 'آماده‌ای دانش خود رو بسنجی؟'}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {i18n.language === 'en' ? 'Take a short quiz based on your learned vocabulary and skills with detailed explanations.' : 'یک آزمون کوتاه همراه با توضیحات آموزشی برای ارتقای یادگیری بدهید.'}
                    </p>
                    <button 
                      onClick={() => startQuiz('vocabulary')}
                      disabled={loadingQuiz}
                      className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-sm"
                    >
                      {loadingQuiz ? (i18n.language === 'en' ? 'Loading...' : 'در حال بارگذاری...') : (i18n.language === 'en' ? 'Start Vocabulary Quiz' : 'شروع آزمون لغت')}
                    </button>
                  </div>
                )}

                {quizQuestions.length > 0 && !quizSubmitted && (
                  <div className={`p-8 rounded-3xl shadow-sm border space-y-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                      <span>{i18n.language === 'en' ? `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}` : `سوال ${currentQuestionIndex + 1} از ${quizQuestions.length}`}</span>
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
                        {i18n.language === 'en' ? 'Quiz Completed & Analyzed!' : 'آزمون به پایان رسید و تحلیل شد!'}
                      </h3>
                      <div className="flex justify-center gap-8 py-2">
                        <div>
                          <span className="block text-gray-400 text-xs font-bold">{i18n.language === 'en' ? 'Score' : 'امتیاز'}</span>
                          <span className="text-2xl font-black text-indigo-500">{quizResult.score} / {quizResult.total}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-xs font-bold">{i18n.language === 'en' ? 'Percentage' : 'درصد موفقیت'}</span>
                          <span className="text-2xl font-black text-green-500">{quizResult.percentage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* بخش مرور پاسخ‌ها و توضیحات آموزشی */}
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className={`font-bold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {i18n.language === 'en' ? 'Detailed Explanations & Review:' : 'مرور پاسخ‌ها و توضیحات آموزشی:'}
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
                              {item.is_correct ? '✓ Correct' : `✗ Correct was: ${item.correct_answer}`}
                            </span>
                          </div>
                          <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            💡 <span className="font-bold">Explanation:</span> {item.explanation}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="text-center pt-2">
                      <button 
                        onClick={() => setQuizQuestions([])}
                        className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-sm"
                      >
                        {i18n.language === 'en' ? 'Take Another Quiz' : 'آزمون مجدد'}
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
            <span
              onClick={() => onWordClick(cleanWord)}
              className={`cursor-pointer transition-colors rounded px-0.5 ${darkMode ? 'hover:bg-indigo-950 hover:text-indigo-300' : 'hover:bg-indigo-100 hover:text-indigo-800'}`}
              title="Add to Vocabulary"
            >
              {word}
            </span>
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