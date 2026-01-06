import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test 1: Check connection
    const connectionTest = await sql`SELECT NOW() as current_time`

    // Test 2: Count products
    const productCount = await sql`SELECT COUNT(*) as count FROM products`

    // Test 3: Try to insert a test record (then delete it)
    const testHash = `test_${Date.now()}`

    try {
      await sql`
        INSERT INTO products (
          ingredients_hash,
          raw_ingredient_text,
          product_name,
          brand,
          category,
          ingredients,
          health_score,
          toxicity_score,
          overall_rating,
          concerns,
          positive_aspects,
          confidence_score,
          analysis_version,
          times_requested
        ) VALUES (
          ${testHash},
          'Test ingredients',
          'Test Product',
          'Test Brand',
          'food',
          '[]',
          5,
          5,
          5,
          '[]',
          '[]',
          0.5,
          1,
          1
        )
      `

      // Delete test record
      await sql`DELETE FROM products WHERE ingredients_hash = ${testHash}`

      return NextResponse.json({
        success: true,
        connection: 'OK',
        current_time: connectionTest.rows[0].current_time,
        product_count: productCount.rows[0].count,
        insert_test: 'OK - Insert and delete succeeded',
      })
    } catch (insertError: any) {
      return NextResponse.json({
        success: false,
        connection: 'OK',
        current_time: connectionTest.rows[0].current_time,
        product_count: productCount.rows[0].count,
        insert_test: 'FAILED',
        insert_error: insertError.message,
        insert_error_code: insertError.code,
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      error_code: error.code,
      error_detail: error.detail,
    }, { status: 500 })
  }
}
