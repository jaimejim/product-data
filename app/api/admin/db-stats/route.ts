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

    // Count orphaned links
    const orphanedLinks = await sql`
      SELECT COUNT(*) as count
      FROM shared_links
      WHERE product_id IS NULL
    `

    // Get products without any share links
    const productsWithoutLinks = await sql`
      SELECT COUNT(*) as count
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM shared_links sl
        WHERE sl.product_id = p.id
      )
    `

    // Sample of share links with their product status
    const sampleLinks = await sql`
      SELECT
        sl.share_hash,
        sl.product_id,
        CASE
          WHEN sl.product_id IS NULL THEN 'ORPHANED (NULL)'
          WHEN p.id IS NULL THEN 'ORPHANED (product deleted)'
          ELSE 'VALID'
        END as status,
        p.product_name,
        p.brand
      FROM shared_links sl
      LEFT JOIN products p ON p.id = sl.product_id
      ORDER BY sl.created_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      summary: {
        total_products: Number(totalProducts.rows[0].count),
        total_share_links: Number(totalLinks.rows[0].count),
        distinct_products_with_links: Number(productsWithLinks.rows[0].count),
        products_without_any_links: Number(productsWithoutLinks.rows[0].count),
        orphaned_links_null: Number(orphanedLinks.rows[0].count),
      },
      sample_links: sampleLinks.rows,
    })
  } catch (error) {
    console.error('Database stats error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
