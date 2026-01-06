import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'
import { saveSharedResult } from '@/lib/share'
import { AnalysisData } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

// Get product by ingredients_hash and return/create share link
export async function GET(request: NextRequest, { params }: { params: { hash: string } }) {
  try {
    const { hash: ingredientsHash } = params

    if (!ingredientsHash) {
      return NextResponse.json({ status: 'error', message: 'Missing hash' }, { status: 400 })
    }

    // Get the product from database
    const productResult = await sql`
      SELECT
        p.*,
        sl.share_hash
      FROM products p
      LEFT JOIN shared_links sl ON sl.product_id = p.id
      WHERE p.ingredients_hash = ${ingredientsHash}
      LIMIT 1
    `

    if (productResult.rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Product not found' }, { status: 404 })
    }

    const product = productResult.rows[0]

    // If share link already exists, return it
    if (product.share_hash) {
      return NextResponse.json({
        status: 'success',
        share_hash: product.share_hash,
      })
    }

    // Create analysis data from product
    const analysisData: AnalysisData = {
      product_name: product.product_name,
      brand: product.brand,
      category: product.category || 'other',
      ingredients: product.ingredients,
      health_score: product.health_score,
      toxicity_score: product.toxicity_score,
      overall_rating: product.overall_rating,
      concerns: product.concerns || [],
      positive_aspects: product.positive_aspects || [],
      confidence_score: product.confidence_score,
      summary: product.summary || `Analysis of ${product.product_name || 'this product'}`,
    }

    // Create share link via API
    const shareResponse = await fetch(`${request.nextUrl.origin}/api/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisData,
        productId: product.id
      }),
    })

    if (shareResponse.ok) {
      const shareData = await shareResponse.json()
      if (shareData.status === 'success' && shareData.hash) {
        return NextResponse.json({
          status: 'success',
          share_hash: shareData.hash,
        })
      }
    }

    return NextResponse.json(
      { status: 'error', message: 'Failed to create share link' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Failed to get product:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to get product' },
      { status: 500 }
    )
  }
}
