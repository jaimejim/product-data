import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function POST() {
  try {
    console.log('🔧 Starting orphan link repair...')

    // Find all orphaned share links (product_id IS NULL)
    const orphanedLinksNull = await sql`
      SELECT share_hash, analysis_data
      FROM shared_links
      WHERE product_id IS NULL
      ORDER BY created_at DESC
    `

    // Find share links pointing to deleted products
    const orphanedLinksDeleted = await sql`
      SELECT sl.share_hash
      FROM shared_links sl
      LEFT JOIN products p ON p.id = sl.product_id
      WHERE sl.product_id IS NOT NULL AND p.id IS NULL
    `

    console.log(`Found ${orphanedLinksNull.rows.length} NULL orphaned links and ${orphanedLinksDeleted.rows.length} links pointing to deleted products`)

    let fixed = 0
    let deleted = 0
    const failedLinks: string[] = []

    // First, delete all links pointing to deleted products (no recovery possible)
    for (const link of orphanedLinksDeleted.rows) {
      console.log(`🗑️ Deleting link ${link.share_hash} - points to deleted product`)
      await sql`DELETE FROM shared_links WHERE share_hash = ${link.share_hash}`
      deleted++
      failedLinks.push(link.share_hash)
    }

    // Try to link each NULL orphaned share link to its product
    for (const link of orphanedLinksNull.rows) {
      const analysisData = link.analysis_data
      const productName = analysisData.product_name
      const brand = analysisData.brand

      if (!productName) {
        console.log(`Deleting ${link.share_hash} - no product name`)
        await sql`DELETE FROM shared_links WHERE share_hash = ${link.share_hash}`
        deleted++
        continue
      }

      try {
        // Find matching product by name and brand
        let product
        if (brand) {
          product = await sql`
            SELECT id FROM products
            WHERE product_name = ${productName}
            AND brand = ${brand}
            LIMIT 1
          `
        } else {
          product = await sql`
            SELECT id FROM products
            WHERE product_name = ${productName}
            AND brand IS NULL
            LIMIT 1
          `
        }

        if (product.rows.length > 0) {
          const productId = product.rows[0].id

          // Update the share link
          await sql`
            UPDATE shared_links
            SET product_id = ${productId}
            WHERE share_hash = ${link.share_hash}
          `

          console.log(`✅ Fixed ${link.share_hash}: "${productName}" → product_id ${productId}`)
          fixed++
        } else {
          // Product doesn't exist - delete the orphaned link
          console.log(`🗑️ Deleting orphaned link ${link.share_hash} - product "${productName}" not found`)
          await sql`DELETE FROM shared_links WHERE share_hash = ${link.share_hash}`
          deleted++
          failedLinks.push(link.share_hash)
        }
      } catch (error) {
        console.error(`❌ Error processing ${link.share_hash}:`, error)
        // Delete problematic links
        await sql`DELETE FROM shared_links WHERE share_hash = ${link.share_hash}`
        deleted++
        failedLinks.push(link.share_hash)
      }
    }

    const totalOrphans = orphanedLinksNull.rows.length + orphanedLinksDeleted.rows.length

    return NextResponse.json({
      success: true,
      total: totalOrphans,
      fixed,
      deleted,
      message: `Fixed ${fixed} orphaned links, deleted ${deleted} unfixable links (${orphanedLinksDeleted.rows.length} pointed to deleted products)`,
      deletedLinks: failedLinks.slice(0, 10), // Show first 10
    })
  } catch (error) {
    console.error('Error repairing orphaned links:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
