"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from "@supabase/supabase-js";
import { 
  Save, 
  Settings, 
  BookOpen, 
  Clock, 
  BarChart3,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Plus,
  Zap,
  Users,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import { toastPromise, parseJsonResponse } from '@/lib/toastAsync';
import QuestionSelector from '@/components/QuestionSelector';
import SelectedQuestions from '@/components/SelectedQuestions';
import QuestionEditor from '@/components/QuestionEditor';
import { usesGateMarking } from '@/lib/mockTestUtils';

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/** Normalize route param for DB/API: gate-cse -> GATE-CSE */
const normalizeCategory = (param) =>
  (param || 'gate-cse').toString().trim().toUpperCase().replace(/_/g, '-');

/** Label for UI: gate-cse -> GATE CSE */
const categoryLabel = (param) =>
  (param || 'gate-cse').toString().trim().replace(/-/g, ' ').toUpperCase();

/** Equal % per subject that always sums to 100 */
const buildEqualWeightage = (subjects) => {
  const list = (subjects || []).filter(Boolean);
  if (!list.length) return [];
  const n = list.length;
  const base = Math.floor((10000 / n)) / 100;
  const config = list.map((subject) => ({ subject, percent: base }));
  const sum = config.reduce((s, item) => s + item.percent, 0);
  config[0].percent = Math.round((config[0].percent + (100 - sum)) * 10) / 10;
  return config;
};

/** Scale subject percents to total 100 (for auto generation) */
const normalizeWeightageTo100 = (config) => {
  if (!config?.length) return [];
  const total = config.reduce((sum, item) => sum + (Number(item.percent) || 0), 0);
  if (total <= 0) return buildEqualWeightage(config.map((c) => c.subject));
  if (Math.abs(total - 100) < 0.05) return config;

  const scaled = config.map((item) => ({
    subject: item.subject,
    percent: Math.round(((Number(item.percent) || 0) / total) * 1000) / 10,
  }));
  const scaledSum = scaled.reduce((s, item) => s + item.percent, 0);
  scaled[0].percent = Math.round((scaled[0].percent + (100 - scaledSum)) * 10) / 10;
  return scaled;
};

export default function CreateTestPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examcategory = params?.examcategory || 'gate-cse';
  const categoryForApi = useMemo(() => normalizeCategory(examcategory), [examcategory]);
  const categoryDisplay = useMemo(() => categoryLabel(examcategory), [examcategory]);
  const isGateExam = useMemo(() => usesGateMarking(examcategory), [examcategory]);

  const { user, isAdmin } = useAuth();
  const mode = searchParams?.get('mode') || '';
  const topicWiseMode = mode === 'topic';
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [testConfig, setTestConfig] = useState({
    name: '',
    description: '',
    totalQuestions: 65,
    duration: 180,
    difficulty: 'mixed',
    includeGeneralAptitude: true,
    includeEngineeringMath: true,
    customWeightage: false,
    weightageConfig: [],
    category: categoryForApi,
    creationMode: 'manual',
    scopeType: 'full',
    scopeTopic: '',
    scopeSubject: '',
    scopeChapter: '',
  });
  const [chaptersForSubject, setChaptersForSubject] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [scopeQuestionCount, setScopeQuestionCount] = useState(null);
  const [scopeCountLoading, setScopeCountLoading] = useState(false);
  const [scopedTopics, setScopedTopics] = useState([]);
  const [scopedTopicsLoading, setScopedTopicsLoading] = useState(false);
  const [scopeSubjectFilter, setScopeSubjectFilter] = useState('');

  const userEmail = useMemo(() => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      user?.email ||
      null
    );
  }, [user]);

  // Keep testConfig.category in sync with route category
  useEffect(() => {
    setTestConfig(prev => (prev.category === categoryForApi ? prev : { ...prev, category: categoryForApi }));
  }, [categoryForApi]);

  // Topic-wise mode presets (UPSC wants 20Q/30m, scope topic, auto mode)
  useEffect(() => {
    if (!topicWiseMode) return;
    setTestConfig((prev) => ({
      ...prev,
      totalQuestions: 20,
      duration: 30,
      difficulty: 'mixed',
      scopeType: 'topic',
      creationMode: 'auto',
      name: prev.name || '',
      description: prev.description || '',
      customWeightage: false,
    }));
    setSelectedQuestions([]);
    setShowQuestionSelector(false);
  }, [topicWiseMode]);

  // Fetch subjects and topics from API (category-agnostic)
  useEffect(() => {
    const fetchTopicsAndSubjects = async () => {
      try {
        const response = await fetch(`/api/mock-test/admin/topics?category=${encodeURIComponent(examcategory)}`);
        const data = await parseJsonResponse(response);

        if (data.success) {
          setAvailableSubjects(data.subjects);
          setAvailableTopics(data.topics);
          setSubjects(data.subjects);

          const defaultWeightage = buildEqualWeightage(data.subjects || []);

          setTestConfig(prev => ({
            ...prev,
            weightageConfig: defaultWeightage.length ? defaultWeightage : prev.weightageConfig,
          }));
        } else {
          toast.error(data.error || 'Failed to load subjects and topics');
        }
      } catch (error) {
        console.error('Error fetching topics and subjects:', error);
        toast.error('Failed to load subjects and topics');
      }
    };

    if (user && isAdmin && examcategory) {
      fetchTopicsAndSubjects();
    }
  }, [user, isAdmin, examcategory]);

  // Fetch chapters when scope is chapter and subject is selected
  useEffect(() => {
    if (testConfig.scopeType !== 'chapter' || !testConfig.scopeSubject) {
      setChaptersForSubject([]);
      return;
    }
    let cancelled = false;
    setChaptersLoading(true);
    fetch(`/api/chapters/by-subject?category=${encodeURIComponent(categoryForApi)}&subject=${encodeURIComponent(testConfig.scopeSubject)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.data?.chapters) setChaptersForSubject(data.data.chapters);
        else if (!cancelled) setChaptersForSubject([]);
      })
      .catch(() => { if (!cancelled) setChaptersForSubject([]); })
      .finally(() => { if (!cancelled) setChaptersLoading(false); });
    return () => { cancelled = true; };
  }, [testConfig.scopeType, testConfig.scopeSubject, categoryForApi]);

  // Reset scope chapter when subject changes (chapter scope only)
  useEffect(() => {
    if (testConfig.scopeType === 'chapter') setTestConfig((prev) => ({ ...prev, scopeChapter: '' }));
  }, [testConfig.scopeType, testConfig.scopeSubject]);

  // Topics available under a subject (for topic scope + optional filter)
  useEffect(() => {
    if (testConfig.scopeType !== 'topic' || !scopeSubjectFilter) {
      setScopedTopics(availableTopics);
      return;
    }
    let cancelled = false;
    setScopedTopicsLoading(true);
    supabase
      .from('examtracker')
      .select('topic')
      .eq('category', categoryForApi)
      .eq('subject', scopeSubjectFilter)
      .not('topic', 'is', null)
      .limit(2000)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setScopedTopics(availableTopics);
          return;
        }
        const unique = [...new Set((data || []).map((r) => r.topic).filter(Boolean))].sort();
        setScopedTopics(unique);
      })
      .finally(() => {
        if (!cancelled) setScopedTopicsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [testConfig.scopeType, scopeSubjectFilter, categoryForApi, availableTopics]);

  const scopeLabel = useMemo(() => {
    const { scopeType, scopeTopic, scopeSubject, scopeChapter } = testConfig;
    if (scopeType === 'full') return `All (${categoryDisplay})`;
    if (scopeType === 'subject' && scopeSubject) return `Subject: ${scopeSubject}`;
    if (scopeType === 'topic' && scopeTopic) {
      return scopeSubjectFilter
        ? `${scopeSubjectFilter} → ${scopeTopic}`
        : `Topic: ${scopeTopic}`;
    }
    if (scopeType === 'chapter' && scopeSubject && scopeChapter) {
      return `${scopeSubject} → ${scopeChapter}`;
    }
    return 'Select scope below';
  }, [testConfig, categoryDisplay, scopeSubjectFilter]);

  useEffect(() => {
    let cancelled = false;
    const loadCount = async () => {
      const { scopeType, scopeTopic, scopeSubject, scopeChapter } = testConfig;
      if (scopeType === 'topic' && !scopeTopic) {
        setScopeQuestionCount(null);
        return;
      }
      if (scopeType === 'subject' && !scopeSubject) {
        setScopeQuestionCount(null);
        return;
      }
      if (scopeType === 'chapter' && (!scopeSubject || !scopeChapter)) {
        setScopeQuestionCount(null);
        return;
      }

      setScopeCountLoading(true);
      try {
        let query = supabase
          .from('examtracker')
          .select('_id', { count: 'exact', head: true })
          .eq('category', categoryForApi);

        if (scopeType === 'subject' && scopeSubject) {
          query = query.eq('subject', scopeSubject);
        } else if (scopeType === 'topic' && scopeTopic) {
          query = query.eq('topic', scopeTopic);
          if (scopeSubjectFilter) query = query.eq('subject', scopeSubjectFilter);
        } else if (scopeType === 'chapter') {
          query = query.eq('subject', scopeSubject).eq('chapter', scopeChapter);
        }

        const { count, error } = await query;
        if (!cancelled) setScopeQuestionCount(error ? null : count ?? 0);
      } catch {
        if (!cancelled) setScopeQuestionCount(null);
      } finally {
        if (!cancelled) setScopeCountLoading(false);
      }
    };

    const t = setTimeout(loadCount, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    testConfig.scopeType,
    testConfig.scopeTopic,
    testConfig.scopeSubject,
    testConfig.scopeChapter,
    scopeSubjectFilter,
    categoryForApi,
  ]);

  const applyScopeToQuery = useCallback(
    (query) => {
      const { scopeType, scopeTopic, scopeSubject, scopeChapter } = testConfig;
      let q = query.eq('category', categoryForApi);
      if (scopeType === 'subject' && scopeSubject) {
        q = q.eq('subject', scopeSubject);
      } else if (scopeType === 'topic' && scopeTopic) {
        q = q.eq('topic', scopeTopic);
        if (scopeSubjectFilter) q = q.eq('subject', scopeSubjectFilter);
      } else if (scopeType === 'chapter' && scopeSubject && scopeChapter) {
        q = q.eq('subject', scopeSubject).eq('chapter', scopeChapter);
      }
      return q;
    },
    [testConfig, categoryForApi, scopeSubjectFilter]
  );

  const fetchQuestionsForScope = useCallback(async () => {
    try {
      const base = supabase
        .from('examtracker')
        .select(
          '_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty, subject, chapter'
        );
      const { data, error } = await applyScopeToQuery(base).limit(5000);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching scope questions:', error);
      toast.error('Failed to load questions for this scope');
      return [];
    }
  }, [applyScopeToQuery]);

  const addAllFromScope = useCallback(async () => {
    const pool = await fetchQuestionsForScope();
    if (!pool.length) {
      toast.error('No questions found for the selected scope');
      return;
    }
    const existing = new Set(selectedQuestions.map((q) => q._id));
    const available = pool.filter((q) => !existing.has(q._id));
    if (!available.length) {
      toast.info('All questions from this scope are already selected');
      return;
    }
    const remaining = Math.max(0, testConfig.totalQuestions - selectedQuestions.length);
    const toAdd = [...available].sort(() => Math.random() - 0.5).slice(0, remaining || available.length);
    setSelectedQuestions((prev) => [...prev, ...toAdd]);
    toast.success(`Added ${toAdd.length} question${toAdd.length === 1 ? '' : 's'} from scope`);
  }, [fetchQuestionsForScope, selectedQuestions, testConfig.totalQuestions]);

  const clearScopeSelection = useCallback(() => {
    const { scopeType, scopeTopic, scopeSubject, scopeChapter } = testConfig;
    if (scopeType === 'full') {
      setSelectedQuestions([]);
      toast.success('Cleared all selected questions');
      return;
    }
    setSelectedQuestions((prev) =>
      prev.filter((q) => {
        if (scopeType === 'subject' && scopeSubject) return q.subject !== scopeSubject;
        if (scopeType === 'topic' && scopeTopic) return q.topic !== scopeTopic;
        if (scopeType === 'chapter' && scopeChapter) {
          return !(q.subject === scopeSubject && q.chapter === scopeChapter);
        }
        return true;
      })
    );
    toast.success('Cleared questions from this scope');
  }, [testConfig]);

  const effectiveWeightageConfig = useMemo(
    () => normalizeWeightageTo100(testConfig.weightageConfig),
    [testConfig.weightageConfig]
  );

  // Calculate question distribution for auto mode (full category)
  const calculateQuestionDistribution = useCallback(() => {
    if (testConfig.creationMode === 'manual' || testConfig.scopeType !== 'full') {
      return [];
    }

    const normalizedConfig = effectiveWeightageConfig;
    if (!normalizedConfig.length) return [];

    return normalizedConfig.map((subject) => ({
      subject: subject.subject,
      count: Math.round((subject.percent / 100) * testConfig.totalQuestions),
    }));
  }, [
    effectiveWeightageConfig,
    testConfig.creationMode,
    testConfig.scopeType,
    testConfig.totalQuestions,
  ]);

  // Handle question selection toggle
  const handleQuestionToggle = useCallback((question, action) => {
    if (action === 'add') {
      setSelectedQuestions(prev => [...prev, question]);
    } else {
      setSelectedQuestions(prev => prev.filter(q => q._id !== question._id));
    }
  }, []);

  // Handle question removal
  const handleQuestionRemove = useCallback((question, index) => {
    setSelectedQuestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle question reordering
  const handleQuestionReorder = useCallback((fromIndex, toIndex) => {
    setSelectedQuestions(prev => {
      const newQuestions = [...prev];
      const [movedQuestion] = newQuestions.splice(fromIndex, 1);
      newQuestions.splice(toIndex, 0, movedQuestion);
      return newQuestions;
    });
  }, []);

  // Handle question editing
  const handleQuestionEdit = useCallback((question, index) => {
    setEditingQuestion({ ...question, index });
  }, []);

  // Handle question save
  const handleQuestionSave = useCallback((editedQuestion) => {
    setSelectedQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[editingQuestion.index] = editedQuestion;
      return newQuestions;
    });
    setEditingQuestion(null);
    toast.success('Question updated successfully');
  }, [editingQuestion]);

  // Fetch random questions for auto mode (supports full category, topic scope, or chapter scope)
  const fetchRandomQuestions = useCallback(async () => {
    try {
      const { scopeType, scopeTopic, scopeSubject, scopeChapter, category, totalQuestions } = testConfig;

      if (scopeType === 'topic' && scopeTopic) {
        let query = supabase
          .from('examtracker')
          .select('_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty, subject')
          .eq('category', category)
          .eq('topic', scopeTopic);
        if (scopeSubjectFilter) query = query.eq('subject', scopeSubjectFilter);
        const { data, error } = await query;
        if (error) throw error;
        if (!data?.length) {
          toast.error(`No questions found for topic "${scopeTopic}"`);
          return [];
        }
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, totalQuestions);
      }

      if (scopeType === 'subject' && scopeSubject) {
        const { data, error } = await supabase
          .from('examtracker')
          .select('_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty, subject')
          .eq('category', category)
          .eq('subject', scopeSubject);
        if (error) throw error;
        if (!data?.length) {
          toast.error(`No questions found for subject "${scopeSubject}"`);
          return [];
        }
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, totalQuestions);
      }

      if (scopeType === 'chapter' && scopeSubject && scopeChapter) {
        const { data, error } = await supabase
          .from('examtracker')
          .select('_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty, subject')
          .eq('category', category)
          .eq('subject', scopeSubject)
          .eq('chapter', scopeChapter);
        if (error) throw error;
        if (!data?.length) {
          toast.error(`No questions found for chapter "${scopeChapter}"`);
          return [];
        }
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, totalQuestions);
      }

      if (scopeType !== 'full') {
        toast.error('Complete the question scope selection');
        return [];
      }

      let questionDistribution = calculateQuestionDistribution();
      if (!questionDistribution.length && effectiveWeightageConfig.length) {
        questionDistribution = effectiveWeightageConfig.map((item) => ({
          subject: item.subject,
          count: Math.round((item.percent / 100) * totalQuestions),
        }));
      }
      let allQuestions = [];

      for (const dist of questionDistribution) {
        if (dist.count === 0) continue;
        const { data: allSubjectQuestions, error } = await supabase
          .from('examtracker')
          .select('_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty, subject')
          .eq('category', category)
          .eq('subject', dist.subject);

        if (error) {
          console.error(`Error fetching ${dist.subject} questions:`, error);
          toast.error(`Error fetching ${dist.subject} questions`);
          continue;
        }
        if (!allSubjectQuestions?.length) continue;

        const shuffled = allSubjectQuestions.sort(() => Math.random() - 0.5);
        allQuestions = [...allQuestions, ...shuffled.slice(0, dist.count)];
      }

      return allQuestions.sort(() => Math.random() - 0.5);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
      return [];
    }
  }, [
    calculateQuestionDistribution,
    testConfig.category,
    testConfig.scopeType,
    testConfig.scopeTopic,
    testConfig.scopeSubject,
    testConfig.scopeChapter,
    testConfig.totalQuestions,
    effectiveWeightageConfig,
    scopeSubjectFilter,
  ]);

  // Handle test creation
  const handleCreateTest = async () => {
    const inferredName =
      topicWiseMode && testConfig.scopeType === 'topic' && testConfig.scopeTopic?.trim()
        ? `${testConfig.scopeTopic.trim()} Topic Test`
        : '';
    const inferredDescription =
      topicWiseMode && testConfig.scopeType === 'topic' && testConfig.scopeTopic?.trim()
        ? `Topic-wise test · Topic: ${testConfig.scopeTopic.trim()}${scopeSubjectFilter ? ` · Subject: ${scopeSubjectFilter}` : ''}`
        : '';

    if (!testConfig.name.trim() && !inferredName) {
      toast.error('Please enter a test name');
      return;
    }

    if (testConfig.creationMode === 'manual' && selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    if (testConfig.scopeType === 'topic' && !testConfig.scopeTopic?.trim()) {
      toast.error('Please select a topic for question scope');
      return;
    }
    if (testConfig.scopeType === 'subject' && !testConfig.scopeSubject?.trim()) {
      toast.error('Please select a subject for question scope');
      return;
    }
    if (testConfig.scopeType === 'chapter' && (!testConfig.scopeSubject?.trim() || !testConfig.scopeChapter?.trim())) {
      toast.error('Please select subject and chapter for question scope');
      return;
    }
    setIsLoading(true);
    try {
      await toastPromise(
        async () => {
      if (!userEmail) {
        throw new Error("Unable to determine your email (created_by). Please sign out/in and try again.");
      }
      let questions = [];
      
      if (testConfig.creationMode === 'manual') {
        questions = selectedQuestions;
      } else {
        questions = await fetchRandomQuestions();
        if (!questions.length) {
          throw new Error('No questions available for auto mode');
        }
      }

      // Save test to database
      const testData = {
        name: testConfig.name?.trim() || inferredName,
        description: (testConfig.description || inferredDescription || '').trim(),
        duration: topicWiseMode ? 30 : testConfig.duration,
        creation_mode: topicWiseMode ? 'topic_auto' : testConfig.creationMode,
        total_questions: questions.length,
        difficulty: testConfig.difficulty,
        category: testConfig.category,
        ...(isGateExam
          ? {
              include_general_aptitude: testConfig.includeGeneralAptitude,
              include_engineering_math: testConfig.includeEngineeringMath,
            }
          : {
              include_general_aptitude: false,
              include_engineering_math: false,
            }),
        custom_weightage: testConfig.customWeightage,
        created_by: userEmail,
        question_distribution: testConfig.creationMode === 'auto' ? calculateQuestionDistribution() : [],
        weightage_config: effectiveWeightageConfig,
        is_active: true
      };

      const testQuestionsPayload = questions.map((q, index) => ({
        question_id: q._id,
        question_order: index + 1,
        subject: q.subject || 'Unknown',
        topic: q.topic || '',
        difficulty: q.difficulty || 'medium',
      }));

      const response = await fetch('/api/mock-test/admin/create-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'create-mock-test',
          examCategory: examcategory,
          testData,
          testQuestions: testQuestionsPayload,
        }),
      });

      const result = await parseJsonResponse(response);
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create test');
      }

      setTestConfig(prev => ({
        ...prev,
        name: '',
        description: '',
        weightageConfig: buildEqualWeightage(prev.weightageConfig.map((item) => item.subject)),
      }));
      setSelectedQuestions([]);

      return (
        result.message ||
        `Test "${testConfig.name || inferredName}" created with ${questions.length} questions!`
      );
        },
        {
          loading: 'Creating test…',
          success: (msg) => msg,
          error: (err) => err?.message || 'Failed to create test',
        }
      );
    } catch (error) {
      console.error('Error creating test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTestConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWeightageChange = (subject, newPercent) => {
    setTestConfig(prev => ({
      ...prev,
      weightageConfig: prev.weightageConfig.map(item =>
        item.subject === subject ? { ...item, percent: parseFloat(newPercent) || 0 } : item
      )
    }));
  };

  // Memoized values for better performance
  const questionDistribution = useMemo(() => calculateQuestionDistribution(), [calculateQuestionDistribution]);
  const canCreateTest = useMemo(() => {
    if (!testConfig.name.trim()) return false;
    if (testConfig.scopeType === 'topic' && !testConfig.scopeTopic?.trim()) return false;
    if (testConfig.scopeType === 'subject' && !testConfig.scopeSubject?.trim()) return false;
    if (
      testConfig.scopeType === 'chapter' &&
      (!testConfig.scopeSubject?.trim() || !testConfig.scopeChapter?.trim())
    ) {
      return false;
    }
    if (testConfig.creationMode === 'manual') {
      return selectedQuestions.length > 0;
    }
    return true;
  }, [
    testConfig.name,
    testConfig.creationMode,
    testConfig.scopeType,
    testConfig.scopeTopic,
    testConfig.scopeSubject,
    testConfig.scopeChapter,
    selectedQuestions.length,
  ]);

  const setScopeType = useCallback((scopeType) => {
    setScopeSubjectFilter('');
    setTestConfig((p) => ({
      ...p,
      scopeType,
      scopeTopic: '',
      scopeSubject: '',
      scopeChapter: '',
    }));
  }, []);

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
            onClick={() => router.push(`/mock-test/${examcategory}/admin`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Panel
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New {categoryDisplay} Mock Test</h1>
          <p className="text-gray-600">Configure and create a new mock test with manual or automatic question selection</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Test Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Test Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                Basic Test Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={testConfig.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={`e.g., ${categoryDisplay} Mock Test 2026 - Set 1`}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={testConfig.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the test..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Test Configuration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-green-600" />
                Test Configuration
              </h3>
              <div className="space-y-4">
                {/* Creation Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Selection Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleInputChange('creationMode', 'manual')}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        testConfig.creationMode === 'manual'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Manual Selection</div>
                      <div className="text-sm text-gray-600">Choose questions individually</div>
                    </button>
                    
                    <button
                      onClick={() => handleInputChange('creationMode', 'auto')}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        testConfig.creationMode === 'auto'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Zap className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Auto Generation</div>
                      <div className="text-sm text-gray-600">Generate based on weightage</div>
                    </button>
                  </div>
                </div>

                {/* Question scope: All / Subject / Topic / Chapter */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Build test from
                    </label>
                    {scopeCountLoading ? (
                      <span className="text-xs text-gray-500">Counting pool…</span>
                    ) : scopeQuestionCount != null && testConfig.scopeType !== 'full' ? (
                      <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        {scopeQuestionCount} questions in pool
                      </span>
                    ) : testConfig.scopeType === 'full' && availableSubjects.length > 0 ? (
                      <span className="text-xs text-gray-500">
                        {availableSubjects.length} subjects · {availableTopics.length} topics
                      </span>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {[
                      { id: 'full', label: 'All' },
                      { id: 'subject', label: 'Subject' },
                      { id: 'topic', label: 'Topic' },
                      { id: 'chapter', label: 'Chapter' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setScopeType(id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          testConfig.scopeType === id
                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{scopeLabel}</p>

                  {testConfig.scopeType === 'subject' && (
                    <select
                      value={testConfig.scopeSubject}
                      onChange={(e) =>
                        setTestConfig((p) => ({
                          ...p,
                          scopeSubject: e.target.value,
                          name: p.name || (e.target.value ? `${e.target.value} Mock Test` : p.name),
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    >
                      <option value="">Select subject</option>
                      {availableSubjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}

                  {testConfig.scopeType === 'topic' && (
                    <div className="space-y-2">
                      <select
                        value={scopeSubjectFilter}
                        onChange={(e) => {
                          setScopeSubjectFilter(e.target.value);
                          setTestConfig((p) => ({ ...p, scopeTopic: '' }));
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      >
                        <option value="">All subjects (optional filter)</option>
                        {availableSubjects.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <select
                        value={testConfig.scopeTopic}
                        onChange={(e) =>
                          setTestConfig((p) => ({
                            ...p,
                            scopeTopic: e.target.value,
                            name:
                              p.name ||
                              (e.target.value ? `${e.target.value} Mock Test` : p.name),
                          }))
                        }
                        disabled={scopedTopicsLoading}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:opacity-50"
                      >
                        <option value="">
                          {scopedTopicsLoading ? 'Loading topics…' : 'Select topic'}
                        </option>
                        {(scopedTopics.length ? scopedTopics : availableTopics).map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {testConfig.scopeType === 'chapter' && (
                    <div className="space-y-2">
                      <select
                        value={testConfig.scopeSubject}
                        onChange={(e) =>
                          setTestConfig((p) => ({
                            ...p,
                            scopeSubject: e.target.value,
                            scopeChapter: '',
                          }))
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      >
                        <option value="">Select subject</option>
                        {availableSubjects.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <select
                        value={testConfig.scopeChapter}
                        onChange={(e) =>
                          setTestConfig((p) => ({ ...p, scopeChapter: e.target.value }))
                        }
                        disabled={!testConfig.scopeSubject || chaptersLoading}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:opacity-50"
                      >
                        <option value="">
                          {chaptersLoading ? 'Loading chapters…' : 'Select chapter'}
                        </option>
                        {chaptersForSubject.map((ch) => (
                          <option key={ch.slug || ch.title} value={ch.title}>
                            {ch.title} ({ch.count ?? 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {testConfig.creationMode === 'manual' &&
                    testConfig.scopeType !== 'full' &&
                    ((testConfig.scopeType === 'subject' && testConfig.scopeSubject) ||
                      (testConfig.scopeType === 'topic' && testConfig.scopeTopic) ||
                      (testConfig.scopeType === 'chapter' &&
                        testConfig.scopeSubject &&
                        testConfig.scopeChapter)) && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={addAllFromScope}
                          className="text-sm px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          Fill from scope (up to {testConfig.totalQuestions})
                        </button>
                        {selectedQuestions.length > 0 && (
                          <button
                            type="button"
                            onClick={clearScopeSelection}
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                          >
                            Clear scope picks
                          </button>
                        )}
                      </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Questions
                    </label>
                    <input
                      type="number"
                      value={testConfig.totalQuestions}
                      onChange={(e) => handleInputChange('totalQuestions', parseInt(e.target.value))}
                      min="10"
                      max="100"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={testConfig.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      min="30"
                      max="300"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={testConfig.difficulty}
                      onChange={(e) => handleInputChange('difficulty', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="mixed">Mixed (Easy, Medium, Hard)</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  {isGateExam && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Include sections (GATE)
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={testConfig.includeGeneralAptitude}
                            onChange={(e) =>
                              handleInputChange('includeGeneralAptitude', e.target.checked)
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">General Aptitude</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={testConfig.includeEngineeringMath}
                            onChange={(e) =>
                              handleInputChange('includeEngineeringMath', e.target.checked)
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Engineering Mathematics</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subject Weightage Configuration - auto + full category only */}
            {testConfig.creationMode === 'auto' && testConfig.scopeType !== 'full' && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                Auto mode will randomly pick {testConfig.totalQuestions} questions from{' '}
                <span className="font-medium">{scopeLabel}</span>. Subject weightage applies only
                when scope is <span className="font-medium">All</span>.
              </div>
            )}

            {testConfig.creationMode === 'auto' && testConfig.scopeType === 'full' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Subject Weightage Configuration
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Custom Weightage</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testConfig.customWeightage}
                        onChange={(e) => handleInputChange('customWeightage', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  {testConfig.customWeightage && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">
                        Total:{' '}
                        {testConfig.weightageConfig
                          .reduce((sum, item) => sum + (Number(item.percent) || 0), 0)
                          .toFixed(1)}
                        % — values are normalized to 100% when you create the test.
                      </p>
                      {testConfig.weightageConfig.map((subject) => (
                        <div key={subject.subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={subject.percent}
                              onChange={(e) => handleWeightageChange(subject.subject, e.target.value)}
                              min="0"
                              max="100"
                              step="0.1"
                              className="w-20 p-2 border border-gray-300 rounded text-sm"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manual Question Selection - Only show for manual mode */}
            {testConfig.creationMode === 'manual' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-orange-600" />
                    Question Selection
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {testConfig.scopeType !== 'full' &&
                      ((testConfig.scopeType === 'subject' && testConfig.scopeSubject) ||
                        (testConfig.scopeType === 'topic' && testConfig.scopeTopic) ||
                        (testConfig.scopeType === 'chapter' &&
                          testConfig.scopeSubject &&
                          testConfig.scopeChapter)) && (
                        <button
                          type="button"
                          onClick={addAllFromScope}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                        >
                          Fill from scope
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() => setShowQuestionSelector(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Browse & pick</span>
                    </button>
                  </div>
                </div>
                {testConfig.scopeType !== 'full' && (
                  <p className="text-xs text-gray-500 mb-3">
                    Question picker opens filtered to: {scopeLabel}
                  </p>
                )}
                
                <div className="text-sm text-gray-600 mb-4">
                  {selectedQuestions.length} of {testConfig.totalQuestions} questions selected
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((selectedQuestions.length / testConfig.totalQuestions) * 100, 100)}%` }}
                  ></div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{selectedQuestions.length}</div>
                    <div className="text-xs text-blue-600">Selected</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {testConfig.totalQuestions - selectedQuestions.length}
                    </div>
                    <div className="text-xs text-green-600">Remaining</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((selectedQuestions.length / testConfig.totalQuestions) * 100)}%
                    </div>
                    <div className="text-xs text-purple-600">Complete</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview and Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Test Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Test Preview
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Test Name</p>
                  <p className="font-medium">{testConfig.name || 'Untitled Test'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{testConfig.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="font-medium">{testConfig.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <p className="font-medium capitalize">{testConfig.difficulty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Creation Mode</p>
                  <p className="font-medium capitalize">{testConfig.creationMode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Question scope</p>
                  <p className="font-medium text-sm">{scopeLabel}</p>
                </div>
              </div>
            </div>

            {/* Question Distribution - Only show for auto mode */}
            {testConfig.creationMode === 'auto' &&
              testConfig.scopeType === 'full' &&
              questionDistribution.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Question Distribution
                </h3>
                <div className="space-y-2">
                  {questionDistribution.map((item) => (
                    <div key={item.subject} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 truncate">{item.subject}</span>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total</span>
                      <span>{questionDistribution.reduce((sum, item) => sum + item.count, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Questions Preview - Only show for manual mode */}
            {testConfig.creationMode === 'manual' && selectedQuestions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Questions Preview</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedQuestions.slice(0, 5).map((question, index) => (
                    <div key={question._id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          {question.subject}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{question.question}</p>
                    </div>
                  ))}
                  {selectedQuestions.length > 5 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      +{selectedQuestions.length - 5} more questions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create Test Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={handleCreateTest}
                disabled={isLoading || !canCreateTest}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Test...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Test
                  </>
                )}
              </button>
              
              {!canCreateTest && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {!testConfig.name.trim() ? 'Please enter a test name' :
                   testConfig.creationMode === 'manual' && selectedQuestions.length === 0 ? 'Please select at least one question' :
                   'Please complete the test configuration'}
                </p>
              )}
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                {testConfig.creationMode === 'manual' 
                  ? 'This will create a test with your manually selected questions'
                  : 'This will create a test with auto-generated questions based on weightage'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Manual Mode: Selected Questions Management */}
        {testConfig.creationMode === 'manual' && (
          <div className="mt-8">
            <SelectedQuestions
              selectedQuestions={selectedQuestions}
              onQuestionRemove={handleQuestionRemove}
              onQuestionReorder={handleQuestionReorder}
              onQuestionEdit={handleQuestionEdit}
              maxQuestions={testConfig.totalQuestions}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showQuestionSelector && (
        <QuestionSelector
          selectedQuestions={selectedQuestions}
          onQuestionToggle={handleQuestionToggle}
          onClose={() => setShowQuestionSelector(false)}
          maxQuestions={testConfig.totalQuestions}
          examcategory={examcategory}
          initialTopic={testConfig.scopeType === 'topic' ? testConfig.scopeTopic : undefined}
          initialSubject={
            testConfig.scopeType === 'subject' || testConfig.scopeType === 'chapter'
              ? testConfig.scopeSubject
              : scopeSubjectFilter || undefined
          }
          initialChapter={testConfig.scopeType === 'chapter' ? testConfig.scopeChapter : undefined}
        />
      )}

      {editingQuestion && (
        <QuestionEditor
          question={editingQuestion}
          onSave={handleQuestionSave}
          onCancel={() => setEditingQuestion(null)}
          availableSubjects={availableSubjects}
          availableTopics={availableTopics}
        />
      )}

    </div>
  );
}