import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // 1. Search with Tavily API
    const tavilyResponse = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: 'basic',
        max_results: 5
      }
    )

    const searchResults = tavilyResponse.data.results || []
    const sources = searchResults.slice(0, 5).map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.content?.substring(0, 150) || ''
    }))

    // 2. Generate summary with Gemini
    const resultsText = searchResults
      .map((r: any) => `${r.title}: ${r.content}`)
      .join('\n\n')

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Summarize the following search results about "${query}" in 2-3 concise sentences:\n\n${resultsText}`
          }]
        }]
      }
    )

    const summary = geminiResponse.data.candidates[0]?.content?.parts[0]?.text || 'No summary available'

    // 3. Save to Supabase
    await supabase
      .from('searches')
      .insert({
        query: query,
        summary: summary,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      query,
      summary,
      sources,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Search API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process search' },
      { status: 500 }
    )
  }
}
