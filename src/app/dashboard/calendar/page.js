'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './calendar.module.css'

export default function Calendar() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadScheduledPosts()
    }
  }, [user, currentDate])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
    } else {
      setUser(user)
      setLoading(false)
    }
  }

  const loadScheduledPosts = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_date', startOfMonth.toISOString())
      .lte('scheduled_date', endOfMonth.toISOString())
      .order('scheduled_date', { ascending: true })

    if (!error && data) {
      setScheduledPosts(data)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Previous month's days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getPostsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduled_date).toISOString().split('T')[0]
      return postDate === dateStr
    })
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)
    setShowScheduleModal(true)
  }

  const handleDeletePost = async (postId) => {
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', postId)

    if (!error) {
      loadScheduledPosts()
    }
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const days = getDaysInMonth(currentDate)
  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
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
          <Link href="/dashboard/history" className={styles.navItem}>
            <span className={styles.navIcon}>◉</span>
            History
          </Link>
          <Link href="/dashboard/calendar" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.navIcon}>📅</span>
            Calendar
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
            <h1 className={styles.pageTitle}>Content Calendar</h1>
            <p className={styles.pageSubtitle}>Plan and schedule your content</p>
          </div>
          <Link href="/dashboard/generate">
            <button className={styles.scheduleButton}>Schedule New Post</button>
          </Link>
        </div>

        <div className={styles.calendarContainer}>
          <div className={styles.calendarHeader}>
            <button onClick={handlePreviousMonth} className={styles.navButton}>
              ← Prev
            </button>
            <h2 className={styles.monthTitle}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={handleNextMonth} className={styles.navButton}>
              Next →
            </button>
          </div>

          <div className={styles.calendar}>
            <div className={styles.dayNames}>
              {dayNames.map(day => (
                <div key={day} className={styles.dayName}>{day}</div>
              ))}
            </div>

            <div className={styles.daysGrid}>
              {days.map((date, index) => {
                const postsForDate = date ? getPostsForDate(date) : []
                return (
                  <div
                    key={index}
                    className={`${styles.dayCell} ${!date ? styles.dayCellEmpty : ''} ${isToday(date) ? styles.dayCellToday : ''}`}
                    onClick={() => date && handleDateClick(date)}
                  >
                    {date && (
                      <>
                        <div className={styles.dayNumber}>{date.getDate()}</div>
                        {postsForDate.length > 0 && (
                          <div className={styles.postsIndicator}>
                            {postsForDate.map((post, i) => (
                              <div
                                key={i}
                                className={styles.postDot}
                                style={{ backgroundColor: getPlatformColor(post.platform) }}
                                title={`${post.platform} - ${post.content?.substring(0, 50)}...`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.legend}>
            <div className={styles.legendTitle}>Platforms:</div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: '#ff6b35' }}></div>
              Reddit
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: '#1da1f2' }}></div>
              Twitter
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: '#0a66c2' }}></div>
              LinkedIn
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: '#3b5998' }}></div>
              IndieHackers
            </div>
          </div>
        </div>

        <div className={styles.upcomingSection}>
          <h2 className={styles.sectionTitle}>Upcoming Posts</h2>
          {scheduledPosts.length > 0 ? (
            <div className={styles.upcomingList}>
              {scheduledPosts.slice(0, 10).map(post => (
                <div key={post.id} className={styles.upcomingItem}>
                  <div className={styles.upcomingDate}>
                    {new Date(post.scheduled_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className={styles.upcomingContent}>
                    <div className={styles.upcomingPlatform}>
                      <span style={{ color: getPlatformColor(post.platform) }}>
                        {post.platform}
                      </span>
                    </div>
                    <div className={styles.upcomingText}>
                      {post.content?.substring(0, 100)}{post.content?.length > 100 ? '...' : ''}
                    </div>
                  </div>
                  <div className={styles.upcomingActions}>
                    <button
                      onClick={() => router.push(`/dashboard/generate?edit=${post.id}`)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <div className={styles.emptyTitle}>No scheduled posts yet</div>
              <div className={styles.emptyDesc}>
                Generate content and schedule it to appear here
              </div>
              <Link href="/dashboard/generate">
                <button className={styles.emptyButton}>Schedule Your First Post</button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function getPlatformColor(platform) {
  const colors = {
    reddit: '#ff6b35',
    twitter: '#1da1f2',
    linkedin: '#0a66c2',
    indiehackers: '#3b5998'
  }
  return colors[platform?.toLowerCase()] || '#888888'
}
