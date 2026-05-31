CREATE TABLE IF NOT EXISTS external_brand_metrics (
  brand_id TEXT NOT NULL,
  source TEXT NOT NULL,
  followers INTEGER,
  engagement_rate REAL,
  posts_7d INTEGER,
  posts_30d INTEGER,
  avg_views INTEGER,
  last_post_date TEXT,
  social_score REAL,
  reputation_score REAL,
  complaints_7d INTEGER,
  complaints_30d INTEGER,
  google_reviews INTEGER,
  app_name TEXT,
  app_rating REAL,
  app_reviews INTEGER,
  app_version TEXT,
  app_last_update TEXT,
  sentiment_score REAL,
  risk_terms TEXT,
  raw_payload TEXT,
  collected_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_external_brand_metrics_brand_source_date
  ON external_brand_metrics (brand_id, source, collected_at);
