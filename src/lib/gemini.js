import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function generatePost({ startup, platform, goal, tone, knowledgeContext, additionalInfo }) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
      }
    })

    const platformCharLimit = getPlatformCharLimit(platform)
    const examplePosts = getFewShotExamples(platform, goal, tone)

    const prompt = `You are an expert social media content strategist and copywriter specializing in authentic founder-led content for ${startup.name}.

STARTUP CONTEXT:
Name: ${startup.name}
Description: ${startup.description}
Website: ${startup.website || 'N/A'}

KNOWLEDGE BASE:
${knowledgeContext || 'Use the startup description above.'}

${additionalInfo ? `ADDITIONAL CONTEXT FOR THIS POST:\n${additionalInfo}\n` : ''}

TASK: Create 3 unique, highly authentic ${platform} posts that sound like they were written by the founder themselves.

GOAL: ${goal}
${getGoalExplanation(goal)}

TONE: ${tone}
${getToneExplanation(tone)}

PLATFORM: ${platform}
${getPlatformGuidelines(platform)}

${examplePosts ? `EXCELLENT EXAMPLES FOR THIS PLATFORM/GOAL:\n${examplePosts}\n` : ''}

CRITICAL REQUIREMENTS:
1. DIRECTLY address the goal "${goal}" - be specific, not generic
2. Use SPECIFIC details from the startup context (name, description, features)
3. Sound like a REAL founder, not an AI or marketing copy
4. Stay within ${platformCharLimit} character limit for ${platform}
5. Each post should take a DIFFERENT angle (e.g., problem-focused, solution-focused, story-focused)
6. Include specific metrics, numbers, or concrete details when relevant
7. Use authentic language - contractions, simple words, personal voice
8. ${goal === 'announce' ? 'Announce something SPECIFIC - a feature, update, or launch with clear details' : ''}
${goal === 'feedback' ? 'Ask for SPECIFIC feedback on a feature, design, or decision you need help with' : ''}
${goal === 'milestone' ? 'Share a SPECIFIC achievement with numbers (users, revenue, posts processed, etc.)' : ''}
${goal === 'buildinpublic' ? 'Share SPECIFIC behind-the-scenes work, challenges, or lessons from this week' : ''}
${goal === 'question' ? 'Ask a GENUINE question you actually need answered, with context' : ''}
${goal === 'tips' ? 'Share SPECIFIC, actionable advice based on your real experience building this product' : ''}

RED FLAGS TO AVOID:
- "We're excited to announce..." (too corporate)
- "Thrilled to share..." (sounds like PR speak)
- Generic statements that could apply to any startup
- Buzzwords: "game-changing", "revolutionary", "cutting-edge"
- Overly promotional language
- Vague claims without specifics
- Perfect grammar that sounds too polished (founders make typos!)

GOOD POST PATTERNS:
- Start with a specific number or metric
- Lead with a personal story or challenge
- Ask a direct question to the reader
- Share a specific behind-the-scenes detail
- Reference a concrete problem being solved
- Use "I" or "we" - make it personal

Return ONLY a valid JSON array with 3 posts (no markdown, no code blocks, just the JSON):
[
  {"content": "post 1 here"},
  {"content": "post 2 here"},
  {"content": "post 3 here"}
]

IMPORTANT: Each post must:
- Be unique in approach and angle
- Achieve the same goal (${goal})
- Match the tone (${tone})
- Be platform-appropriate for ${platform}
- Stay under ${platformCharLimit} characters`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response with multiple fallback strategies
    let posts
    try {
      // Try 1: Clean JSON with code block removal
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      // Try 2: Extract JSON array
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        posts = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found in response')
      }

      // Validate structure
      if (!Array.isArray(posts) || posts.length !== 3) {
        throw new Error('Expected array of 3 posts')
      }

      // Ensure each post has content
      posts = posts.map((post, i) => ({
        content: post.content || post.text || `Generated post ${i + 1}`
      }))

    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Raw response:', text)

      // Fallback: Create generic posts
      posts = [
        { content: "Error generating post. Please try again with more specific details." },
        { content: "Error generating post. Please try again with more specific details." },
        { content: "Error generating post. Please try again with more specific details." }
      ]
    }

    return posts

  } catch (error) {
    console.error('Error generating content:', error)
    throw error
  }
}

