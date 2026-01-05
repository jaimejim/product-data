-- Product Health Analyzer Database Schema
-- PostgreSQL database for caching product analyses

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,

    -- Caching and identification
    ingredients_hash TEXT UNIQUE NOT NULL,
    raw_ingredient_text TEXT NOT NULL,

    -- Product information
    product_name TEXT,
    brand TEXT,
    category TEXT CHECK (category IN ('food', 'cosmetic', 'hygiene', 'supplement', 'beverage', 'other')),

    -- Parsed ingredients
    ingredients JSONB NOT NULL,  -- Array of ingredient objects [{name, purpose, concerns}]

    -- Scores (1-10 scale)
    health_score INTEGER CHECK (health_score BETWEEN 1 AND 10),
    toxicity_score INTEGER CHECK (toxicity_score BETWEEN 1 AND 10),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 10),

    -- Detailed analysis
    concerns JSONB,  -- Array of concern objects [{type, severity, description, ingredient}]
    positive_aspects JSONB,  -- Array of positive findings

    -- Metadata
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    analysis_version INTEGER DEFAULT 1,
    photo_quality_note TEXT,  -- Any notes about image quality

    -- Analytics
    times_requested INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ingredients_hash ON products(ingredients_hash);
CREATE INDEX IF NOT EXISTS idx_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_overall_rating ON products(overall_rating);
CREATE INDEX IF NOT EXISTS idx_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_name ON products USING gin(to_tsvector('english', product_name));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE products IS 'Cached product analyses from Claude Vision API';
COMMENT ON COLUMN products.ingredients_hash IS 'SHA-256 hash of raw ingredient text for cache lookups';
COMMENT ON COLUMN products.raw_ingredient_text IS 'Original ingredient list text extracted from photo';
COMMENT ON COLUMN products.ingredients IS 'Structured array of ingredient objects';
COMMENT ON COLUMN products.concerns IS 'Array of health/toxicity concerns identified';
COMMENT ON COLUMN products.confidence_score IS 'Claude API confidence in analysis (0.00-1.00)';
COMMENT ON COLUMN products.times_requested IS 'Number of times this product was analyzed (cache hits + 1)';

-- Shared links table for permanent permalinks
CREATE TABLE IF NOT EXISTS shared_links (
    share_hash TEXT PRIMARY KEY,  -- 5-character alphanumeric hash

    -- Full analysis data
    analysis_data JSONB NOT NULL,  -- Complete AnalysisData object

    -- Link to products table (optional)
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,

    -- Analytics
    view_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    last_viewed_at TIMESTAMP
);

-- Indexes for shared links
CREATE INDEX IF NOT EXISTS idx_shared_product_id ON shared_links(product_id);
CREATE INDEX IF NOT EXISTS idx_shared_created_at ON shared_links(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE shared_links IS 'Permanent shareable links to product analyses';
COMMENT ON COLUMN shared_links.share_hash IS '5-character alphanumeric hash used in URL';
COMMENT ON COLUMN shared_links.analysis_data IS 'Complete product analysis data for permalink';
COMMENT ON COLUMN shared_links.view_count IS 'Number of times this shared link was accessed';
