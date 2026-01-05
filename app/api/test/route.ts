// GET /api/test - Test Claude API connection with a simple call

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

export async function GET() {
  const results: any = {
    apiKeyExists: !!process.env.ANTHROPIC_API_KEY,
    apiKeyPreview: process.env.ANTHROPIC_API_KEY
      ? `${process.env.ANTHROPIC_API_KEY.substring(0, 20)}...`
      : 'NOT SET',
    timestamp: new Date().toISOString(),
  }

  // Test Claude API with a simple call
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "API test successful" in JSON format: {"status": "success", "message": "API test successful"}',
        },
      ],
    })

    const textContent = message.content.find((block) => block.type === 'text')

    results.claudeApiTest = 'SUCCESS'
    results.claudeResponse = textContent && textContent.type === 'text' ? textContent.text : 'No text response'
    results.usage = message.usage

  } catch (error) {
    results.claudeApiTest = 'FAILED'
    results.error = error instanceof Error ? error.message : 'Unknown error'
    results.errorType = error?.constructor?.name || 'Unknown'

    if (error instanceof Anthropic.APIError) {
      results.apiError = {
        status: error.status,
        message: error.message,
        headers: error.headers,
      }
    }
  }

  return NextResponse.json(results, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
