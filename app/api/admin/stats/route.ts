// GET /api/admin/stats - Get database statistics

import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Check if table exists first
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'products'
      ) as table_exists
    `

    if (!tableCheck.rows[0]?.table_exists) {
      return NextResponse.json({
        totalProducts: 0,
        totalAnalyses: 0,
        avgConfidence: 0,
        recentProducts: [],
        message: 'Database not initialized. Run migration first.',
      })
    }

    // Get total unique products
    const productCount = await sql`
      SELECT COUNT(*) as count FROM products
    `

    // Get total analyses (sum of times_requested)
    const analysesCount = await sql`
      SELECT COALESCE(SUM(times_requested), 0) as total FROM products
    `

    // Get average confidence score
    const avgConfidence = await sql`
      SELECT COALESCE(AVG(confidence_score), 0) as avg FROM products
      WHERE confidence_score IS NOT NULL
    `

    // Get recent products
    const recentProducts = await sql`
      SELECT
        product_name,
        brand,
        category,
        overall_rating,
        times_requested,
        created_at
      FROM products
      ORDER BY created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      totalProducts: parseInt(productCount.rows[0]?.count || '0'),
      totalAnalyses: parseInt(analysesCount.rows[0]?.total || '0'),
      avgConfidence: parseFloat(avgConfidence.rows[0]?.avg || '0'),
      recentProducts: recentProducts.rows,
    })

  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({
      totalProducts: 0,
      totalAnalyses: 0,
      avgConfidence: 0,
      recentProducts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
