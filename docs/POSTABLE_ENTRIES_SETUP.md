# Postable Entries System Setup

This system allows you to manage entries (title, image URL, category) that can be posted one by one. Each entry is marked as "posted" after being fetched, ensuring unique data retrieval.

## 🚀 Setup Instructions

### 1. Database Setup

Run the SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of create_postable_entries_table.sql
```

This will create:
- `postable_entries` table with fields: id, title, image_url, category, is_posted, created_at, updated_at
- Indexes for performance
- Row Level Security (RLS) policies
- Auto-update trigger for `updated_at` timestamp

### 2. Access Admin UI

Navigate to: `/admin/postable-entries`

The admin UI allows you to:
- ✅ Create new entries (title, image URL, category)
- ✅ Edit existing entries
- ✅ Delete entries
- ✅ Filter by posted/unposted status
- ✅ Search entries
- ✅ View statistics (total, unposted, posted)

### 3. API Endpoints

#### Fetch One Unposted Entry (Marks as Posted)
```javascript
GET /api/postable-entries
// Returns the oldest unposted entry and marks it as posted
// Response: { success: true, data: { id, title, image_url, category, ... } }
```

#### Fetch Without Marking as Posted
```javascript
GET /api/postable-entries?mark_as_posted=false
// Returns entry without marking it as posted
```

#### Create New Entry (Admin Only)
```javascript
POST /api/postable-entries
Body: {
  title: "Entry Title",
  image_url: "https://example.com/image.jpg",
  category: "latest-jobs"
}
```

#### List All Entries (Admin Only)
```javascript
GET /api/postable-entries/list
// Optional query params:
// ?is_posted=true - filter posted entries
// ?is_posted=false - filter unposted entries
// ?limit=100 - limit results
// ?offset=0 - pagination
```

#### Update Entry (Admin Only)
```javascript
PUT /api/postable-entries
Body: {
  id: "uuid",
  title: "Updated Title",
  image_url: "https://example.com/new-image.jpg",
  category: "news",
  is_posted: false // optional
}
```

#### Delete Entry (Admin Only)
```javascript
DELETE /api/postable-entries?id=uuid
```

## 📋 Usage Example

### Fetching Entries One by One

```javascript
// Fetch next unposted entry (automatically marks as posted)
const response = await fetch('/api/postable-entries');
const result = await response.json();

if (result.success && result.data) {
  const entry = result.data;
  console.log('Title:', entry.title);
  console.log('Image URL:', entry.image_url);
  console.log('Category:', entry.category);
  // Use this entry for posting
} else {
  console.log('No unposted entries available');
}
```

### Creating Entries via API

```javascript
const response = await fetch('/api/postable-entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Job Opening',
    image_url: 'https://example.com/job-image.jpg',
    category: 'latest-jobs'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Entry created:', result.data);
}
```

## 🔒 Security

- Admin authentication required for creating, updating, and deleting entries
- Public read access only for unposted entries (for fetching)
- All admin operations use `verifyAdminAuth` middleware
- API routes use service role key when available (set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` for enhanced security)
- RLS policies allow anon operations (protected by middleware) and authenticated users

## 📊 Table Structure

```sql
postable_entries
├── id (UUID, Primary Key)
├── title (TEXT, Required)
├── image_url (TEXT, Required)
├── category (TEXT, Required)
├── is_posted (BOOLEAN, Default: FALSE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🎯 Features

1. **One-by-One Fetching**: Each fetch returns the oldest unposted entry and marks it as posted
2. **Unique Data**: Once posted, an entry won't be fetched again
3. **Admin Management**: Clean UI for managing all entries
4. **Filtering & Search**: Easy to find specific entries
5. **Statistics**: View counts of total, posted, and unposted entries

## 🔄 Workflow

1. Admin adds entries via UI or API
2. System fetches entries one by one using GET endpoint
3. Each fetch automatically marks entry as posted
4. Next fetch gets the next unposted entry
5. Admin can view/manage all entries in the UI
