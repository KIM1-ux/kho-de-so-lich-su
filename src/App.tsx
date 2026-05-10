import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { 
  Home, 
  FileText, 
  CheckSquare, 
  Network, 
  Target,
  Search, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  MapPin,
  X,
  ArrowLeft,
  Download,
  ExternalLink,
  User,
  ChevronDown,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchExams, fetchTopics, fetchQuizzes, type Exam, type Topic, type QuizItem } from './services/dataService';

const NAV_ITEMS = [
  { id: 'home', label: 'Trang chủ', icon: Home },
  { id: 'khode', label: 'Kho đề thi', icon: FileText },
  { id: 'answers', label: 'Bài tập lịch sử', icon: CheckSquare },
  { id: 'topics', label: 'Chuyên đề trọng tâm', icon: Network },
  { id: 'skills', label: 'Kỹ năng làm bài', icon: Target },
];

const removeAccents = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  
  const normalizedText = removeAccents(text);
  const words = highlight.trim().split(/\s+/).filter(Boolean).map(w => removeAccents(w));
  
  if (words.length === 0) return <span>{text}</span>;

  // We need to find all occurrences of all words and highlight them
  // A simple way is to use a regex that matches any of the words
  // But we need to escape the words and handle them as unaccented
  
  // Since we are dealing with unaccented matching, it's easier to find 
  // start/end indices in the normalized text
  const matchIndices: { start: number; end: number }[] = [];
  
  words.forEach(word => {
    let pos = normalizedText.indexOf(word);
    while (pos !== -1) {
      matchIndices.push({ start: pos, end: pos + word.length });
      pos = normalizedText.indexOf(word, pos + 1);
    }
  });

  if (matchIndices.length === 0) return <span>{text}</span>;

  // Merge overlapping or adjacent indices
  matchIndices.sort((a, b) => a.start - b.start);
  const mergedIndices: { start: number; end: number }[] = [];
  if (matchIndices.length > 0) {
    let current = matchIndices[0];
    for (let i = 1; i < matchIndices.length; i++) {
      if (matchIndices[i].start <= current.end) {
        current.end = Math.max(current.end, matchIndices[i].end);
      } else {
        mergedIndices.push(current);
        current = matchIndices[i];
      }
    }
    mergedIndices.push(current);
  }

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  mergedIndices.forEach((match, i) => {
    if (match.start > lastIndex) {
      parts.push(<span key={`text-${i}`}>{text.substring(lastIndex, match.start)}</span>);
    }
    parts.push(
      <mark key={`mark-${i}`} className="bg-brand-accent/30 text-brand-blue rounded-sm px-0.5">
        {text.substring(match.start, match.end)}
      </mark>
    );
    lastIndex = match.end;
  });

  if (lastIndex < text.length) {
    parts.push(<span key="text-end">{text.substring(lastIndex)}</span>);
  }

  return <span>{parts}</span>;
};

