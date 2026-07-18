# Article System Setup Guide

This guide will help you set up the article posting functionality for your CatTracker website with admin access restricted to `jain10gunjan@gmail.com`.

## 🚀 Features Implemented

- ✅ Admin-only article creation (restricted to jain10gunjan@gmail.com)
- ✅ Article categories with color coding
- ✅ High-quality fonts matching homepage hero section
- ✅ Table and grid view for articles on homepage
- ✅ Full article management system
- ✅ Responsive design with modern UI

## 📋 Setup Instructions

### 1. Database Setup

Run the SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of articles_setup.sql
-- This will create the necessary tables and permissions
```

### 2. Environment Variables

Make sure your `.env.local` file has the required Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Admin Authentication

The system is configured to only allow `jain10gunjan@gmail.com` to:
- Create articles
- Edit articles
- Delete articles
- Access admin panel

### 4. File Structure

```
src/
├── app/
│   ├── api/
│   │   └── articles/
│   │       ├── route.js (GET, POST articles)
│   │       ├── [id]/route.js (GET, PUT, DELETE single article)
│   │       └── categories/route.js (GET categories)
│   ├── admin/
│   │   ├── login/page.js (Admin login)
│   │   └── articles/page.js (Article management)
│   └── articles/
│       ├── page.js (Articles listing)
│       └── [slug]/page.js (Individual article)
├── components/
│   └── ArticlesSection.jsx (Homepage articles display)
├── middleware/
│   └── adminAuth.js (Admin authentication)
└── articles_setup.sql (Database schema)
```

## 🎨 Design Features

### Typography
- Uses the same high-quality font stack as homepage hero section
- Consistent with existing design system
- Optimized for readability

### UI Components
- **Table View**: Clean, organized table with article metadata
- **Grid View**: Card-based layout with featured images
- **Responsive**: Works on all device sizes
- **Modern**: Clean, minimal design matching site aesthetic

### Color System
- Category-based color coding
- Consistent with existing neutral color palette
- Accessible contrast ratios

## 🔧 Admin Panel Features

### Article Management
- Create new articles with rich content
- Edit existing articles
- Delete articles
- Set featured articles
- Category management
- Tag system

### Content Editor
- Title and excerpt fields
- Full content editor
- Featured image support
- Category selection
- Tag management
- Featured article toggle

## 📱 User Experience

### Homepage Integration
- Articles section appears below exam cards
- Table view by default (as requested)
- Grid view toggle available
- Category filtering
- Search functionality

### Article Pages
- Individual article pages with full content
- Related articles suggestions
- Social sharing
- Reading time estimation
- View count tracking

## 🚦 Access Control

### Admin Access
- Login: `/admin/login`
- Article Management: `/admin/articles`
- Restricted to: `jain10gunjan@gmail.com`

### Public Access
- Articles listing: `/articles`
- Individual articles: `/articles/[slug]`
- Homepage articles section

## 🎯 Usage Instructions

### For Admins (jain10gunjan@gmail.com)

1. **Login**: Go to `/admin/login`
2. **Create Article**: Click "Create Article" button
3. **Fill Details**: 
   - Title (required)
   - Content (required)
   - Category (required)
   - Excerpt (optional)
   - Tags (comma-separated)
   - Featured image URL (optional)
   - Mark as featured (optional)
4. **Save**: Click "Create Article"

### For Users

1. **Browse Articles**: Visit homepage or `/articles`
2. **Filter**: Use category filter and search
3. **View**: Click on any article to read full content
4. **Share**: Use share button on article pages

## 🔒 Security

- Admin authentication required for all management operations
- Email-based access control
- Secure API endpoints with proper error handling
- Input validation and sanitization

## 📊 Database Schema

### Articles Table
- `id`: Primary key
- `title`: Article title
- `slug`: URL-friendly identifier
- `content`: Article content
- `excerpt`: Short description
- `category`: Category slug
- `tags`: Array of tags
- `featured_image_url`: Image URL
- `author_email`: Author email (jain10gunjan@gmail.com)
- `status`: Article status (draft/published/archived)
- `is_featured`: Featured article flag
- `view_count`: View counter
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Categories Table
- `id`: Primary key
- `name`: Category name
- `slug`: URL-friendly identifier
- `description`: Category description
- `color`: Hex color code
- `created_at`: Creation timestamp

## 🎨 Styling

The article system uses the same design language as your existing homepage:

- **Fonts**: Apple system fonts for consistency
- **Colors**: Neutral palette matching site theme
- **Spacing**: Consistent with existing components
- **Animations**: Framer Motion for smooth interactions
- **Responsive**: Mobile-first design approach

## 🚀 Next Steps

1. Run the database setup script
2. Test admin login with your email
3. Create your first article
4. Verify homepage display
5. Test all functionality

The system is now ready for use! You can start creating articles immediately after completing the database setup.
