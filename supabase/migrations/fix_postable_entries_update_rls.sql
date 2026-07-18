-- Fix RLS policies for postable_entries table UPDATE operations
-- This ensures updates work correctly for both anon and authenticated users

-- Drop existing update policies if they exist
DROP POLICY IF EXISTS "Allow anon users to update" ON postable_entries;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON postable_entries;

-- Create new update policies that work correctly
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

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'postable_entries';
