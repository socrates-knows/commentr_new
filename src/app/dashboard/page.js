'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './dashboard.module.css'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [startup, setStartup] = useState(null)
  const [stats, setStats] = useState({
    postsThisMonth: 0,
    usageRemaining: 0,
    usageLimit: 100,
    timeSaved: 0,
    engagementRate: 0
  })
  const [recentContent, setRecentContent] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/auth/signin')
        return
      }
      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
      } else {
        setProfile(profileData)
      }

      const { data: startupData, error: startupError } = await supabase
        .from('startups')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (startupError) {
        console.error('Error fetching startup:', startupError)
        router.push('/onboarding')
        return
      }
      setStartup(startupData)

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: contentData, error: contentError } = await supabase
        .from('generated_content')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      if (!contentError && contentData) {
        const postsThisMonth = contentData.length
        const timeSaved = (postsThisMonth * 0.5).toFixed(1)
        const engagementRate = postsThisMonth > 0 ? 0 : 0 // Set to 0 until we have real engagement data
        
        setStats({
          postsThisMonth,
          usageRemaining: (profileData?.usage_limit || 100) - (profileData?.usage_count || 0),
          usageLimit: profileData?.usage_limit || 100,
          timeSaved,
          engagementRate
        })
      } else {
        // No content data
        setStats({
          postsThisMonth: 0,
          usageRemaining: (profileData?.usage_limit || 100) - (profileData?.usage_count || 0),
          usageLimit: profileData?.usage_limit || 100,
          timeSaved: 0,
          engagementRate: 0
        })
      }

      const { data: recentData, error: recentError } = await supabase
        .from('generated_content')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!recentError && recentData) {
        setRecentContent(recentData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getWeeklyData = () => {
    const weeklyMap = {}
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    days.forEach(day => {
      weeklyMap[day] = 0
    })

    // Only count content from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    recentContent.forEach(item => {
      const itemDate = new Date(item.created_at)
      if (itemDate >= sevenDaysAgo) {
        const dayIndex = (itemDate.getDay() + 6) % 7
        const dayName = days[dayIndex]
        if (weeklyMap.hasOwnProperty(dayName)) {
          weeklyMap[dayName]++
        }
      }
    })

    return Object.entries(weeklyMap).map(([day, posts]) => ({ day, posts }))
  }

  const getPlatformData = () => {
    const platformCounts = {}
    
    recentContent.forEach(item => {
      const platform = item.platform
      platformCounts[platform] = (platformCounts[platform] || 0) + 1
    })

    return Object.entries(platformCounts).map(([platform, count]) => ({
      platform,
      count
    }))
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
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

  const weeklyData = getWeeklyData()
  const platformData = getPlatformData()
  const hasActivity = recentContent.length > 0

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>commentr</div>
        </div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navItem} ${styles.navItemActive}`}>
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
          <Link href="/dashboard/analytics" className={styles.navItem}>
            <span className={styles.navIcon}>⊞</span>
            Analytics
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.planBadge}>
            <div className={styles.planName}>
              {profile?.subscription_tier ? profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1) : 'Free'} Plan
            </div>
            <div className={styles.planUpgrade}>
              <Link href="/dashboard/settings">Upgrade →</Link>
            </div>
          </div>
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
            <h1 className={styles.pageTitle}>
              Welcome back{startup?.name ? `, ${startup.name}` : ''}
            </h1>
            <p className={styles.pageSubtitle}>Here is what is happening with your content</p>
          </div>
          <div className={styles.userInfo}>
            {user?.email}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={styles.statLabel}>Posts This Month</div>
            </div>
            <div className={styles.statValue}>{stats.postsThisMonth}</div>
            <div className={styles.statChange}>
              {stats.postsThisMonth > 0 ? 'Keep it up!' : 'Start creating content'}
            </div>
            <div className={styles.statProgress}>
              <div className={styles.statProgressBar} style={{ width: `${Math.min((stats.postsThisMonth / 30) * 100, 100)}%` }}></div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={styles.statLabel}>Usage Remaining</div>
              <div className={styles.statTrendNeutral}>
                {Math.round((stats.usageRemaining / stats.usageLimit) * 100)}%
              </div>
            </div>
            <div className={styles.statValue}>{stats.usageRemaining} / {stats.usageLimit}</div>
            <div className={styles.statChange}>Resets monthly</div>
            <div className={styles.statProgress}>
              <div className={styles.statProgressBar} style={{ width: `${(stats.usageRemaining / stats.usageLimit) * 100}%` }}></div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={styles.statLabel}>Time Saved</div>
            </div>
            <div className={styles.statValue}>{stats.timeSaved} hrs</div>
            <div className={styles.statChange}>This month</div>
            <div className={styles.statProgress}>
              <div className={styles.statProgressBar} style={{ width: stats.timeSaved > 0 ? `${Math.min((parseFloat(stats.timeSaved) / 15) * 100, 100)}%` : '0%' }}></div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={styles.statLabel}>Generations Used</div>
            </div>
            <div className={styles.statValue}>{profile?.usage_count || 0}</div>
            <div className={styles.statChange}>
              Total generations
            </div>
            <div className={styles.statProgress}>
              <div className={styles.statProgressBar} style={{ width: `${((profile?.usage_count || 0) / stats.usageLimit) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {hasActivity && (
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Weekly Activity</h3>
              <p className={styles.chartSubtitle}>Posts generated this week</p>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={200}>
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
                    <Line type="monotone" dataKey="posts" stroke="#ffffff" strokeWidth={2} dot={{ fill: '#ffffff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {platformData.length > 0 && (
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Platform Distribution</h3>
                <p className={styles.chartSubtitle}>Posts by platform</p>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={200}>
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
                      <Bar dataKey="count" fill="#ffffff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link href="/dashboard/generate" className={styles.actionCard}>
              <div className={styles.actionIcon}>+</div>
              <div className={styles.actionTitle}>Generate Post</div>
              <div className={styles.actionDesc}>
                Create content for Reddit, Twitter, or IndieHackers
              </div>
              <div className={styles.actionArrow}>→</div>
            </Link>

            <Link href="/dashboard/reply" className={styles.actionCard}>
              <div className={styles.actionIcon}>↩</div>
              <div className={styles.actionTitle}>Reply to Thread</div>
              <div className={styles.actionDesc}>
                Paste a URL and get smart replies
              </div>
              <div className={styles.actionArrow}>→</div>
            </Link>

            <Link href="/dashboard/history" className={styles.actionCard}>
              <div className={styles.actionIcon}>◉</div>
              <div className={styles.actionTitle}>View History</div>
              <div className={styles.actionDesc}>
                See all your generated content
              </div>
              <div className={styles.actionArrow}>→</div>
            </Link>

            <Link href="/dashboard/analytics" className={styles.actionCard}>
              <div className={styles.actionIcon}>⊞</div>
              <div className={styles.actionTitle}>Analytics</div>
              <div className={styles.actionDesc}>
                Deep dive into your performance
              </div>
              <div className={styles.actionArrow}>→</div>
            </Link>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <Link href="/dashboard/history" className={styles.sectionLink}>
              View All →
            </Link>
          </div>

          {recentContent.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◉</div>
              <div className={styles.emptyTitle}>No content yet</div>
              <div className={styles.emptyDesc}>
                Generate your first post to start building in public
              </div>
              <Link href="/dashboard/generate">
                <button className={styles.emptyButton}>Create First Post</button>
              </Link>
            </div>
          ) : (
            <div className={styles.activityList}>
              {recentContent.slice(0, 3).map((item) => (
                <div key={item.id} className={styles.activityItem}>
                  <div className={styles.activityHeader}>
                    <div className={styles.activityMeta}>
                      <span className={styles.activityPlatform}>{item.platform}</span>
                      <span className={styles.activityTime}>{getTimeAgo(item.created_at)}</span>
                    </div>
                    <div className={styles.activityStatus}>{item.status}</div>
                  </div>
                  <div className={styles.activityContent}>
                    {(item.user_edited_text || item.generated_text).substring(0, 150)}...
                  </div>
                  {item.engagement_data && (
                    <div className={styles.activityStats}>
                      <span>📊 Engagement tracked</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.tipsSection}>
          <div className={styles.tipCard}>
            <div className={styles.tipIcon}>💡</div>
            <div className={styles.tipContent}>
              <div className={styles.tipTitle}>Pro Tip</div>
              <div className={styles.tipText}>
                Post consistently at the same time each day to build audience expectations.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}