const SEARCH_SUGGESTIONS = ['Nam Định', '2025', 'Liên Xô', 'Cách mạng tháng Tám', 'Kháng chiến chống Mỹ'];

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'khode' | 'topics' | 'quizzes'>('home');
  const [exams, setExams] = useState<Exam[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Quiz State
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<('A' | 'B' | 'C' | 'D' | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [filterProvince, setFilterProvince] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [examsData, topicsData, quizzesData] = await Promise.all([
          fetchExams(), 
          fetchTopics(),
          fetchQuizzes()
        ]);
        setExams(examsData);
        setTopics(topicsData);
        setQuizzes(quizzesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const latestExams = useMemo(() => {
    return exams.slice(0, 3);
  }, [exams]);

  const filteredExams = useMemo(() => {
    const query = removeAccents(searchQuery);
    if (!query && filterProvince === '') return exams;
    
    const keywords = query.split(/\s+/).filter(Boolean);
    
    return exams.filter(exam => {
      const searchableText = removeAccents(`${exam.title} ${exam.province} ${exam.year || ''} ${exam.difficulty || ''}`);
      const matchesSearch = keywords.every(kw => searchableText.includes(kw));
      const matchesFilter = filterProvince === '' || exam.province === filterProvince;
      return matchesSearch && matchesFilter;
    });
  }, [exams, searchQuery, filterProvince]);

  const filteredTopics = useMemo(() => {
    const query = removeAccents(searchQuery);
    if (!query) return topics;
    
    const keywords = query.split(/\s+/).filter(Boolean);
    
    return topics.filter(topic => {
      // Add "chuyen de" and "chu de" as keywords to searchable text to handle synonyms
      const searchableText = removeAccents(`chuyen de chu de ${topic.title} ${topic.id}`);
      return keywords.every(kw => searchableText.includes(kw));
    });
  }, [topics, searchQuery]);

  const quizLessons = useMemo(() => {
    const allLessons = Array.from(new Set(quizzes.map(q => q.lesson))).filter(Boolean);
    const query = removeAccents(searchQuery);
    if (!query) return allLessons;

    const keywords = query.split(/\s+/).filter(Boolean);

    return allLessons.filter((lesson): lesson is string => {
      const normalizedLesson = removeAccents(lesson as string);
      return keywords.every(kw => normalizedLesson.includes(kw));
    });
  }, [quizzes, searchQuery]);

  const provinces = useMemo(() => {
    return Array.from(new Set(exams.map(e => e.province))).filter(Boolean);
  }, [exams]);

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;

    if (currentView === 'home') {
      const normalizedQuery = removeAccents(searchQuery);
      if (normalizedQuery.includes('chuyen de')) {
        setCurrentView('topics');
        setSelectedTopic(null);
      } else if (normalizedQuery.includes('bai tap') || normalizedQuery.includes('trac nghiem')) {
        setCurrentView('quizzes');
        setSelectedLesson(null);
        resetQuiz();
      } else {
        setCurrentView('khode');
        setSelectedExam(null);
      }
    }
  };

  const currentLessonQuizzes = useMemo(() => {
    return quizzes.filter(q => q.lesson === selectedLesson);
  }, [quizzes, selectedLesson]);

  const handleFeatureClick = (title: string) => {
    if (title === 'KHO ĐỀ THI') {
      setCurrentView('khode');
      setSelectedExam(null);
      setSearchQuery('');
    } else if (title === 'CHUYÊN ĐỀ TRỌNG TÂM') {
      setCurrentView('topics');
      setSelectedTopic(null);
      setSearchQuery('');
    } else if (title === 'BÀI TẬP LỊCH SỬ') {
      setCurrentView('quizzes');
      setSelectedLesson(null);
      resetQuiz();
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setUserAnswers([]);
    setShowExplanation(false);
    setIsQuizFinished(false);
  };

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (userAnswers[currentQuestionIndex]) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);

    if (answer === currentLessonQuizzes[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentLessonQuizzes.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    } else {
      setIsQuizFinished(true);
    }
  };

  if (currentView === 'quizzes') {
    return (
      <div className="flex min-h-screen bg-slate-50 font-sans overflow-hidden">
        {/* Sidebar for navigation back */}
        <aside className="w-1/3 flex flex-col border-r border-slate-200 bg-white">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <button 
              onClick={() => { setCurrentView('home'); resetQuiz(); }}
              className="flex items-center gap-2 text-brand-blue font-bold hover:text-brand-sepia transition-colors"
            >
              <ArrowLeft size={18} />
              Quay lại trang chủ
            </button>
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-xl font-serif font-bold text-brand-blue">Bài Tập Trắc Nghiệm</h2>
            <p className="text-sm text-slate-500">Hệ thống câu hỏi ôn luyện chuyên sâu theo từng bài học.</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Tìm kiếm bài tập..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-accent/30"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              />
              <AnimatePresence>
                {isSearchFocused && !searchQuery && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <p className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Gợi ý tìm kiếm</p>
                    {SEARCH_SUGGESTIONS.map(sug => (
                      <button 
                        key={sug}
                        onClick={() => setSearchQuery(sug)}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-brand-beige hover:text-brand-blue transition-colors flex items-center gap-2"
                      >
                        <TrendingUp size={12} className="text-brand-accent" />
                        {sug}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <div className="space-y-3">
              {quizLessons.map(lesson => (
                <button
                  key={lesson}
                  onClick={() => {
                    setSelectedLesson(lesson);
                    resetQuiz();
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedLesson === lesson 
                    ? 'bg-brand-beige border-brand-accent/50 shadow-sm text-brand-blue' 
                    : 'bg-white border-slate-100 hover:border-brand-accent/30 hover:shadow-md text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${selectedLesson === lesson ? 'bg-brand-accent/20 text-brand-blue' : 'bg-slate-50 text-slate-400'}`}>
                        <CheckSquare size={18} />
                     </div>
                     <span className="text-sm font-bold truncate">
                       <HighlightText text={lesson} highlight={searchQuery} />
                     </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-slate-100 flex flex-col p-8 overflow-y-auto relative">
          {!selectedLesson ? (
            <div className="max-w-6xl mx-auto w-full">
               <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-serif font-black text-brand-blue uppercase tracking-tight">Hệ thống bài tập</h2>
                    <p className="text-slate-500 mt-2">Chọn một chủ đề để bắt đầu luyện tập trắc nghiệm kiến thức.</p>
                  </div>
                  {searchQuery && (
                    <div className="text-sm font-medium text-slate-400 bg-slate-200/50 px-4 py-2 rounded-full flex items-center gap-2">
                       Kết quả cho: <span className="text-brand-blue">"{searchQuery}"</span>
                       <button onClick={() => setSearchQuery('')}><X size={14} /></button>
                    </div>
                  )}
               </div>

               {quizLessons.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-[3.5rem] border border-dashed border-slate-200">
                    <Search size={64} className="mb-6 opacity-10" />
                    <h3 className="text-xl font-serif font-bold text-slate-600 mb-2">Không tìm thấy bài tập phù hợp</h3>
                    <p className="max-w-sm text-center">Rất tiếc, không tìm thấy tài liệu phù hợp. Hãy thử tìm với từ khóa khác nhé!</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-6 text-brand-blue font-bold px-6 py-2 bg-brand-accent/20 rounded-xl hover:bg-brand-accent/40"
                    >
                      Xóa tìm kiếm
                    </button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {quizLessons.map((lesson) => {
                      const count = quizzes.filter(q => q.lesson === lesson).length;
                      return (
                        <motion.div
                          key={lesson}
                          layout
                          whileHover={{ y: -8, scale: 1.02 }}
                          onClick={() => {
                            setSelectedLesson(lesson);
                            resetQuiz();
                          }}
                          className="bg-white rounded-[2.5rem] p-8 shadow-lg shadow-black/5 border border-slate-100 cursor-pointer group transition-all"
                        >
                          <div className="w-16 h-16 bg-brand-beige rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-accent/20 transition-colors">
                             <BookOpen size={32} className="text-brand-sepia group-hover:text-brand-blue transition-colors" />
                          </div>
                          <h3 className="text-xl font-bold text-brand-blue leading-tight mb-4 group-hover:text-brand-sepia transition-colors">
                            <HighlightText text={lesson} highlight={searchQuery} />
                          </h3>
                          <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                             <div className="flex items-center gap-2 text-slate-400">
                               <CheckSquare size={16} />
                               <span className="text-xs font-bold uppercase tracking-wider">{count} CÂU HỎI</span>
                             </div>
                             <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all">
                               <ChevronRight size={18} />
                             </div>
                          </div>
                        </motion.div>
                      );
                    })}
                 </div>
               )}
            </div>
          ) : isQuizFinished ? (
            <div className="max-w-2xl mx-auto w-full bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100 text-center flex flex-col items-center">
               <div className="w-24 h-24 bg-brand-beige rounded-full flex items-center justify-center mb-8">
                  <Target size={48} className="text-brand-sepia" />
               </div>
               <h2 className="text-3xl font-serif font-black text-brand-blue mb-2">HOÀN THÀNH LUYỆN TẬP!</h2>
               <p className="text-slate-500 mb-8">Kết quả của bạn đã được ghi nhận vào hệ thống.</p>
               
               <div className="bg-slate-50 rounded-3xl p-8 mb-8 w-full grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Số câu đúng</p>
                    <p className="text-4xl font-black text-brand-blue">{score}/{currentLessonQuizzes.length}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tỉ lệ chính xác</p>
                    <p className="text-4xl font-black text-green-600">{Math.round((score / currentLessonQuizzes.length) * 100)}%</p>
                  </div>
               </div>

               <p className="text-brand-sepia font-bold mb-8 italic">
                 {score === currentLessonQuizzes.length ? "Tuyệt vời! Bạn đã nắm vững kiến thức bài này." : 
                  score >= currentLessonQuizzes.length * 0.8 ? "Rất tốt! Hãy tiếp tục phát huy nhé." :
                  "Cần cố gắng hơn! Hãy xem lại phần tư liệu và luyện tập thêm."}
               </p>

               <div className="flex gap-4 w-full">
                  <button 
                    onClick={resetQuiz}
                    className="flex-1 py-4 bg-brand-blue text-white font-bold rounded-2xl shadow-lg hover:shadow-brand-blue/30 transition-all"
                  >
                    LÀM LẠI BỘ NÀY
                  </button>
                  <button 
                    onClick={() => setSelectedLesson(null)}
                    className="flex-1 py-4 bg-white border border-slate-200 text-brand-blue font-bold rounded-2xl shadow-sm hover:bg-slate-50 transition-all"
                  >
                    CHỌN BÀI KHÁC
                  </button>
               </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-8">
               {/* Progress Bar */}
               <div className="bg-white rounded-full p-1.5 shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestionIndex + 1) / currentLessonQuizzes.length) * 100}%` }}
                        className="h-full bg-brand-accent"
                     />
                  </div>
                  <span className="text-xs font-black text-brand-blue pr-4 shrink-0">
                    CÂU {currentQuestionIndex + 1} / {currentLessonQuizzes.length}
                  </span>
               </div>

               {/* Question Section */}
               <div className="bg-white rounded-[2.5rem] p-10 shadow-lg shadow-black/5 border border-slate-100">
                  <h3 className="text-2xl font-black text-brand-blue leading-tight mb-10">
                    {currentLessonQuizzes[currentQuestionIndex].question}
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(currentLessonQuizzes[currentQuestionIndex].options).map(([key, value]) => {
                      const isSelected = userAnswers[currentQuestionIndex] === key;
                      const isCorrect = currentLessonQuizzes[currentQuestionIndex].correctAnswer === key;
                      
                      let variantClasses = "bg-slate-50 border-slate-100 text-slate-700 hover:bg-white hover:border-brand-accent/50 hover:shadow-md";
                      
                      if (userAnswers[currentQuestionIndex]) {
                         if (isCorrect) variantClasses = "bg-green-50 border-green-200 text-green-700 ring-2 ring-green-100";
                         else if (isSelected) variantClasses = "bg-red-50 border-red-200 text-red-700 ring-2 ring-red-100";
                         else variantClasses = "bg-slate-50 border-slate-100 text-slate-400 opacity-50";
                      }

                      return (
                        <button
                          key={key}
                          disabled={!!userAnswers[currentQuestionIndex]}
                          onClick={() => handleAnswerSelect(key as 'A' | 'B' | 'C' | 'D')}
                          className={`w-full text-left p-6 rounded-2xl border transition-all flex items-center gap-4 group ${variantClasses}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                             isSelected ? 'bg-white' : 'bg-white border-2 border-slate-200 group-hover:border-brand-accent transition-colors'
                          }`}>
                            {key}
                          </div>
                          <span className="font-bold">{value}</span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-10 pt-10 border-t border-slate-100"
                      >
                         <div className="flex items-center gap-2 mb-4 text-brand-sepia font-bold">
                            <AlertCircle size={18} />
                            <span>GIẢI THÍCH CHI TIẾT</span>
                         </div>
                         <p className="text-slate-600 leading-relaxed">
                            {/* In real app, this would come from CSV. For now we use the material or a generic text */}
                            {currentLessonQuizzes[currentQuestionIndex].material || "Dựa trên kiến thức lịch sử giai đoạn này, đáp án được chọn là câu trả lời chính xác nhất phản ánh nội dung được hỏi."}
                         </p>
                         
                         <button 
                           onClick={handleNextQuestion}
                           className="mt-8 w-full py-4 bg-brand-blue text-white font-bold rounded-2xl shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all active:translate-y-0"
                         >
                           {currentQuestionIndex === currentLessonQuizzes.length - 1 ? 'HOÀN THÀNH' : 'CÂU TIẾP THEO'}
                           <ChevronRight size={20} />
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentView === 'topics') {
    return (
      <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
        <aside className="w-1/3 flex flex-col border-r border-slate-200 bg-white">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 text-brand-blue font-bold hover:text-brand-sepia transition-colors"
            >
              <ArrowLeft size={18} />
              Quay lại trang chủ
            </button>
            <div className="h-8 w-8 bg-brand-blue text-white rounded-lg flex items-center justify-center font-bold text-sm">K</div>
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-xl font-serif font-bold text-brand-blue">Chuyên Đề Trọng Tâm</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Tìm kiếm chuyên đề..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-accent/30"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              />
              <AnimatePresence>
                {isSearchFocused && !searchQuery && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <p className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Gợi ý tìm kiếm</p>
                    {SEARCH_SUGGESTIONS.map(sug => (
                      <button 
                        key={sug}
                        onClick={() => setSearchQuery(sug)}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-brand-beige hover:text-brand-blue transition-colors flex items-center gap-2"
                      >
                        <TrendingUp size={12} className="text-brand-accent" />
                        {sug}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="text-center py-20 px-6 text-slate-400">
                <Network size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-serif font-bold text-slate-600 mb-2">Không tìm thấy chuyên đề phù hợp</h3>
                <p className="text-sm italic">Rất tiếc, không tìm thấy tài liệu phù hợp. Thử thử tìm với từ khóa khác nhé!</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-6 text-xs text-brand-blue font-bold px-4 py-2 bg-brand-accent/20 rounded-lg"
                >
                  Xóa tìm kiếm
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTopics.map(topic => (
                  <motion.div 
                    layout
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      selectedTopic?.id === topic.id 
                      ? 'bg-brand-beige border-brand-accent/50 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-brand-accent/30 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${selectedTopic?.id === topic.id ? 'bg-brand-accent/20 text-brand-blue' : 'bg-amber-50 text-amber-600'}`}>
                        <Network size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-brand-blue line-clamp-2 leading-tight">
                          <HighlightText text={topic.title} highlight={searchQuery} />
                        </h4>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 bg-slate-100 flex flex-col overflow-hidden">
          {selectedTopic ? (
            <div className="flex-1 flex flex-col h-full bg-slate-200 relative overflow-hidden">
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-50 z-0">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue mb-4" />
                  <p className="font-medium">Đang tải tài liệu...</p>
                  <p className="text-xs mt-2 px-6 text-center">Nếu quá lâu, vui lòng <a href={selectedTopic.pdfUrl.replace('/preview', '/view')} target="_blank" rel="noopener noreferrer" className="text-brand-blue font-bold underline">bấm vào đây để mở trực tiếp</a></p>
               </div>

               <div className="absolute top-4 right-6 z-30 flex gap-2">
                  <button 
                    onClick={() => setSelectedTopic(null)}
                    className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all shadow-lg flex items-center gap-2 px-4 text-xs font-bold"
                  >
                    <ArrowLeft size={16} /> THOÁT XEM
                  </button>
                  <a href={selectedTopic.pdfUrl.replace('/preview', '/view')} target="_blank" rel="noopener noreferrer" className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all shadow-lg">
                    <ExternalLink size={20} />
                  </a>
               </div>
               
               <iframe 
                key={selectedTopic.id}
                src={selectedTopic.pdfUrl} 
                className="relative z-10 w-full h-full border-none bg-transparent" 
                title={selectedTopic.title} 
                allow="autoplay" 
                loading="lazy"
               />

               <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-md p-4 border-t border-slate-200 flex items-center justify-between z-20">
                  <div>
                    <h3 className="font-bold text-brand-blue">{selectedTopic.title}</h3>
                    <p className="text-xs text-slate-500">Chuyên đề học tập trọng tâm - Tài liệu lưu truyền nội bộ.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => window.open(selectedTopic.pdfUrl.replace('/preview', '/view'), '_blank')}
                      className="px-6 py-2 bg-white border border-slate-200 text-brand-blue font-bold rounded-xl text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                      <ExternalLink size={16} /> MỞ TRONG TAB MỚI
                    </button>
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-8 overflow-y-auto">
               <div className="mb-8">
                  <h2 className="text-3xl font-serif font-black text-brand-blue uppercase tracking-tight">Danh sách chuyên đề</h2>
                  <p className="text-slate-500 mt-1">Hệ thống hóa kiến thức - Sơ đồ tư duy liên kết</p>
               </div>

               {filteredTopics.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner mb-6">
                      <Network size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-slate-600 mb-2">Không tìm thấy chuyên đề phù hợp</h3>
                    <p className="max-w-sm text-center">Rất tiếc, không tìm thấy tài liệu phù hợp. Hãy thử tìm với từ khóa khác nhé!</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-6 text-brand-blue font-bold px-6 py-2 bg-brand-accent/20 rounded-xl hover:bg-brand-accent/40"
                    >
                      Xóa tìm kiếm
                    </button>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTopics.map((topic) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -8 }}
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic)}
                        className="bg-white rounded-[2.5rem] p-6 shadow-lg shadow-black/5 border border-slate-100 cursor-pointer group transition-all"
                      >
                        <div className="w-full aspect-video bg-amber-50/50 rounded-[2rem] mb-6 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-50 transition-colors">
                           <Network size={48} className="text-amber-500/20 group-hover:text-amber-500/40 transition-all group-hover:scale-110" />
                        </div>
                        <h3 className="text-lg font-bold text-brand-blue leading-tight mb-2 group-hover:text-brand-sepia transition-colors line-clamp-2">
                          <HighlightText text={topic.title} highlight={searchQuery} />
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">Tài liệu học thuật</p>
                      </motion.div>
                    ))}
                  </div>
               )}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentView === 'khode') {
    return (
      <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
        <aside className="w-1/3 flex flex-col border-r border-slate-200 bg-white">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 text-brand-blue font-bold hover:text-brand-sepia transition-colors"
            >
              <ArrowLeft size={18} />
              Quay lại trang chủ
            </button>
            <div className="h-8 w-8 bg-brand-blue text-white rounded-lg flex items-center justify-center font-bold text-sm">K</div>
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-xl font-serif font-bold text-brand-blue">Kho Đề Thi Hệ Thống</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Tìm kiếm tên đề, tỉnh..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-accent/30"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              />
              <AnimatePresence>
                {isSearchFocused && !searchQuery && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <p className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Gợi ý tìm kiếm</p>
                    {SEARCH_SUGGESTIONS.map(sug => (
                      <button 
                        key={sug}
                        onClick={() => setSearchQuery(sug)}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-brand-beige hover:text-brand-blue transition-colors flex items-center gap-2"
                      >
                        <TrendingUp size={12} className="text-brand-accent" />
                        {sug}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => { setFilterProvince(''); setSelectedExam(null); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterProvince === '' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Tất cả
              </button>
              {provinces.map(p => (
                <button 
                  key={p}
                  onClick={() => { setFilterProvince(p); setSelectedExam(null); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterProvince === p ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-20 px-6 text-slate-400">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-serif font-bold text-slate-600 mb-2">Không tìm thấy đề thi phù hợp</h3>
                <p className="text-sm italic">Rất tiếc, không tìm thấy tài liệu phù hợp. Thử thử tìm với từ khóa khác nhé!</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-6 text-xs text-brand-blue font-bold px-4 py-2 bg-brand-accent/20 rounded-lg"
                >
                  Xóa tìm kiếm
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExams.map(exam => (
                  <motion.div 
                    layout
                    key={exam.id}
                    onClick={() => setSelectedExam(exam)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      selectedExam?.id === exam.id 
                      ? 'bg-brand-beige border-brand-accent/50 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-brand-accent/30 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${selectedExam?.id === exam.id ? 'bg-brand-accent/20 text-brand-blue' : 'bg-red-50 text-red-600'}`}>
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-brand-blue line-clamp-2 leading-tight">
                          <HighlightText text={exam.title} highlight={searchQuery} />
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">
                            <HighlightText text={exam.province} highlight={searchQuery} />
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full uppercase">
                            <HighlightText text={exam.year} highlight={searchQuery} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 bg-slate-100 flex flex-col overflow-hidden">
          {selectedExam ? (
            <div className="flex-1 flex flex-col h-full bg-slate-200 relative overflow-hidden">
               {/* Loading & Fallback state */}
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-50 z-0">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue mb-4" />
                  <p className="font-medium">Đang tải tài liệu...</p>
                  <p className="text-xs mt-2 px-6 text-center">Nếu quá lâu, vui lòng <a href={selectedExam.pdfUrl.replace('/preview', '/view')} target="_blank" rel="noopener noreferrer" className="text-brand-blue font-bold underline">bấm vào đây để mở trực tiếp</a></p>
               </div>

               <div className="absolute top-4 right-6 z-30 flex gap-2">
                  <button 
                    onClick={() => setSelectedExam(null)}
                    className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all shadow-lg flex items-center gap-2 px-4 text-xs font-bold"
                  >
                    <ArrowLeft size={16} /> THOÁT XEM
                  </button>
                  <a href={selectedExam.pdfUrl.replace('/preview', '/view')} target="_blank" rel="noopener noreferrer" className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all shadow-lg">
                    <ExternalLink size={20} />
                  </a>
               </div>
               
               <iframe 
                key={selectedExam.id}
                src={selectedExam.pdfUrl} 
                className="relative z-10 w-full h-full border-none bg-transparent" 
                title={selectedExam.title} 
                allow="autoplay" 
                loading="lazy"
               />

               <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-md p-4 border-t border-slate-200 flex items-center justify-between z-20">
                  <div>
                    <h3 className="font-bold text-brand-blue">{selectedExam.title}</h3>
                    <p className="text-xs text-slate-500">Người xem có thể in hoặc tải về từ thanh công cụ của Google Drive phía trên.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => window.open(selectedExam.pdfUrl.replace('/preview', '/view'), '_blank')}
                      className="px-6 py-2 bg-white border border-slate-200 text-brand-blue font-bold rounded-xl text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                      <ExternalLink size={16} /> MỞ TRONG TAB MỚI
                    </button>
                    {selectedExam.answerUrl && (
                      <button onClick={() => window.open(selectedExam.answerUrl, '_blank')} className="px-6 py-2 bg-brand-accent text-brand-blue font-bold rounded-xl text-sm shadow-sm hover:scale-105 transition-all">
                        XEM ĐÁP ÁN CHI TIẾT
                      </button>
                    )}
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-8 overflow-y-auto">
               <div className="mb-8 flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-serif font-black text-brand-blue uppercase tracking-tight">Tất cả đề thi</h2>
                    <p className="text-slate-500 mt-1">Hiển thị {filteredExams.length} tài liệu học tập phù hợp</p>
                  </div>
               </div>

               {filteredExams.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner mb-6">
                      <FileText size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-slate-600 mb-2">Không tìm thấy đề thi phù hợp</h3>
                    <p className="max-w-xs text-sm text-center">Rất tiếc, không tìm thấy tài liệu phù hợp. Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-6 text-brand-blue font-bold px-6 py-2 bg-brand-accent/20 rounded-xl hover:bg-brand-accent/40"
                    >
                      Xóa tìm kiếm
                    </button>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredExams.map((exam) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -8 }}
                        key={exam.id}
                        onClick={() => setSelectedExam(exam)}
                        className="bg-white rounded-[2.5rem] p-6 shadow-lg shadow-black/5 border border-slate-100 cursor-pointer group transition-all"
                      >
                        <div className="w-full aspect-[4/3] bg-brand-beige/30 rounded-[2rem] mb-6 flex items-center justify-center relative overflow-hidden group-hover:bg-brand-beige transition-colors">
                           <FileText size={64} className="text-red-500/20 group-hover:text-red-500/40 transition-all group-hover:scale-110" />
                           <div className="absolute top-4 right-4 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[10px] font-black text-brand-blue border border-white/50">
                             PDF DOCUMENT
                           </div>
                        </div>
                        <h3 className="text-lg font-bold text-brand-blue leading-tight mb-4 group-hover:text-brand-sepia transition-colors line-clamp-2 min-h-[3.5rem]">
                          {exam.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                           <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">{exam.year}</span>
                           <span className="px-3 py-1 bg-slate-100 text-brand-blue text-[10px] font-bold rounded-full">{exam.province}</span>
                           <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                             exam.difficulty === 'Giỏi' ? 'bg-amber-100 text-amber-600' : 
                             exam.difficulty === 'Khá' ? 'bg-blue-100 text-blue-600' : 
                             'bg-green-100 text-green-600'
                           }`}>{exam.difficulty}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
               )}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="w-72 bg-brand-blue text-white flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-xl text-brand-blue">K</div>
          <span className="font-serif font-bold text-lg leading-tight uppercase tracking-wider">Kho Đề Số <br/> Lịch Sử</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { 
                if (item.id === 'khode') {
                  setCurrentView('khode');
                  setSelectedExam(null);
                }
                else if (item.id === 'topics') {
                  setCurrentView('topics');
                  setSelectedTopic(null);
                }
                else if (item.id === 'answers') {
                  setCurrentView('quizzes');
                  setSelectedLesson(null);
                  resetQuiz();
                }
                else if (item.id === 'home') setCurrentView('home');
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${currentView === item.id ? 'bg-blue-900/50 text-white shadow-sm' : 'text-blue-100/70 hover:bg-blue-900/30 hover:text-white'}`}
            >
              <item.icon size={20} strokeWidth={1.5} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-8 mt-auto border-t border-blue-900/30">
          <div className="p-4 bg-white/5 rounded-2xl">
            <p className="text-xs text-blue-200/50 mb-2">Đội tuyển THCS</p>
            <p className="font-medium text-sm">Vị Xuyên, Hà Giang</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <section className="relative h-[320px] overflow-hidden bg-[#FDFBF7]">
          <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=2070&auto=format&fit=crop" alt="Văn Miếu Quốc Tử Giám" className="w-full h-full object-cover opacity-60 sepia-[30%] blur-[2px]" />
            <div className="absolute inset-0 bg-[#FDFBF7]/20" />
          </div>
          <div className="relative z-10 h-full flex items-center">
            <div className="container mx-auto px-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="max-w-4xl bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-2xl shadow-brand-blue/5"
              >
                <h1 className="text-3xl lg:text-[40px] font-serif font-black text-brand-blue mb-3 tracking-tight leading-[1.1] uppercase">KHO ĐỀ SỐ HỌC SINH GIỎI <br/> MÔN LỊCH SỬ</h1>
                <p className="text-brand-sepia text-base font-medium opacity-90 mb-6 max-w-2xl">Nền tảng ôn luyện chuyên sâu và hệ thống hóa kiến thức cho đội tuyển HSG THCS Vị Xuyên, Hà Giang.</p>
                <div className="relative max-w-2xl group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-sepia/60"><Search size={22} /></div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm đề thi, chuyên đề, bài tập..."
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchSubmit();
                      }
                    }}
                    className="w-full bg-white/80 h-14 pl-14 pr-12 rounded-2xl shadow-inner border border-slate-200 focus:ring-4 focus:ring-brand-accent/20 transition-all outline-none text-lg text-brand-blue"
                  />
                  <AnimatePresence>
                    {isSearchFocused && !searchQuery && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                      >
                        <p className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Gợi ý tìm kiếm phổ biến</p>
                        <div className="p-2 grid grid-cols-2">
                          {SEARCH_SUGGESTIONS.map(sug => (
                            <button 
                              key={sug}
                              onClick={() => {
                                setSearchQuery(sug);
                                setTimeout(() => {
                                  // Logic to handle suggestion click on home
                                  const normalizedS = removeAccents(sug);
                                  if (normalizedS.includes('chuyen de')) {
                                    setCurrentView('topics');
                                    setSelectedTopic(null);
                                  } else if (normalizedS.includes('bai tap') || normalizedS.includes('trac nghiem')) {
                                    setCurrentView('quizzes');
                                    setSelectedLesson(null);
                                    resetQuiz();
                                  } else {
                                    setCurrentView('khode');
                                    setSelectedExam(null);
                                  }
                                }, 100);
                              }}
                              className="text-left px-6 py-3 text-sm font-bold text-slate-600 hover:bg-brand-beige hover:text-brand-blue rounded-2xl transition-colors flex items-center gap-3"
                            >
                              <TrendingUp size={16} className="text-brand-accent" />
                              {sug}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-[130px] top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors"
                    >
                      <X size={20} />
                    </button>
                  )}
                  <button 
                    onClick={handleSearchSubmit} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 px-6 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-sepia transition-all flex items-center gap-2"
                  >
                     <Search size={18} />
                     <span>TÌM KIẾM</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-12 pt-12 mb-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'KHO ĐỀ THI', desc: 'Theo năm, tỉnh, cấp độ', icon: FileText, color: 'bg-blue-50 text-blue-600' },
              { title: 'BÀI TẬP LỊCH SỬ', desc: 'Hướng dẫn giải, phân tích bài', icon: CheckSquare, color: 'bg-green-50 text-green-600' },
              { title: 'CHUYÊN ĐỀ TRỌNG TÂM', desc: 'Sơ đồ tư duy, bảng so sánh', icon: Network, color: 'bg-amber-50 text-amber-600' },
              { title: 'KỸ NĂNG LÀM BÀI', desc: 'Phương pháp giải nhanh, lỗi thường gặp', icon: Target, color: 'bg-purple-50 text-purple-600' },
            ].map((feature, idx) => (
              <motion.div key={idx} whileHover={{ y: -5 }} onClick={() => handleFeatureClick(feature.title)} className="bg-white p-6 rounded-3xl shadow-lg shadow-black/5 hover:shadow-xl transition-all cursor-pointer border border-slate-100 flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${feature.color}`}><feature.icon size={24} /></div>
                <div>
                  <h3 className="font-bold text-brand-blue mb-1 uppercase tracking-tight">{feature.title}</h3>
                  <p className="text-slate-500 text-xs">{feature.desc}</p>
                </div>
                <ChevronRight className="ml-auto text-slate-300" size={18} />
              </motion.div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-brand-accent" size={24} />
                  <h2 className="text-2xl font-serif font-bold text-brand-blue">Đề thi mới cập nhật</h2>
                </div>
                <button onClick={() => setCurrentView('khode')} className="px-5 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-500 hover:bg-white hover:border-brand-accent hover:text-brand-blue transition-all">View More</button>
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Tên Đề Thi</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Mức độ</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Cập nhật</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {isLoading ? (
                        <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                      ) : latestExams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-brand-beige/20 transition-colors cursor-pointer group" onClick={() => { setSelectedExam(exam); setCurrentView('khode'); }}>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0"><FileText size={20} /></div>
                              <div>
                                <h4 className="font-bold text-brand-blue group-hover:text-brand-sepia transition-colors">{exam.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full"><MapPin size={10} /> {exam.province}</span>
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full uppercase">{exam.year}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${
                              exam.difficulty === 'Giỏi' ? 'bg-amber-100 text-amber-700' : 
                              exam.difficulty === 'Khá' ? 'bg-blue-100 text-blue-700' : 
                              'bg-green-100 text-green-700'
                            }`}>{exam.difficulty.toUpperCase()}</span>
                          </td>
                          <td className="px-8 py-5 text-right text-slate-500 font-mono text-xs">{exam.updatedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-brand-blue p-8 rounded-[2rem] text-white shadow-xl shadow-brand-blue/20">
                <div className="flex items-center gap-3 mb-6">
                  <Target size={24} className="text-brand-accent" />
                  <h3 className="text-lg font-serif font-bold uppercase tracking-wide">Kỹ năng cần rèn</h3>
                </div>
                <div className="space-y-4">
                  {['So sánh các sự kiện lịch sử', 'Phân tích nguyên nhân & kết quả', 'Tổng hợp kiến thức theo giai đoạn', 'Kỹ năng trình bày bài tự luận'].map((skill, i) => (
                    <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-default">
                      <span className="text-brand-accent font-bold">0{i+1}</span>
                      <p className="text-sm font-medium">{skill}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle size={24} className="text-red-500" />
                  <h3 className="text-lg font-serif font-bold text-brand-blue uppercase tracking-wide">Lưu ý lỗi thường gặp</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100/50">
                    <p className="text-xs font-bold text-red-600 mb-1">KIẾN THỨC</p>
                    <p className="text-sm text-red-800">Nhầm lẫn mốc thời gian giữa các Hiệp định Paris (1973) và Geneve (1954).</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100/50">
                    <p className="text-xs font-bold text-red-600 mb-1">KỸ NĂNG</p>
                    <p className="text-sm text-red-800">Chưa biết cách dùng từ nối (liên từ) để làm nổi bật tính logic của bài làm.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-auto p-12 text-center text-slate-400 text-sm font-medium border-t border-slate-100">
          <p>© 2024 Kho Đề Số HSG Lịch Sử - Hệ thống quản lý học liệu số chuyên sâu.</p>
        </footer>
      </main>
    </div>
  );
}
