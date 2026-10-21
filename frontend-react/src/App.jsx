import { useState, useEffect } from 'react'

export default function App() {
  const [activeTab, setActiveTab] = useState('reading')
  const [words, setWords] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  // دریافت داده‌ها بر اساس تب فعال
  useEffect(() => {
    setLoading(true)
    const endpoint = activeTab === 'vocabulary' 
      ? 'http://127.0.0.1:8000/vocabulary/api/words/'
      : 'http://127.0.0.1:8000/reading/api/articles/'

    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (activeTab === 'vocabulary') setWords(data)
        else setArticles(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("API Error:", err)
        setLoading(false)
      })
  }, [activeTab])

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation / Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className="font-extrabold text-xl text-gray-900 tracking-tight">AI Tutor</span>
              </div>
              <div className="flex space-x-8">
                <button 
                  onClick={() => setActiveTab('reading')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'reading' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Reading
                </button>
                <button 
                  onClick={() => setActiveTab('vocabulary')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'vocabulary' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Vocabulary
                </button>
              </div>
            </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            {activeTab === 'reading' ? 'Reading Comprehension' : 'Vocabulary Bank'}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {activeTab === 'reading' 
              ? 'Enhance your reading skills with AI-curated articles tailored to your exact proficiency level.' 
              : 'Master new words systematically. Review, pronounce, and track your daily progress.'}
          </p>
        </div>

        {/* Loading Skeletons (Commercial standard) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-20 bg-gray-100 rounded w-full mb-4"></div>
                <div className="h-8 bg-indigo-50 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Articles View */}
            {activeTab === 'reading' && (
              articles.length === 0 ? (
                <EmptyState message="No articles found. Please add some via Django Admin." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articles.map((article) => (
                    <article key={article.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group cursor-pointer">
                      <div className="h-3 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
                            Level {article.level}
                          </span>
                          <span className="text-xs text-gray-400 font-medium flex items-center">
                            ⏳ 3 min read
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                        <p className="text-gray-500 text-sm mb-6 line-clamp-3 flex-grow">
                          {article.content}
                        </p>
                        <button className="w-full py-2.5 bg-gray-50 hover:bg-indigo-50 text-indigo-600 font-semibold rounded-xl text-sm transition-colors border border-gray-100 hover:border-indigo-100">
                          Start Reading
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )
            )}

            {/* Vocabulary View */}
            {activeTab === 'vocabulary' && (
              words.length === 0 ? (
                <EmptyState message="No words found. Please add some via Django Admin." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {words.map((word) => (
                    <div key={word.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -z-10"></div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">{word.english_word}</h2>
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md">
                          {word.level}
                        </span>
                      </div>
                      <p className="text-indigo-600 font-medium mb-4">{word.translation}</p>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                         <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">
                           Practice
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  )
}

// کامپوننت کمکی برای حالت خالی بودن دیتابیس
function EmptyState({ message }) {
  return (
    <div className="bg-yellow-50 border border-yellow-100 p-8 rounded-2xl text-center max-w-2xl mx-auto">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-yellow-800 font-medium">{message}</p>
    </div>
  )
}