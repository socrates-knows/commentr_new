'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './analytics.module.css'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Analytics() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalEngagement: 0,
    avgEngagementRate: 0,
    timeSaved: 0
  })
  const [weeklyData, setWeeklyData] = useState([])
  const [platformData, setPlatformData] = useState([])
  const [contentTypeData, setContentTypeData] = useState([])
  const [topPosts, setTopPosts] = useState([])
  const router = useRouter()

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      router.push('/auth/signin')
      return
    }
    setUser(user)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    if (timeRange === '7d') startDate.setDate(endDate.getDate() - 7)
    else if (timeRange === '30d') startDate.setDate(endDate.getDate() - 30)
    else if (timeRange === '90d') startDate.setDate(endDate.getDate() - 90)

    // Get all content in range
    const { data: contentData, error: contentError } = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (!contentError && contentData) {
      // Calculate stats
      const totalPosts = contentData.length
      const timeSaved = (totalPosts * 0.5).toFixed(1)

      setStats({
        totalPosts,
        totalEngagement: 0, // Will calculate when engagement data is added
        avgEngagementRate: 4.2,
        timeSaved
      })

      // Platform distribution
      const platformCounts = {}
      contentData.forEach(item => {
        platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1
      })
      const platformDataArray = Object.entries(platformCounts).map(([platform, count]) => ({
        platform,
        posts: count,
        engagement: count * 15 // Mock engagement
      }))
      setPlatformData(platformDataArray)

      // Content type distribution
      const goalCounts = {}
      contentData.forEach(item => {
        const goal = item.goal || 'other'
        goalCounts[goal] = (goalCounts[goal] || 0) + 1
      })
      const contentTypeArray = Object.entries(goalCounts).map(([name, value], index) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: ['#ffffff', '#cccccc', '#999999', '#666666'][index % 4]
      }))
      setContentTypeData(contentTypeArray)

      // Weekly data (last 7 days)
      const weeklyMap = {}
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayName = days[date.getDay()]
        weeklyMap[dayName] = 0
      }
      
      contentData.forEach(item => {
        const itemDate = new Date(item.created_at)
        const dayName = days[itemDate.getDay()]
        if (weeklyMap.hasOwnProperty(dayName)) {
          weeklyMap[dayName]++
        }
      })

      const weeklyArray = Object.entries(weeklyMap).map(([day, posts]) => ({ day, posts }))
      setWeeklyData(weeklyArray)

      // Top posts (most recent 3)
      const topPostsData = contentData
        .slice(-3)
        .reverse()
        .map((item, index) => ({
          id: item.id,
          platform: item.platform,
          content: item.user_edited_text || item.generated_text,
          engagement: (contentData.length - index) * 50, // Mock engagement based on recency
          date: new Date(item.created_at).toLocaleDateString()
        }))
      setTopPosts(topPostsData)
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
          <Link href="/dashboard/analytics" className={`${styles.navItem} ${styles.navItemActive}`}>
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
            <h1 className={styles.pageTitle}>Analytics</h1>
            <p className={styles.pageSubtitle}>Deep dive into your content performance</p>
          </div>
          <div className={styles.timeRangeSelector}>
            <button 
              className={`${styles.timeButton} ${timeRange === '7d' ? styles.timeButtonActive : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button 
              className={`${styles.timeButton} ${timeRange === '30d' ? styles.timeButtonActive : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
            <button 
              className={`${styles.timeButton} ${timeRange === '90d' ? styles.timeButtonActive : ''}`}
              onClick={() => setTimeRange('90d')}
            >
              90 Days
            </button>
          </div>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Posts</div>
            <div className={styles.metricValue}>{stats.totalPosts}</div>
            <div className={styles.metricChange}>In selected period</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Engagement</div>
            <div className={styles.metricValue}>{stats.totalEngagement}</div>
            <div className={styles.metricChange}>Across all platforms</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Avg Engagement Rate</div>
            <div className={styles.metricValue}>{stats.avgEngagementRate}%</div>
            <div className={styles.metricChange}>Industry average: 3.5%</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Time Saved</div>
            <div className={styles.metricValue}>{stats.timeSaved} hrs</div>
            <div className={styles.metricChange}>Based on 30min per post</div>
          </div>
        </div>

        {weeklyData.length > 0 && (
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Weekly Activity</h3>
              <p className={styles.chartSubtitle}>Posts generated this week</p>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="day" stroke="#666666" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#666666" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0a0a0a', 
                        border: '1px solid #1a1a1a',
                        borderRadius: '4px',
                        fontFamily: 'Geist Mono, monospace',
                        fontSize: '12px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="posts" stroke="#ffffff" strokeWidth={2} name="Posts" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {contentTypeData.length > 0 && (
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Content Type Distribution</h3>
                <p className={styles.chartSubtitle}>Breakdown by post category</p>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={contentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {contentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0a0a0a', 
                          border: '1px solid #1a1a1a',
                          borderRadius: '4px',
                          fontFamily: 'Geist Mono, monospace',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {platformData.length > 0 && (
          <div className={styles.chartCardFull}>
            <h3 className={styles.chartTitle}>Platform Performance</h3>
            <p className={styles.chartSubtitle}>Posts and engagement by platform</p>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="platform" stroke="#666666" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#666666" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0a0a', 
                      border: '1px solid #1a1a1a',
                      borderRadius: '4px',
                      fontFamily: 'Geist Mono, monospace',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="posts" fill="#ffffff" name="Posts" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="engagement" fill="#888888" name="Engagement" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {topPosts.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Posts</h2>
            <div className={styles.topPostsList}>
              {topPosts.map((post, index) => (
                <div key={post.id} className={styles.topPostItem}>
                  <div className={styles.topPostRank}>#{index + 1}</div>
                  <div className={styles.topPostContent}>
                    <div className={styles.topPostMeta}>
                      <span className={styles.topPostPlatform}>{post.platform}</span>
                      <span className={styles.topPostDate}>{post.date}</span>
                    </div>
                    <div className={styles.topPostText}>
                      {post.content.substring(0, 150)}...
                    </div>
                    <div className={styles.topPostEngagement}>
                      {post.engagement} total engagements
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.totalPosts === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⊞</div>
            <div className={styles.emptyTitle}>No analytics yet</div>
            <div className={styles.emptyDesc}>
              Start generating content to see your performance metrics
            </div>
            <Link href="/dashboard/generate">
              <button className={styles.emptyButton}>Generate First Post</button>
            </Link>
          </div>
        )}

        <div className={styles.insightsSection}>
          <h2 className={styles.sectionTitle}>Insights & Recommendations</h2>
          <div className={styles.insightsGrid}>
            <div className={styles.insightCard}>
              <div className={styles.insightIcon}>🔥</div>
              <div className={styles.insightTitle}>Keep Posting</div>
              <div className={styles.insightText}>
                Consistency is key. Try to post at least 3 times per week for best results.
              </div>
            </div>

            <div className={styles.insightCard}>
              <div className={styles.insightIcon}>📈</div>
              <div className={styles.insightTitle}>Diversify Platforms</div>
              <div className={styles.insightText}>
                Expand your reach by posting on multiple platforms regularly.
              </div>
            </div>

            <div className={styles.insightCard}>
              <div className={styles.insightIcon}>💡</div>
              <div className={styles.insightTitle}>Engage More</div>
              <div className={styles.insightText}>
                Reply to threads and engage with your audience to build community.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}