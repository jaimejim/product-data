// Product Health Analyzer - Type Definitions

export type ProductCategory = 'food' | 'cosmetic' | 'hygiene' | 'supplement' | 'beverage' | 'other'

export interface Ingredient {
  name: string
  purpose?: string  // e.g., "preservative", "flavor", "colorant"
  concerns?: string[]  // Quick list of concerns for this ingredient
}

export interface Concern {
  type: 'allergen' | 'carcinogen' | 'irritant' | 'hormone_disruptor' | 'additive' | 'other'
  severity: 'low' | 'moderate' | 'high'
  description: string
  ingredient?: string  // Which ingredient caused this concern
}

export interface PositiveAspect {
  type: 'nutrient' | 'natural' | 'beneficial' | 'safe'
  description: string
  ingredient?: string
}

export interface Product {
  id: number
  ingredients_hash: string
  raw_ingredient_text: string
  product_name: string | null
  brand: string | null
  category: ProductCategory | null
  ingredients: Ingredient[]
  health_score: number | null  // 1-10
  toxicity_score: number | null  // 1-10
  overall_rating: number | null  // 1-10
  concerns: Concern[] | null
  positive_aspects: PositiveAspect[] | null
  confidence_score: number | null  // 0.00-1.00
  analysis_version: number
  photo_quality_note: string | null
  times_requested: number
  created_at: Date
  updated_at: Date
}

// API Response Types
export type AnalysisResult =
  | { status: 'success'; data: AnalysisData; product_id?: number; ingredients_hash?: string }
  | { status: 'cached'; data: AnalysisData; cached_at: string; product_id?: number; ingredients_hash?: string }
  | { status: 'poor_quality'; message: string; suggestion: string }
  | { status: 'not_product'; detected_type: string; message: string }
  | { status: 'error'; message: string; retry_after?: number }

export interface AnalysisData {
  product_name: string | null
  brand: string | null
  category: ProductCategory
  ingredients: Ingredient[]
  health_score: number
  toxicity_score: number
  overall_rating: number
  concerns: Concern[]
  positive_aspects: PositiveAspect[]
  confidence_score: number
  summary: string  // Brief 1-2 sentence summary
}

// Claude API Response Type
export interface ClaudeAnalysisResponse {
  product_name: string | null
  brand: string | null
  category: ProductCategory
  raw_ingredient_text: string
  ingredients: Ingredient[]
  health_score: number
  toxicity_score: number
  overall_rating: number
  concerns: Concern[]
  positive_aspects: PositiveAspect[]
  confidence_score: number
  summary: string
  photo_quality: 'excellent' | 'good' | 'fair' | 'poor'
  photo_quality_note?: string
}

// Request Types
export interface AnalyzeRequest {
  image: string  // base64 encoded image
}

// Score color helpers
export type ScoreColor = 'red' | 'yellow' | 'green'

export function getScoreColor(score: number): ScoreColor {
  if (score >= 1 && score <= 4) return 'red'
  if (score >= 5 && score <= 7) return 'yellow'
  return 'green'
}

export function getScoreLabel(score: number): string {
  if (score >= 1 && score <= 4) return 'Poor'
  if (score >= 5 && score <= 7) return 'Moderate'
  return 'Good'
}

// Severity badge colors
export function getSeverityColor(severity: Concern['severity']): string {
  switch (severity) {
    case 'high': return 'bg-red-100 text-red-800 border-red-300'
    case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-300'
  }
}
