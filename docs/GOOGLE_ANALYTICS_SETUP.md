# Google Analytics Setup Guide

This guide will help you set up Google Analytics (GA4) for your CatTracker web application.

## 🚀 Setup Instructions

### 1. Get Your Google Analytics Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property for your website
3. Choose "Web" as your platform
4. Enter your website URL: `https://your-domain.com`
5. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Add Environment Variable

Add your Google Analytics Measurement ID to your `.env.local` file:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

### 3. Verify Installation

The Google Analytics code is already added to your `layout.js` file. To verify it's working:

1. **Check Network Tab**: Open browser dev tools → Network tab → Look for requests to `googletagmanager.com`
2. **Google Analytics Debugger**: Install the Chrome extension to see real-time data
3. **Real-time Reports**: Check Google Analytics → Reports → Real-time

## 📊 Custom Event Tracking

### Available Custom Events

The app tracks these custom events automatically:

#### **User Authentication Events**
- `user_signup` - When a user creates an account
- `user_login` - When a user logs in
- `user_logout` - When a user logs out

#### **Exam Practice Events**
- `practice_started` - When user starts practicing questions
- `practice_completed` - When user completes a practice session
- `test_attempted` - When user attempts a mock test
- `test_completed` - When user completes a mock test

#### **Content Engagement Events**
- `article_viewed` - When user views an article
- `article_shared` - When user shares an article
- `video_watched` - When user watches a video

#### **E-commerce Events**
- `purchase_initiated` - When user starts checkout
- `purchase_completed` - When user completes payment
- `subscription_started` - When user subscribes to premium

### Manual Event Tracking

You can track custom events in your components:

```javascript
import { trackEvent } from '@/lib/analytics';

// Track a custom event
trackEvent('button_clicked', {
  button_name: 'Get Started',
  page_location: window.location.href
});

// Track user actions
trackEvent('form_submitted', {
  form_name: 'Contact Form',
  form_success: true
});
```

## 🎯 Key Metrics to Monitor

### **User Engagement**
- Page views and unique visitors
- Session duration and bounce rate
- Most popular pages and content

### **Exam Performance**
- Practice completion rates
- Test attempt success rates
- Most popular exam categories

### **Content Performance**
- Article read rates
- Video completion rates
- Search query analysis

### **Conversion Tracking**
- User registration rates
- Premium subscription conversions
- Payment completion rates

## 🔧 Advanced Configuration

### Enhanced E-commerce Tracking

For detailed purchase tracking, the app automatically tracks:
- Product views
- Add to cart events
- Purchase completions
- Revenue tracking

### Custom Dimensions

The app tracks these custom dimensions:
- `user_type` (free/premium)
- `exam_category` (GATE, CAT, etc.)
- `content_type` (article/video/practice)

## 📈 Analytics Dashboard Setup

### Recommended Reports

1. **Audience Overview**
   - Users, sessions, page views
   - Demographics and interests

2. **Acquisition Reports**
   - Traffic sources
   - Campaign performance
   - Social media referrals

3. **Behavior Reports**
   - Site content performance
   - User flow analysis
   - Site speed metrics

4. **Conversions**
   - Goal completions
   - E-commerce performance
   - Custom event tracking

## 🛠️ Troubleshooting

### Common Issues

1. **No Data Appearing**
   - Check if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
   - Verify the Measurement ID format (G-XXXXXXXXXX)
   - Wait 24-48 hours for data to appear

2. **Events Not Tracking**
   - Check browser console for errors
   - Verify the analytics script is loading
   - Use Google Analytics Debugger extension

3. **Real-time Data Issues**
   - Clear browser cache
   - Check ad blockers
   - Verify network connectivity

### Testing Commands

```bash
# Check if environment variables are loaded
npm run dev
# Open browser console and check for gtag function
console.log(typeof gtag);
```

## 📱 Mobile Analytics

The setup automatically tracks:
- Mobile vs desktop usage
- App-like behavior on mobile
- Touch interactions and gestures

## 🔒 Privacy Compliance

The analytics setup includes:
- GDPR compliance features
- Cookie consent integration
- Data anonymization options
- User opt-out capabilities

## 📊 Performance Impact

- **Minimal Impact**: Analytics scripts load asynchronously
- **Optimized Loading**: Uses Next.js Script component with proper strategies
- **No Blocking**: Analytics won't affect page load times

## 🎉 Success Metrics

After setup, you should see:
- Real-time visitor data in Google Analytics
- Custom events appearing in reports
- Detailed user journey tracking
- Conversion funnel analysis

Your Google Analytics is now fully integrated and will start collecting data immediately!
