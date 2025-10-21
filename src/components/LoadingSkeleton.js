'use client'

import styles from './LoadingSkeleton.module.css'

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.circle} />
              <div className={styles.titleBar} />
            </div>
            <div className={styles.content}>
              <div className={styles.line} />
              <div className={styles.line} />
              <div className={styles.lineShort} />
            </div>
          </div>
        )

      case 'post':
        return (
          <div className={styles.post}>
            <div className={styles.postHeader}>
              <div className={styles.smallCircle} />
              <div className={styles.smallBar} />
            </div>
            <div className={styles.postContent}>
              <div className={styles.line} />
              <div className={styles.line} />
              <div className={styles.line} />
              <div className={styles.lineShort} />
            </div>
          </div>
        )

      case 'list':
        return (
          <div className={styles.listItem}>
            <div className={styles.circle} />
            <div className={styles.listContent}>
              <div className={styles.titleBar} />
              <div className={styles.smallBar} />
            </div>
          </div>
        )

      case 'text':
        return (
          <div className={styles.textBlock}>
            <div className={styles.line} />
            <div className={styles.line} />
            <div className={styles.lineShort} />
          </div>
        )

      default:
        return <div className={styles.line} />
    }
  }

  return (
    <div className={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  )
}
