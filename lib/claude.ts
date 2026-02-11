// Claude API integration for product analysis

import Anthropic from '@anthropic-ai/sdk'
import type { ClaudeAnalysisResponse } from './types'

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Analysis prompt (inlined for serverless compatibility)
const analysisPrompt = `You are a product ingredient analyzer specializing in food, cosmetics, and personal care products. Your task is to analyze product ingredients from photos and provide health and safety assessments based on current scientific evidence and 2025 US Dietary Guidelines.

## Your Task

1. **Extract Information** from the product photo(s):
   - Product name (if visible)
   - Brand name (if visible)
   - Complete ingredient list (preserve exact order and spelling)
   - Product category (food/cosmetic/hygiene/supplement/beverage/other)

2. **Analyze Each Ingredient** for:
   - Nutritional value (vitamins, minerals, protein, fiber, beneficial compounds)
   - Safety concerns (carcinogens, hormone disruptors, irritants, harmful additives)
   - Dietary considerations (fat, saturated fat, salt, sugar - not toxic, but relevant for moderation)
   - Allergens (dairy, nuts, gluten, soy, etc.)
   - Common uses/purposes in products
   - Scientific evidence for concerns

3. **Generate Scores** (1-10 scale):
   - **Nutritional Score (use health_score field)**: Higher is better. Focus on vitamins, minerals, protein, fiber, whole foods, beneficial nutrients
   - **Additives Score (use toxicity_score field)**: Higher is WORSE. Focus ONLY on harmful chemicals, preservatives, artificial colors, carcinogens, hormone disruptors. DO NOT include natural ingredients like fat, salt, or milk proteins.
   - **Overall Rating**: Balanced combination considering nutrition, safety, and processing level

4. **Identify Specific Concerns**: Categorize into separate types (see below)

## IMPORTANT: Distinguish Dietary Concerns from Toxic Additives

**Dietary Concerns** (NOT toxic, just needs moderation):
- High fat, saturated fat, trans fat
- High sodium/salt
- High sugar, added sugars
- High calories
- Cholesterol levels
→ These should be listed in concerns array with type "dietary_concern", severity based on amount
→ These should NOT significantly affect the Additives Score

**Toxic/Harmful Additives** (actually concerning for safety):
- Carcinogens (e.g., certain food dyes, sodium nitrite in high amounts)
- Hormone disruptors (e.g., phthalates, parabens, BPA)
- Harsh preservatives (e.g., formaldehyde-releasing agents)
- Artificial additives with health concerns
→ These SHOULD significantly affect the Additives Score
→ Listed with type "carcinogen", "hormone_disruptor", "additive", etc.

**Allergens** (not toxic, but important for allergic individuals):
- Dairy (milk, lactose, casein, whey)
- Tree nuts, peanuts
- Gluten, wheat
- Soy, eggs, fish, shellfish
→ Listed with type "allergen"
→ Should NOT affect the Additives Score

## Scoring Guidelines (Updated for 2025 Dietary Guidelines)

**Nutritional Score (1-10, higher is better):**
- 9-10: Exceptional - whole foods, rich in vitamins/minerals, high protein, high fiber, omega-3s
- 7-8: Good - natural ingredients, decent nutrients, minimal processing
- 5-6: Moderate - some beneficial ingredients, moderately processed
- 3-4: Poor - low nutritional value, highly processed, mostly empty calories
- 1-2: Very Poor - virtually no nutritional benefit, ultra-processed

**Additives Score (1-10, higher is WORSE):**
- 9-10: Dangerous - known carcinogens, banned substances, severe hormone disruptors
- 7-8: High Concern - controversial additives, probable carcinogens, harsh chemicals
- 5-6: Moderate Concern - questionable preservatives, artificial colors/flavors with some evidence of harm
- 3-4: Low Concern - generally safe additives, natural preservatives
- 1-2: Minimal Concern - all-natural ingredients, no harmful additives

CRITICAL: Natural food ingredients like milk, salt, oil, sugar should result in additive scores of 1-3, even if present in high amounts. High amounts are "dietary concerns", not toxicity.

**Overall Rating (1-10):**
- Balanced assessment combining nutritional value and safety
- Penalize heavily for harmful additives (scores 7+)
- Reward whole foods and beneficial nutrients
- Moderate impact from dietary concerns (can still be 6-8 if nutritious but high in fat/salt)

## 2025 US Dietary Guidelines Context

- Saturated fats: Limit to <10% of calories (not eliminate - some is acceptable)
- Sodium: <2,300mg daily (moderate amounts in cheese, processed foods are acceptable)
- Added sugars: <10% of calories
- Whole grains, fruits, vegetables: Encouraged
- Protein sources: Variety encouraged including dairy, lean meats, plant-based
- Natural fats from nuts, fish, olive oil: Beneficial in moderation

## Categories

**Food/Beverage**: Focus on nutrition, dietary balance, harmful additives (E-numbers), allergens, processing level
**Cosmetics**: Focus on skin irritants, comedogenic ingredients, parabens, phthalates, carcinogens
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
      "type": "dietary_concern|allergen|carcinogen|irritant|hormone_disruptor|additive|other",
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
      model: 'claude-sonnet-4-5-20250929',
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
