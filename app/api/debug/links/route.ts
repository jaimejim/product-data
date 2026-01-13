import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Count total products
    const totalProducts = await sql`SELECT COUNT(*) as count FROM products`

    // Count distinct products with share links (product_id IS NOT NULL)
    const productsWithLinks = await sql`
      SELECT COUNT(DISTINCT product_id) as count
      FROM shared_links
      WHERE product_id IS NOT NULL
    `

    // Count total share links
    const totalLinks = await sql`SELECT COUNT(*) as count FROM shared_links`

    // Count products without any share links
    const productsWithoutLinks = await sql`
      SELECT COUNT(*) as count
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM shared_links sl
        WHERE sl.product_id = p.id
      )
    `

    // Count orphaned links
    const orphanedLinksCount = await sql`
      SELECT COUNT(*) as count
      FROM shared_links
      WHERE product_id IS NULL
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
      stats: {
        total_products: Number(totalProducts.rows[0].count),
        products_with_links: Number(productsWithLinks.rows[0].count),
        products_without_links: Number(productsWithoutLinks.rows[0].count),
        total_share_links: Number(totalLinks.rows[0].count),
        orphaned_links_count: Number(orphanedLinksCount.rows[0].count),
      },
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
