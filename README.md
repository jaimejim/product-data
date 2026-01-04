# 🔍 Product Health Analyzer

A mobile-first PWA that analyzes food and personal care products from photos. Users snap ingredient lists and get instant health, toxicity, and safety ratings powered by Claude AI.

![Status](https://img.shields.io/badge/status-beta-yellow)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)

## Features

✅ **Photo Analysis** - Snap ingredient lists with your camera or upload images
✅ **Instant Results** - Smart caching for previously analyzed products (<500ms)
✅ **Health Scoring** - Visual 1-10 scores for health, toxicity, and overall rating
✅ **Detailed Insights** - Specific concerns with severity levels and explanations
✅ **Mobile-First** - PWA installable on phones with camera optimization
✅ **Privacy-Focused** - No photo storage, images processed in-memory only
✅ **Multi-Category** - Supports food, cosmetics, hygiene, supplements, beverages

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **AI:** Anthropic Claude 3.5 Sonnet (Vision API)
- **Database:** Vercel Postgres (or Neon)
- **Deployment:** Vercel (recommended)

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Anthropic API key ([Get one here](https://console.anthropic.com/))
- Vercel Postgres database (or local PostgreSQL)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd product-data
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your credentials:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-xxx
   POSTGRES_URL=postgres://xxx
   POSTGRES_PRISMA_URL=postgres://xxx
   ```

4. **Initialize the database**

   If using Vercel Postgres:
   - Create a Postgres database in your [Vercel dashboard](https://vercel.com/storage)
   - Copy the environment variables to `.env.local`
   - Run the schema:
     ```bash
     npm run db:init
     ```

   If using local PostgreSQL:
   ```bash
   psql -U postgres -d your_database -f sql/schema.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### Option 1: Vercel Postgres (Recommended for production)

1. Go to [vercel.com/storage](https://vercel.com/storage)
2. Create a new Postgres database
3. Copy the environment variables to `.env.local`
4. Run the schema: `npm run db:init`

### Option 2: Neon (Serverless Postgres)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `POSTGRES_URL` in `.env.local`
4. Run the schema manually or via migration

### Option 3: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database: `createdb product_analyzer`
3. Run schema: `psql -d product_analyzer -f sql/schema.sql`
4. Update `DATABASE_URL` in `.env.local`

## Project Structure

```
product-analyzer/
├── app/
│   ├── api/
│   │   └── analyze/route.ts      # Main analysis endpoint
│   ├── components/
│   │   ├── Camera.tsx            # Camera capture component
│   │   ├── ResultCard.tsx        # Results display
│   │   └── ScoreDisplay.tsx      # Score visualization
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout + PWA config
│   └── page.tsx                  # Main page
├── lib/
│   ├── claude.ts                 # Claude API integration
│   ├── db.ts                     # Database queries
│   ├── hash.ts                   # Hashing utilities
│   └── types.ts                  # TypeScript types
├── prompts/
│   └── analysis-prompt.txt       # Claude system prompt
├── public/
│   └── manifest.json             # PWA manifest
├── sql/
│   └── schema.sql                # Database schema
├── Claude.md                     # AI context document
└── README.md                     # This file
```

## How It Works

1. **User takes photo** of ingredient list (or uploads image)
2. **Image compressed** and optimized client-side
3. **Sent to Claude Vision API** for extraction + analysis
4. **Ingredients hashed** (SHA-256) for cache lookup
5. **Check database cache**
   - If found: instant return (<500ms)
   - If new: store analysis and return
6. **Display results** with visual scores and detailed insights

## Scoring System

### Health Score (1-10)
- **8-10:** Whole foods, minimal processing, beneficial nutrients
- **5-7:** Moderately processed, some beneficial ingredients
- **1-4:** Highly processed, low nutritional value

### Toxicity Score (1-10)
- **8-10:** Known carcinogens, severe allergens, banned substances
- **5-7:** Moderate concerns, potential irritants
- **1-4:** Generally safe, minimal concerns

### Overall Rating (1-10)
Weighted combination prioritizing safety (high toxicity severely impacts rating)

## API Endpoints

### `POST /api/analyze`

Analyzes a product image.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "product_name": "Example Product",
    "brand": "Brand Name",
    "category": "food",
    "health_score": 7,
    "toxicity_score": 3,
    "overall_rating": 7,
    "concerns": [...],
    "positive_aspects": [...],
    "ingredients": [...],
    "confidence_score": 0.95,
    "summary": "..."
  }
}
```

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

Required:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `POSTGRES_URL` - PostgreSQL connection string

Optional:
- `POSTGRES_PRISMA_URL` - Prisma-compatible connection string
- `NODE_ENV` - Environment (development/production)

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Create Vercel Postgres database
5. Deploy!

The app will automatically use Vercel's edge network and serverless functions.

### Deploy Elsewhere

Build the app:
```bash
npm run build
```

The app is a standard Next.js app and can be deployed to any Node.js hosting platform.

## Customization

### Modify Analysis Prompt

Edit `prompts/analysis-prompt.txt` to customize how Claude analyzes products.

### Add More Categories

1. Update `ProductCategory` type in `lib/types.ts`
2. Add category validation in `sql/schema.sql`
3. Update the analysis prompt

### Adjust Scoring Logic

Modify the scoring guidelines in `prompts/analysis-prompt.txt` or add post-processing in `lib/claude.ts`.

## Performance

- **Cached products:** <500ms response time
- **New analysis:** 5-7 seconds (includes Claude API call)
- **Image optimization:** Client-side compression before upload
- **Database:** Indexed lookups on ingredient hash

## Privacy & Security

- ✅ No photo storage - images processed in-memory only
- ✅ API key secured server-side (never exposed to client)
- ✅ HTTPS required in production
- ✅ Ingredient lists hashed for privacy
- ⚠️ Add rate limiting for production use

## Legal Disclaimer

This app is for **informational purposes only** and is not a substitute for medical or professional advice. Users should:
- Always check with healthcare providers for health concerns
- Verify ingredient information independently
- Understand that analysis is based on listed ingredients only
- Not rely solely on this app for health/safety decisions

## Roadmap

- [ ] User accounts and analysis history
- [ ] Product comparison side-by-side
- [ ] Barcode scanning integration
- [ ] Ethics scoring (animal testing, sustainability)
- [ ] External data sources (OpenBeautyFacts API)
- [ ] Alternative product suggestions
- [ ] Export results to PDF
- [ ] Offline PWA support
- [ ] Multi-language support

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues first
- Provide error logs and reproduction steps

## Acknowledgments

- Powered by [Anthropic Claude](https://www.anthropic.com/)
- Built with [Next.js](https://nextjs.org/)
- Deployed on [Vercel](https://vercel.com/)

---

**Made with ❤️ for healthier product choices**
