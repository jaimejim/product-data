import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET() {
  try {
    const result = await sql`
      SELECT
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
      ORDER BY p.updated_at DESC
      LIMIT 20
    `

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
