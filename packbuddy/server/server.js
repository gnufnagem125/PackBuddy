
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null

app.get('/api/health', (req, res) => {
  res.json({ status: 'PackBuddy backend is running!' })
})

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
      typeof homeLocation !== 'string' ||
      typeof destinationLocation !== 'string' ||
      homeLocation.length > 120 ||
      destinationLocation.length > 120
    ) {
      return res.status(400).json({
        error: 'Please enter a valid item and locations.',
      })
    }

    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API key is missing. Check your .env file.',
      })
    }

    const prompt = `
You are PackBuddy, an assistant helping international students
decide whether to pack an item from home or buy it at their destination.

Item: ${item.trim()}
Home country: ${homeCountry}
Home city or area: ${homeLocation || 'Not specified'}
Destination country: ${destinationCountry}
Destination city or area: ${destinationLocation || 'Not specified'}

Give a practical recommendation using these headings:
1. Recommendation: Pack or Buy
2. Why
3. What to consider
4. Confidence

Consider portability, luggage space, availability, likely price differences,
and whether the item may be unsuitable for air travel.

Do not invent exact prices or claim to have checked live shopping listings.
If you lack reliable information about local prices or availability, say so.
Keep the answer friendly and concise.
`

    const response = await ai.models.generateContent({
  model: 'gemini-3.8-flash',
  contents: prompt,
})

    res.json({
      recommendation:
        response.text || 'Sorry, no recommendation was generated.',
    })
  } catch (error) {
    console.error('Gemini recommendation failed:', error.message)

    res.status(502).json({
      error: 'Could not get a recommendation. Please try again.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`PackBuddy backend running at http://localhost:${PORT}`)
})
