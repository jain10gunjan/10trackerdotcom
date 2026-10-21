-- Upsert full platform exam catalog so admin can see every exam (active or not).
-- Safe to re-run.
-- - New rows insert with is_active = false (admin turns them on).
-- - Existing rows keep their is_active; metadata is refreshed.

INSERT INTO public.platform_exams (
  slug,
  name,
  description,
  category,
  image_url,
  icon,
  color_gradient,
  sort_order,
  is_active,
  updated_at
)
VALUES
  (
    'gate-cse',
    'GATE CSE',
    'Graduate Aptitude Test in Engineering - Computer Science',
    'Engineering',
    'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    '💻',
    'from-gray-500 to-cyan-500',
    10,
    false,
    NOW()
  ),
  (
    'gate-ec',
    'GATE EC',
    'Graduate Aptitude Test in Engineering - Electronics & Communication',
    'Engineering',
    'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    '💻',
    'from-gray-500 to-cyan-500',
    20,
    false,
    NOW()
  ),
  (
    'gate-ee',
    'GATE EE',
    'Graduate Aptitude Test in Engineering - Electrical Engineering',
    'Engineering',
    'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    '💻',
    'from-gray-500 to-cyan-500',
    30,
    false,
    NOW()
  ),
  (
    'jee-main',
    'JEE Mains',
    'Joint Entrance Examination for Engineering',
    'Engineering',
    'https://img.studydekho.com/uploads/c/2022/3/17509-c-whatsapp-image-2022-03-19-at-53432-pm-2.jpeg',
    '⚛️',
    'from-green-500 to-emerald-500',
    40,
    false,
    NOW()
  ),
  (
    'mht-cet',
    'MHT-CET',
    'Maharashtra Common Entrance Test',
    'State Level',
    'https://images.careerindia.com/img/2022/04/mht-1611563405-1650630681.jpg',
    '🎓',
    'from-teal-500 to-cyan-500',
    50,
    false,
    NOW()
  ),
  (
    'upsc-prelims',
    'UPSC Prelims',
    'Union Public Service Commission - Civil Services Prelims Exam',
    'Civil Services',
    'https://c.ndtvimg.com/upsc_625x300_1529562820916.jpg?downsize=773:435',
    '📚',
    'from-orange-500 to-red-500',
    60,
    false,
    NOW()
  ),
  (
    'bitsat',
    'BITSAT',
    'Birla Institute of Technology and Science, Pilani',
    'Engineering',
    'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/BITS_Pilani-Logo.svg/330px-BITS_Pilani-Logo.svg.png',
    '🧬',
    'from-indigo-500 to-blue-500',
    70,
    false,
    NOW()
  ),
  (
    'general-aptitude',
    'General Aptitude',
    'General Aptitude and Reasoning Practice. Quantitative Aptitude and Verbal Ability.',
    'General',
    NULL,
    '📊',
    'from-purple-500 to-pink-500',
    80,
    false,
    NOW()
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image_url = COALESCE(EXCLUDED.image_url, public.platform_exams.image_url),
  icon = COALESCE(EXCLUDED.icon, public.platform_exams.icon),
  color_gradient = COALESCE(EXCLUDED.color_gradient, public.platform_exams.color_gradient),
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
  -- is_active intentionally NOT updated so admin toggles stick
