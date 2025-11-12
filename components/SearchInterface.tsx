'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null

interface SearchResult {
  query: string
  summary: string
  sources: Array<{ title: string; url: string; snippet: string }>
  timestamp: string
}

export default function SearchInterface() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [recentSearches, setRecentSearches] = useState<any[]>([])
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchRecentSearches()
  }, [])

  const fetchRecentSearches = async () => {
    const { data } = await supabase
          if (!supabase) {
      setRecentSearches([])
      return
    }
      .from('searches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setRecentSearches(data)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await response.json()
      setResult(data)
      fetchRecentSearches()
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Lisa Search
        </h1>
        <p className="text-gray-600 dark:text-gray-300">AI-Powered Smart Search Engine</p>
      </div>

      {/* Theme Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 px-6 py-4 rounded-full border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-full transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Loading Animation */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Generating AI summary...</p>
        </div>
      )}

      {/* Search Result */}
      {result && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Summary</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{result.summary}</p>
          
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sources</h3>
          <div className="space-y-3">
            {result.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">{source.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{source.url}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{source.snippet}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Searches</h3>
          <div className="space-y-2">
            {recentSearches.map((search, idx) => (
              <div
                key={idx}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => setQuery(search.query)}
              >
                <p className="font-medium text-gray-900 dark:text-white">{search.query}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(search.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
