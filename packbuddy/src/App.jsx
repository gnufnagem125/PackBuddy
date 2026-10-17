
import './App.css'

import { Routes, Route, Link } from 'react-router-dom'

import PackingCalculator from './features/PackingCalculator'
import DormRoomFit from './features/DormRoomFit'
import PackOrBuy from './features/PackOrBuy'
import TransportPlanner from './features/TransportPlanner'

const features = [
  {
    icon: '🧳',
    title: 'Smart Packing Calculator',
    description:
      'Estimate your luggage weight and figure out what you can bring.',
    link: 'Start packing',
    path: '/packing',
  },
  {
    icon: '📐',
    title: 'Dorm Room Fit Checker',
    description:
      'Check whether your belongings will fit in your new room.',
    link: 'Check your space',
    path: '/dorm-fit',
  },
  {
    icon: '🛍️',
    title: 'Bring from Home or Buy Locally?',
    description:
      'Compare the cost of bringing items from home with buying them at your destination.',
    link: 'Compare items',
    path: '/pack-or-buy',
  },
  {
    icon: '🚗',
    title: 'Transport Planner',
    description:
      'Plan how to transport yourself and your luggage to your new home.',
    link: 'Plan transport',
    path: '/transport',
  },
]

function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">
            ✦ YOUR NEW CHAPTER STARTS HERE
          </span>

          <h1>
            Pack smarter.
            <br />
            <span>Move easier. Spend less.</span>
          </h1>

          <p className="hero-description">
            Your all-in-one moving companion for studying abroad.
            Figure out what to pack, what to buy, and how to settle
            into your new home without the stress.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to="/packing">
              Plan my move <span>→</span>
            </Link>
            <Link className="secondary-button" to="/#how-it-works">
              See how it works
            </Link>
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
            <article className="feature-card" key={feature.path}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>

              <Link
                className="feature-card-action"
                to={feature.path}
              >
                {feature.link} <span>→</span>
              </Link>
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
        <Link className="primary-button" to="/#features">
          Explore your tools →
        </Link>
      </section>
    </>
  )
}

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <Link className="logo" to="/">
          <span className="logo-icon">↗</span>
          PackBuddy
        </Link>

        <div className="nav-links">
          <Link to="/#features">Features</Link>
          <Link to="/#how-it-works">How it works</Link>
          <Link className="nav-button" to="/#features">
            Get started →
          </Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/packing" element={<PackingCalculator />} />
        <Route path="/dorm-fit" element={<DormRoomFit />} />
        <Route path="/pack-or-buy" element={<PackOrBuy />} />
        <Route path="/transport" element={<TransportPlanner />} />
      </Routes>

      <footer>
        <Link className="logo" to="/">
          <span className="logo-icon">↗</span>
          PackBuddy
        </Link>
        <p>Pack smarter. Move easier. Spend less.</p>
      </footer>
    </div>
  )
}

export default App
