// GET /api/admin/health - System health check

import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

export async function GET() {
  const health = {
    api: 'ok',
    database: 'ok',
    apiMessage: '',
    dbMessage: '',
  }

  // Check Claude API
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      health.api = 'error'
      health.apiMessage = 'ANTHROPIC_API_KEY not set'
    } else {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
      // Just check if we can create a client (doesn't make API call)
      health.apiMessage = 'API key configured'
    }
  } catch (error) {
    health.api = 'error'
    health.apiMessage = error instanceof Error ? error.message : 'Unknown error'
  }

  // Check Database
  try {
    if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      health.database = 'error'
      health.dbMessage = 'Database URL not configured'
    } else {
      // Try to connect and query
      const result = await sql`SELECT NOW() as current_time`

      // Check if products table exists
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'products'
        ) as table_exists
      `

      const tableExists = tableCheck.rows[0]?.table_exists

      if (tableExists) {
        // Count products
        const count = await sql`SELECT COUNT(*) as count FROM products`
        health.dbMessage = `Connected. ${count.rows[0].count} products in database`
      } else {
        health.database = 'error'
        health.dbMessage = 'Database connected but products table not found. Run migration.'
      }
    }
  } catch (error) {
    health.database = 'error'
    health.dbMessage = error instanceof Error ? error.message : 'Database connection failed'
  }

  return NextResponse.json(health)
}
