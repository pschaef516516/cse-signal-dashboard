// api/analyze.js
// Vercel serverless function. Calls Claude Haiku 4.5 with a pre-aggregated
// signal summary and returns the analysis text as JSON.
// API key is read from process.env.ANTHROPIC_API_KEY — NEVER use a VITE_ prefix
// because that would embed the key in the browser bundle (RESEARCH.md Pitfall 2).

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req) {
  // CORS preflight — needed for local dev with Vite proxy / cross-origin tests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { summary } = await req.json()

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are a CSE (Customer Success Engineering) analyst at HousecallPro.
Analyze the signal pipeline data and provide a concise written summary for the CSE team.
Focus on: overall pipeline health, match rate quality, high-severity signals, and the top sources and categories.
Write in plain English with short paragraphs or bullet points. Be direct and actionable.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this signal pipeline summary as of ${summary.date}:\n\n${JSON.stringify(summary, null, 2)}`,
        },
      ],
    })

    // Guard against empty content (RESEARCH.md Pitfall 6)
    const analysis = message.content?.[0]?.text ?? 'No analysis returned.'

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('Anthropic API error:', err)
    return new Response(
      JSON.stringify({ error: 'Analysis failed. Please try again.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}
