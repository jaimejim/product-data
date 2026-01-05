// Claude API integration for product analysis

import Anthropic from '@anthropic-ai/sdk'
import type { ClaudeAnalysisResponse } from './types'

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Analysis prompt (inlined for serverless compatibility)
const analysisPrompt = `You are a product ingredient analyzer specializing in food, cosmetics, and personal care products. Your task is to analyze product ingredients from photos and provide health and safety assessments.

## Your Task

1. **Extract Information** from the product photo(s):
   - Product name (if visible)
   - Brand name (if visible)
   - Complete ingredient list (preserve exact order and spelling)
   - Product category (food/cosmetic/hygiene/supplement/beverage/other)

2. **Analyze Each Ingredient** for:
   - Health impact (nutritional value, benefits, risks)
   - Toxicity concerns (carcinogens, allergens, irritants, hormone disruptors)
   - Common uses/purposes in products
   - Scientific evidence for concerns

3. **Generate Scores** (1-10 scale):
   - **Health Score**: Higher is better. Consider nutritional value, beneficial ingredients, natural vs synthetic
   - **Toxicity Score**: Higher is worse. Consider harmful chemicals, allergens, carcinogens, irritants
   - **Overall Rating**: Weighted combination favoring health and penalizing toxicity

4. **Identify Specific Concerns**: List top 3-5 most important issues with severity levels

## Scoring Guidelines

**Health Score (1-10):**
- 8-10: Whole foods, minimal processing, beneficial nutrients, natural ingredients
- 5-7: Moderately processed, some beneficial ingredients, acceptable additives
- 1-4: Highly processed, low nutritional value, artificial ingredients dominate

**Toxicity Score (1-10):**
- 8-10: Known carcinogens, severe allergens, banned substances, hormone disruptors
- 5-7: Moderate concerns, potential irritants, controversial additives
- 1-4: Generally recognized as safe (GRAS), minimal concerns, natural ingredients

**Overall Rating (1-10):**
- Prioritize safety: High toxicity severely impacts overall rating
- Reward health: Natural, beneficial ingredients boost rating
- Balance: A product can be "not harmful" but also "not nutritious"

## Categories

**Food/Beverage**: Focus on nutrition, additives (E-numbers), allergens, processing level
**Cosmetics**: Focus on skin irritants, comedogenic ingredients, parabens, phthalates
**Hygiene**: Focus on harsh chemicals, antibacterials, fragrances, preservatives
**Supplements**: Focus on active ingredients, fillers, dosages, bioavailability

## Output Format

Return ONLY a valid JSON object (no markdown, no additional text):

{
  "product_name": "string or null",
  "brand": "string or null",
  "category": "food|cosmetic|hygiene|supplement|beverage|other",
  "raw_ingredient_text": "complete extracted ingredient list exactly as shown",
  "ingredients": [
    {
      "name": "ingredient name",
      "purpose": "preservative|flavor|colorant|emulsifier|etc",
      "concerns": ["concern1", "concern2"]
    }
  ],
  "health_score": 1-10,
  "toxicity_score": 1-10,
  "overall_rating": 1-10,
  "concerns": [
    {
      "type": "allergen|carcinogen|irritant|hormone_disruptor|additive|other",
      "severity": "low|moderate|high",
      "description": "detailed explanation",
      "ingredient": "which ingredient causes this"
    }
  ],
  "positive_aspects": [
    {
      "type": "nutrient|natural|beneficial|safe",
      "description": "what's good about this",
      "ingredient": "optional ingredient name"
    }
  ],
  "confidence_score": 0.0-1.0,
  "summary": "Brief 1-2 sentence summary of overall assessment",
  "photo_quality": "excellent|good|fair|poor",
  "photo_quality_note": "optional note if image has issues"
}

Be thorough, evidence-based, and helpful. Users trust your analysis for health decisions.`

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
      model: 'claude-3-5-sonnet-20240620',
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
