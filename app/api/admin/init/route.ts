// POST /api/admin/init - Initialize database schema

import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export const runtime = 'nodejs'

export async function POST() {
  try {
    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        ingredients_hash TEXT UNIQUE NOT NULL,
        raw_ingredient_text TEXT NOT NULL,
        product_name TEXT,
        brand TEXT,
        category TEXT CHECK (category IN ('food', 'cosmetic', 'hygiene', 'supplement', 'beverage', 'other')),
        ingredients JSONB NOT NULL,
        health_score INTEGER CHECK (health_score BETWEEN 1 AND 10),
        toxicity_score INTEGER CHECK (toxicity_score BETWEEN 1 AND 10),
        overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 10),
        concerns JSONB,
        positive_aspects JSONB,
        confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
        analysis_version INTEGER DEFAULT 1,
        photo_quality_note TEXT,
        times_requested INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_ingredients_hash ON products(ingredients_hash)`
    await sql`CREATE INDEX IF NOT EXISTS idx_category ON products(category)`
    await sql`CREATE INDEX IF NOT EXISTS idx_overall_rating ON products(overall_rating)`
    await sql`CREATE INDEX IF NOT EXISTS idx_created_at ON products(created_at DESC)`

    // Create update function
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `

    // Drop trigger if exists, then create
    await sql`DROP TRIGGER IF EXISTS update_products_updated_at ON products`
    await sql`
      CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `

    // Create shared_links table
    await sql`
      CREATE TABLE IF NOT EXISTS shared_links (
        share_hash TEXT PRIMARY KEY,
        analysis_data JSONB NOT NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        last_viewed_at TIMESTAMP
      )
    `

    // Create indexes for shared_links
    await sql`CREATE INDEX IF NOT EXISTS idx_shared_product_id ON shared_links(product_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_shared_created_at ON shared_links(created_at DESC)`

    // Verify tables were created
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('products', 'shared_links')
    `

    if (result.rows.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Table creation verification failed',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      tables: ['products', 'shared_links'],
      indexes: ['idx_ingredients_hash', 'idx_category', 'idx_overall_rating', 'idx_created_at', 'idx_shared_product_id', 'idx_shared_created_at'],
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
