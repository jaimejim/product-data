import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET() {
  try {
    console.log('🔍 Fetching recent products with share links...')

    const result = await sql`
      WITH ranked_links AS (
        SELECT
          product_id,
          share_hash,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY created_at DESC) as rn
        FROM shared_links
        WHERE product_id IS NOT NULL
      )
      SELECT
        p.ingredients_hash,
        p.product_name,
        p.brand,
        p.category,
        p.overall_rating,
        p.created_at,
        p.updated_at,
        p.times_requested,
        rl.share_hash
      FROM products p
      INNER JOIN ranked_links rl ON rl.product_id = p.id AND rl.rn = 1
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
