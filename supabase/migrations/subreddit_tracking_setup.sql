-- Subreddit Tracking Table Setup
-- Run this script in your Supabase SQL editor

-- Create subreddit_tracking table
CREATE TABLE IF NOT EXISTS subreddit_tracking (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_index INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial record if it doesn't exist
INSERT INTO subreddit_tracking (id, last_index)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subreddit_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subreddit_tracking_updated_at 
    BEFORE UPDATE ON subreddit_tracking 
    FOR EACH ROW 
    EXECUTE FUNCTION update_subreddit_tracking_updated_at();

-- Grant necessary permissions
GRANT ALL ON subreddit_tracking TO authenticated;
GRANT ALL ON subreddit_tracking TO anon;
