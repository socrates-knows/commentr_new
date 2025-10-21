import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function generatePost({ startup, platform, goal, tone, knowledgeContext, additionalInfo }) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are an expert content creator for ${startup.name}, a startup that ${startup.description}.

STARTUP CONTEXT:
Name: ${startup.name}
Description: ${startup.description}
Website: ${startup.website || 'N/A'}

KNOWLEDGE BASE:
${knowledgeContext || 'Use the startup description above.'}

${additionalInfo ? `ADDITIONAL CONTEXT FOR THIS POST:\n${additionalInfo}\n` : ''}

TASK: Create 3 unique, authentic ${platform} posts.

GOAL: ${goal}
${getGoalExplanation(goal)}

TONE: ${tone}
${getToneExplanation(tone)}

PLATFORM: ${platform}
${getPlatformGuidelines(platform)}

CRITICAL REQUIREMENTS:
1. DIRECTLY address the goal "${goal}" - don't be generic
2. Use SPECIFIC details from the startup context
3. Sound like a real founder, not an AI
4. ${goal === 'announce' ? 'Announce something specific about the product' : ''}
${goal === 'feedback' ? 'Ask for specific feedback on a feature or direction' : ''}
${goal === 'milestone' ? 'Share a specific milestone with numbers/metrics' : ''}
${goal === 'buildinpublic' ? 'Share behind-the-scenes progress or learnings' : ''}
${goal === 'question' ? 'Ask a genuine question to the community' : ''}
${goal === 'tips' ? 'Share actionable tips or lessons learned' : ''}

EXAMPLES OF WHAT TO AVOID:
- "We're excited to announce..." (too corporate)
- Generic statements that could apply to any startup
- Overly promotional language
- Buzzwords without substance

EXAMPLES OF GOOD POSTS:
- Specific numbers and progress
- Personal stories and challenges
- Concrete problems being solved
- Real questions from real struggles

Return ONLY a JSON array with 3 posts:
[
  {"content": "post 1 here"},
  {"content": "post 2 here"},
  {"content": "post 3 here"}
]

Each post should be DIFFERENT in approach but all achieve the same goal.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI')
    }
    
    const posts = JSON.parse(jsonMatch[0])
    return posts

  } catch (error) {
    console.error('Error generating content:', error)
    throw error
  }
}

export async function generateReply({ startup, threadContext, includeContext, includeCTA, knowledgeContext }) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `You are replying on behalf of ${startup.name}, a startup that ${startup.description}.

STARTUP CONTEXT:
${startup.name} - ${startup.description}

KNOWLEDGE BASE:
${knowledgeContext || 'Use the startup description above.'}

THREAD YOU'RE REPLYING TO:
${threadContext}

TASK: Generate 3 authentic, helpful replies.

REQUIREMENTS:
- Be genuinely helpful first, promotional second
- ${includeContext ? 'Reference specific points from the thread' : 'Keep it general and helpful'}
- ${includeCTA ? 'Naturally mention ' + startup.name + ' ONLY if highly relevant' : 'Do NOT mention the product at all'}
- Sound like a real person, not a company
- Add actual value to the discussion
- Use the poster's language and tone

AVOID:
- "As a [startup name] founder..." (too formal)
- Forced product mentions
- Generic advice that could apply to anything
- Sales-y language

GOOD EXAMPLES:
- "I struggled with this exact problem for months. What worked for me was..."
- "Have you tried [specific solution]? We found it helped when..."
- "This is a great question. In my experience..."

Return ONLY a JSON array:
[
  {"content": "reply 1"},
  {"content": "reply 2"},
  {"content": "reply 3"}
]`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI')
    }
    
    const replies = JSON.parse(jsonMatch[0])
    return replies

  } catch (error) {
    console.error('Error generating reply:', error)
    throw error
  }
}

function getGoalExplanation(goal) {
  const explanations = {
    announce: `This means you should:
- Announce a NEW feature, product launch, or update
- Be exciting but authentic
- Include what it does and why it matters
- Invite people to try it or give feedback`,

    feedback: `This means you should:
- Ask for SPECIFIC feedback on a feature, design, or direction
- Show what you're working on
- Ask clear questions
- Show you genuinely want input`,

    milestone: `This means you should:
- Share a SPECIFIC achievement with numbers
- Examples: "Hit 100 users", "Processed 1000 posts", "$1k MRR"
- Be proud but humble
- Thank supporters if relevant`,

    buildinpublic: `This means you should:
- Share what you're CURRENTLY working on
- Show progress, challenges, or learnings
- Be transparent about the journey
- Give behind-the-scenes insights`,

    question: `This means you should:
- Ask a GENUINE question you need help with
- Show the context of why you're asking
- Be specific enough that people can help
- Show you're open to suggestions`,

    tips: `This means you should:
- Share SPECIFIC, actionable advice
- Based on real experience
- Include examples or how-to steps
- Help others avoid your mistakes`
  }

  return explanations[goal] || ''
}

function getToneExplanation(tone) {
  const explanations = {
    casual: `Casual tone means:
- Friendly and approachable
- Use contractions (I'm, we're, don't)
- Conversational language
- Can use emojis sparingly
- Like talking to a friend`,

    technical: `Technical tone means:
- Data-driven and precise
- Use specific metrics and numbers
- Professional but not stuffy
- Focus on how things work
- Detailed and informative`,

    storyteller: `Storyteller tone means:
- Narrative and engaging
- Set the scene
- Use "I" and "we" 
- Share the journey
- Make it personal and relatable`
  }

  return explanations[tone] || ''
}

function getPlatformGuidelines(platform) {
  const guidelines = {
    reddit: `Reddit-specific rules:
- NO promotional language
- Add REAL value first
- Be part of the community
- Longer, detailed posts work well
- Tell stories, share experiences
- Avoid anything that sounds like marketing
- Max 300-500 words`,
    
    twitter: `Twitter-specific rules:
- Keep under 280 characters
- Strong hook in first 5 words
- Use line breaks for readability
- 1-2 emojis max
- Make every word count
- Can be punchy and bold`,
    
    indiehackers: `IndieHackers-specific rules:
- Founder-to-founder tone
- Share REAL metrics
- Be transparent about challenges
- Ask for help when needed
- Focus on lessons learned
- Community-first mindset
- 200-400 words ideal`,
    
    linkedin: `LinkedIn-specific rules:
- Professional but personal
- Lead with a hook or insight
- Use paragraph breaks
- Share expertise and learnings
- Can be 300-500 words
- Focus on value and knowledge sharing
- Professional credibility matters`
  }

  return guidelines[platform.toLowerCase()] || guidelines.reddit
}