-- Fix RLS policies for postable_entries table
-- Run this if you already created the table and are getting RLS errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON postable_entries;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON postable_entries;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON postable_entries;

-- Create new policies that allow both anon and authenticated users

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
