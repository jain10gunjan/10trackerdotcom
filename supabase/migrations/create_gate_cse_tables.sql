-- GATE CSE Mock Test System - Complete Database Setup
-- Run this script in your Supabase SQL Editor

-- =====================================================
-- STEP 1: Create the main tables
-- =====================================================

-- Create gate_cse_tests table
CREATE TABLE IF NOT EXISTS gate_cse_tests (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_questions INTEGER NOT NULL DEFAULT 65,
    duration INTEGER NOT NULL DEFAULT 180, -- in minutes
    difficulty VARCHAR(50) DEFAULT 'mixed',
    include_general_aptitude BOOLEAN DEFAULT true,
    include_engineering_math BOOLEAN DEFAULT true,
    custom_weightage BOOLEAN DEFAULT false,
    weightage_config JSONB,
    question_distribution JSONB,
    created_by VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gate_cse_test_instances table
CREATE TABLE IF NOT EXISTS gate_cse_test_instances (
    id BIGSERIAL PRIMARY KEY,
    test_id BIGINT REFERENCES gate_cse_tests(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    answers JSONB,
    score DECIMAL(5,2),
    analytics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Create indexes for better performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_gate_cse_tests_created_by ON gate_cse_tests(created_by);
CREATE INDEX IF NOT EXISTS idx_gate_cse_tests_is_active ON gate_cse_tests(is_active);
CREATE INDEX IF NOT EXISTS idx_gate_cse_tests_created_at ON gate_cse_tests(created_at);
CREATE INDEX IF NOT EXISTS idx_gate_cse_test_instances_test_id ON gate_cse_test_instances(test_id);
CREATE INDEX IF NOT EXISTS idx_gate_cse_test_instances_user_id ON gate_cse_test_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_cse_test_instances_created_at ON gate_cse_test_instances(created_at);

-- =====================================================
-- STEP 3: Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE gate_cse_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_cse_test_instances ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Create RLS policies
-- =====================================================

-- Policies for gate_cse_tests table
-- Anyone can read active tests
CREATE POLICY "Anyone can read active tests" ON gate_cse_tests
    FOR SELECT USING (is_active = true);

-- Only admin can create/update/delete tests
CREATE POLICY "Admin can manage tests" ON gate_cse_tests
    FOR ALL USING (created_by = 'jain10gunjan@gmail.com');

-- Policies for gate_cse_test_instances table
-- Users can only access their own test instances
CREATE POLICY "Users can access their own test instances" ON gate_cse_test_instances
    FOR ALL USING (user_id = current_user);

-- Allow users to create their own test instances
CREATE POLICY "Users can create test instances" ON gate_cse_test_instances
    FOR INSERT WITH CHECK (user_id = current_user);

-- =====================================================
-- STEP 5: Create trigger function for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_gate_cse_tests_updated_at 
    BEFORE UPDATE ON gate_cse_tests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 6: Grant necessary permissions
-- =====================================================

GRANT ALL ON gate_cse_tests TO authenticated;
GRANT ALL ON gate_cse_test_instances TO authenticated;
GRANT USAGE ON SEQUENCE gate_cse_tests_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE gate_cse_test_instances_id_seq TO authenticated;

-- =====================================================
-- STEP 7: Insert sample test data
-- =====================================================

INSERT INTO gate_cse_tests (name, description, total_questions, duration, difficulty, created_by) 
VALUES 
    ('GATE CSE Mock Test 2026 - Set 1', 'Comprehensive mock test covering all GATE CSE subjects with proper weightage distribution', 65, 180, 'mixed', 'jain10gunjan@gmail.com'),
    ('GATE CSE Practice Test - Programming', 'Focused test on Programming & Data Structures with detailed solutions', 30, 90, 'medium', 'jain10gunjan@gmail.com'),
    ('GATE CSE Quick Test - Algorithms', 'Quick practice test focusing on Algorithm design and analysis', 20, 60, 'hard', 'jain10gunjan@gmail.com'),
    ('GATE CSE Full Length Test - All Subjects', 'Complete GATE CSE mock test with all subjects and proper time management', 65, 180, 'mixed', 'jain10gunjan@gmail.com')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 8: Verify tables and data
-- =====================================================

-- Check if tables were created successfully
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('gate_cse_tests', 'gate_cse_test_instances')
ORDER BY table_name;

-- Check sample data
SELECT 
    id,
    name,
    total_questions,
    duration,
    difficulty,
    is_active,
    created_at
FROM gate_cse_tests
ORDER BY created_at DESC;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('gate_cse_tests', 'gate_cse_test_instances')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 9: Additional utility functions (optional)
-- =====================================================

-- Function to get test statistics
CREATE OR REPLACE FUNCTION get_test_statistics(test_id_param BIGINT)
RETURNS TABLE(
    total_attempts BIGINT,
    avg_score DECIMAL(5,2),
    highest_score DECIMAL(5,2),
    lowest_score DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_attempts,
        AVG(score)::DECIMAL(5,2) as avg_score,
        MAX(score)::DECIMAL(5,2) as highest_score,
        MIN(score)::DECIMAL(5,2) as lowest_score
    FROM gate_cse_test_instances
    WHERE test_id = test_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's test history
CREATE OR REPLACE FUNCTION get_user_test_history(user_id_param VARCHAR(255))
RETURNS TABLE(
    test_name VARCHAR(255),
    score DECIMAL(5,2),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.name as test_name,
        ti.score,
        ti.completed_at,
        t.total_questions
    FROM gate_cse_test_instances ti
    JOIN gate_cse_tests t ON ti.test_id = t.id
    WHERE ti.user_id = user_id_param
    ORDER BY ti.completed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 10: Final verification queries
-- =====================================================

-- Verify everything is working
SELECT 'Database setup completed successfully!' as status;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'gate_cse_tests'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('gate_cse_tests', 'gate_cse_test_instances')
ORDER BY tablename, indexname;

