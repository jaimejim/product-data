import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Increased timeout for bulk operation

// Generate a unique 5-letter hash
function generateHash(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let hash = ''
  for (let i = 0; i < 5; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return hash
}

export async function POST() {
  try {
    console.log('🔧 Creating share links for products without them...')

    // Find all products that don't have share links
    const productsWithoutLinks = await sql`
      SELECT p.id, p.product_name, p.brand, p.category, p.ingredients,
             p.health_score, p.toxicity_score, p.overall_rating,
             p.concerns, p.positive_aspects, p.confidence_score, p.summary
      FROM products p
      LEFT JOIN shared_links sl ON sl.product_id = p.id
      WHERE sl.product_id IS NULL
      ORDER BY p.updated_at DESC
    `

    console.log(`Found ${productsWithoutLinks.rows.length} products without share links`)

    let created = 0
    let failed = 0

    // Create share link for each product
    for (const product of productsWithoutLinks.rows) {
      try {
        // Build analysis data from product
        const analysisData = {
          product_name: product.product_name,
          brand: product.brand,
          category: product.category,
          ingredients: product.ingredients,
          health_score: product.health_score,
          toxicity_score: product.toxicity_score,
          overall_rating: product.overall_rating,
          concerns: product.concerns,
          positive_aspects: product.positive_aspects,
          confidence_score: product.confidence_score,
          summary: product.summary,
        }

        // Generate unique hash
        let hash = generateHash()
        let attempts = 0
        const maxAttempts = 10

        while (attempts < maxAttempts) {
          try {
            await sql`
              INSERT INTO shared_links (share_hash, analysis_data, product_id)
              VALUES (${hash}, ${JSON.stringify(analysisData)}, ${product.id})
            `
            break // Success
          } catch (error: any) {
            if (error.code === '23505') {
              // Unique violation, try new hash
              hash = generateHash()
              attempts++
            } else {
              throw error
            }
          }
        }

        if (attempts >= maxAttempts) {
          console.error(`Failed to generate unique hash for product ${product.id}`)
          failed++
          continue
        }

        console.log(`✅ Created share link ${hash} for "${product.product_name}" (ID: ${product.id})`)
        created++
      } catch (error) {
        console.error(`❌ Error creating link for product ${product.id}:`, error)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      total: productsWithoutLinks.rows.length,
      created,
      failed,
      message: `Created ${created} share links, ${failed} failed`,
    })
  } catch (error) {
    console.error('Error creating missing share links:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
