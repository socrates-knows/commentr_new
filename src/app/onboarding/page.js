'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import styles from './onboarding.module.css'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()

  const [startupName, setStartupName] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')

  const [uploadedFiles, setUploadedFiles] = useState([])
  const [textContent, setTextContent] = useState('')

  const [selectedTone, setSelectedTone] = useState('casual')

  const toneOptions = [
    { id: 'casual', label: 'Casual', desc: 'Friendly and approachable' },
    { id: 'technical', label: 'Technical', desc: 'Data-driven and precise' },
    { id: 'storyteller', label: 'Storyteller', desc: 'Narrative and engaging' }
  ]

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
    } else {
      setUser(user)
    }
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    setUploadedFiles([...uploadedFiles, ...files])
  }

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (step === 1 && (!startupName || !description)) {
      alert('Please fill in startup name and description')
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleComplete = async () => {
    setLoading(true)

    try {
      // Create startup record
      const { data: startup, error: startupError } = await supabase
        .from('startups')
        .insert({
          user_id: user.id,
          name: startupName,
          description: description,
          website: website,
          tone_profile: {
            voice: selectedTone,
            avg_sentence_length: 15,
            emoji_frequency: 0.2
          }
        })
        .select()
        .single()

      if (startupError) throw startupError

      // Upload files to storage and save metadata
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          try {
            // Upload file to Supabase Storage
            const fileName = `${user.id}/${startup.id}/${Date.now()}_${file.name}`
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('knowledge-files')
              .upload(fileName, file)

            if (uploadError) {
              console.error('Error uploading file:', uploadError)
              continue
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('knowledge-files')
              .getPublicUrl(fileName)

            // Save file metadata to knowledge_items
            const fileType = file.type.startsWith('image/') ? 'image' :
                           file.type === 'application/pdf' ? 'pdf' : 'file'

            await supabase
              .from('knowledge_items')
              .insert({
                startup_id: startup.id,
                type: fileType,
                content: urlData.publicUrl,
                filename: file.name
              })
          } catch (fileError) {
            console.error('Error processing file:', file.name, fileError)
          }
        }
      }

      // Save text content
      if (textContent) {
        const { error: knowledgeError } = await supabase
          .from('knowledge_items')
          .insert({
            startup_id: startup.id,
            type: 'text',
            content: textContent
          })

        if (knowledgeError) throw knowledgeError
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'starter',
          usage_limit: 100
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Error saving your data. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
          <div className={styles.progressText}>Step {step} of 3</div>
        </div>

        {step === 1 && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Tell us about your startup</h1>
            <p className={styles.subtitle}>
              This helps Commentr understand what you're building
            </p>

            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Startup Name *</label>
                <input
                  type="text"
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  placeholder="e.g. TaskFlow"
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What problem does your startup solve? What makes it unique?"
                  className={styles.textarea}
                  rows={4}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Website (optional)</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button onClick={handleNext} className={styles.primaryButton}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Upload your startup brain</h1>
            <p className={styles.subtitle}>
              Add screenshots, docs, or paste content that explains your product
            </p>

            <div className={styles.form}>
              <div className={styles.uploadSection}>
                <label className={styles.uploadLabel}>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.md"
                    onChange={handleFileUpload}
                    className={styles.fileInput}
                  />
                  <div className={styles.uploadBox}>
                    <div className={styles.uploadIcon}>↑</div>
                    <div className={styles.uploadText}>
                      Click to upload or drag and drop
                    </div>
                    <div className={styles.uploadHint}>
                      Screenshots, PDFs, text files
                    </div>
                  </div>
                </label>

                {uploadedFiles.length > 0 && (
                  <div className={styles.fileList}>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className={styles.fileItem}>
                        <span className={styles.fileName}>{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className={styles.removeButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.divider}>
                <span>OR</span>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Paste content directly</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste feature descriptions, past posts, product details..."
                  className={styles.textarea}
                  rows={6}
                />
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button onClick={handleBack} className={styles.secondaryButton}>
                Back
              </button>
              <button onClick={handleNext} className={styles.primaryButton}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Choose your voice</h1>
            <p className={styles.subtitle}>
              Pick a tone that matches how you want to sound
            </p>

            <div className={styles.toneGrid}>
              {toneOptions.map((tone) => (
                <div
                  key={tone.id}
                  onClick={() => setSelectedTone(tone.id)}
                  className={`${styles.toneCard} ${
                    selectedTone === tone.id ? styles.toneCardSelected : ''
                  }`}
                >
                  <div className={styles.toneLabel}>{tone.label}</div>
                  <div className={styles.toneDesc}>{tone.desc}</div>
                </div>
              ))}
            </div>

            <div className={styles.buttonGroup}>
              <button onClick={handleBack} className={styles.secondaryButton}>
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className={styles.primaryButton}
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}