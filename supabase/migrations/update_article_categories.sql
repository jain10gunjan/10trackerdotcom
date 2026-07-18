-- Update Article Categories Script
-- Run this script in your Supabase SQL editor to update existing categories

-- First, delete all existing categories
DELETE FROM article_categories;

-- Insert the new categories
INSERT INTO article_categories (name, slug, description, color) VALUES 
    ('Categories', 'categories', 'General categories and topics', '#3B82F6'),
    ('Latest Jobs', 'latest-jobs', 'Latest job openings and opportunities', '#10B981'),
    ('Exam Results', 'exam-results', 'Exam results and scorecards', '#F59E0B'),
    ('Answer Key', 'answer-key', 'Answer keys for various exams', '#EF4444'),
    ('Admit Cards', 'admit-cards', 'Admit cards and hall tickets', '#8B5CF6'),
    ('News', 'news', 'Latest news and updates', '#6B7280');

-- Update existing articles to use one of the new categories
-- This will map old categories to new ones
UPDATE articles 
SET category = CASE 
    WHEN category = 'exam-preparation' THEN 'categories'
    WHEN category = 'study-materials' THEN 'categories'
    WHEN category = 'success-stories' THEN 'news'
    WHEN category = 'career-guidance' THEN 'latest-jobs'
    WHEN category = 'technology' THEN 'news'
    WHEN category = 'general' THEN 'categories'
    ELSE 'categories'
END
WHERE category NOT IN ('categories', 'latest-jobs', 'exam-results', 'answer-key', 'admit-cards', 'news');
