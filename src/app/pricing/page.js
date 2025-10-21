import Link from 'next/link'
import styles from './pricing.module.css'

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Commentr',
      features: [
        '10 generations per month',
        'All platforms supported',
        'Basic tone presets',
        'Community support',
        'Content history'
      ],
      cta: 'Start Free',
      highlighted: false
    },
    {
      name: 'Starter',
      price: '$24',
      period: 'per month',
      description: 'For solo founders building in public',
      features: [
        '50 generations per month',
        'All platforms supported',
        'AI learns your edits',
        'Advanced tone control',
        'Email support',
        'Content analytics'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Pro',
      price: '$69',
      period: 'per month',
      description: 'For serious content creators',
      features: [
        '100 generations per month',
        'All platforms supported',
        'Priority AI processing',
        'Advanced analytics',
        'Content calendar',
        'Priority email support',
        'Custom tone profiles'
      ],
      cta: 'Start Free Trial',
      highlighted: false
    },
    {
      name: 'Enterprise',
      price: '$199',
      period: 'per month',
      description: 'For teams and agencies',
      features: [
        '200 generations per month',
        'All platforms supported',
        'Team collaboration',
        'Multiple startups',
        'White-label options',
        'Dedicated support',
        'Custom integrations',
        'API access'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ]

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          commentr
        </Link>
        <div className={styles.navLinks}>
          <Link href="/pricing" className={styles.navLink}>Pricing</Link>
          <Link href="/auth/signin" className={styles.navLink}>Sign In</Link>
          <Link href="/auth/signup">
            <button className={styles.navButton}>Get Started</button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className={styles.header}>
        <h1 className={styles.title}>Simple, transparent pricing</h1>
        <p className={styles.subtitle}>
          Choose the plan that fits your needs. All plans include 14-day free trial.
        </p>
      </section>

      {/* Pricing Grid */}
      <section className={styles.pricingSection}>
        <div className={styles.pricingGrid}>
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`${styles.pricingCard} ${plan.highlighted ? styles.highlighted : ''}`}
            >
              {plan.highlighted && (
                <div className={styles.badge}>MOST POPULAR</div>
              )}
              
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>{plan.price}</span>
                  <span className={styles.period}>{plan.period}</span>
                </div>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              <ul className={styles.featureList}>
                {plan.features.map((feature, i) => (
                  <li key={i} className={styles.feature}>
                    <span className={styles.checkmark}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/auth/signup">
                <button
                  className={plan.highlighted ? styles.ctaButtonPrimary : styles.ctaButton}
                >
                  {plan.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>

        <div className={styles.note}>
          All plans include overage at $0.10 per additional generation.
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>What counts as a generation?</h3>
            <p className={styles.faqAnswer}>
              Each time you click "Generate" to create posts or replies, that counts as one generation. Each generation creates 3 variants for you to choose from.
            </p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>Can I change plans anytime?</h3>
            <p className={styles.faqAnswer}>
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any charges.
            </p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>What happens if I exceed my limit?</h3>
            <p className={styles.faqAnswer}>
              You can purchase additional generations at $0.10 each, or upgrade to a higher tier. We'll never charge without your permission.
            </p>
          </div>

          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>Is there a free trial?</h3>
            <p className={styles.faqAnswer}>
              Yes! All paid plans come with a 14-day free trial. No credit card required to start the trial.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div>© 2025 Commentr. All rights reserved.</div>
          <div className={styles.footerLinks}>
            <Link href="#">Privacy</Link>
            <Link href="#">Terms</Link>
            <Link href="#">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}