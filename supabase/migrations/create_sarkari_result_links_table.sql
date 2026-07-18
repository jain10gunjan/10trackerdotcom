-- Create table for storing Sarkari Result links
CREATE TABLE IF NOT EXISTS sarkari_result_links (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL CHECK (category IN ('results', 'admit_cards', 'latest_jobs', 'answer_key', 'documents', 'admission')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, url)
);

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_sarkari_result_links_category ON sarkari_result_links(category);

-- Create index on url for faster lookups
CREATE INDEX IF NOT EXISTS idx_sarkari_result_links_url ON sarkari_result_links(url);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_sarkari_result_links_created_at ON sarkari_result_links(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sarkari_result_links_updated_at 
    BEFORE UPDATE ON sarkari_result_links 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
