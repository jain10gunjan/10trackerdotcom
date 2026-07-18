# 🚀 GATE CSE Mock Test - Quick Setup Guide

## 📋 **Step-by-Step Setup**

### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project
2. Navigate to **SQL Editor** in the left sidebar

### **Step 2: Create Database Tables**
1. Copy the entire content of `supabase/migrations/create_gate_cse_tables.sql`
2. Paste it in the SQL Editor
3. Click **Run** to execute

### **Step 3: Add GATE CSE Questions**
1. Copy the entire content of `supabase/migrations/add_gate_cse_questions.sql`
2. Paste it in the SQL Editor
3. Click **Run** to execute

### **Step 4: Verify Setup**
Run these queries to verify everything is working:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('gate_cse_tests', 'gate_cse_test_instances');

-- Check if questions were added
SELECT COUNT(*) FROM examtracker WHERE category = 'GATE_CSE';

-- Check sample tests
SELECT * FROM gate_cse_tests;
```

## ✅ **Expected Results**

After running the scripts, you should see:

### **Tables Created:**
- ✅ `gate_cse_tests` - Test configurations
- ✅ `gate_cse_test_instances` - Student attempts

### **Sample Data:**
- ✅ 4 sample GATE CSE tests
- ✅ 40+ GATE CSE questions across all subjects

### **Questions by Topic:**
- Algorithms (6 questions)
- Programming & Data Structures (6 questions)
- Operating Systems (4 questions)
- Discrete Mathematics & Graph Theory (4 questions)
- Computer Networks (3 questions)
- DBMS (3 questions)
- Theory of Computation (3 questions)
- Computer Organization (3 questions)
- Digital Logic (3 questions)
- Compiler Design (3 questions)
- Software Engineering (2 questions)

## 🎯 **Test the System**

### **Admin Access:**
1. Visit: `/gate-cse/mock-test/admin`
2. Login as: `jain10gunjan@gmail.com`
3. Create new tests or view existing ones

### **Student Access:**
1. Visit: `/gate-cse/mock-test`
2. Browse available tests
3. Start taking tests

## 🔧 **Troubleshooting**

### **If tables don't exist:**
- Make sure you ran `supabase/migrations/create_gate_cse_tables.sql` completely
- Check for any SQL errors in the console

### **If no questions appear:**
- Make sure you ran `supabase/migrations/add_gate_cse_questions.sql`
- Verify category = 'GATE_CSE' in examtracker table

### **If admin access doesn't work:**
- Ensure you're logged in as `jain10gunjan@gmail.com`
- Check RLS policies are properly set

## 📊 **Database Structure**

### **gate_cse_tests table:**
```sql
- id (Primary Key)
- name (Test name)
- description (Test description)
- total_questions (Number of questions)
- duration (Time in minutes)
- difficulty (easy/medium/hard/mixed)
- created_by (Admin email)
- is_active (Boolean)
- created_at (Timestamp)
```

### **gate_cse_test_instances table:**
```sql
- id (Primary Key)
- test_id (Foreign Key to gate_cse_tests)
- user_id (Student ID)
- started_at (Start time)
- completed_at (End time)
- answers (JSON with student answers)
- score (Final score)
- analytics (Performance analytics)
```

## 🎉 **Ready to Use!**

Your GATE CSE Mock Test system is now fully functional with:
- ✅ Complete database setup
- ✅ Sample test data
- ✅ 40+ GATE CSE questions
- ✅ Admin and student interfaces
- ✅ Real-time analytics

**Start creating tests and helping students prepare for GATE CSE!** 🚀