export async function generateReply({ startup, threadContext, includeContext, includeCTA, knowledgeContext }) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.85,
        topK: 40,
        topP: 0.9,
      }
    })

    const prompt = `You are a founder helping other founders. You run ${startup.name}, which ${startup.description}.

STARTUP CONTEXT:
${startup.name} - ${startup.description}

KNOWLEDGE BASE:
${knowledgeContext || 'Use the startup description above.'}

THREAD YOU'RE REPLYING TO:
${threadContext}

TASK: Generate 3 authentic, genuinely helpful replies to this thread.

CRITICAL REQUIREMENTS:
- Be HELPFUL FIRST, promotional never (unless specifically asked)
- ${includeContext ? 'Reference SPECIFIC points from the thread - show you actually read it' : 'Keep it general but still valuable'}
- ${includeCTA ? 'You MAY mention ' + startup.name + ' IF it genuinely solves their problem (not forced)' : 'Do NOT mention your product at all - just be helpful'}
- Sound like a REAL PERSON having a conversation, not a company
- Add ACTUAL VALUE - share experience, insights, or actionable advice
- Match the poster's tone and language style
- Be concise - don't over-explain

AVOID AT ALL COSTS:
- "As a ${startup.name} founder..." (too formal and self-promotional)
- "Have you tried ${startup.name}?" (too salesy unless they asked)
- Forced product mentions that feel unnatural
- Generic advice that anyone could give
- Corporate or sales-y language
- "I'd be happy to help!" (too customer service-y)
- "Feel free to reach out" (sounds like a sales pitch)

EXCELLENT REPLY PATTERNS:
- "I struggled with this exact thing for 6 months. What finally worked was..."
- "This is a great question. In my experience, [specific insight]..."
- "Had the same problem. Here's what I learned: [actionable advice]"
- "Not sure if this helps, but when we faced this, we tried [solution]..."
- "I've seen this pattern before. Usually it means [insight]. Try [specific action]."

${includeCTA ? `IF AND ONLY IF your product genuinely solves their specific problem, you can mention it like:
- "We actually built ${startup.name} because of this exact problem. Happy to share what we learned."
- "This is why we made ${startup.name} - DM me if you want to chat about it."
BUT only if it's truly relevant. When in doubt, don't mention it.` : ''}

Return ONLY a valid JSON array (no markdown, no code blocks):
[
  {"content": "reply 1"},
  {"content": "reply 2"},
  {"content": "reply 3"}
]

Each reply should:
- Take a different helpful approach
- Be genuine and conversational
- Add real value to the discussion
- Feel like something a helpful founder would actually write`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON with fallback handling
    let replies
    try {
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/)

      if (jsonMatch) {
        replies = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found')
      }

      if (!Array.isArray(replies) || replies.length !== 3) {
        throw new Error('Expected array of 3 replies')
      }

      replies = replies.map((reply, i) => ({
        content: reply.content || reply.text || `Generated reply ${i + 1}`
      }))

    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Raw response:', text)

      replies = [
        { content: "I'd be happy to help with this. Could you share more details about what you've tried so far?" },
        { content: "This is an interesting challenge. In my experience, the key is to start small and iterate." },
        { content: "Great question. I've found that breaking this down into smaller steps usually helps." }
      ]
    }

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
- NO promotional language - you'll get downvoted
- Add REAL value first, mention product last (if at all)
- Be part of the community, not a marketer
- Longer, detailed posts work well (300-500 words)
- Tell stories, share experiences, be vulnerable
- Use formatting: paragraphs, bullet points, emphasis
- Avoid anything that sounds like marketing
- Be helpful and genuine`,

    twitter: `Twitter-specific rules:
- Keep under 280 characters (strict limit)
- Strong hook in first 5-10 words
- Use line breaks for readability
- 1-2 emojis max (use sparingly)
- Make every word count - delete fluff
- Can be punchy and bold
- Thread if needed (but prefer single tweets)`,

    indiehackers: `IndieHackers-specific rules:
- Founder-to-founder tone - speak as peers
- Share REAL metrics and numbers
- Be transparent about challenges and failures
- Ask for help when needed - community is supportive
- Focus on lessons learned and insights
- Community-first mindset - give before asking
- 200-400 words ideal
- Use subheadings and formatting`,

    linkedin: `LinkedIn-specific rules:
- Professional but personal - not corporate
- Lead with a hook or insight in first line
- Use paragraph breaks (single line = paragraph)
- Share expertise and learnings
- Can be 300-500 words
- Focus on value and knowledge sharing
- Professional credibility matters
- Can use light emojis as bullet points`
  }

  return guidelines[platform.toLowerCase()] || guidelines.reddit
}

function getPlatformCharLimit(platform) {
  const limits = {
    twitter: 280,
    reddit: 2500,
    indiehackers: 2000,
    linkedin: 3000
  }
  return limits[platform.toLowerCase()] || 2000
}

function getFewShotExamples(platform, goal, tone) {
  // Few-shot examples for better generation
  const examples = {
    twitter: {
      milestone: `Example 1 (casual): "Just hit 1,000 users on our side project 🎉\n\nStarted 3 months ago as a weekend hack.\n\nNow processing 10k+ AI-generated posts.\n\nStill can't believe this is real."

Example 2 (technical): "Milestone: 1,000 active users\nTime: 90 days\nConversion: 8.2%\nChurn: <2%\n\nWe focused on one thing: making AI content actually sound human.\n\nIt worked."`,

      buildinpublic: `Example 1 (casual): "3am debugging session:\n\n❌ Coffee\n❌ Stack Overflow\n✅ Rubber duck\n\nThe duck won. Bug fixed.\n\nBuilding in public means sharing the weird wins too."

Example 2 (storyteller): "Rewrote our AI prompt 47 times yesterday.\n\n#1-30: Garbage\n#31-45: Slightly less garbage\n#46: Almost there\n#47: Perfect\n\nThis is what 'build in public' really looks like."`
    },
    reddit: {
      feedback: `Example 1 (casual): "Hey r/startups - would love your honest feedback on something I'm stuck on.\n\nWe built an AI tool that generates social media posts for founders. Works great, but I'm torn on pricing:\n\nOption A: $24/mo for 100 posts (targets side project folks)\nOption B: $69/mo for 500 posts (targets serious builders)\n\nI genuinely can't decide. What would make YOU actually pull out your credit card?\n\nNot looking for 'nice job' comments - I want brutal honesty. What's missing? What's wrong with these options?"`,

      tips: `Example 1 (technical): "Spent 6 months trying to make AI-generated content sound human. Here's what actually worked:\n\n1. Temperature > 0.9 (counterintuitive but works)\n2. Few-shot examples from real founders (not marketing copy)\n3. Add intentional imperfections (real people make typos)\n4. Track what users edit - that's your training data\n5. Platform-specific prompts (Reddit ≠ Twitter)\n\nThe magic isn't in the model. It's in the prompt engineering and post-processing.\n\nHappy to share our exact prompts if anyone wants them."`
    }
  }

  const platformExamples = examples[platform.toLowerCase()]
  return platformExamples?.[goal] || null
}