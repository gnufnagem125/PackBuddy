
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './PackOrBuy.css'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'


function PackOrBuy() {
  const [item, setItem] = useState('')
  const [destination, setDestination] = useState('')
  const [origin, setOrigin] = useState('')
  const [searched, setSearched] = useState(false)
  const [recommendation, setRecommendation] = useState('')
  const [prices, setPrices] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(event) {
    event.preventDefault()

    if (!item.trim() || !destination.trim() || !origin.trim()) {
      setError('Please enter an item, your home country, and your destination.')
      return
    }

    setError('')
    setRecommendation('')
    setPrices(null)
    setWarnings([])
    setSearched(true)
    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:3001/api/recommendation',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item: item.trim(),
            homeCountry: origin.trim(),
            destinationCountry: destination.trim(),
            homeLocation: '',
            destinationLocation: '',
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not get your price comparison.')
      }

      setRecommendation(data.recommendation || '')
      setPrices(data.prices || null)
      setWarnings(data.warnings || [])
    } catch (err) {
      setError(
        err.message ||
          'Could not connect to PackBuddy. Check that your backend is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(result) {
    if (result?.averagePrice == null || !result?.currency) {
      return 'Price unavailable'
    }

    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: result.currency,
      }).format(result.averagePrice)
    } catch {
      return `${result.averagePrice} ${result.currency}`
    }
  }

  function getSearchUrl(country) {
    const query = `${item} price buy in ${country}`
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`
  }

  function getGeneralSearchUrl() {
    const query = `${item} price shops in ${destination}`
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`
  }

  function clearResults() {
    setSearched(false)
    setRecommendation('')
    setPrices(null)
    setWarnings([])
    setError('')
  }

  return (
  <main className="pack-buy-page">
    <Link to="/" className="back-link">
      ← Back to Home
    </Link>

    <section className="pack-buy-hero">
      <span className="pack-buy-eyebrow">
        YOUR SMARTER PACKING ASSISTANT
      </span>

        <h1>
          Pack it or <span>buy it?</span>
        </h1>

        <p className="pack-buy-description">
          Moving abroad? Compare average shopping prices at home and at
          your destination before filling up your suitcase.
        </p>
      </section>

      <section className="pack-buy-card">
        <form onSubmit={handleSearch}>
          <div className="pack-buy-field">
            <label htmlFor="item">
              What are you thinking of bringing?
            </label>
            <input
              id="item"
              type="text"
              placeholder="e.g. rice cooker, bedding, winter coat"
              value={item}
              onChange={(event) => {
                setItem(event.target.value)
                clearResults()
              }}
            />
          </div>

          <div className="pack-buy-field">
            <label htmlFor="origin">
              Where are you travelling from?
            </label>
            <input
              id="origin"
              type="text"
              placeholder="e.g. Hong Kong"
              value={origin}
              onChange={(event) => {
                setOrigin(event.target.value)
                clearResults()
              }}
            />
          </div>

          <div className="pack-buy-field">
            <label htmlFor="destination">
              Where are you moving to?
            </label>
            <input
              id="destination"
              type="text"
              placeholder="e.g. United Kingdom"
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value)
                clearResults()
              }}
            />
          </div>

          {error && (
            <p className="pack-buy-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="pack-buy-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Comparing prices...' : 'Compare prices'}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>
        </form>

        {searched && (
          <section className="pack-buy-results" aria-live="polite">
            <div className="pack-buy-result-icon" aria-hidden="true">
            
            </div>

            <span className="pack-buy-result-label">
              YOUR PACKING RESULTS
            </span>

            <h2>{item}</h2>

            <p>
              Home country: <strong>{origin}</strong>
            </p>

            <p>
              Destination: <strong>{destination}</strong>
            </p>

            {loading && (
              <p>
                Searching shopping listings and generating your
                recommendation...
              </p>
            )}

            {prices && (
              <section className="pack-buy-price-comparison">
                <h3>Average local prices</h3>

                <p>
                  See how much your item costs in each country before
                  deciding whether to pack it or buy it.
                </p>

                <div className="pack-buy-price-grid">
                  <article className="pack-buy-price-card">
                    <h4>🏠 Home country</h4>

                    <p className="pack-buy-country">
                      {prices.home?.country || origin}
                    </p>

                    <p className="pack-buy-average">
                      {formatPrice(prices.home)}
                    </p>

                    {prices.home?.averagePrice != null ? (
                      <p>
                        Based on {prices.home.sampleSize} priced listings
                      </p>
                    ) : (
                      <p>No suitable priced listings were found.</p>
                    )}

                    <a
                      href={getSearchUrl(origin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pack-buy-secondary-link"
                    >
                      View local listings ↗
                    </a>
                  </article>

                  <article className="pack-buy-price-card">
                    <h4>📍 Destination</h4>

                    <p className="pack-buy-country">
                      {prices.destination?.country || destination}
                    </p>

                    <p className="pack-buy-average">
                      {formatPrice(prices.destination)}
                    </p>

                    {prices.destination?.averagePrice != null ? (
                      <p>
                        Based on {prices.destination.sampleSize} priced
                        listings
                      </p>
                    ) : (
                      <p>No suitable priced listings were found.</p>
                    )}

                    <a
                      href={getSearchUrl(destination)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pack-buy-secondary-link"
                    >
                      View local listings ↗
                    </a>
                  </article>
                </div>

                <p className="pack-buy-price-note">
                  These are averages of retrieved shopping listings, not
                  guaranteed market-wide prices. Products, quality, and
                  retailers may differ between countries. Prices are shown
                  in their local currencies.
                </p>
              </section>
            )}

            {warnings.length > 0 && (
              <ul className="pack-buy-warnings" role="status">
                {warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            )}

        
{recommendation && (
  <section className="pack-buy-ai-card">
    <div className="pack-buy-ai-heading">
      <span className="pack-buy-ai-icon">✦</span>
      <div>
        <h3>Your PackBuddy recommendation</h3>
        <p>A smarter way to pack for your trip</p>
      </div>
    </div>

    <div className="pack-buy-ai-content">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {recommendation
      .replace(/\\\*/g, '*')
      .replace(/\\#/g, '#')
      .replace(/\\-/g, '-')}
  </ReactMarkdown>
</div>
  </section>
)}


            {!loading && !prices && !error && (
              <p>
                No price data was returned. Please try searching again.
              </p>
            )}

            <a
              className="pack-buy-button pack-buy-link"
              href={getGeneralSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              Search more shops <span aria-hidden="true">↗</span>
            </a>
          </section>
        )}
      </section>

      <section className="pack-buy-how">
        <h2>A smarter way to pack</h2>

        <div className="pack-buy-steps">
          <article>
            <span>01</span>
            <h3>Enter your item</h3>
            <p>Tell us what you're considering bringing from home.</p>
          </article>

          <article>
            <span>02</span>
            <h3>Compare local prices</h3>
            <p>Compare average shopping listings from both countries.</p>
          </article>

          <article>
            <span>03</span>
            <h3>Make your decision</h3>
            <p>Use your price comparison and AI advice to help you decide.</p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default PackOrBuy
