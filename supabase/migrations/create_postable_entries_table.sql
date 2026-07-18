-- Create table for postable entries
-- This table stores entries that can be posted one by one
-- Each entry has a title, image_url, category, and is_posted status

CREATE TABLE IF NOT EXISTS postable_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  is_posted BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index on is_posted for faster queries
CREATE INDEX IF NOT EXISTS idx_postable_entries_is_posted ON postable_entries(is_posted);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_postable_entries_category ON postable_entries(category);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_postable_entries_created_at ON postable_entries(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE postable_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for fetching unposted entries)
CREATE POLICY "Allow public read access for unposted entries"
  ON postable_entries
  FOR SELECT
  USING (is_posted = FALSE);

-- Policy: Allow authenticated users to read all entries (for admin UI)
CREATE POLICY "Allow authenticated users to read all entries"
  ON postable_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anon users to insert (admin routes are protected by middleware)
CREATE POLICY "Allow anon users to insert"
  ON postable_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated users to insert (for admin UI)
CREATE POLICY "Allow authenticated users to insert"
  ON postable_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow anon users to update (for marking as posted via API)
CREATE POLICY "Allow anon users to update"
  ON postable_entries
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to update (for marking as posted)
CREATE POLICY "Allow authenticated users to update"
  ON postable_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anon users to delete (admin routes are protected by middleware)
CREATE POLICY "Allow anon users to delete"
  ON postable_entries
  FOR DELETE
  TO anon
  USING (true);

-- Policy: Allow authenticated users to delete (for admin UI)
CREATE POLICY "Allow authenticated users to delete"
  ON postable_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_postable_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_postable_entries_updated_at
  BEFORE UPDATE ON postable_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_postable_entries_updated_at();

-- Add comments for documentation
COMMENT ON TABLE postable_entries IS 'Stores entries that can be posted one by one. Each entry is marked as posted after being fetched.';
COMMENT ON COLUMN postable_entries.title IS 'Title of the entry';
COMMENT ON COLUMN postable_entries.image_url IS 'URL of the featured image';
COMMENT ON COLUMN postable_entries.category IS 'Category slug for the entry';
COMMENT ON COLUMN postable_entries.is_posted IS 'Whether this entry has been posted (fetched) or not';
