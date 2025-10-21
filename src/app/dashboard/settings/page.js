'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'
import styles from './settings.module.css'

export default function Settings() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  // Settings state
  const [activeTab, setActiveTab] = useState('startup')

  // Startup settings
  const [startupId, setStartupId] = useState(null)
  const [startupName, setStartupName] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [knowledgeItems, setKnowledgeItems] = useState([])

  // Account settings
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Preferences
  const [defaultPlatform, setDefaultPlatform] = useState('reddit')
  const [defaultTone, setDefaultTone] = useState('casual')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)

  // Billing
  const [profile, setProfile] = useState(null)
  const [usageCount, setUsageCount] = useState(0)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
    } else {
      setUser(user)
      setEmail(user.email)
      await loadUserData(user.id)
      setLoading(false)
    }
  }

  const loadUserData = async (userId) => {
    // Load startup data
    const { data: startupData, error: startupError } = await supabase
      .from('startups')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!startupError && startupData) {
      setStartupId(startupData.id)
      setStartupName(startupData.name || '')
      setDescription(startupData.description || '')
      setWebsite(startupData.website || '')

      // Load default tone from tone_profile
      if (startupData.tone_profile && startupData.tone_profile.voice) {
        setDefaultTone(startupData.tone_profile.voice)
      }

      // Load knowledge items
      const { data: knowledgeData } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('startup_id', startupData.id)
        .order('created_at', { ascending: false })

      if (knowledgeData) {
        setKnowledgeItems(knowledgeData)
      }
    }

    // Load profile data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileData) {
      setProfile(profileData)
      setUsageCount(profileData.usage_count || 0)
      setEmailNotifications(profileData.email_notifications !== false)
      setWeeklyReport(profileData.weekly_report !== false)
      if (profileData.default_platform) setDefaultPlatform(profileData.default_platform)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSaveStartup = async () => {
    if (!startupId) {
      showToast('No startup found. Please complete onboarding.', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('startups')
        .update({
          name: startupName,
          description: description,
          website: website
        })
        .eq('id', startupId)

      if (error) throw error

      showToast('Startup settings saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving startup:', error)
      showToast('Error saving startup settings: ' + error.message, 'error')
    }
    setSaving(false)
  }

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast('Please fill in all password fields', 'warning')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    setSaving(false)
    if (error) {
      showToast('Error updating password: ' + error.message, 'error')
    } else {
      showToast('Password updated successfully!', 'success')
      setCurrentPassword('')
      setNewPassword('')
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      // Update profile preferences
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          default_platform: defaultPlatform,
          email_notifications: emailNotifications,
          weekly_report: weeklyReport
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update startup tone profile
      if (startupId) {
        const { error: startupError } = await supabase
          .from('startups')
          .update({
            tone_profile: {
              voice: defaultTone,
              avg_sentence_length: 15,
              emoji_frequency: 0.2
            }
          })
          .eq('id', startupId)

        if (startupError) throw startupError
      }

      showToast('Preferences saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving preferences:', error)
      showToast('Error saving preferences: ' + error.message, 'error')
    }
    setSaving(false)
  }

  const handleDeleteKnowledgeItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('knowledge_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      // Update local state
      setKnowledgeItems(knowledgeItems.filter(item => item.id !== itemId))
      showToast('Knowledge item deleted successfully!', 'success')
    } catch (error) {
      console.error('Error deleting knowledge item:', error)
      showToast('Error deleting item: ' + error.message, 'error')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.')
    if (!confirmed) return

    const doubleConfirm = confirm('This will permanently delete all your data including posts, analytics, and settings. Are you absolutely sure?')
    if (!doubleConfirm) return

    setSaving(true)
    try {
      // Delete generated content
      await supabase
        .from('generated_content')
        .delete()
        .eq('user_id', user.id)

      // Delete knowledge items
      if (startupId) {
        await supabase
          .from('knowledge_items')
          .delete()
          .eq('startup_id', startupId)

        // Delete startup
        await supabase
          .from('startups')
          .delete()
          .eq('id', startupId)
      }

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      // Sign out and redirect
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Error deleting account: ' + error.message)
      setSaving(false)
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
      {/* Sidebar */}
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
          <Link href="/dashboard/analytics" className={styles.navItem}>
            <span className={styles.navIcon}>⊞</span>
            Analytics
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/dashboard/settings" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.navIcon}>⚙</span>
            Settings
          </Link>
          <button onClick={handleSignOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Settings</h1>
            <p className={styles.pageSubtitle}>Manage your account and preferences</p>
          </div>
        </div>

        <div className={styles.content}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'startup' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('startup')}
            >
              Startup
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'account' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'preferences' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              Preferences
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'billing' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('billing')}
            >
              Billing
            </button>
          </div>

          {/* Startup Tab */}
          {activeTab === 'startup' && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Startup Information</h2>
                <p className={styles.sectionDesc}>
                  Update your startup details. This helps the AI understand your product better.
                </p>

                <div className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Startup Name</label>
                    <input
                      type="text"
                      value={startupName}
                      onChange={(e) => setStartupName(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className={styles.textarea}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <button 
                    onClick={handleSaveStartup}
                    disabled={saving}
                    className={styles.saveButton}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Knowledge Base</h2>
                <p className={styles.sectionDesc}>
                  Manage the files and content that help the AI understand your startup.
                </p>

                <div className={styles.knowledgeList}>
                  {knowledgeItems.length > 0 ? (
                    knowledgeItems.map((item) => (
                      <div key={item.id} className={styles.knowledgeItem}>
                        <div className={styles.knowledgeIcon}>
                          {item.type === 'text' ? '📝' : item.type === 'image' ? '🖼️' : '📄'}
                        </div>
                        <div className={styles.knowledgeInfo}>
                          <div className={styles.knowledgeName}>
                            {item.type === 'text' ? 'Text Content' : item.filename || 'File'}
                          </div>
                          <div className={styles.knowledgeMeta}>
                            {item.type} • Added {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteKnowledgeItem(item.id)}
                          className={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyKnowledge}>
                      No knowledge items yet. Upload files to help the AI understand your startup.
                    </div>
                  )}
                </div>

                <button className={styles.uploadButton}>
                  Upload New Files
                </button>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Account Details</h2>
                <p className={styles.sectionDesc}>
                  Manage your account information and security.
                </p>

                <div className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className={styles.inputDisabled}
                    />
                    <div className={styles.hint}>Contact support to change your email</div>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Change Password</h2>
                <p className={styles.sectionDesc}>
                  Update your password to keep your account secure.
                </p>

                <div className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  <button 
                    onClick={handleUpdatePassword}
                    disabled={saving}
                    className={styles.saveButton}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              <div className={styles.dangerSection}>
                <h2 className={styles.sectionTitle}>Danger Zone</h2>
                <p className={styles.sectionDesc}>
                  Permanently delete your account and all associated data.
                </p>

                <button onClick={handleDeleteAccount} className={styles.dangerButton}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Default Settings</h2>
                <p className={styles.sectionDesc}>
                  Set your preferred defaults for content generation.
                </p>

                <div className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Default Platform</label>
                    <select 
                      value={defaultPlatform}
                      onChange={(e) => setDefaultPlatform(e.target.value)}
                      className={styles.select}
                    >
                      <option value="reddit">Reddit</option>
                      <option value="twitter">Twitter</option>
                      <option value="indiehackers">IndieHackers</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Default Tone</label>
                    <select 
                      value={defaultTone}
                      onChange={(e) => setDefaultTone(e.target.value)}
                      className={styles.select}
                    >
                      <option value="casual">Casual</option>
                      <option value="technical">Technical</option>
                      <option value="storyteller">Storyteller</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Notifications</h2>
                <p className={styles.sectionDesc}>
                  Choose what updates you want to receive.
                </p>

                <div className={styles.checkboxList}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    <div>
                      <div className={styles.checkboxLabel}>Email Notifications</div>
                      <div className={styles.checkboxDesc}>Receive emails about your account activity</div>
                    </div>
                  </label>

                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={weeklyReport}
                      onChange={(e) => setWeeklyReport(e.target.checked)}
                    />
                    <div>
                      <div className={styles.checkboxLabel}>Weekly Report</div>
                      <div className={styles.checkboxDesc}>Get a summary of your content performance</div>
                    </div>
                  </label>
                </div>

                <button 
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className={styles.saveButton}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className={styles.tabContent}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Current Plan</h2>
                <p className={styles.sectionDesc}>
                  Manage your subscription and billing information.
                </p>

                <div className={styles.planCard}>
                  <div className={styles.planHeader}>
                    <div>
                      <div className={styles.planName}>
                        {profile?.subscription_tier === 'pro' ? 'Pro Plan' :
                         profile?.subscription_tier === 'enterprise' ? 'Enterprise Plan' :
                         'Starter Plan'}
                      </div>
                      <div className={styles.planPrice}>
                        {profile?.subscription_tier === 'pro' ? '$69 / month' :
                         profile?.subscription_tier === 'enterprise' ? '$225 / month' :
                         '$24 / month'}
                      </div>
                    </div>
                    <div className={styles.planBadge}>Active</div>
                  </div>

                  <div className={styles.planFeatures}>
                    {profile?.subscription_tier === 'starter' && (
                      <>
                        <div className={styles.planFeature}>✓ 100 posts monthly</div>
                        <div className={styles.planFeature}>✓ AI learns your edits</div>
                        <div className={styles.planFeature}>✓ All platforms</div>
                        <div className={styles.planFeature}>✓ Email support</div>
                      </>
                    )}
                    {profile?.subscription_tier === 'pro' && (
                      <>
                        <div className={styles.planFeature}>✓ 500 posts monthly</div>
                        <div className={styles.planFeature}>✓ Priority AI training</div>
                        <div className={styles.planFeature}>✓ Advanced analytics</div>
                        <div className={styles.planFeature}>✓ Priority support</div>
                      </>
                    )}
                    {profile?.subscription_tier === 'enterprise' && (
                      <>
                        <div className={styles.planFeature}>✓ Unlimited posts</div>
                        <div className={styles.planFeature}>✓ Custom AI model</div>
                        <div className={styles.planFeature}>✓ Team collaboration</div>
                        <div className={styles.planFeature}>✓ Dedicated support</div>
                      </>
                    )}
                  </div>

                  <div className={styles.planActions}>
                    {profile?.subscription_tier !== 'enterprise' && (
                      <button className={styles.upgradeButton}>Upgrade Plan</button>
                    )}
                    <button className={styles.cancelButton}>Cancel Subscription</button>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Usage This Month</h2>
                <p className={styles.sectionDesc}>
                  Track your usage against your plan limits.
                </p>

                <div className={styles.usageCard}>
                  <div className={styles.usageItem}>
                    <div className={styles.usageLabel}>Posts Generated</div>
                    <div className={styles.usageValue}>
                      {usageCount} / {profile?.usage_limit || 100}
                    </div>
                    <div className={styles.usageBar}>
                      <div
                        className={styles.usageBarFill}
                        style={{ width: `${Math.min((usageCount / (profile?.usage_limit || 100)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Billing History</h2>
                <p className={styles.sectionDesc}>
                  View your past invoices and payments.
                </p>

                <div className={styles.billingList}>
                  <div className={styles.billingItem}>
                    <div className={styles.billingInfo}>
                      <div className={styles.billingDate}>October 1, 2025</div>
                      <div className={styles.billingDesc}>Starter Plan - Monthly</div>
                    </div>
                    <div className={styles.billingAmount}>$24.00</div>
                    <button className={styles.invoiceButton}>Download</button>
                  </div>

                  <div className={styles.billingItem}>
                    <div className={styles.billingInfo}>
                      <div className={styles.billingDate}>September 1, 2025</div>
                      <div className={styles.billingDesc}>Starter Plan - Monthly</div>
                    </div>
                    <div className={styles.billingAmount}>$24.00</div>
                    <button className={styles.invoiceButton}>Download</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}