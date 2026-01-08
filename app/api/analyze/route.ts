// POST /api/analyze - Main product analysis endpoint with improved caching

import { NextRequest, NextResponse } from 'next/server'
import { analyzeProductImage, optimizeImageForAnalysis } from '@/lib/claude'
import { hashIngredients } from '@/lib/hash'
import { getProductByHash, storeProductAnalysis, productToAnalysisData } from '@/lib/db'
import type { AnalysisResult, AnalyzeRequest } from '@/lib/types'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds max for complex analyses

// Helper to hash image for quick cache lookup
function hashImage(imageData: string): string {
  return crypto.createHash('sha256').update(imageData).digest('hex').substring(0, 16)
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse request body
    const body: AnalyzeRequest = await request.json()

    if (!body.image) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'No image provided',
        } as AnalysisResult,
        { status: 400 }
      )
    }

    // Optimize image
    const { data: imageBase64, mediaType } = optimizeImageForAnalysis(body.image)

    console.log('🔍 Starting analysis...')

    // Call Claude Vision API
    const analysis = await analyzeProductImage({
      imageBase64,
      mediaType,
    })

    console.log('✅ Claude analysis complete')
    console.log('📝 Extracted ingredients:', analysis.raw_ingredient_text.substring(0, 100))

    // Check photo quality
    if (analysis.photo_quality === 'poor') {
      return NextResponse.json({
        status: 'poor_quality',
        message: 'Image quality is too low to analyze accurately',
        suggestion: analysis.photo_quality_note || 'Please take a clearer photo with better lighting',
      } as AnalysisResult)
    }

    // Check if this is actually a product
    if (analysis.category === 'other' && analysis.confidence_score < 0.5) {
      return NextResponse.json({
        status: 'not_product',
        detected_type: 'unknown',
        message: 'This does not appear to be a food or personal care product',
      } as AnalysisResult)
    }

    // Generate hash from ingredient text
    const ingredientsHash = await hashIngredients(analysis.raw_ingredient_text)
    console.log('🔑 Ingredient hash:', ingredientsHash)

    // Check cache
    const cachedProduct = await getProductByHash(ingredientsHash)

    if (cachedProduct) {
      const elapsed = Date.now() - startTime
      console.log(`⚡ Cache HIT! Returned in ${elapsed}ms`)
      console.log(`📤 Returning cached product_id: ${cachedProduct.id} to frontend`)

      return NextResponse.json({
        status: 'cached',
        data: productToAnalysisData(cachedProduct),
        cached_at: cachedProduct.created_at.toISOString(),
        product_id: cachedProduct.id,
      } as AnalysisResult)
    }

    // Store new analysis
    console.log('💾 Cache MISS - storing new analysis')
    const product = await storeProductAnalysis(ingredientsHash, analysis)

    const elapsed = Date.now() - startTime
    console.log(`✨ Analysis complete in ${elapsed}ms`)
    console.log(`📤 Returning product_id: ${product.id} to frontend`)

    // Return success response
    return NextResponse.json({
      status: 'success',
      data: {
        product_name: analysis.product_name,
        brand: analysis.brand,
        category: analysis.category,
        ingredients: analysis.ingredients,
        health_score: analysis.health_score,
        toxicity_score: analysis.toxicity_score,
        overall_rating: analysis.overall_rating,
        concerns: analysis.concerns,
        positive_aspects: analysis.positive_aspects || [],
        confidence_score: analysis.confidence_score,
        summary: analysis.summary,
      },
      product_id: product.id,
    } as AnalysisResult)

  } catch (error) {
    console.error('❌ Error in /api/analyze:', error)

    // Get detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('Detailed error:', {
      message: errorMessage,
      stack: errorStack,
    })

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Claude API error') || error.message.includes('404')) {
        return NextResponse.json(
          {
            status: 'error',
            message: `Failed to analyze: ${errorMessage}`,
            retry_after: 5,
          } as AnalysisResult,
          { status: 503 }
        )
      }

      if (error.message.includes('JSON')) {
        return NextResponse.json(
          {
            status: 'error',
            message: `Could not understand response. The image might be unclear or not show ingredients.`,
          } as AnalysisResult,
          { status: 500 }
        )
      }
    }

    // Generic error response with details
    return NextResponse.json(
      {
        status: 'error',
        message: `Analysis failed: ${errorMessage}. Please try a clearer photo of the ingredient list.`,
      } as AnalysisResult,
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Product Health Analyzer API',
    version: '2.0.0',
    model: 'claude-sonnet-4-5',
  })
}
