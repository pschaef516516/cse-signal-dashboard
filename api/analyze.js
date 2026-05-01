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
    const { userMessage, mode } = await req.json()

    const SYSTEM_PROMPTS = {
      analysis: `You are a CSE analyst at HousecallPro. Analyze signal pipeline data and community quotes to surface what pros are actually experiencing.

Focus on:
- pipelineHealth: 1-2 sentences on match rate quality and signal volume
- themes: 3-5 recurring themes from the community quotes — what are pros frustrated about, what do they want, what's driving churn? Group similar quotes.

Return ONLY valid JSON — no markdown fences, no explanation:
{"pipelineHealth":{"headline":"...","body":"..."},"themes":[{"title":"...","detail":"...","sentiment":"negative|positive|neutral"}]}`,
      chat: `You are a CSE analyst at HousecallPro. Answer questions about the signal pipeline data concisely and directly. Plain English only, no markdown formatting, no bullet points. 2-3 sentences max unless more detail is genuinely needed.`,
    }

    const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.analysis

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const analysis = message.content?.[0]?.text ?? '{}'

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
