-- Articles System Setup for CatTracker
-- Run this script in your Supabase SQL editor

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category VARCHAR(100) NOT NULL,
    tags TEXT[], -- Array of tags
    featured_image_url TEXT,
    author_email VARCHAR(255) NOT NULL DEFAULT 'jain10gunjan@gmail.com',
    status VARCHAR(20) DEFAULT 'published', -- draft, published, archived
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create article_categories table for better organization
CREATE TABLE IF NOT EXISTS article_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for category
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author_email ON articles(author_email);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured);

-- Enable Row Level Security (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for articles
-- Anyone can read published articles
CREATE POLICY "Anyone can read published articles" ON articles
    FOR SELECT USING (status = 'published');

-- Only admin can create/update/delete articles
CREATE POLICY "Admin can manage articles" ON articles
    FOR ALL USING (author_email = 'jain10gunjan@gmail.com');

-- Create policies for article_categories
-- Anyone can read categories
CREATE POLICY "Anyone can read categories" ON article_categories
    FOR SELECT USING (true);

-- Only admin can manage categories
CREATE POLICY "Admin can manage categories" ON article_categories
    FOR ALL USING (true);

-- Insert default categories
INSERT INTO article_categories (name, slug, description, color) VALUES 
    ('Categories', 'categories', 'General categories and topics', '#3B82F6'),
    ('Latest Jobs', 'latest-jobs', 'Latest job openings and opportunities', '#10B981'),
    ('Exam Results', 'exam-results', 'Exam results and scorecards', '#F59E0B'),
    ('Answer Key', 'answer-key', 'Answer keys for various exams', '#EF4444'),
    ('Admit Cards', 'admit-cards', 'Admit cards and hall tickets', '#8B5CF6'),
    ('News', 'news', 'Latest news and updates', '#6B7280')
ON CONFLICT (slug) DO NOTHING;

-- Create a function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = generate_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_article_slug
    BEFORE INSERT ON articles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_slug();

-- Grant necessary permissions
GRANT ALL ON articles TO authenticated;
GRANT ALL ON article_categories TO authenticated;
GRANT USAGE ON SEQUENCE articles_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE article_categories_id_seq TO authenticated;

-- Create a view for published articles with category info
CREATE OR REPLACE VIEW published_articles AS
SELECT 
    a.id,
    a.title,
    a.slug,
    a.content,
    a.excerpt,
    a.category,
    a.tags,
    a.featured_image_url,
    a.author_email,
    a.status,
    a.is_featured,
    a.view_count,
    a.created_at,
    a.updated_at,
    ac.name as category_name,
    ac.color as category_color
FROM articles a
LEFT JOIN article_categories ac ON a.category = ac.slug
WHERE a.status = 'published'
ORDER BY a.is_featured DESC, a.created_at DESC;

-- Insert dummy articles for testing
INSERT INTO articles (title, content, excerpt, category, tags, featured_image_url, author_email, status, is_featured, view_count) VALUES 
(
    'Complete Guide to GATE CSE Preparation 2024',
    '<h2>Introduction</h2><p>GATE (Graduate Aptitude Test in Engineering) is one of the most competitive exams for computer science students. This comprehensive guide will help you prepare effectively for GATE CSE 2024.</p><h2>Key Topics to Focus On</h2><ul><li><strong>Data Structures and Algorithms</strong> - Master fundamental concepts</li><li><strong>Operating Systems</strong> - Process management, memory management</li><li><strong>Computer Networks</strong> - OSI model, TCP/IP protocols</li><li><strong>Database Management Systems</strong> - Normalization, SQL queries</li><li><strong>Computer Organization</strong> - CPU architecture, memory hierarchy</li></ul><h2>Study Strategy</h2><p>Create a structured study plan covering all subjects systematically. Practice previous year questions and take mock tests regularly.</p>',
    'A comprehensive guide covering all aspects of GATE CSE preparation including study strategies, important topics, and exam tips.',
    'exam-preparation',
    ARRAY['GATE', 'CSE', 'preparation', 'study guide'],
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop',
    'jain10gunjan@gmail.com',
    'published',
    true,
    150
),
(
    'Best Programming Languages for Competitive Programming',
    '<h2>Top Programming Languages</h2><p>Choosing the right programming language is crucial for competitive programming success.</p><h2>1. C++</h2><p>C++ is the most popular choice due to its speed and STL library. It offers excellent performance for time-critical problems.</p><h2>2. Python</h2><p>Python is great for beginners and offers concise syntax. However, it may be slower for some problems.</p><h2>3. Java</h2><p>Java provides good performance and is widely used in competitive programming contests.</p><h2>Tips for Success</h2><ul><li>Master one language thoroughly</li><li>Practice regularly on online judges</li><li>Learn common algorithms and data structures</li><li>Participate in contests</li></ul>',
    'Discover the best programming languages for competitive programming and learn tips to improve your coding skills.',
    'study-materials',
    ARRAY['programming', 'competitive programming', 'algorithms', 'coding'],
    'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
    'jain10gunjan@gmail.com',
    'published',
    false,
    89
),
(
    'Success Story: How I Cracked GATE with Rank 47',
    '<h2>My Journey</h2><p>Hi, I am Rahul, and I secured AIR 47 in GATE CSE 2023. Here is my complete preparation strategy and experience.</p><h2>Preparation Timeline</h2><p>I started my preparation 8 months before the exam. The key was consistency and proper planning.</p><h2>Study Schedule</h2><ul><li><strong>Morning (6-9 AM)</strong> - Theory subjects</li><li><strong>Afternoon (2-5 PM)</strong> - Problem solving</li><li><strong>Evening (7-9 PM)</strong> - Revision and mock tests</li></ul><h2>Key Strategies</h2><p>1. <strong>Strong Foundation</strong> - Focus on basics first<br>2. <strong>Regular Practice</strong> - Solve problems daily<br>3. <strong>Mock Tests</strong> - Take tests every weekend<br>4. <strong>Time Management</strong> - Practice speed and accuracy</p><h2>Final Tips</h2><p>Stay consistent, believe in yourself, and never give up. Hard work always pays off!</p>',
    'Read the inspiring success story of a GATE topper who secured AIR 47 and learn their preparation strategy.',
    'success-stories',
    ARRAY['GATE', 'success story', 'AIR 47', 'preparation strategy'],
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop',
    'jain10gunjan@gmail.com',
    'published',
    true,
    234
),
(
    'Career Opportunities After GATE CSE',
    '<h2>Higher Education Options</h2><p>GATE CSE opens doors to various prestigious institutions and programs.</p><h2>1. M.Tech Programs</h2><p>Top IITs and NITs offer excellent M.Tech programs in Computer Science and Engineering.</p><h2>2. Research Opportunities</h2><p>Many students pursue PhD programs after M.Tech, contributing to cutting-edge research.</p><h2>3. Industry Jobs</h2><p>GATE score is also considered by many companies for direct recruitment.</p><h2>Top Recruiters</h2><ul><li>Google, Microsoft, Amazon</li><li>ISRO, DRDO, BHEL</li><li>Public Sector Undertakings</li><li>Research Organizations</li></ul><h2>Salary Expectations</h2><p>GATE qualified candidates typically earn 8-15 LPA in their first job, with significant growth potential.</p>',
    'Explore various career opportunities and higher education options available after qualifying GATE CSE.',
    'career-guidance',
    ARRAY['career', 'GATE', 'M.Tech', 'job opportunities'],
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    'jain10gunjan@gmail.com',
    'published',
    false,
    167
),
(
    'Latest Trends in Computer Science Education',
    '<h2>Emerging Technologies</h2><p>The field of computer science is rapidly evolving with new technologies and methodologies.</p><h2>1. Artificial Intelligence and Machine Learning</h2><p>AI/ML has become an integral part of computer science education, with universities offering specialized courses.</p><h2>2. Cloud Computing</h2><p>Understanding cloud platforms like AWS, Azure, and Google Cloud is essential for modern developers.</p><h2>3. Cybersecurity</h2><p>With increasing cyber threats, cybersecurity education has gained significant importance.</p><h2>4. Blockchain Technology</h2><p>Blockchain and cryptocurrency technologies are being integrated into computer science curricula.</p><h2>Future Prospects</h2><p>Students should focus on developing skills in these emerging areas to stay relevant in the job market.</p>',
    'Stay updated with the latest trends and technologies shaping computer science education in 2024.',
    'technology',
    ARRAY['technology', 'computer science', 'AI', 'trends'],
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
    'jain10gunjan@gmail.com',
    'published',
    false,
    98
),
(
    'Tips for Effective Time Management During Exams',
    '<h2>Why Time Management Matters</h2><p>Proper time management is crucial for exam success. It helps you cover all topics and reduces stress.</p><h2>1. Create a Study Schedule</h2><p>Plan your study sessions in advance. Allocate specific time slots for different subjects.</p><h2>2. Prioritize Topics</h2><p>Focus on high-weightage topics first. Use the 80/20 rule - 80% of results come from 20% of efforts.</p><h2>3. Take Regular Breaks</h2><p>Study for 45-50 minutes, then take a 10-15 minute break. This improves focus and retention.</p><h2>4. Practice Mock Tests</h2><p>Regular practice tests help you understand the exam pattern and improve speed.</p><h2>5. Stay Healthy</h2><p>Maintain a balanced diet, exercise regularly, and get adequate sleep.</p><h2>Final Tips</h2><p>Stay consistent, avoid last-minute cramming, and believe in your preparation. Success comes to those who plan and execute effectively.</p>',
    'Learn essential time management strategies to maximize your study efficiency and exam performance.',
    'exam-preparation',
    ARRAY['time management', 'study tips', 'exam preparation', 'productivity'],
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop',
    'jain10gunjan@gmail.com',
    'published',
    false,
    76
);
