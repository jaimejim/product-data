// POST /api/analyze - Main product analysis endpoint

import { NextRequest, NextResponse } from 'next/server'
import { analyzeProductImage, optimizeImageForAnalysis } from '@/lib/claude'
import { hashIngredients } from '@/lib/hash'
import { getProductByHash, storeProductAnalysis, productToAnalysisData } from '@/lib/db'
import type { AnalysisResult, AnalyzeRequest } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30 // 30 seconds max (for Claude API call)

export async function POST(request: NextRequest) {
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

    // Call Claude Vision API
    console.log('Analyzing image with Claude Vision API...')
    const analysis = await analyzeProductImage({
      imageBase64,
      mediaType,
    })

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

    // Check cache
    console.log('Checking cache for hash:', ingredientsHash)
    const cachedProduct = await getProductByHash(ingredientsHash)

    if (cachedProduct) {
      console.log('Cache hit! Returning cached analysis')
      return NextResponse.json({
        status: 'cached',
        data: productToAnalysisData(cachedProduct),
        cached_at: cachedProduct.created_at.toISOString(),
      } as AnalysisResult)
    }

    // Store new analysis
    console.log('Cache miss. Storing new analysis...')
    const storedProduct = await storeProductAnalysis(ingredientsHash, analysis)

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
    } as AnalysisResult)

  } catch (error) {
    console.error('Error in /api/analyze:', error)

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Claude API error')) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Failed to analyze image. Please try again.',
            retry_after: 5,
          } as AnalysisResult,
          { status: 503 }
        )
      }

      if (error.message.includes('JSON')) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Failed to parse analysis results. Please try again.',
          } as AnalysisResult,
          { status: 500 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        status: 'error',
        message: 'An unexpected error occurred. Please try again.',
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
    version: '1.0.0',
  })
}
