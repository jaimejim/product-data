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
    let failed = 0

    // Try to link each orphaned share link to its product
    for (const link of orphanedLinks.rows) {
      const analysisData = link.analysis_data
      const productName = analysisData.product_name
      const brand = analysisData.brand

      if (!productName) {
        console.log(`Skipping ${link.share_hash} - no product name`)
        failed++
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
          console.log(`⚠️ No product found for "${productName}" (brand: ${brand || 'NULL'})`)
          failed++
        }
      } catch (error) {
        console.error(`❌ Error fixing ${link.share_hash}:`, error)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      total: orphanedLinks.rows.length,
      fixed,
      failed,
      message: `Fixed ${fixed} orphaned links, ${failed} could not be fixed`,
    })
  } catch (error) {
    console.error('Error repairing orphaned links:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
