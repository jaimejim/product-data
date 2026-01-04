// Database initialization script
// Run with: npm run db:init

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { sql } = require('@vercel/postgres')
const { readFileSync } = require('fs')
const { join } = require('path')

async function initDatabase() {
  console.log('🔄 Initializing database...')

  try {
    // Read schema file
    const schemaPath = join(__dirname, '..', 'sql', 'schema.sql')
    const schemaSQL = readFileSync(schemaPath, 'utf-8')

    console.log('📖 Reading schema from:', schemaPath)

    // Execute schema
    // Split by semicolon and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('comment on')) {
        // Comments need special handling
        await sql.query(statement + ';')
      } else {
        await sql.query(statement)
      }
    }

    console.log('✅ Database schema initialized successfully!')
    console.log('📊 Tables created:')
    console.log('   - products')
    console.log('   - indexes')
    console.log('   - triggers')

    // Verify table exists
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'products'
    `

    if (result.rows.length > 0) {
      console.log('✅ Verification: products table exists')
    } else {
      console.log('⚠️  Warning: products table not found')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to initialize database:')
    console.error(error)
    process.exit(1)
  }
}

// Check for required environment variables
if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  console.error('❌ Error: POSTGRES_URL or DATABASE_URL environment variable not found')
  console.error('   Please set up your database connection in .env.local')
  process.exit(1)
}

initDatabase()
