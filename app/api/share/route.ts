import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'
import type { AnalysisData } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

// Generate a unique 5-letter hash
function generateHash(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let hash = ''
  for (let i = 0; i < 5; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return hash
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { analysisData, productId } = body as {
      analysisData: AnalysisData
      productId?: number
    }

    if (!analysisData) {
      return NextResponse.json({ status: 'error', message: 'Missing analysis data' }, { status: 400 })
    }

    // Generate unique hash (retry if collision)
    let hash = generateHash()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      try {
        await sql`
          INSERT INTO shared_links (share_hash, analysis_data, product_id)
          VALUES (${hash}, ${JSON.stringify(analysisData)}, ${productId || null})
        `
        break // Success
      } catch (error: any) {
        if (error.code === '23505') {
          // Unique violation, try new hash
          hash = generateHash()
          attempts++
        } else {
          throw error
        }
      }
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { status: 'error', message: 'Failed to generate unique hash' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      hash,
    })
  } catch (error) {
    console.error('Failed to create shared link:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to create shared link' }, { status: 500 })
  }
}
