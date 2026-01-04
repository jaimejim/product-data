# Product Health Analyzer

## Project Overview
Mobile PWA for analyzing food and personal care product ingredients from photos using Claude Vision API.

**Stack:** Next.js 14 (App Router) + Vercel Postgres + Claude API + Tailwind CSS

## Key Requirements
- **No photo storage** - Images sent directly to Claude API, not persisted
- **Smart caching** - Cache analyses by ingredient hash for instant results
- **Mobile-first** - Camera interface optimized for phones
- **Fast analysis** - Target 5-7s for new products, <500ms for cached
- **Visual ratings** - Color-coded scores (1-10) with severity badges
- **Categories** - Support food and bathroom/personal care products

## Scoring System (MVP)
- **Health Score (1-10):** Nutritional value, beneficial ingredients
- **Toxicity Score (1-10):** Harmful chemicals, allergens, carcinogens
- **Overall Rating (1-10):** Weighted combination of health + toxicity

Color coding:
- 1-4: Red (poor/high concern)
- 5-7: Yellow/Orange (moderate)
- 8-10: Green (good/low concern)

*Ethics scoring deferred to Phase 2*

## Database Schema
PostgreSQL with `products` table:
- `ingredients_hash` - SHA-256 of raw ingredient text for cache lookups
- `raw_ingredient_text` - Original OCR output from Claude
- `ingredients` - JSONB array of parsed ingredients
- `category` - 'food' | 'cosmetic' | 'hygiene'
- `confidence_score` - Claude's confidence (0.00-1.00)
- `analysis_version` - Track prompt iterations
- `times_requested` - Cache hit counter

See `sql/schema.sql` for full schema.

## API Routes

### POST /api/analyze
Main analysis endpoint:
1. Receives base64 image from client
2. Compresses/optimizes image
3. Sends to Claude Vision API
4. Generates hash from extracted ingredients
5. Checks cache in PostgreSQL
6. If cached: return immediately
7. If new: analyze, store, return results

### GET /api/products/[hash] (Future)
Retrieve cached analysis by ingredients hash.

## Claude API Integration
Single API call extracts + analyzes:
- Extract product name, brand, ingredient list
- Parse ingredients into structured format
- Analyze health impact of each ingredient
- Assess toxicity concerns
- Generate scores and specific concerns
- Return JSON response

System prompt located in `prompts/analysis-prompt.txt`

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
```

Template in `.env.local.example`

## Development Notes
- **Hashing:** SHA-256 of raw ingredient text (preserves order/concentration)
- **Image optimization:** Client-side compression before upload
- **Camera API:** Uses `navigator.mediaDevices.getUserMedia()`
- **Error handling:** Graceful degradation for poor quality images, API errors
- **Performance:** Progress indicators, optimistic UI updates

## Product Categories
**Food Products:**
- Packaged foods
- Beverages
- Supplements

**Bathroom/Personal Care:**
- Cosmetics (makeup, skincare)
- Personal hygiene (deodorant, toothpaste)
- Hair care products

## Future Enhancements (Phase 2+)
- Ethics scoring (animal testing, sustainability)
- User accounts and history
- Product comparisons
- Barcode scanning
- Alternative product suggestions
- Community ratings
- External data integration (OpenBeautyFacts API)
- Offline PWA capabilities

## Legal Disclaimers
All results include:
- "For informational purposes only"
- "Not a substitute for medical/professional advice"
- "Always check with healthcare provider for health concerns"
- "Analysis based on listed ingredients only"
