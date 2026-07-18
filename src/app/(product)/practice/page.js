"use client"
// components/EducationalServices.jsx
import { useState } from 'react';
import { CheckCircle, Book, FileText, LayoutGrid, Activity, Calendar, Download } from 'lucide-react';

export default function EducationalServices() {
  const [activeTab, setActiveTab] = useState('features');
  
  const features = [
    {
      id: 1,
      icon: <Book size={24} />,
      title: "Topic-wise Chapter Practice",
      description: "Access comprehensive practice questions organized by topics and chapters for targeted learning"
    },
    {
      id: 2,
      icon: <FileText size={24} />,
      title: "Previous Year Questions",
      description: "Practice with authentic PYQs from all previous years, sorted by exam and difficulty"
    },
    {
      id: 3,
      icon: <LayoutGrid size={24} />,
      title: "Unlimited Test Creator",
      description: "Generate unlimited custom tests with questions from specific topics, years, or difficulty levels"
    },
    {
      id: 4,
      icon: <Activity size={24} />,
      title: "Multi-topic Practice Sessions",
      description: "Train with questions across multiple topics to strengthen your overall preparation"
    },
    {
      id: 5,
      icon: <Calendar size={24} />,
      title: "Year-wise MCQs",
      description: "Focus on MCQs from specific years to understand exam trends and patterns"
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-3 px-4 py-1 bg-blue-100 text-blue-700 font-medium rounded-full text-sm">
            All-In-One Exam Preparation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Master Your Exam Preparation
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Unlock your full potential with our comprehensive practice tools designed for exam success
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
                  className={`pb-3 px-2 font-medium ${activeTab === 'features' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('features')}
                >
                  Features
                </button>
                <button 
                  className={`pb-3 px-2 font-medium ${activeTab === 'includes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
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
                        <div className="mt-1 bg-blue-100 rounded-lg p-2 text-blue-600 mr-4">
                          {feature.icon}
                        </div>
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
                      <span>Life-Time access to all updates</span>
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
                      <span className="text-4xl font-bold">₹199</span>
                      <span className="text-lg ml-2 opacity-80">/only</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="line-through opacity-70 text-sm">₹599</span>
                      <span className="ml-2 bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">67% OFF</span>
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
                <button className="w-full bg-white text-blue-700 font-bold py-4 px-6 rounded-xl hover:shadow-lg transition-all flex items-center justify-center">
                  <span>Buy Now — ₹199 only</span>
                </button>
                <p className="text-center text-sm mt-4 opacity-80">Secure payment • Instant access</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}