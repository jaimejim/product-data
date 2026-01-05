import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET() {
  try {
    const result = await sql`
      SELECT
        ingredients_hash,
        product_name,
        brand,
        category,
        overall_rating,
        created_at,
        updated_at,
        times_requested
      FROM products
      ORDER BY updated_at DESC
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
