
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { GoogleGenAI } from '@google/genai'
import multer from 'multer'

dotenv.config()

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB maximum
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Please upload an image file.'))
    }
  },
})

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null

// Country names, Google Shopping regions, and local currencies.
const countries = {
  'hong kong': { gl: 'hk', currency: 'HKD' },
  hk: { gl: 'hk', currency: 'HKD' },
  'united kingdom': { gl: 'gb', currency: 'GBP' },
  uk: { gl: 'gb', currency: 'GBP' },
  britain: { gl: 'gb', currency: 'GBP' },
  england: { gl: 'gb', currency: 'GBP' },
  london: { gl: 'gb', currency: 'GBP' },
  'united states': { gl: 'us', currency: 'USD' },
  usa: { gl: 'us', currency: 'USD' },
  us: { gl: 'us', currency: 'USD' },
  canada: { gl: 'ca', currency: 'CAD' },
  australia: { gl: 'au', currency: 'AUD' },
  'new zealand': { gl: 'nz', currency: 'NZD' },
  singapore: { gl: 'sg', currency: 'SGD' },
  japan: { gl: 'jp', currency: 'JPY' },
  china: { gl: 'cn', currency: 'CNY' },
  'south korea': { gl: 'kr', currency: 'KRW' },
  korea: { gl: 'kr', currency: 'KRW' },
  india: { gl: 'in', currency: 'INR' },
  malaysia: { gl: 'my', currency: 'MYR' },
  thailand: { gl: 'th', currency: 'THB' },
  philippines: { gl: 'ph', currency: 'PHP' },
  indonesia: { gl: 'id', currency: 'IDR' },
  vietnam: { gl: 'vn', currency: 'VND' },
  france: { gl: 'fr', currency: 'EUR' },
  germany: { gl: 'de', currency: 'EUR' },
  italy: { gl: 'it', currency: 'EUR' },
  spain: { gl: 'es', currency: 'EUR' },
  ireland: { gl: 'ie', currency: 'EUR' },
  netherlands: { gl: 'nl', currency: 'EUR' },
  portugal: { gl: 'pt', currency: 'EUR' },
  switzerland: { gl: 'ch', currency: 'CHF' },
  'united arab emirates': { gl: 'ae', currency: 'AED' },
  uae: { gl: 'ae', currency: 'AED' },
  'south africa': { gl: 'za', currency: 'ZAR' },
  brazil: { gl: 'br', currency: 'BRL' },
  mexico: { gl: 'mx', currency: 'MXN' },
  turkey: { gl: 'tr', currency: 'TRY' },
  'saudi arabia': { gl: 'sa', currency: 'SAR' },
}

// Retrieve shopping listings and calculate their average price.
async function searchAveragePrice(item, country, location = '') {
  const countryInfo = countries[country.trim().toLowerCase()]

  if (!countryInfo) {
    throw new Error(
      `Country "${country}" is not supported yet. Please use a supported country name.`
    )
  }

  if (!process.env.SERPAPI_KEY) {
    throw new Error('SerpApi key is missing. Check your .env file.')
  }

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: item,
    gl: countryInfo.gl,
    api_key: process.env.SERPAPI_KEY,
  })

  if (location.trim()) {
    params.set('location', location.trim())
  }

  const response = await fetch(
    `https://serpapi.com/search.json?${params.toString()}`,
    { signal: AbortSignal.timeout(15000) }
  )

  if (!response.ok) {
    throw new Error(`Shopping search failed (${response.status}).`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error)
  }

  const listings = (data.shopping_results || [])
    .filter(
      (product) =>
        typeof product.extracted_price === 'number' &&
        Number.isFinite(product.extracted_price) &&
        product.extracted_price > 0
    )
    .slice(0, 20)

  if (listings.length === 0) {
    return {
      country,
      currency: countryInfo.currency,
      averagePrice: null,
      sampleSize: 0,
      listings: [],
    }
  }

  const averagePrice =
    listings.reduce((sum, product) => sum + product.extracted_price, 0) /
    listings.length

  return {
    country,
    currency: countryInfo.currency,
    averagePrice: Math.round(averagePrice * 100) / 100,
    sampleSize: listings.length,
    listings: listings.slice(0, 5).map((product) => ({
      title: product.title,
      price: product.extracted_price,
      link: product.product_link || null,
    })),
  }
}

// Stop waiting for a slow AI response after a set time.
function withTimeout(promise, milliseconds) {
  let timer

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('Gemini request timed out.'))
    }, milliseconds)
  })

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer)
  })
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'PackBuddy backend is running!' })
})


