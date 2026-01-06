import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check how many products have share links vs don't
    const stats = await sql`
      SELECT
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT CASE WHEN sl.share_hash IS NOT NULL THEN p.id END) as products_with_links,
        COUNT(DISTINCT CASE WHEN sl.share_hash IS NULL THEN p.id END) as products_without_links
      FROM products p
      LEFT JOIN shared_links sl ON sl.product_id = p.id
    `

    // Get recent products with their share link status (one row per product)
    const recent = await sql`
      SELECT
        p.id,
        p.product_name,
        p.brand,
        p.updated_at,
        (
          SELECT share_hash
          FROM shared_links
          WHERE product_id = p.id
          ORDER BY created_at DESC
          LIMIT 1
        ) as share_hash,
        p.id as linked_product_id
      FROM products p
      ORDER BY p.updated_at DESC
      LIMIT 20
    `

    // Get share links without product_id
    const orphanedLinks = await sql`
      SELECT share_hash, created_at
      FROM shared_links
      WHERE product_id IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      stats: stats.rows[0],
      recent_products: recent.rows,
      orphaned_links: orphanedLinks.rows,
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
