import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET() {
  try {
    console.log('🔍 Fetching recent products with share links...')

    // Use the same query as admin diagnostics which works correctly
    const result = await sql`
      SELECT
        p.id,
        p.ingredients_hash,
        p.product_name,
        p.brand,
        p.category,
        p.overall_rating,
        p.created_at,
        p.updated_at,
        p.times_requested,
        (
          SELECT share_hash
          FROM shared_links
          WHERE product_id = p.id
          ORDER BY created_at DESC
          LIMIT 1
        ) as share_hash
      FROM products p
      WHERE EXISTS (
        SELECT 1 FROM shared_links sl
        WHERE sl.product_id = p.id
      )
      ORDER BY p.updated_at DESC
      LIMIT 20
    `

    console.log(`✅ Found ${result.rows.length} products with share links`)

    return NextResponse.json({
      status: 'success',
      products: result.rows,
    })
  } catch (error) {
    console.error('Failed to fetch recent products:', error)
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
