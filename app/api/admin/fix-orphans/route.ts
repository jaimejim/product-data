import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function POST() {
  try {
    console.log('🔧 Starting orphan link repair...')

    // Find all orphaned share links (product_id IS NULL)
    const orphanedLinks = await sql`
      SELECT share_hash, analysis_data
      FROM shared_links
      WHERE product_id IS NULL
      ORDER BY created_at DESC
    `

    console.log(`Found ${orphanedLinks.rows.length} orphaned share links`)

    let fixed = 0
    let deleted = 0
    const failedLinks: string[] = []

    // Try to link each orphaned share link to its product
    for (const link of orphanedLinks.rows) {
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

    return NextResponse.json({
      success: true,
      total: orphanedLinks.rows.length,
      fixed,
      deleted,
      message: `Fixed ${fixed} orphaned links, deleted ${deleted} unfixable links`,
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
