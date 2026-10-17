import './App.css'

const features = [
  {
    icon: '🧳',
    title: 'Packing Calculator',
    description:
      'Estimate your luggage weight and figure out what you can bring with you.',
    link: 'Start packing',
  },
  {
    icon: '🛍️',
    title: 'Pack or Buy?',
    description:
      'Compare the cost of bringing items from home with buying them at your destination.',
    link: 'Compare items',
  },
  {
    icon: '📦',
    title: 'Moving Checklist',
    description:
      'Keep track of what to pack, what to buy, and what to check in your new accommodation.',
    link: 'Plan your move',
  },
]

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <a className="logo" href="#">
          <span className="logo-icon">↗</span>
          PackBuddy
        </a>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a className="nav-button" href="#features">
            Get started →
          </a>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              ✦ YOUR NEW CHAPTER STARTS HERE
            </span>

            <h1>
              Moving abroad?
              <br />
              <span>Pack smarter.</span>
            </h1>

            <p className="hero-description">
              Your all-in-one moving companion for studying abroad.
              Figure out what to pack, what to buy, and how to settle
              into your new home without the stress.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#features">
                Plan my move <span>→</span>
              </a>
              <a className="secondary-button" href="#how-it-works">
                See how it works
              </a>
            </div>

            <div className="hero-note">
              <span>✓</span> Less stress
              <span>✓</span> Fewer forgotten essentials
              <span>✓</span> Smarter spending
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-circle"></div>
            <div className="suitcase">🧳</div>

            <div className="floating-card top-card">
              <span>✈️</span>
              <div>
                <strong>New destination</strong>
                <small>New beginnings await</small>
              </div>
            </div>

            <div className="floating-card bottom-card">
              <span>✓</span>
              <div>
                <strong>Move-in ready</strong>
                <small>Your move, organised</small>
              </div>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-heading">
            <span className="eyebrow">YOUR MOVE, MADE EASIER</span>
            <h2>Everything you need, all in one place.</h2>
            <p>
              From your first packing list to the day you move in.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <a href="#how-it-works">
                  {feature.link} <span>→</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="how-it-works" id="how-it-works">
          <span className="eyebrow">A FRESH START, SIMPLIFIED</span>
          <h2>Your journey starts with a plan.</h2>
          <p>
            Make confident decisions about your luggage, your budget,
            and your new space — before you even leave home.
          </p>
          <a className="primary-button" href="#features">
            Explore your tools →
          </a>
        </section>
      </main>

      <footer>
        <a className="logo" href="#">
          <span className="logo-icon">↗</span>
          PackBuddy
        </a>
        <p>Pack smarter. Move easier. Start anywhere.</p>
      </footer>
    </div>
  )
}

export default App
