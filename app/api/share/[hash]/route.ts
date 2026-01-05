import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET(request: NextRequest, { params }: { params: { hash: string } }) {
  try {
    const { hash } = params

    // Validate hash format
    if (!/^[a-z0-9]{5}$/.test(hash)) {
      return NextResponse.json({ status: 'error', message: 'Invalid hash format' }, { status: 400 })
    }

    // Fetch shared link
    const result = await sql`
      SELECT analysis_data, created_at, view_count
      FROM shared_links
      WHERE share_hash = ${hash}
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Link not found' }, { status: 404 })
    }

    const sharedLink = result.rows[0]

    // Increment view count
    await sql`
      UPDATE shared_links
      SET view_count = view_count + 1,
          last_viewed_at = NOW()
      WHERE share_hash = ${hash}
    `

    return NextResponse.json({
      status: 'success',
      data: sharedLink.analysis_data,
      metadata: {
        created_at: sharedLink.created_at,
        view_count: sharedLink.view_count + 1,
      },
    })
  } catch (error) {
    console.error('Failed to fetch shared link:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to fetch shared link' }, { status: 500 })
  }
}
