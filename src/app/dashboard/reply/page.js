'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './reply.module.css'

export default function Reply() {
  const [user, setUser] = useState(null)
  const [startup, setStartup] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  const [threadUrl, setThreadUrl] = useState('')
  const [includeContext, setIncludeContext] = useState(true)
  const [includeCTA, setIncludeCTA] = useState(false)
  const [generatedReplies, setGeneratedReplies] = useState([])
  const [selectedReply, setSelectedReply] = useState(null)
  const [threadPreview, setThreadPreview] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      router.push('/auth/signin')
      return
    }
    setUser(user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(profileData)

    const { data: startupData } = await supabase
      .from('startups')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!startupData) {
      router.push('/onboarding')
      return
    }

    setStartup(startupData)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAnalyze = async () => {
    if (!threadUrl) {
      alert('Please enter a thread URL')
      return
    }

    if (profile.usage_count >= profile.usage_limit) {
      alert('You have reached your usage limit. Please upgrade your plan.')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      // Mock thread preview for now (can implement real scraping later)
      setThreadPreview({
        title: 'Thread title from URL',
        author: 'username',
        platform: 'Reddit',
        snippet: 'Thread content preview...'
      })

      const response = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          startupId: startup.id,
          threadContext: `URL: ${threadUrl}\nContext: User discussion about relevant topic`,
          includeContext,
          includeCTA
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate replies')
      }

      setGeneratedReplies(data.replies)
      setSelectedReply(0)

      // Increment usage count
      const newUsageCount = profile.usage_count + 1
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ usage_count: newUsageCount })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating usage:', updateError)
      } else {
        setProfile({ ...profile, usage_count: newUsageCount })
      }

    } catch (error) {
      console.error('Error:', error)
      setError(error.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content)
    alert('Copied to clipboard!')
  }

  const handleSave = async () => {
    if (!generatedReplies[selectedReply]) return

    try {
      const content = generatedReplies[selectedReply].content

      const { error } = await supabase
        .from('generated_content')
        .insert({
          startup_id: startup.id,
          user_id: user.id,
          platform: 'reply',
          content_type: 'reply',
          generated_text: content,
          status: 'draft'
        })

      if (error) throw error

      alert('Saved to history!')
      router.push('/dashboard/history')
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error saving content')
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>commentr</div>
        </div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navItem}>
            <span className={styles.navIcon}>◆</span>
            Dashboard
          </Link>
          <Link href="/dashboard/generate" className={styles.navItem}>
            <span className={styles.navIcon}>+</span>
            Generate
          </Link>
          <Link href="/dashboard/reply" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.navIcon}>↩</span>
            Reply
          </Link>
          <Link href="/dashboard/history" className={styles.navItem}>
            <span className={styles.navIcon}>◉</span>
            History
          </Link>
          <Link href="/dashboard/analytics" className={styles.navItem}>
            <span className={styles.navIcon}>⊞</span>
            Analytics
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/dashboard/settings" className={styles.navItem}>
            <span className={styles.navIcon}>⚙</span>
            Settings
          </Link>
          <button onClick={handleSignOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Reply to Thread</h1>
            <p className={styles.pageSubtitle}>Generate contextual replies for any conversation</p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.inputPanel}>
            <div className={styles.section}>
              <label className={styles.label}>Thread URL</label>
              <input
                type="url"
                value={threadUrl}
                onChange={(e) => setThreadUrl(e.target.value)}
                placeholder="https://reddit.com/r/..."
                className={styles.input}
              />
              <div className={styles.hint}>
                Paste a Reddit, Twitter, or IndieHackers thread URL
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.label}>Options</label>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={includeContext}
                    onChange={(e) => setIncludeContext(e.target.checked)}
                  />
                  <span>Reference thread context</span>
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={includeCTA}
                    onChange={(e) => setIncludeCTA(e.target.checked)}
                  />
                  <span>Include subtle product mention</span>
                </label>
              </div>
            </div>

            <div className={styles.usageInfo}>
              Usage: {profile.usage_count} / {profile.usage_limit}
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={generating || !threadUrl}
              className={styles.analyzeButton}
            >
              {generating ? 'Analyzing...' : 'Generate Replies'}
            </button>

            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}

            {threadPreview && (
              <div className={styles.threadPreview}>
                <div className={styles.previewLabel}>Thread Preview</div>
                <div className={styles.previewPlatform}>{threadPreview.platform}</div>
                <div className={styles.previewTitle}>{threadPreview.title}</div>
                <div className={styles.previewAuthor}>by {threadPreview.author}</div>
                <div className={styles.previewSnippet}>{threadPreview.snippet}</div>
              </div>
            )}
          </div>

          <div className={styles.resultsPanel}>
            {generatedReplies.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>↩</div>
                <div className={styles.emptyTitle}>No replies generated yet</div>
                <div className={styles.emptyDesc}>
                  Paste a thread URL and click Generate Replies to create contextual responses
                </div>
              </div>
            ) : (
              <>
                <div className={styles.variantTabs}>
                  {generatedReplies.map((reply, index) => (
                    <button
                      key={index}
                      className={`${styles.variantTab} ${selectedReply === index ? styles.variantTabActive : ''}`}
                      onClick={() => setSelectedReply(index)}
                    >
                      Reply {index + 1}
                    </button>
                  ))}
                </div>

                <div className={styles.replyPreview}>
                  <div className={styles.replyContent}>
                    {generatedReplies[selectedReply]?.content}
                  </div>

                  <div className={styles.replyMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Tone:</span>
                      <span className={styles.metaValue}>Helpful</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Length:</span>
                      <span className={styles.metaValue}>Medium</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>CTA:</span>
                      <span className={styles.metaValue}>{includeCTA ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  <div className={styles.replyActions}>
                    <button 
                      onClick={() => handleCopy(generatedReplies[selectedReply]?.content)}
                      className={styles.actionButton}
                    >
                      Copy
                    </button>
                    <button className={styles.actionButton}>
                      Edit
                    </button>
                    <button onClick={handleSave} className={styles.actionButtonPrimary}>
                      Save to History
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}