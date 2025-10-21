'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './history.module.css'

export default function History() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [historyItems, setHistoryItems] = useState([])

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

    // Load all user's generated content
    const { data: contentData, error: contentError } = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!contentError && contentData) {
      setHistoryItems(contentData)
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content)
    alert('Copied to clipboard!')
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    const { error } = await supabase
      .from('generated_content')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting item')
    } else {
      setHistoryItems(historyItems.filter(item => item.id !== id))
    }
  }

  const filteredItems = historyItems.filter(item => {
    if (filter !== 'all' && item.platform.toLowerCase() !== filter) return false
    const searchText = item.user_edited_text || item.generated_text
    if (searchQuery && !searchText.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`
    return date.toLocaleDateString()
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
          <Link href="/dashboard/reply" className={styles.navItem}>
            <span className={styles.navIcon}>↩</span>
            Reply
          </Link>
          <Link href="/dashboard/history" className={`${styles.navItem} ${styles.navItemActive}`}>
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
            <h1 className={styles.pageTitle}>Content History</h1>
            <p className={styles.pageSubtitle}>All your generated posts and replies</p>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            <button 
              className={`${styles.filterButton} ${filter === 'all' ? styles.filterButtonActive : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`${styles.filterButton} ${filter === 'reddit' ? styles.filterButtonActive : ''}`}
              onClick={() => setFilter('reddit')}
            >
              Reddit
            </button>
            <button 
              className={`${styles.filterButton} ${filter === 'twitter' ? styles.filterButtonActive : ''}`}
              onClick={() => setFilter('twitter')}
            >
              Twitter
            </button>
            <button 
              className={`${styles.filterButton} ${filter === 'indiehackers' ? styles.filterButtonActive : ''}`}
              onClick={() => setFilter('indiehackers')}
            >
              IndieHackers
            </button>
            <button 
              className={`${styles.filterButton} ${filter === 'linkedin' ? styles.filterButtonActive : ''}`}
              onClick={() => setFilter('linkedin')}
            >
              LinkedIn
            </button>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search content..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.historyList}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◉</div>
              <div className={styles.emptyTitle}>No content found</div>
              <div className={styles.emptyDesc}>
                {searchQuery ? 'Try a different search term' : 'Start generating content to see it here'}
              </div>
              {!searchQuery && (
                <Link href="/dashboard/generate">
                  <button className={styles.emptyButton}>Generate First Post</button>
                </Link>
              )}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemPlatform}>{item.platform}</span>
                    <span className={styles.itemType}>{item.content_type}</span>
                    <span className={styles.itemTime}>{getTimeAgo(item.created_at)}</span>
                  </div>
                  <div className={styles.itemStatus}>
                    <span className={item.status === 'published' ? styles.statusPublished : styles.statusDraft}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className={styles.itemContent}>
                  {item.user_edited_text || item.generated_text}
                </div>

                {item.engagement_data && (
                  <div className={styles.itemEngagement}>
                    <span>📊 Engagement tracked</span>
                  </div>
                )}

                <div className={styles.itemActions}>
                  <button 
                    onClick={() => handleCopy(item.user_edited_text || item.generated_text)}
                    className={styles.actionButton}
                  >
                    Copy
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className={styles.actionButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}