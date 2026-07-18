-- Complete fix for postable_entries RLS policies
-- This will drop all existing policies and recreate them correctly

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Allow public read access for unposted entries" ON postable_entries;
DROP POLICY IF EXISTS "Allow authenticated users to read all entries" ON postable_entries;
DROP POLICY IF EXISTS "Allow anon users to insert" ON postable_entries;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON postable_entries;
DROP POLICY IF EXISTS "Allow anon users to update" ON postable_entries;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON postable_entries;
DROP POLICY IF EXISTS "Allow anon users to delete" ON postable_entries;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON postable_entries;

-- Step 2: Recreate all policies correctly

-- SELECT policies
CREATE POLICY "Allow public read access for unposted entries"
  ON postable_entries
  FOR SELECT
  USING (is_posted = FALSE);

CREATE POLICY "Allow authenticated users to read all entries"
  ON postable_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT policies
CREATE POLICY "Allow anon users to insert"
  ON postable_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert"
  ON postable_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE policies (this is the critical one)
CREATE POLICY "Allow anon users to update"
  ON postable_entries
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update"
  ON postable_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE policies
CREATE POLICY "Allow anon users to delete"
  ON postable_entries
  FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated users to delete"
  ON postable_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 3: Create a database function to mark entries as posted (bypasses RLS)
-- This is a more reliable way to update the status
CREATE OR REPLACE FUNCTION mark_postable_entry_as_posted(entry_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE postable_entries
  SET is_posted = TRUE,
      updated_at = NOW()
  WHERE id = entry_id
    AND is_posted = FALSE;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION mark_postable_entry_as_posted(UUID) TO anon;
GRANT EXECUTE ON FUNCTION mark_postable_entry_as_posted(UUID) TO authenticated;

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'postable_entries'
ORDER BY policyname;
