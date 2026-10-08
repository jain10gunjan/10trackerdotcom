-- Phase F: unique enrollment / roll_no per vendor (safe to re-run)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_members_roll_unique
  ON public.vendor_members (vendor_id, lower(trim(roll_no)))
  WHERE roll_no IS NOT NULL AND trim(roll_no) <> '';
