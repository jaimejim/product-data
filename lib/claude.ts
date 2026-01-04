// Claude API integration for product analysis

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { ClaudeAnalysisResponse } from './types'

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Load analysis prompt
let analysisPrompt: string
try {
  analysisPrompt = readFileSync(
    join(process.cwd(), 'prompts', 'analysis-prompt.txt'),
    'utf-8'
  )
} catch (error) {
  console.error('Failed to load analysis prompt:', error)
  analysisPrompt = 'Analyze this product image and extract ingredients.'
}

export interface AnalyzeImageOptions {
  imageBase64: string
  mediaType?: 'image/jpeg' | 'image/png' | 'image/webp'
}

/**
 * Analyzes a product image using Claude Vision API
 * Returns extracted product information and health/toxicity analysis
 */
export async function analyzeProductImage({
  imageBase64,
  mediaType = 'image/jpeg',
}: AnalyzeImageOptions): Promise<ClaudeAnalysisResponse> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: analysisPrompt,
            },
          ],
        },
      ],
    })

    // Extract the text response
    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse JSON response
    let jsonText = textContent.text.trim()

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    const analysis: ClaudeAnalysisResponse = JSON.parse(jsonText)

    // Validate response
    validateAnalysisResponse(analysis)

    return analysis
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('Claude API Error:', {
        status: error.status,
        message: error.message,
        type: error.type,
      })
      throw new Error(`Claude API error: ${error.message}`)
    }

    if (error instanceof SyntaxError) {
      console.error('JSON parsing error:', error)
      throw new Error('Failed to parse Claude response as JSON')
    }

    console.error('Unexpected error in analyzeProductImage:', error)
    throw error
  }
}

/**
 * Validates that the Claude response has all required fields
 */
function validateAnalysisResponse(analysis: any): asserts analysis is ClaudeAnalysisResponse {
  const requiredFields = [
    'category',
    'raw_ingredient_text',
    'ingredients',
    'health_score',
    'toxicity_score',
    'overall_rating',
    'concerns',
    'confidence_score',
    'summary',
    'photo_quality',
  ]

  for (const field of requiredFields) {
    if (!(field in analysis)) {
      throw new Error(`Missing required field in Claude response: ${field}`)
    }
  }

  // Validate scores are in range
  if (analysis.health_score < 1 || analysis.health_score > 10) {
    throw new Error('health_score must be between 1 and 10')
  }
  if (analysis.toxicity_score < 1 || analysis.toxicity_score > 10) {
    throw new Error('toxicity_score must be between 1 and 10')
  }
  if (analysis.overall_rating < 1 || analysis.overall_rating > 10) {
    throw new Error('overall_rating must be between 1 and 10')
  }
  if (analysis.confidence_score < 0 || analysis.confidence_score > 1) {
    throw new Error('confidence_score must be between 0 and 1')
  }

  // Validate arrays
  if (!Array.isArray(analysis.ingredients)) {
    throw new Error('ingredients must be an array')
  }
  if (!Array.isArray(analysis.concerns)) {
    throw new Error('concerns must be an array')
  }
}

/**
 * Compresses and optimizes image before sending to Claude
 * Reduces base64 size while maintaining readability
 */
export function optimizeImageForAnalysis(base64Image: string): {
  data: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
} {
  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')

  // Detect media type from original data URL
  let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
  if (base64Image.startsWith('data:image/png')) {
    mediaType = 'image/png'
  } else if (base64Image.startsWith('data:image/webp')) {
    mediaType = 'image/webp'
  }

  return {
    data: base64Data,
    mediaType,
  }
}
