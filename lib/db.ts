// Database client and query functions

import { sql } from '@vercel/postgres'
import type { Product, ClaudeAnalysisResponse, AnalysisData } from './types'

/**
 * Looks up a product by ingredients hash
 * Returns null if not found in cache
 */
export async function getProductByHash(
  ingredientsHash: string
): Promise<Product | null> {
  try {
    const result = await sql<Product>`
      SELECT * FROM products
      WHERE ingredients_hash = ${ingredientsHash}
      LIMIT 1
    `

    if (result.rows.length === 0) {
      return null
    }

    // Increment times_requested counter
    await sql`
      UPDATE products
      SET times_requested = times_requested + 1
      WHERE ingredients_hash = ${ingredientsHash}
    `

    return result.rows[0]
  } catch (error) {
    console.error('Database error in getProductByHash:', error)
    throw new Error('Failed to query product cache')
  }
}

/**
 * Stores a new product analysis in the database
 */
export async function storeProductAnalysis(
  ingredientsHash: string,
  analysis: ClaudeAnalysisResponse
): Promise<Product> {
  try {
    console.log(`💾 Storing product: ${analysis.product_name || 'Unknown'} (hash: ${ingredientsHash})`)

    const result = await sql<Product>`
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
        photo_quality_note,
        times_requested
      ) VALUES (
        ${ingredientsHash},
        ${analysis.raw_ingredient_text},
        ${analysis.product_name},
        ${analysis.brand},
        ${analysis.category},
        ${JSON.stringify(analysis.ingredients)},
        ${analysis.health_score},
        ${analysis.toxicity_score},
        ${analysis.overall_rating},
        ${JSON.stringify(analysis.concerns)},
        ${JSON.stringify(analysis.positive_aspects || [])},
        ${analysis.confidence_score},
        1,
        ${analysis.photo_quality_note || null},
        1
      )
      ON CONFLICT (ingredients_hash) DO UPDATE SET
        times_requested = products.times_requested + 1,
        updated_at = NOW()
      RETURNING *
    `

    const product = result.rows[0]
    console.log(`✓ Product stored with ID: ${product.id}`)

    return product
  } catch (error) {
    console.error('❌ Database error in storeProductAnalysis:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error('Failed to store product analysis')
  }
}

/**
 * Converts a Product database row to AnalysisData for API response
 */
export function productToAnalysisData(product: Product): AnalysisData {
  return {
    product_name: product.product_name,
    brand: product.brand,
    category: product.category || 'other',
    ingredients: product.ingredients,
    health_score: product.health_score || 5,
    toxicity_score: product.toxicity_score || 5,
    overall_rating: product.overall_rating || 5,
    concerns: product.concerns || [],
    positive_aspects: product.positive_aspects || [],
    confidence_score: product.confidence_score || 0.5,
    summary: generateSummary(product),
  }
}

/**
 * Generates a summary from stored product data
 */
function generateSummary(product: Product): string {
  const rating = product.overall_rating || 5
  const productName = product.product_name || 'This product'

  if (rating >= 8) {
    return `${productName} is a good choice with minimal health concerns and beneficial ingredients.`
  } else if (rating >= 5) {
    return `${productName} has moderate concerns. Some ingredients may require attention.`
  } else {
    return `${productName} has several health and safety concerns that should be considered.`
  }
}

/**
 * Gets recent analyses for debugging/admin purposes
 */
export async function getRecentAnalyses(limit: number = 10): Promise<Product[]> {
  try {
    const result = await sql<Product>`
      SELECT * FROM products
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result.rows
  } catch (error) {
    console.error('Database error in getRecentAnalyses:', error)
    return []
  }
}

/**
 * Initializes the database schema
 * Run this during deployment or setup
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Read schema file
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const schemaSQL = readFileSync(
      join(process.cwd(), 'sql', 'schema.sql'),
      'utf-8'
    )

    // Execute schema
    await sql.query(schemaSQL)
    console.log('Database schema initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}
