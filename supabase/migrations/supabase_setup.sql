-- GATE CSE Mock Test System - Supabase Setup
-- Run this script in your Supabase SQL editor

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gate_cse_tests_created_by ON gate_cse_tests(created_by);
CREATE INDEX IF NOT EXISTS idx_gate_cse_tests_is_active ON gate_cse_tests(is_active);
CREATE INDEX IF NOT EXISTS idx_gate_cse_test_instances_test_id ON gate_cse_test_instances(test_id);
CREATE INDEX IF NOT EXISTS idx_gate_cse_test_instances_user_id ON gate_cse_test_instances(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE gate_cse_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_cse_test_instances ENABLE ROW LEVEL SECURITY;

-- Create policies for gate_cse_tests
-- Anyone can read active tests
CREATE POLICY "Anyone can read active tests" ON gate_cse_tests
    FOR SELECT USING (is_active = true);

-- Only admin can create/update/delete tests
CREATE POLICY "Admin can manage tests" ON gate_cse_tests
    FOR ALL USING (created_by = 'jain10gunjan@gmail.com');

-- Create policies for gate_cse_test_instances
-- Users can only access their own test instances
CREATE POLICY "Users can access their own test instances" ON gate_cse_test_instances
    FOR ALL USING (user_id = current_user);

-- Insert some sample GATE CSE questions into examtracker table if they don't exist
-- Note: This assumes you already have an examtracker table with GATE_CSE questions
-- If not, you'll need to add them manually or import from your existing data

-- Sample data for testing (optional)
INSERT INTO gate_cse_tests (name, description, total_questions, duration, difficulty, created_by) 
VALUES 
    ('GATE CSE Mock Test 2026 - Set 1', 'Comprehensive mock test covering all GATE CSE subjects with proper weightage distribution', 65, 180, 'mixed', 'jain10gunjan@gmail.com'),
    ('GATE CSE Practice Test - Programming', 'Focused test on Programming & Data Structures with detailed solutions', 30, 90, 'medium', 'jain10gunjan@gmail.com'),
    ('GATE CSE Quick Test - Algorithms', 'Quick practice test focusing on Algorithm design and analysis', 20, 60, 'hard', 'jain10gunjan@gmail.com')
ON CONFLICT DO NOTHING;

-- Create a function to update the updated_at timestamp
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

-- Grant necessary permissions
GRANT ALL ON gate_cse_tests TO authenticated;
GRANT ALL ON gate_cse_test_instances TO authenticated;
GRANT USAGE ON SEQUENCE gate_cse_tests_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE gate_cse_test_instances_id_seq TO authenticated;
