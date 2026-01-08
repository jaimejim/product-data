import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'
import type { AnalysisData } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

// Generate a unique 5-letter hash
function generateHash(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let hash = ''
  for (let i = 0; i < 5; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return hash
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { analysisData, productId } = body as {
      analysisData: AnalysisData
      productId?: number
    }

    console.log('=== SHARE LINK CREATION START ===')
    console.log(`Product: ${analysisData.product_name}`)
    console.log(`Brand: ${analysisData.brand || 'NULL'}`)
    console.log(`Provided product_id: ${productId}`)
    console.log(`Type of product_id: ${typeof productId}`)

    if (!analysisData) {
      return NextResponse.json({ status: 'error', message: 'Missing analysis data' }, { status: 400 })
    }

    // If no productId provided, try to find product by name and brand
    let finalProductId = productId
    if (!finalProductId && analysisData.product_name) {
      console.log(`⚠️ No product_id provided, attempting database lookup...`)
      try {
        // Match by product name and brand (handling null brands correctly)
        let productLookup
        if (analysisData.brand) {
          console.log(`Searching for: name="${analysisData.product_name}", brand="${analysisData.brand}"`)
          productLookup = await sql`
            SELECT id FROM products
            WHERE product_name = ${analysisData.product_name}
            AND brand = ${analysisData.brand}
            ORDER BY updated_at DESC
            LIMIT 1
          `
        } else {
          console.log(`Searching for: name="${analysisData.product_name}", brand=NULL`)
          productLookup = await sql`
            SELECT id FROM products
            WHERE product_name = ${analysisData.product_name}
            AND brand IS NULL
            ORDER BY updated_at DESC
            LIMIT 1
          `
        }

        if (productLookup.rows.length > 0) {
          finalProductId = productLookup.rows[0].id
          console.log(`✓ Found product in database! Using product_id: ${finalProductId}`)
        } else {
          console.warn(`⚠️ Product NOT found in database: ${analysisData.product_name}`)
          console.warn(`This share link will be orphaned (product_id = NULL)`)
        }
      } catch (error) {
        console.error('❌ Failed to lookup product:', error)
        // Continue without product_id
      }
    } else if (finalProductId) {
      console.log(`✓ Product ID provided directly: ${finalProductId}`)
    }

    // Generate unique hash (retry if collision)
    let hash = generateHash()
    let attempts = 0
    const maxAttempts = 10

    console.log(`Attempting to insert share link with product_id: ${finalProductId || 'NULL'}`)

    while (attempts < maxAttempts) {
      try {
        const insertResult = await sql`
          INSERT INTO shared_links (share_hash, analysis_data, product_id)
          VALUES (${hash}, ${JSON.stringify(analysisData)}, ${finalProductId || null})
          RETURNING share_hash, product_id, created_at
        `
        console.log(`✅ Database insert successful:`, insertResult.rows[0])
        break // Success
      } catch (error: any) {
        if (error.code === '23505') {
          // Unique violation, try new hash
          console.log(`Hash collision on ${hash}, generating new hash...`)
          hash = generateHash()
          attempts++
        } else {
          console.error(`❌ Database insert failed:`, error)
          throw error
        }
      }
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { status: 'error', message: 'Failed to generate unique hash' },
        { status: 500 }
      )
    }

    console.log(`=== SHARE LINK CREATED: ${hash} with product_id=${finalProductId || 'NULL'} ===`)

    return NextResponse.json({
      status: 'success',
      hash,
    })
  } catch (error) {
    console.error('Failed to create shared link:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to create shared link' }, { status: 500 })
  }
}
