'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './generate.module.css'

export default function Generate() {
  const [user, setUser] = useState(null)
  const [startup, setStartup] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  const [platform, setPlatform] = useState('reddit')
  const [goal, setGoal] = useState('announce')
  const [tone, setTone] = useState('casual')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [generatedPosts, setGeneratedPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
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

  const handleGenerate = async () => {
    if (profile.usage_count >= profile.usage_limit) {
      alert('You have reached your usage limit. Please upgrade your plan.')
      return
    }

    setGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          startupId: startup.id,
          platform,
          goal,
          tone,
          additionalInfo
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate posts')
      }

      setGeneratedPosts(data.posts)
      setSelectedPost(0)

      // Increment usage count immediately after successful generation
      const newUsageCount = profile.usage_count + 1
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ usage_count: newUsageCount })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating usage:', updateError)
      } else {
        // Update local state
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
    if (!generatedPosts[selectedPost]) return

    try {
      const content = generatedPosts[selectedPost].content

      const { error } = await supabase
        .from('generated_content')
        .insert({
          startup_id: startup.id,
          user_id: user.id,
          platform,
          content_type: 'post',
          goal,
          tone,
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
          <Link href="/dashboard/generate" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.navIcon}>+</span>
            Generate
          </Link>
          <Link href="/dashboard/reply" className={styles.navItem}>
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
            <h1 className={styles.pageTitle}>Generate Post</h1>
            <p className={styles.pageSubtitle}>Create platform-native content in seconds</p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.configPanel}>
            <div className={styles.section}>
              <label className={styles.label}>Platform</label>
              <div className={styles.buttonGroup}>
                <button 
                  className={`${styles.optionButton} ${platform === 'reddit' ? styles.optionButtonActive : ''}`}
                  onClick={() => setPlatform('reddit')}
                >
                  Reddit
                </button>
                <button 
                  className={`${styles.optionButton} ${platform === 'twitter' ? styles.optionButtonActive : ''}`}
                  onClick={() => setPlatform('twitter')}
                >
                  Twitter
                </button>
                <button 
                  className={`${styles.optionButton} ${platform === 'indiehackers' ? styles.optionButtonActive : ''}`}
                  onClick={() => setPlatform('indiehackers')}
                >
                  IndieHackers
                </button>
                <button 
                  className={`${styles.optionButton} ${platform === 'linkedin' ? styles.optionButtonActive : ''}`}
                  onClick={() => setPlatform('linkedin')}
                >
                  LinkedIn
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.label}>Goal</label>
              <select 
                value={goal} 
                onChange={(e) => setGoal(e.target.value)}
                className={styles.select}
              >
                <option value="announce">Announce feature</option>
                <option value="feedback">Ask for feedback</option>
                <option value="milestone">Share milestone</option>
                <option value="buildinpublic">Build in public</option>
                <option value="question">Ask question</option>
                <option value="tips">Share tips</option>
              </select>
            </div>

            <div className={styles.section}>
              <label className={styles.label}>Tone</label>
              <div className={styles.buttonGroup}>
                <button 
                  className={`${styles.optionButton} ${tone === 'casual' ? styles.optionButtonActive : ''}`}
                  onClick={() => setTone('casual')}
                >
                  Casual
                </button>
                <button 
                  className={`${styles.optionButton} ${tone === 'technical' ? styles.optionButtonActive : ''}`}
                  onClick={() => setTone('technical')}
                >
                  Technical
                </button>
                <button 
                  className={`${styles.optionButton} ${tone === 'storyteller' ? styles.optionButtonActive : ''}`}
                  onClick={() => setTone('storyteller')}
                >
                  Story
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.label}>Additional Context (Optional)</label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Add specific details for this post... e.g., 'We just hit 500 users' or 'Launching dark mode tomorrow'"
                className={styles.textarea}
                rows={4}
              />
              <div className={styles.hint}>
                Be specific! The more context you provide, the better the AI can tailor the post.
              </div>
            </div>

            <div className={styles.usageInfo}>
              Usage: {profile.usage_count} / {profile.usage_limit}
            </div>

            <button 
              onClick={handleGenerate}
              disabled={generating}
              className={styles.generateButton}
            >
              {generating ? 'Generating...' : 'Generate Posts'}
            </button>

            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}
          </div>

          <div className={styles.resultsPanel}>
            {generatedPosts.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>+</div>
                <div className={styles.emptyTitle}>No posts generated yet</div>
                <div className={styles.emptyDesc}>
                  Configure your settings and click Generate Posts to create content
                </div>
              </div>
            ) : (
              <>
                <div className={styles.variantTabs}>
                  {generatedPosts.map((post, index) => (
                    <button
                      key={index}
                      className={`${styles.variantTab} ${selectedPost === index ? styles.variantTabActive : ''}`}
                      onClick={() => setSelectedPost(index)}
                    >
                      Variant {index + 1}
                    </button>
                  ))}
                </div>

                <div className={styles.postPreview}>
                  <div className={styles.postContent}>
                    {generatedPosts[selectedPost]?.content}
                  </div>

                  <div className={styles.postActions}>
                    <button 
                      onClick={() => handleCopy(generatedPosts[selectedPost]?.content)}
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