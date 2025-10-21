import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.logo}>commentr</div>
        <Link href="/auth/signup">
          <button className={styles.navButton}>Get Started</button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.badge}>Save 10+ hours every week</div>
        <h1 className={styles.heroTitle}>
          Your AI co-founder for growth and traction
        </h1>
        <p className={styles.heroDescription}>
          Feed Commentr your startup context once. It learns your product, tone, and voice then generates authentic posts and replies across Reddit, Twitter, IndieHackers that actually convert.
        </p>
        <Link href="/auth/signup">
          <button className={styles.ctaButton}>Start Free No Credit Card</button>
        </Link>
        <div className={styles.socialProof}>
          Join 200+ founders building in public with AI
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>10+</div>
            <div className={styles.statLabel}>Hours saved weekly</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>3x</div>
            <div className={styles.statLabel}>More consistent posting</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>85%</div>
            <div className={styles.statLabel}>Say it feels authentic</div>
          </div>
        </div>
      </section>

      {/* The Real Cost */}
      <section className={styles.realCost}>
        <h2 className={styles.sectionTitle}>You are already paying the price</h2>
        <p className={styles.realCostDescription}>
          Every week you do not post consistently, competitors gain visibility. Every reply you skip is a customer you will never reach. Time is your scarcest resource Commentr gives it back.
        </p>
        
        <div className={styles.comparisonCard}>
          <div className={styles.comparisonSection}>
            <div className={styles.comparisonLabel}>WITHOUT COMMENTR</div>
            <div className={styles.comparisonList}>
              <div className={styles.comparisonItemBad}>Spend 2 hours writing a post</div>
              <div className={styles.comparisonItemBad}>It performs okay, not great</div>
              <div className={styles.comparisonItemBad}>Forget to post for 2 weeks</div>
              <div className={styles.comparisonItemBad}>Lose momentum, start from zero</div>
              <div className={styles.comparisonItemBad}>Watch competitors gain traction</div>
            </div>
          </div>
          
          <div className={styles.divider}></div>
          
          <div className={styles.comparisonSection}>
            <div className={styles.comparisonLabelGood}>WITH COMMENTR</div>
            <div className={styles.comparisonList}>
              <div className={styles.comparisonItemGood}>Generate 3 post variants in 30 seconds</div>
              <div className={styles.comparisonItemGood}>Each one sounds exactly like you</div>
              <div className={styles.comparisonItemGood}>Post consistently, build compound growth</div>
              <div className={styles.comparisonItemGood}>Reply to 20+ threads weekly</div>
              <div className={styles.comparisonItemGood}>Your startup becomes impossible to ignore</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitleCenter}>Context in, traction out</h2>
        
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepContent}>
              <h4 className={styles.stepTitle}>Upload your startup brain</h4>
              <p className={styles.stepDescription}>
                Screenshots, feature docs, past posts anything that explains your product. Commentr builds a knowledge graph of your startup.
              </p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepContent}>
              <h4 className={styles.stepTitle}>AI learns your voice</h4>
              <p className={styles.stepDescription}>
                It analyzes how you write, what you emphasize, your tone. Every edit you make teaches it to sound more like you.
              </p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepContent}>
              <h4 className={styles.stepTitle}>Generate platform-native content</h4>
              <p className={styles.stepDescription}>
                Choose Reddit, Twitter, IndieHackers, LinkedIn. Pick your goal. Get 2-3 variants that match each platform culture.
              </p>
            </div>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>04</div>
            <div className={styles.stepContent}>
              <h4 className={styles.stepTitle}>Reply to conversations at scale</h4>
              <p className={styles.stepDescription}>
                Paste thread URLs. Commentr reads context and generates authentic replies that reference your product naturally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className={styles.testimonial}>
        <div className={styles.testimonialCard}>
          <p className={styles.testimonialQuote}>
            I went from posting once a month to 3x weekly. Commentr writes exactly how I would nobody can tell it is AI. Got my first 5 customers from Reddit threads I replied to.
          </p>
          <div className={styles.testimonialAuthor}>
            Sarah Chen, Founder of TaskFlow
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricing}>
        <h2 className={styles.sectionTitleCenter}>Start free, scale as you grow</h2>
        <p className={styles.pricingSubtitle}>
          No credit card. Cancel anytime. Keep what you have learned.
        </p>

        <div className={styles.pricingGrid}>
          <div className={styles.pricingCard}>
            <div className={styles.planName}>Starter</div>
            <div className={styles.priceContainer}>
              <span className={styles.price}>$24</span>
              <span className={styles.period}>per month</span>
            </div>
            <Link href="/auth/signup">
              <button className={styles.planButton}>Start Free Trial</button>
            </Link>
            <ul className={styles.featureList}>
              <li>100 posts monthly</li>
              <li>AI learns your edits</li>
              <li>All platforms</li>
              <li>Email support</li>
            </ul>
          </div>

          <div className={`${styles.pricingCard} ${styles.highlighted}`}>
            <div className={styles.popularBadge}>MOST POPULAR</div>
            <div className={styles.planName}>Pro</div>
            <div className={styles.priceContainer}>
              <span className={styles.price}>$69</span>
              <span className={styles.period}>per month</span>
            </div>
            <Link href="/auth/signup">
              <button className={styles.planButtonHighlighted}>Start Free Trial</button>
            </Link>
            <ul className={styles.featureList}>
              <li>500 posts monthly</li>
              <li>Analytics dashboard</li>
              <li>Content calendar</li>
              <li>Priority support</li>
            </ul>
          </div>

          <div className={styles.pricingCard}>
            <div className={styles.planName}>Enterprise</div>
            <div className={styles.priceContainer}>
              <span className={styles.price}>$225</span>
              <span className={styles.period}>per month</span>
            </div>
            <button className={styles.planButton}>Coming Soon</button>
            <ul className={styles.featureList}>
              <li>Unlimited posts</li>
              <li>Team collaboration</li>
              <li>Custom AI training</li>
              <li>Dedicated support</li>
            </ul>
          </div>
        </div>
        
        <div className={styles.pricingNote}>
          All plans include 14-day free trial. Overage at $0.05 per extra post.
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <h2 className={styles.finalCtaTitle}>
          Stop losing customers to silence
        </h2>
        <p className={styles.finalCtaDescription}>
          Your competitors are building in public right now. Do not let them own the conversation.
        </p>
        <Link href="/auth/signup">
          <button className={styles.ctaButton}>Start Free No Credit Card</button>
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerCopyright}>2025 Commentr. All rights reserved.</div>
        <div className={styles.footerLinks}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  )
}