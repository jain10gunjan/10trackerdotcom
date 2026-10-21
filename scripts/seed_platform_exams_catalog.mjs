/**
 * Upsert the full exam catalog into platform_exams.
 * New rows: is_active = false. Existing rows: is_active preserved.
 *
 * Usage (from cattracker/):
 *   node --env-file=.env.local scripts/seed_platform_exams_catalog.mjs
 */

import { createClient } from '@supabase/supabase-js';

const CATALOG = [
  {
    slug: 'gate-cse',
    name: 'GATE CSE',
    description: 'Graduate Aptitude Test in Engineering - Computer Science',
    category: 'Engineering',
    image_url: 'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    icon: '💻',
    color_gradient: 'from-gray-500 to-cyan-500',
    sort_order: 10,
  },
  {
    slug: 'gate-ec',
    name: 'GATE EC',
    description: 'Graduate Aptitude Test in Engineering - Electronics & Communication',
    category: 'Engineering',
    image_url: 'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    icon: '💻',
    color_gradient: 'from-gray-500 to-cyan-500',
    sort_order: 20,
  },
  {
    slug: 'gate-ee',
    name: 'GATE EE',
    description: 'Graduate Aptitude Test in Engineering - Electrical Engineering',
    category: 'Engineering',
    image_url: 'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    icon: '💻',
    color_gradient: 'from-gray-500 to-cyan-500',
    sort_order: 30,
  },
  {
    slug: 'jee-main',
    name: 'JEE Mains',
    description: 'Joint Entrance Examination for Engineering',
    category: 'Engineering',
    image_url:
      'https://img.studydekho.com/uploads/c/2022/3/17509-c-whatsapp-image-2022-03-19-at-53432-pm-2.jpeg',
    icon: '⚛️',
    color_gradient: 'from-green-500 to-emerald-500',
    sort_order: 40,
  },
  {
    slug: 'mht-cet',
    name: 'MHT-CET',
    description: 'Maharashtra Common Entrance Test',
    category: 'State Level',
    image_url: 'https://images.careerindia.com/img/2022/04/mht-1611563405-1650630681.jpg',
    icon: '🎓',
    color_gradient: 'from-teal-500 to-cyan-500',
    sort_order: 50,
  },
  {
    slug: 'upsc-prelims',
    name: 'UPSC Prelims',
    description: 'Union Public Service Commission - Civil Services Prelims Exam',
    category: 'Civil Services',
    image_url: 'https://c.ndtvimg.com/upsc_625x300_1529562820916.jpg?downsize=773:435',
    icon: '📚',
    color_gradient: 'from-orange-500 to-red-500',
    sort_order: 60,
  },
  {
    slug: 'bitsat',
    name: 'BITSAT',
    description: 'Birla Institute of Technology and Science, Pilani',
    category: 'Engineering',
    image_url:
      'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/BITS_Pilani-Logo.svg/330px-BITS_Pilani-Logo.svg.png',
    icon: '🧬',
    color_gradient: 'from-indigo-500 to-blue-500',
    sort_order: 70,
  },
  {
    slug: 'general-aptitude',
    name: 'General Aptitude',
    description:
      'General Aptitude and Reasoning Practice. Quantitative Aptitude and Verbal Ability.',
    category: 'General',
    image_url: null,
    icon: '📊',
    color_gradient: 'from-purple-500 to-pink-500',
    sort_order: 80,
  },
];

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in env');
  }
  return createClient(url, key);
}

async function main() {
  const supabase = getClient();

  const { data: existing, error: existingError } = await supabase
    .from('platform_exams')
    .select('slug, is_active');

  if (existingError) throw existingError;

  const activeBySlug = new Map(
    (existing || []).map((row) => [String(row.slug).toLowerCase(), row.is_active])
  );

  const rows = CATALOG.map((exam) => {
    const slug = exam.slug.toLowerCase();
    const already = activeBySlug.has(slug);
    return {
      ...exam,
      slug,
      is_active: already ? activeBySlug.get(slug) : false,
      updated_at: new Date().toISOString(),
    };
  });

  const { data, error } = await supabase
    .from('platform_exams')
    .upsert(rows, { onConflict: 'slug' })
    .select('slug, name, is_active, sort_order');

  if (error) throw error;

  console.log(`Upserted ${data.length} platform exams:`);
  for (const row of data.sort((a, b) => a.sort_order - b.sort_order)) {
    console.log(`  ${row.slug.padEnd(18)} ${row.is_active ? 'active' : 'inactive'}  ${row.name}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
