'use client';

import { useState } from 'react';
import { useAuth } from "@/app/context/AuthContext";
import { CheckCircle, Book, FileText, LayoutGrid, Activity, Calendar } from 'lucide-react';
import RazorpayButton from './RazorpayButton';
import AuthModal from '@/components/AuthModal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function BuyNow({ category, userEmail, userName }) {
  const { user, googleSignIn } = useAuth();
  const [activeTab, setActiveTab] = useState('features');
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const features = [
    {
      id: 1,
      icon: <Book size={24} />,
      title: 'Topic-wise Chapter Practice',
      description: 'Access comprehensive practice questions organized by topics and chapters for targeted learning',
    },
    {
      id: 2,
      icon: <FileText size={24} />,
      title: 'Previous Year Questions',
      description: 'Practice with authentic PYQs from all previous years, sorted by exam and difficulty',
    },
    {
      id: 3,
      icon: <LayoutGrid size={24} />,
      title: 'Unlimited Test Creator',
      description: 'Generate unlimited custom tests with questions from specific topics, years, or difficulty levels',
    },
    {
      id: 4,
      icon: <Activity size={24} />,
      title: 'Multi-topic Practice Sessions',
      description: 'Train with questions across multiple topics to strengthen your overall preparation',
    },
    {
      id: 5,
      icon: <Calendar size={24} />,
      title: 'Year-wise MCQs',
      description: 'Focus on MCQs from specific years to understand exam trends and patterns',
    },
  ];

  const formattedCategory = category
    ? category
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : '';

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
      setShowAuthModal(false);
      toast.success('Successfully signed in!');
    } catch (err) {
      toast.error('Authentication failed');
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen px-4 py-16 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-md max-w-md border border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to purchase the {formattedCategory} Premium Package.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center mx-auto"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.564,9.505-11.622H12.545z" />
            </svg>
            Sign in with Google
          </button>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onGoogleSignIn={handleGoogleSignIn}
          />
</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-3 px-4 py-1 bg-blue-100 text-blue-700 font-medium rounded-full text-sm">
            All-In-One Exam Preparation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Master Your {formattedCategory} Exam Preparation
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Unlock your full potential with our comprehensive practice tools designed for {formattedCategory} exam success
          </p>
        </div>

        {/* Testimonials/Social Proof */}
        <div className="mt-16 text-center">
          <div className="mb-6 inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full">
            <CheckCircle size={16} className="mr-2" />
            <span className="font-medium">Trusted by 10,000+ students</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16">
          <div className="grid md:grid-cols-2">
            {/* Content Column */}
            <div className="p-8 md:p-12">
              {/* Tabs */}
              <div className="flex space-x-4 mb-8 border-b border-gray-100">
                <button
                  className={`pb-3 px-2 font-medium ${
                    activeTab === 'features' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('features')}
                >
                  Features
                </button>
                <button
                  className={`pb-3 px-2 font-medium ${
                    activeTab === 'includes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('includes')}
                >
                  What&apos;s Included
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'features' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Everything You Need To Succeed</h2>
                  <div className="space-y-5">
                    {features.map((feature) => (
                      <div key={feature.id} className="flex items-start">
                        <div className="mt-1 bg-blue-100 rounded-lg p-2 text-blue-600 mr-4">{feature.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'includes' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">Premium Package Includes</h2>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3" size={20} />
                      <span>All previous year questions (10+ years)</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3" size={20} />
                      <span>10,000+ chapter-wise practice questions</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3" size={20} />
                      <span>Create unlimited custom tests</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3" size={20} />
                      <span>Detailed performance analytics</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3" size={20} />
                      <span>Mobile & tablet compatible</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3" size={20} />
                      <span>Lifetime access to all updates</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Pricing Column */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 text-white flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 bg-blue-500 bg-opacity-30 rounded-full text-sm font-medium mb-4">
                  Limited Time Offer
                </div>
                <h2 className="text-3xl font-bold mb-2">Premium Package</h2>
                <p className="opacity-90 mb-6">Unlock all features for your exam success</p>

                <div className="flex items-baseline mb-6">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className="text-4xl font-bold">₹49</span>
                      <span className="text-lg ml-2 opacity-80">/only</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="line-through opacity-70 text-sm">₹199</span>
                      <span className="ml-2 bg-white text-blue-600 text-xs px-2 py-0.5 rounded-fullVECTOR font-medium">75% OFF</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center">
                    <CheckCircle className="text-blue-300 mr-3" size={18} />
                    <span className="text-sm">One-time payment, no subscription</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-blue-300 mr-3" size={18} />
                    <span className="text-sm">Instant access to all features</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="text-blue-300 mr-3" size={18} />
                    <span className="text-sm">Works on all devices</span>
                  </div>
                </div>
              </div>

              <div>
                {error && <p className="text-red-200 text-sm mb-4 text-center">{error}</p>}
                <RazorpayButton
                  name={user.name}
                  email={user.email}
                  plan={category}
                  amount={4900}
                  buttonText="Pay Now with Razorpay"
                  buttonClassName="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md w-full transition"
                  onSuccess={() => {
                    toast.success('Payment successful! Redirecting to your practice page.');
                    window.location.href = `/${category}`;
                  }}
                  onError={(err) => {
                    setError(err.message || 'Payment failed. Please try again.');
                    toast.error(err.message || 'Payment failed');
                  }}
                  razorpayOptions={{
                    theme: { color: '#4F46E5' },
                    description: `Unlock your full potential with our comprehensive practice tools designed for ${formattedCategory} exam success`,
                  }}
                />
                <p className="text-center text-sm mt-4 opacity-80">Secure payment • Instant access</p>
              </div>
            </div>
          </div>
        </div>
      </div>
</div>
  );
}