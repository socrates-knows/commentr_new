import { NextResponse } from 'next/server'
import { generatePost } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'

// Create admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request) {
  try {
    const { userId, startupId, platform, goal, tone, additionalInfo } = await request.json()

    if (!userId || !startupId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get startup info using admin client
    const { data: startup, error: startupError } = await supabaseAdmin
      .from('startups')
      .select('*')
      .eq('id', startupId)
      .eq('user_id', userId) // Ensure user owns this startup
      .single()

    if (startupError || !startup) {
      console.error('Startup fetch error:', startupError)
      return NextResponse.json(
        { error: 'Startup not found or access denied' },
        { status: 404 }
      )
    }

    // Get knowledge context using admin client
    const { data: knowledgeItems } = await supabaseAdmin
      .from('knowledge_items')
      .select('content')
      .eq('startup_id', startupId)
      .limit(5)

    const knowledgeContext = knowledgeItems
      ?.map(item => item.content)
      .filter(content => content) // Remove empty items
      .join('\n\n') || ''

    // Generate posts with Gemini
    const posts = await generatePost({
      startup,
      platform,
      goal,
      tone,
      knowledgeContext,
      additionalInfo: additionalInfo || ''
    })

    return NextResponse.json({ posts })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate posts' },
      { status: 500 }
    )
  }
}