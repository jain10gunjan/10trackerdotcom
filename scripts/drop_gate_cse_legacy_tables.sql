-- =============================================================================
-- Deprecate legacy GATE CSE mock-test tables (replaced by mock_tests + user_test_attempts)
--
-- BEFORE RUNNING:
-- 1. Confirm no production traffic uses gate_cse_tests / gate_cse_test_instances.
-- 2. Optional backup:
--    pg_dump ... -t gate_cse_tests -t gate_cse_test_instances > gate_cse_backup.sql
-- 3. Run in Supabase SQL editor or psql.
-- =============================================================================

-- Drop dependent objects first
DROP TRIGGER IF EXISTS update_gate_cse_tests_updated_at ON gate_cse_tests;

DROP TABLE IF EXISTS gate_cse_test_instances CASCADE;
DROP TABLE IF EXISTS gate_cse_tests CASCADE;

-- Optional: drop sequences if they remain
DROP SEQUENCE IF EXISTS gate_cse_tests_id_seq CASCADE;
DROP SEQUENCE IF EXISTS gate_cse_test_instances_id_seq CASCADE;
