
import { useState } from 'react'
import './PackOrBuy.css'

function PackOrBuy() {
  const [item, setItem] = useState('')
  const [destination, setDestination] = useState('')
  const [origin, setOrigin] = useState('')
  const [searched, setSearched] = useState(false)
  const [recommendation, setRecommendation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(event) {
    event.preventDefault()

    if (!item.trim() || !destination.trim()) {
      setError('Please enter an item and your destination.')
      return
    }

    setError('')
    setRecommendation('')
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
            homeCountry: origin.trim() || 'Not specified',
            destinationCountry: destination.trim(),
            homeLocation: origin.trim(),
            destinationLocation: destination.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not get a recommendation.')
      }

      setRecommendation(data.recommendation)
    } catch (err) {
      setError(
        err.message ||
          'Could not connect to PackBuddy. Check that your backend is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  function getSearchUrl() {
    const query = `${item} price buy in ${destination}`
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`
  }

  function getGeneralSearchUrl() {
    const query = `${item} price shops in ${destination}`
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`
  }

  return (
    <main className="pack-buy-page">
      <section className="pack-buy-hero">
        <span className="pack-buy-eyebrow">
          YOUR SMARTER PACKING ASSISTANT
        </span>

        <h1>
          Pack it or <span>buy it?</span>
        </h1>

        <p className="pack-buy-description">
          Moving abroad? Find out how much your essentials cost at your
          destination before filling up your suitcase.
        </p>
      </section>

      <section className="pack-buy-card">
        <form onSubmit={handleSearch}>
          <div className="pack-buy-field">
            <label htmlFor="item">What are you thinking of bringing?</label>
            <input
              id="item"
              type="text"
              placeholder="e.g. rice cooker, bedding, winter coat"
              value={item}
              onChange={(event) => {
                setItem(event.target.value)
                setSearched(false)
                setRecommendation('')
                setError('')
              }}
            />
          </div>

          <div className="pack-buy-field">
            <label htmlFor="destination">Where are you moving to?</label>
            <input
              id="destination"
              type="text"
              placeholder="e.g. London, UK"
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value)
                setSearched(false)
                setRecommendation('')
                setError('')
              }}
            />
          </div>

          <div className="pack-buy-field">
            <label htmlFor="origin">
              Where are you travelling from? <span>(optional)</span>
            </label>
            <input
              id="origin"
              type="text"
              placeholder="e.g. Hong Kong"
              value={origin}
              onChange={(event) => {
                setOrigin(event.target.value)
                setSearched(false)
                setRecommendation('')
                setError('')
              }}
            />
          </div>

          {error && <p className="pack-buy-error">{error}</p>}

          <button
            className="pack-buy-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Getting recommendation...' : 'Find local prices'}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>
        </form>

        {searched && (
          <section className="pack-buy-results" aria-live="polite">
            <div className="pack-buy-result-icon" aria-hidden="true">
              <span>£</span>
            </div>

            <span className="pack-buy-result-label">
              YOUR PACKING RESULTS
            </span>
            <h2>{item}</h2>

            <p>
              Your destination: <strong>{destination}</strong>
            </p>

            {origin.trim() && (
              <p className="pack-buy-origin">
                Travelling from {origin} to {destination}
              </p>
            )}

            {loading && (
              <p>Gemini is considering your item and travel plans...</p>
            )}

            {recommendation && (
              <div className="pack-buy-notice">
                <strong>PackBuddy's AI recommendation</strong>
                <p className="pack-buy-recommendation">
                  {recommendation}
                </p>
              </div>
            )}

            <div className="pack-buy-notice">
              <strong>Compare local prices</strong>
              <p>
                These links open shopping searches. Prices have not yet
                been retrieved or verified directly by PackBuddy.
              </p>
            </div>

            <a
              className="pack-buy-button pack-buy-link"
              href={getSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              View shopping prices <span aria-hidden="true">↗</span>
            </a>

            <a
              className="pack-buy-secondary-link"
              href={getGeneralSearchUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              Search more shops →
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
            <h3>Check local prices</h3>
            <p>Explore prices at shops in your destination.</p>
          </article>

          <article>
            <span>03</span>
            <h3>Make your decision</h3>
            <p>Use AI advice and local shopping results to help you decide.</p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default PackOrBuy
