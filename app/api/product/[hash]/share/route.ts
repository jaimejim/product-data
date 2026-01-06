import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

// Get or create a share link for a product by ingredients_hash
export async function GET(request: NextRequest, { params }: { params: { hash: string } }) {
  try {
    const { hash: ingredientsHash } = params

    if (!ingredientsHash) {
      return NextResponse.json({ status: 'error', message: 'Missing hash' }, { status: 400 })
    }

    // First, get the product
    const productResult = await sql`
      SELECT * FROM products
      WHERE ingredients_hash = ${ingredientsHash}
      LIMIT 1
    `

    if (productResult.rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Product not found' }, { status: 404 })
    }

    const product = productResult.rows[0]

    // Check if a share link already exists for this product
    const existingShare = await sql`
      SELECT share_hash FROM shared_links
      WHERE product_id = ${product.id}
      LIMIT 1
    `

    if (existingShare.rows.length > 0) {
      return NextResponse.json({
        status: 'success',
        hash: existingShare.rows[0].share_hash,
      })
    }

    // Create a new share link
    const generateHash = (): string => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let hash = ''
      for (let i = 0; i < 5; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return hash
    }

    // Validate required numeric fields
    if (
      product.health_score == null ||
      product.toxicity_score == null ||
      product.overall_rating == null ||
      product.confidence_score == null
    ) {
      return NextResponse.json(
        { status: 'error', message: 'Incomplete product data' },
        { status: 500 }
      )
    }

    // Generate summary from product data
    const concerns = product.concerns || []
    const positives = product.positive_aspects || []
    let summary = ''

    if (product.overall_rating >= 8) {
      summary = `${product.product_name || 'This product'} scores well with minimal concerns.`
    } else if (product.overall_rating >= 5) {
      summary = `${product.product_name || 'This product'} has a moderate rating with some areas of concern.`
    } else {
      summary = `${product.product_name || 'This product'} has a low rating with significant health concerns.`
    }

    if (concerns.length > 0) {
      summary += ` Main concerns: ${concerns.slice(0, 2).map((c: any) => c.description).join(', ')}.`
    }

    // Build analysis data from product
    const analysisData = {
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
      summary,
    }

    // Generate unique hash with retry
    let shareHash = generateHash()
    let attempts = 0

    while (attempts < 10) {
      try {
        await sql`
          INSERT INTO shared_links (share_hash, analysis_data, product_id)
          VALUES (${shareHash}, ${JSON.stringify(analysisData)}, ${product.id})
        `
        break
      } catch (error: any) {
        if (error.code === '23505') {
          shareHash = generateHash()
          attempts++
        } else {
          throw error
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      hash: shareHash,
    })
  } catch (error) {
    console.error('Failed to get/create share link:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to create share link' }, { status: 500 })
  }
}