function cleanRecommendation(text) {
  const cleaned = String(text || '')
    .replace(/\\([\\`*_{}[\]()#+.!>~-])/g, '$1')
    .replace(/[*#_`~]/g, '')
    .replace(/^\s*[-=]{3,}\s*$/gm, '')
    .trim()

  const verdict = cleaned.match(/(?:VERDICT|RECOMMENDATION)\s*:\s*([^\n]+)/i)
  const reason = cleaned.match(/REASON\s*:\s*([^\n]+)/i)
  const tip = cleaned.match(/TIP\s*:\s*([^\n]+)/i)

  if (verdict && reason && tip) {
    return `VERDICT: ${verdict[1].trim()}\nREASON: ${reason[1].trim()}\nTIP: ${tip[1].trim()}`
  }

  return cleaned
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line && !/^#{1,6}\s/.test(line))
    .slice(0, 3)
    .join('\n')
}


app.post('/api/recommendation', async (req, res) => {
  try {
    const {
      item,
      homeCountry,
      destinationCountry,
      homeLocation = '',
      destinationLocation = '',
    } = req.body

    if (
      typeof item !== 'string' ||
      !item.trim() ||
      item.length > 120 ||
      typeof homeCountry !== 'string' ||
      typeof destinationCountry !== 'string' ||
      !homeCountry.trim() ||
      !destinationCountry.trim() ||
      typeof homeLocation !== 'string' ||
      typeof destinationLocation !== 'string' ||
      homeLocation.length > 120 ||
      destinationLocation.length > 120
    ) {
      return res.status(400).json({
        error: 'Please enter a valid item and locations.',
      })
    }

    // Search prices even if the AI service is unavailable.
    const [homeResult, destinationResult] = await Promise.allSettled([
      searchAveragePrice(item.trim(), homeCountry, homeLocation),
      searchAveragePrice(item.trim(), destinationCountry, destinationLocation),
    ])

    const homePrices =
      homeResult.status === 'fulfilled' ? homeResult.value : null

    const destinationPrices =
      destinationResult.status === 'fulfilled'
        ? destinationResult.value
        : null

    console.log('Home prices:', homePrices)
    console.log('Destination prices:', destinationPrices)

    const priceErrors = []

    if (homeResult.status === 'rejected') {
      console.error('Home shopping search failed:', homeResult.reason.message)
      priceErrors.push('Could not retrieve home-country prices.')
    }

    if (destinationResult.status === 'rejected') {
      console.error(
        'Destination shopping search failed:',
        destinationResult.reason.message
      )
      priceErrors.push('Could not retrieve destination-country prices.')
    }

    const formatPrice = (result) => {
      if (!result) return 'Unavailable'

      if (result.averagePrice === null) {
        return 'No suitable priced listings found'
      }

      return `${result.averagePrice} ${result.currency} (based on ${result.sampleSize} listings)`
    }

    

const prompt = `
You are PackBuddy, a concise packing assistant for students moving abroad.

Item: ${item}
Home country: ${homeCountry}
Destination country: ${destinationCountry}
Home price data: ${JSON.stringify(homePrices)}
Destination price data: ${JSON.stringify(destinationPrices)}

Return exactly these three lines, with no introduction:

VERDICT: PACK or BUY AT DESTINATION
REASON: One short sentence explaining the decision.
TIP: One practical sentence the student should know.

Rules:
- Maximum 45 words total.
- Never greet the user or introduce yourself.
- Do not include headings, numbered lists, bullet points, or Markdown.
- Do not repeat prices; the website displays them separately.
- Consider price, luggage space, and practicality.
- Do not claim an item is cheaper unless the price data supports it.
- If prices are unavailable or not comparable, say so.
`;



    // A fallback means price results can still be returned if Gemini fails.
    let recommendation =
      "The AI recommendation is temporarily unavailable, but your price comparison is ready. Compare the local prices and consider luggage space, product suitability, availability, and travel practicality."

    let aiUnavailable = false

    if (ai) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
          }),
          15000
        )

        recommendation = cleanRecommendation(response.text || recommendation)
      } catch (error) {
        aiUnavailable = true
        console.error('Gemini recommendation failed:', error.message)
      }
    } else {
      aiUnavailable = true
      console.error('Gemini API key is missing.')
    }

    if (aiUnavailable) {
      priceErrors.push(
        'The AI recommendation is temporarily unavailable. Any retrieved prices are still available.'
      )
    }

    // Always return the price results, even if Gemini fails.
    return res.json({
      recommendation,
      prices: {
        home: homePrices,
        destination: destinationPrices,
      },
      warnings: priceErrors,
    })
  } catch (error) {
    console.error('PackBuddy request failed:', error.message)

    return res.status(502).json({
      error:
        'The request could not be completed. Please check your connection and try again.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`PackBuddy backend running at http://localhost:${PORT}`)
})


app.post(
  '/api/identify-product',
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Please upload a product photo.',
        })
      }

      if (!ai) {
        return res.status(500).json({
          error: 'Gemini API key is missing. Check your .env file.',
        })
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: req.file.mimetype,
              data: req.file.buffer.toString('base64'),
            },
          },
          {
            text: `Identify the main product in this image.
Estimate the weight of ONE item in kilograms.

Return ONLY valid JSON in this format:
{
  "name": "Product name",
  "weightKg": 0.5,
  "weightText": "Approximately 500 g"
}

Use a reasonable estimate if the exact product is unknown.
Do not claim the weight is verified.
If you cannot estimate the weight reliably, use:
{
  "name": "Product name",
  "weightKg": null,
  "weightText": "Weight unknown"
}`,
          },
        ],
      })

      const text = response.text || ''
      const jsonText = text
        .replace(/```json\s*/i, '')
        .replace(/```\s*$/, '')
        .trim()

      const product = JSON.parse(jsonText)

      if (
        typeof product.name !== 'string' ||
        !product.name.trim() ||
        (product.weightKg !== null &&
          (typeof product.weightKg !== 'number' ||
            !Number.isFinite(product.weightKg) ||
            product.weightKg < 0))
      ) {
        throw new Error('Invalid product data returned by Gemini.')
      }

      return res.json({
        name: product.name,
        weightKg: product.weightKg,
        weightText: product.weightText || 'Weight unknown',
      })
    } catch (error) {
      console.error('Product identification failed:', error.message)

      return res.status(502).json({
        error: 'Could not identify the product. Please try another photo.',
      })
    }
  }
)

