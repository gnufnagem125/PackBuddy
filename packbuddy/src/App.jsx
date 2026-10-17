import './App.css'

import { Routes, Route, Link } from 'react-router-dom'
import PackingCalculator from './features/PackingCalculator'
import DormRoomFit from './features/DormRoomFit'
import PackOrBuy from './features/PackOrBuy'
import TransportPlanner from './features/TransportPlanner'
import MoveTracker from './features/MoveTracker'

const features = [
  {
    icon: '🧳',
    title: 'Smart Packing Calculator',
    description:
      'Estimate your luggage weight and figure out what you can bring.',
    link: 'Start packing',
    path: '/packingcalculator',
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
  {
  icon: '📦',
  title: 'Move-In & Move-Out Tracker',
  description:
    'Organise moving tasks, track deadlines, and stay on top of your accommodation checklist.',
  link: 'Track your move',
  path: '/move-tracker',
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
            <a className="primary-button hero-primary-button" href="#features">
              Plan my move <span>→</span>
            </a>
          </div>

          <div className="hero-note">
            <span>✓</span> Less stress
            <span>✓</span> Fewer forgotten essentials
            <span>✓</span> Smarter spending
          </div>
        </div>

        
<div className="hero-visual">
  <img
    src="/collage.png"
    alt="Packing collage"
    className="hero-photo"
  />
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

      <Link className="feature-card-action" to={feature.path}>
        {feature.link} <span>→</span>
      </Link>
    </article>
  ))}
</div>
      </section>
    </>
  )
}

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <Link className="logo" to="/">
          <img
            src="/packbuddylogo.png"
            alt="PackBuddy logo"
            className="navbar-logo"
          />
          <span>PackBuddy</span>
        </Link>

        <div className="nav-links">
          <a className="nav-button" href="/#features">
            Get started →
          </a>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/packingcalculator" element={<PackingCalculator />} />
        <Route path="/dorm-fit" element={<DormRoomFit />} />
        <Route path="/pack-or-buy" element={<PackOrBuy />} />
        <Route path="/transport" element={<TransportPlanner />} />
        <Route path="/move-tracker" element={<MoveTracker />} />
      </Routes>

      <footer>
        <Link className="logo" to="/">
          <img
            src="/packbuddylogo.png"
            alt=""
            className="navbar-logo"
          />
          <span>PackBuddy</span>
        </Link>
        <p>Pack smarter. Move easier. Spend less.</p>
      </footer>
    </div>
  )
}

export default App