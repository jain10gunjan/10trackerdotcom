"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { 
  ArrowLeft,
  Download,
  RefreshCw,
  Search,
  Eye,
  CheckCircle,
  BookOpen,
  Zap,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApiIntegrationPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [solutions, setSolutions] = useState({});
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [apiConfig, setApiConfig] = useState({
    questionsApiUrl: '',
    solutionsApiUrl: '',
    apiKey: ''
  });
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState('');


  // Filter questions based on search and filters
  useEffect(() => {
    let filtered = questions;
    
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }
    
    if (selectedDifficulty) {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }
    
    if (selectedSubject) {
      filtered = filtered.filter(q => q.subject === selectedSubject);
    }
    
    setFilteredQuestions(filtered);
  }, [questions, searchTerm, selectedCategory, selectedDifficulty, selectedSubject]);

  // Get unique values for filters
  const categories = [...new Set(questions.map(q => q.category))].filter(Boolean);
  const difficulties = [...new Set(questions.map(q => q.difficulty))].filter(Boolean);
  const subjects = [...new Set(questions.map(q => q.subject))].filter(Boolean);

  // HTML decoding function for use in export and save
  const decodeHtml = (html) => {
    if (!html) return '';
    
    // Debug: Log the original HTML to see what we're working with
    if (html.includes('&lt;') || html.includes('&gt;') || html.includes('&amp;')) {
      console.log('Original HTML with entities:', html.substring(0, 200));
    }
    
    // Method 1: Try browser's built-in HTML decoding first (most reliable)
    try {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = html;
      const browserDecoded = textarea.value;
      if (browserDecoded !== html && !browserDecoded.includes('&lt;')) {
        console.log('Browser decoding successful:', browserDecoded.substring(0, 200));
        return browserDecoded;
      }
    } catch (e) {
      console.log('Browser decoding failed, using manual method');
    }
    
    // Method 2: Manual decoding for double-encoded entities
    let decoded = html
      .replace(/&amp;lt;/g, '<')
      .replace(/&amp;gt;/g, '>')
      .replace(/&amp;amp;/g, '&')
      .replace(/&amp;quot;/g, '"')
      .replace(/&amp;#39;/g, "'")
      .replace(/&amp;nbsp;/g, ' ');
    
    // Method 3: Manual decoding for regular HTML entities
    decoded = decoded
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#x60;/g, '`')
      .replace(/&#x3D;/g, '=')
      .replace(/&#x2B;/g, '+');
    
    // Method 4: Try browser decoding again on the manually decoded result
    try {
      const textarea2 = document.createElement('textarea');
      textarea2.innerHTML = decoded;
      const finalDecoded = textarea2.value;
      if (finalDecoded !== decoded) {
        console.log('Final browser decoding successful:', finalDecoded.substring(0, 200));
        return finalDecoded;
      }
    } catch (e) {
      // If all else fails, return manual decoding
    }
    
    // Debug: Log the final decoded result
    if (decoded !== html) {
      console.log('Manual decoding result:', decoded.substring(0, 200));
    }
    
    return decoded;
  };

  // Fetch questions from API
  const fetchQuestions = async () => {
    if (!apiConfig.questionsApiUrl) {
      toast.error('Please enter the Questions API URL');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending request to backend with URL:', apiConfig.questionsApiUrl);
      
      const response = await fetch('/api/gate-cse/mock-test/admin/api-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetch-questions',
          questionsApiUrl: apiConfig.questionsApiUrl,
          apiKey: apiConfig.apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);

      if (data.success) {
        setQuestions(data.questions);
        toast.success(`Successfully fetched ${data.count} questions`);
      } else {
        throw new Error(data.error || 'Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error(`Error fetching questions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch solutions from API
  const fetchSolutions = async () => {
    if (!apiConfig.solutionsApiUrl) {
      toast.error('Please enter the Solutions API URL');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/gate-cse/mock-test/admin/api-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetch-solutions',
          solutionsApiUrl: apiConfig.solutionsApiUrl,
          apiKey: apiConfig.apiKey
        })
      });

      const data = await response.json();

      if (data.success) {
        setSolutions(data.solutions);
        toast.success(`Successfully fetched ${data.count} solutions`);
      } else {
        throw new Error(data.error || 'Failed to fetch solutions');
      }
    } catch (error) {
      console.error('Error fetching solutions:', error);
      toast.error(`Error fetching solutions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };



     // Get solution for a specific question
   const getSolution = (questionId) => {
     const solution = solutions[questionId];
     if (!solution) return null;
     
     // Extract only the solution text content
     let solutionText = null;
     if (solution.sol?.en?.value) {
       solutionText = solution.sol.en.value;
     } else if (solution.value) {
       solutionText = solution.value;
     } else if (typeof solution === 'string') {
       solutionText = solution;
     }
     
     // Decode HTML entities if solution text exists
     if (solutionText) {
       return solutionText
         .replace(/&lt;/g, '<')
         .replace(/&gt;/g, '>')
         .replace(/&amp;/g, '&')
         .replace(/&quot;/g, '"')
         .replace(/&#39;/g, "'")
         .replace(/&nbsp;/g, ' ');
     }
     
     return null;
   };



  // Save configuration
  const saveConfiguration = () => {
    const configName = document.getElementById('configName').value.trim();
    if (!configName) {
      toast.error('Please enter a configuration name');
      return;
    }

    if (!apiConfig.questionsApiUrl && !apiConfig.solutionsApiUrl) {
      toast.error('Please enter at least one API URL');
      return;
    }

    const newConfig = {
      name: configName,
      ...apiConfig
    };

    setSavedConfigs(prev => [...prev, newConfig]);
    document.getElementById('configName').value = '';
    toast.success(`Configuration "${configName}" saved successfully`);
  };

  // Load configuration
  const loadConfiguration = (index) => {
    if (index === '') return;
    
    const config = savedConfigs[parseInt(index)];
    if (config) {
      setApiConfig({
        questionsApiUrl: config.questionsApiUrl || '',
        solutionsApiUrl: config.solutionsApiUrl || '',
        apiKey: config.apiKey || ''
      });
      setSelectedConfig(index);
      toast.success(`Configuration "${config.name}" loaded successfully`);
    }
  };

     // Export questions to JSON
   const exportQuestions = () => {
     if (questions.length === 0) {
       toast.error('No questions to export');
       return;
     }

     try {
       // Create export data following the exact schema format
       const formattedQuestions = questions.map((question, index) => {
         if (!question || typeof question !== 'object') {
           console.warn('Invalid question object at index:', index);
           return null;
         }

         const solution = solutions[question._id];
         
                    // Extract solution text content
           let solutionText = null;
           if (solution) {
             if (solution.sol?.en?.value) {
               solutionText = solution.sol.en.value;
             } else if (solution.value) {
               solutionText = solution.value;
             } else if (typeof solution === 'string') {
               solutionText = solution;
             }
             
             // Decode HTML entities if solution text exists
             if (solutionText) {
               solutionText = solutionText
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&amp;/g, '&')
                 .replace(/&quot;/g, '"')
                 .replace(/&#39;/g, "'")
                 .replace(/&nbsp;/g, ' ');
             }
           }
         
         // Get solution data for this question
         const solutionData = solutions[question._id];
         
         // Extract topic list from solution's globalConcept (if available)
         let topicList = ["Home", "General"];
         if (solutionData && solutionData.globalConcept && Array.isArray(solutionData.globalConcept) && solutionData.globalConcept[0]) {
           const gc = solutionData.globalConcept[0];
           topicList = [
             gc.s?.title,
             gc.c?.title,
             gc.t?.title,
             gc.st?.title,
             gc.st1?.title,
             gc.st2?.title,
             gc.st3?.title,
             gc.st4?.title
           ].filter(Boolean); // Remove empty/null values
         }
         
         // Convert correctOption from number to letter (1->A, 2->B, 3->C, 4->D)
         let correctOption = question.correct_option || "";
         if (solutionData && solutionData.correctOption) {
           const numToLetter = { "1": "A", "2": "B", "3": "C", "4": "D" };
           correctOption = numToLetter[solutionData.correctOption] || solutionData.correctOption;
         }
         
         // Transform year field: remove spaces, brackets, special chars, convert to lowercase, join with hyphens
         let transformedYear = question.year || "Unknown Year";
         if (transformedYear && transformedYear !== "Unknown Year") {
           transformedYear = transformedYear
             .replace(/[()\[\]{}]/g, '') // Remove brackets: (), [], {}
             .replace(/[^\w\s-]/g, '') // Remove special characters except letters, numbers, spaces, hyphens
             .replace(/\s+/g, '-') // Replace spaces with hyphens
             .toLowerCase() // Convert to lowercase
             .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
             .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
         }
         
         // Transform category field: same transformation as year but UPPERCASE
         let transformedCategory = question.category || "GATE";
         if (transformedCategory && transformedCategory !== "GATE") {
           transformedCategory = transformedCategory
             .replace(/[()\[\]{}]/g, '') // Remove brackets: (), [], {}
             .replace(/[^\w\s-]/g, '') // Remove special characters except letters, numbers, spaces, hyphens
             .replace(/\s+/g, '-') // Replace spaces with hyphens
             .toUpperCase() // Convert to UPPERCASE
             .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
             .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
         }
         
         // Transform topic field: same transformation as year
         let transformedTopic = question.topic || "general";
         if (transformedTopic && transformedTopic !== "general") {
           transformedTopic = transformedTopic
             .replace(/[()\[\]{}]/g, '') // Remove brackets: (), [], {}
             .replace(/[^\w\s-]/g, '') // Remove special characters except letters, numbers, spaces, hyphens
             .replace(/\s+/g, '-') // Replace spaces with hyphens
             .toLowerCase() // Convert to lowercase
             .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
             .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
         }
         
                    // Map to exact schema format using the transformed data from UI
                       const mappedQuestion = {
              "_id": question._id || `generated_${Date.now()}_${index}`,
              "topic": transformedTopic,
              "category": transformedCategory,
              "difficulty": question.difficulty || "medium",
              "year": transformedYear,
              "subject": question.subject || "general",
                        "question": decodeHtml(question.question) || "Question text not available",
             "options_A": decodeHtml(question.options_A) || "",
             "options_B": decodeHtml(question.options_B) || "",
             "options_C": decodeHtml(question.options_C) || "",
             "options_D": decodeHtml(question.options_D) || "",
           "correct_option": correctOption,
           "solution": question.solution || "", // URL or reference if available
           "questionCode": question.questionCode || null,
           "questionImage": question.questionImage || null,
                        "solutiontext": (() => {
                          const finalSolutionText = solutionText || decodeHtml(question.solutiontext) || "";
                          if (index < 3) {
                            console.log(`Question ${index + 1} solutiontext processing:`, {
                              original: question.solutiontext?.substring(0, 200),
                              solutionText: solutionText?.substring(0, 200),
                              decoded: decodeHtml(question.solutiontext)?.substring(0, 200),
                              final: finalSolutionText.substring(0, 200)
                            });
                          }
                          return finalSolutionText;
                        })(),
           "topicList": question.topicList || null,
           "topic_list": topicList
         };
         
                   // Debug log for first few questions
          if (index < 3) {
            console.log(`Exporting question ${index + 1}:`, {
              original: {
                _id: question._id,
                correct_option: question.correct_option,
                correctOption: question.correctOption,
                topic: question.topic,
                category: question.category,
                topic_list: question.topic_list,
                year: question.year,
                question: question.question?.substring(0, 100),
                solutiontext: question.solutiontext?.substring(0, 100)
              },
              solutionData: {
                correctOption: solutionData?.correctOption,
                globalConcept: solutionData?.globalConcept?.[0]
              },
              transformed: {
                topic: transformedTopic,
                category: transformedCategory,
                year: transformedYear
              },
              mapped: {
                _id: mappedQuestion._id,
                correct_option: mappedQuestion.correct_option,
                topic: mappedQuestion.topic,
                category: mappedQuestion.category,
                topic_list: mappedQuestion.topic_list,
                year: mappedQuestion.year,
                question: mappedQuestion.question?.substring(0, 100),
                solutiontext: mappedQuestion.solutiontext?.substring(0, 100)
              }
            });
          }
         
         return mappedQuestion;
       }).filter(Boolean); // Remove any null entries

           const exportData = formattedQuestions; // Export as array directly

       const dataStr = JSON.stringify(exportData, null, 2);
       const dataBlob = new Blob([dataStr], { type: 'application/json' });
       const url = URL.createObjectURL(dataBlob);
       
       const link = document.createElement('a');
       link.href = url;
       link.download = `questions-${new Date().toISOString().split('T')[0]}.json`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
       
               toast.success(`Exported ${formattedQuestions.length} questions in standard schema format`);
      } catch (error) {
        console.error('Error during export:', error);
        toast.error(`Export failed: ${error.message}`);
      }
    };

    // Save questions to Supabase examtracker table
    const saveToDatabase = async () => {
      if (questions.length === 0) {
        toast.error('No questions to save');
        return;
      }

      setIsLoading(true);
      try {
        // Transform questions using the same logic as export
        const formattedQuestions = questions.map((question, index) => {
          if (!question || typeof question !== 'object') {
            console.warn('Invalid question object at index:', index);
            return null;
          }

          const solution = solutions[question._id];
          
          // Extract solution text content
          let solutionText = null;
          if (solution) {
            if (solution.sol?.en?.value) {
              solutionText = solution.sol.en.value;
            } else if (solution.value) {
              solutionText = solution.value;
            } else if (typeof solution === 'string') {
              solutionText = solution;
            }
            
            // Decode HTML entities if solution text exists
            if (solutionText) {
              solutionText = solutionText
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, ' ');
            }
          }
          
          // Get solution data for this question
          const solutionData = solutions[question._id];
          
          // Extract topic list from solution's globalConcept (if available)
          let topicList = ["Home", "General"];
         let transformedTopic = '';
         if (
          solutionData &&
          Array.isArray(solutionData.globalConcept) &&
          solutionData.globalConcept[0]
        ) {
          const gc = solutionData.globalConcept[0];
        
          
            transformedTopic = gc.t?.title?.replace(/\s+/g, "-") // Spaces -> hyphens
              .toLowerCase() // Lowercase
              .replace(/-+/g, "-") // Collapse multiple hyphens
              
          
        
          topicList = [
            gc.s?.title,
            gc.c?.title,
            gc.t?.title,
            gc.st?.title,
            gc.st1?.title,
            gc.st2?.title,
            gc.st3?.title,
            gc.st4?.title,
          ].filter(Boolean);
        }
        
          
          // Convert correctOption from number to letter (1->A, 2->B, 3->C, 4->D)
          let correctOption = question.correct_option || "";
          if (solutionData && solutionData.correctOption) {
            const numToLetter = { "1": "A", "2": "B", "3": "C", "4": "D" };
            correctOption = numToLetter[solutionData.correctOption] || solutionData.correctOption;
          }
          
          // Transform year field: remove spaces, brackets, special chars, convert to lowercase, join with hyphens
          let transformedYear = question.year || "Unknown Year";
          if (transformedYear && transformedYear !== "Unknown Year") {
            transformedYear = transformedYear
              .replace(/[()\[\]{}]/g, '') // Remove brackets: (), [], {}
              .replace(/[^\w\s-]/g, '') // Remove special characters except letters, numbers, spaces, hyphens
              .replace(/\s+/g, '-') // Replace spaces with hyphens
              .toLowerCase() // Convert to lowercase
              .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
              .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
          }
          
          // Transform category field: same transformation as year but UPPERCASE
          let transformedCategory = question.category || "GATE";
          if (transformedCategory && transformedCategory !== "GATE") {
            transformedCategory = transformedCategory
              .replace(/[()\[\]{}]/g, '') // Remove brackets: (), [], {}
              .replace(/[^\w\s-]/g, '') // Remove special characters except letters, numbers, spaces, hyphens
              .replace(/\s+/g, '-') // Replace spaces with hyphens
              .toUpperCase() // Convert to UPPERCASE
              .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
              .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
          }
          
          // Transform topic field: same transformation as year
          // let transformedTopic = question.topic || "general";
          // //if (transformedTopic && transformedTopic !== "general") {
          //   transformedTopic = transformedTopic
          //     .replace(/[()\[\]{}]/g, '') // Remove brackets: (), [], {}
          //     .replace(/[^\w\s-]/g, '') // Remove special characters except letters, numbers, spaces, hyphens
          //     .replace(/\s+/g, '-') // Replace spaces with hyphens
          //     .toLowerCase() // Convert to lowercase
          //     .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
          //     .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
          //}
          
          // Map to exact schema format for database
          return {
            "_id": question._id || `generated_${Date.now()}_${index}`,
            "topic": transformedTopic,
            "category": transformedCategory,
            "difficulty": question.difficulty || "medium",
            "year": transformedYear,
            "subject": question.subject || "general",
            "question": decodeHtml(question.question) || "Question text not available",
            "options_A": decodeHtml(question.options_A) || "",
            "options_B": decodeHtml(question.options_B) || "",
            "options_C": decodeHtml(question.options_C) || "",
            "options_D": decodeHtml(question.options_D) || "",
            "correct_option": correctOption,
            "solution": question.solution || "", // URL or reference if available
            "questionCode": question.questionCode || null,
            "questionImage": question.questionImage || null,
            "solutiontext": (() => {
              const finalSolutionText = solutionText || decodeHtml(question.solutiontext) || "";
              if (index < 3) {
                console.log(`Question ${index + 1} solutiontext processing (save):`, {
                  original: question.solutiontext?.substring(0, 200),
                  solutionText: solutionText?.substring(0, 200),
                  decoded: decodeHtml(question.solutiontext)?.substring(0, 200),
                  final: finalSolutionText.substring(0, 200)
                });
              }
              return finalSolutionText;
            })(),
            "topicList": question.topicList || null,
            "topic_list": topicList
          };
        }).filter(Boolean); // Remove any null entries

        // Send to backend API to save to Supabase
        const response = await fetch('/api/gate-cse/mock-test/admin/api-integration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'save-to-database',
            questions: formattedQuestions
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          toast.success(`Successfully saved ${data.savedCount} questions to database`);
        } else {
          throw new Error(data.error || 'Failed to save to database');
        }
      } catch (error) {
        console.error('Error saving to database:', error);
        
        // Provide helpful error message for configuration issues
        if (error.message.includes('Supabase configuration missing')) {
          toast.error('Database configuration missing. Please check ENV_SETUP.md for setup instructions.');
        } else {
          toast.error(`Database save failed: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to access admin panel.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only admin users can access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Panel
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Integration</h1>
          <p className="text-gray-600">Fetch and display questions and solutions from external APIs</p>
        </div>

        {/* API Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-blue-600" />
            API Configuration
          </h3>
          
                     {/* Debug Info */}
           <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
             <p className="text-sm text-blue-800">
               <strong>Note:</strong> This system acts as a proxy to avoid CORS issues. 
               Your API calls will go through our backend server, not directly from your browser.
             </p>
           </div>
           
           {/* Database Configuration Info */}
           <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
             <p className="text-sm text-green-800">
               <strong>Database Save:</strong> To use the &quot;Save to Database&quot; feature, 
               you need to configure Supabase environment variables. See <strong>ENV_SETUP.md</strong> for instructions.
             </p>
           </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Questions API URL *
              </label>
              <input
                type="url"
                value={apiConfig.questionsApiUrl}
                onChange={(e) => setApiConfig(prev => ({ ...prev, questionsApiUrl: e.target.value }))}
                placeholder="https://api.example.com/questions"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solutions API URL *
              </label>
              <input
                type="url"
                value={apiConfig.solutionsApiUrl}
                onChange={(e) => setApiConfig(prev => ({ ...prev, solutionsApiUrl: e.target.value }))}
                placeholder="https://api.example.com/solutions"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key (Optional)
            </label>
            <input
              type="password"
              value={apiConfig.apiKey}
              onChange={(e) => setApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Enter API key if required"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={fetchQuestions}
              disabled={isLoading || !apiConfig.questionsApiUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Fetch Questions</span>
            </button>
            <button
              onClick={fetchSolutions}
              disabled={isLoading || !apiConfig.solutionsApiUrl}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Fetch Solutions</span>
            </button>
          </div>

          {/* Configuration Management */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Configuration Management</h4>
            
            {/* Quick Test Configuration */}
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="text-sm font-medium text-green-800 mb-2">Quick Test Configuration</h5>
              <div className="flex space-x-2">
                <button
                  onClick={() => setApiConfig({
                    questionsApiUrl: 'https://api-new.testbook.com/api/v2/tests/6877a89a71308a999946688b?auth_code=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Rlc3Rib29rLmNvbSIsInN1YiI6IjYyZDhjN2M1NTlmNzRkMDUxMGJjNGY2MSIsImF1ZCI6IlRCIiwiZXhwIjoiMjAyNS0wOS0yOFQxNDoyNzoyNS4zNjgwMzI0MjJaIiwiaWF0IjoiMjAyNS0wOC0yOVQxNDoyNzoyNS4zNjgwMzI0MjJaIiwibmFtZSI6Ikd1bmphbiBKYWluIiwiZW1haWwiOiJqYWluMTBndW5qYW5AZ21haWwuY29tIiwib3JnSWQiOiIiLCJpc0xNU1VzZXIiOmZhbHNlLCJyb2xlcyI6InN0dWRlbnQifQ.vpdsoHKGalVj_kfOhFK7_pBiEBQIIgM14XOC3E9Tpj1ZJ-4jqOD0wR9omdjgy2t8MdllIoYreC3NDtoMqdKb5RYBdoR39WPDQSVc5x968B2BTGUTIeDxPHimHuPfev_ylgLPFQFtLTKk3aiA-lAsg2wBEXMuzInZALHf6cd3Qf4&X-Tb-Client=web,1.2&language=English&attemptNo=1',
                    solutionsApiUrl: '',
                    apiKey: ''
                  })}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Load Testbook Test
                </button>
                <button
                  onClick={() => setApiConfig({
                    questionsApiUrl: '',
                    solutionsApiUrl: '',
                    apiKey: ''
                  })}
                  className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Configuration Name"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="configName"
              />
              <button
                onClick={() => saveConfiguration()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save Config
              </button>
            </div>
            
            {savedConfigs.length > 0 && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Load Saved Configuration:</label>
                <select
                  value={selectedConfig}
                  onChange={(e) => loadConfiguration(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a configuration...</option>
                  {savedConfigs.map((config, index) => (
                    <option key={index} value={index}>{config.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredQuestions.length} of {questions.length} questions</span>
            {questions.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Questions: {questions.length}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Solutions: {Object.keys(solutions).length}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                         {questions.length > 0 && (
               <div className="flex space-x-2">
                 <button
                   onClick={() => exportQuestions()}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                 >
                   <Download className="h-4 w-4" />
                   <span>Export Standard Format</span>
                 </button>
                 <button
                   onClick={() => saveToDatabase()}
                   disabled={isLoading}
                   className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                 >
                   <Database className="h-4 w-4" />
                   <span>Save to Database</span>
                 </button>
                 <div className="text-sm text-gray-600 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {questions.length} questions
                  {Object.keys(solutions).length > 0 && (
                    <span className="ml-2">
                      + {Object.keys(solutions).length} solutions
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {questions.length === 0 ? 'No questions fetched yet' : 'No questions match your filters'}
                </p>
                {questions.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">Configure your API endpoints and fetch questions to get started</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                                                   {filteredQuestions.map((question, index) => (
                    <QuestionCard
                      key={question._id}
                      question={question}
                      solution={getSolution(question._id)}
                      index={index}
                      decodeHtml={decodeHtml}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
</div>
  );
}

// Question Card Component
function QuestionCard({ question, solution, index, decodeHtml }) {
  const [showSolution, setShowSolution] = useState(false);
  const [showFullQuestion, setShowFullQuestion] = useState(false);

  const stripHtml = (html) => {
    if (!html) return '';
    // First decode HTML entities, then strip HTML tags
    const decoded = html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    return decoded.replace(/<[^>]*>/g, '').trim();
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    const cleanText = stripHtml(text);
    return cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            #{index + 1}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {question.difficulty || 'medium'}
          </span>
          {question.subject && (
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              {question.subject}
            </span>
          )}
          {question.category && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              {question.category}
            </span>
          )}
        </div>
                 <button
           onClick={() => setShowSolution(!showSolution)}
           className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
         >
           <Eye className="h-4 w-4" />
           <span>{showSolution ? 'Hide' : 'View'} Solution</span>
         </button>
      </div>

      {/* Question Content */}
      <div className="mb-4">
                 <div className="mb-3">
           <h4 className="font-medium text-gray-900 mb-2 flex items-center justify-between">
             <span>Question:</span>
             <button
               onClick={() => {
                 const rawText = question.question;
                 const decodedText = decodeHtml(question.question);
                 alert(`Raw HTML:\n${rawText.substring(0, 500)}...\n\nDecoded HTML:\n${decodedText.substring(0, 500)}...`);
               }}
               className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded"
             >
               Debug HTML
             </button>
           </h4>
           <div className="text-gray-700">
             {showFullQuestion ? (
               <div dangerouslySetInnerHTML={{ __html: decodeHtml(question.question) }} />
             ) : (
               <div>
                 {truncateText(question.question)}
                 {question.question && question.question.length > 150 && (
                   <button
                     onClick={() => setShowFullQuestion(true)}
                     className="text-blue-600 hover:text-blue-800 text-sm ml-2"
                   >
                     Show more
                   </button>
                 )}
               </div>
             )}
           </div>
         </div>

                 {/* Options */}
         {question.options_A && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
             <div className="flex items-center space-x-2">
               <span className="text-sm font-medium text-gray-600">A:</span>
               <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: decodeHtml(question.options_A) }} />
             </div>
             <div className="flex items-center space-x-2">
               <span className="text-sm font-medium text-gray-600">B:</span>
               <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: decodeHtml(question.options_B) }} />
             </div>
             <div className="flex items-center space-x-2">
               <span className="text-sm font-medium text-gray-600">C:</span>
               <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: decodeHtml(question.options_C) }} />
             </div>
             <div className="flex items-center space-x-2">
               <span className="text-sm font-medium text-gray-600">D:</span>
               <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: decodeHtml(question.options_D) }} />
             </div>
           </div>
         )}

        {/* Correct Answer */}
        {question.correct_option && (
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-600">Correct Answer: </span>
            <span className="text-sm font-medium text-green-600">{question.correct_option}</span>
          </div>
        )}

        {/* Topic Information */}
        {question.topic && (
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-600">Topic: </span>
            <span className="text-sm text-gray-700">{question.topic}</span>
          </div>
        )}

        {/* Year/Paper Information */}
        {question.year && (
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-600">Paper: </span>
            <span className="text-sm text-gray-700">{question.year}</span>
          </div>
        )}
      </div>

                      {/* Solution */}
        {showSolution && solution && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              Solution
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div dangerouslySetInnerHTML={{ __html: decodeHtml(solution) || 'No solution available' }} />
            </div>
          </div>
        )}

                 {/* Solution Text */}
         {question.solutiontext && (
           <div className="border-t border-gray-200 pt-4">
             <h4 className="font-medium text-gray-900 mb-2 flex items-center justify-between">
               <span>Solution Text:</span>
               <div className="flex space-x-2">
                 <button
                   onClick={() => {
                     console.log('Raw solutiontext:', question.solutiontext);
                     console.log('Decoded solutiontext:', decodeHtml(question.solutiontext));
                   }}
                   className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                 >
                   Debug HTML
                 </button>
                 <button
                   onClick={() => {
                     const rawText = question.solutiontext;
                     const decodedText = decodeHtml(question.solutiontext);
                     alert(`Raw HTML:\n${rawText.substring(0, 500)}...\n\nDecoded HTML:\n${decodedText.substring(0, 500)}...`);
                   }}
                   className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded"
                 >
                   Show Raw vs Decoded
                 </button>
               </div>
             </h4>
             <div className="bg-gray-50 rounded-lg p-4">
               <div dangerouslySetInnerHTML={{ __html: decodeHtml(question.solutiontext) }} />
             </div>
           </div>
         )}

      {/* Topic List */}
      {question.topic_list && question.topic_list.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Topic Path:</h4>
          <div className="flex flex-wrap gap-2">
            {question.topic_list.map((topic, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
