import React, { useState, useEffect } from 'react';
import { Flame, Star, Lock, CheckCircle, ChevronRight, BookOpen, Award, ArrowLeft } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000/api";

export default function App() {
  const [parts, setParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [articles, setArticles] = useState([]);
  const [userProgress, setUserProgress] = useState({ current_streak: 0, total_xp: 0 });
  const [activeArticle, setActiveArticle] = useState(null);
  const [articleDetail, setArticleDetail] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [view, setView] = useState('path'); // 'path', 'lesson', 'profile'

  useEffect(() => {
    fetchUserProgress();
    fetchParts();
  }, []);

  const fetchUserProgress = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/default_user/progress`);
      const data = await res.json();
      setUserProgress(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchParts = async () => {
    try {
      const res = await fetch(`${API_BASE}/parts`);
      const data = await res.json();
      setParts(data);
      if (data.length > 0) {
        setSelectedPart(data[0].part_number);
        fetchArticles(data[0].part_number);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchArticles = async (partNum) => {
    try {
      const res = await fetch(`${API_BASE}/parts/${partNum}/articles?user_id=default_user`);
      const data = await res.json();
      setArticles(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePartChange = (partNum) => {
    setSelectedPart(partNum);
    fetchArticles(partNum);
  };

  const openArticleLesson = async (article) => {
    if (article.status === 'locked') return;
    setActiveArticle(article);
    setQuizResult(null);
    setSelectedOption(null);
    setView('lesson');

    try {
      const detailRes = await fetch(`${API_BASE}/articles/${article.id}`);
      const detailData = await detailRes.json();
      setArticleDetail(detailData);

      const quizRes = await fetch(`${API_BASE}/articles/${article.id}/quiz`);
      const quizData = await quizRes.json();
      setQuizData(quizData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteArticle = async () => {
    if (!activeArticle) return;
    try {
      await fetch(`${API_BASE}/user/default_user/articles/${activeArticle.id}/complete`, { method: "POST" });
      await fetchUserProgress();
      await fetchArticles(selectedPart);
      setView('path');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('path')}>
          <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30 text-emerald-400 font-bold">
            🇳🇵
          </div>
          <div>
            <h1 className="font-bold text-lg text-emerald-400">Constitution Quest</h1>
            <p className="text-xs text-slate-400">Nepal Legal Learning Path</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            <span className="font-bold text-sm">{userProgress.current_streak}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-sm">{userProgress.total_xp} XP</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6">
        {view === 'path' && (
          <div>
            {/* Parts Selector */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
              {parts.map((p) => (
                <button
                  key={p.part_number}
                  onClick={() => handlePartChange(p.part_number)}
                  className={`px-4 py-2.5 rounded-2xl whitespace-nowrap font-semibold text-sm transition border ${
                    selectedPart === p.part_number
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Part {p.part_number}: {p.part_title}
                </button>
              ))}
            </div>

            {/* Learning Path Nodes (Duolingo Style zig-zag / path) */}
            <div className="flex flex-col items-center gap-6 py-6">
              {articles.map((art, idx) => {
                const isUnlocked = art.status !== 'locked';
                const isCompleted = art.status === 'completed';
                
                // Alignment offset for zig-zag effect
                const offsets = ['translate-x-0', 'translate-x-8', '-translate-x-8', 'translate-x-4', '-translate-x-4'];
                const offsetClass = offsets[idx % offsets.length];

                return (
                  <div key={art.id} className={`flex flex-col items-center ${offsetClass} transition-all`}>
                    <button
                      onClick={() => openArticleLesson(art)}
                      disabled={!isUnlocked}
                      className={`relative group w-20 h-20 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-xl ${
                        isCompleted
                          ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30 hover:scale-105'
                          : isUnlocked
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-600/30 hover:scale-105 animate-pulse'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-75'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                      ) : isUnlocked ? (
                        <BookOpen className="w-7 h-7" />
                      ) : (
                        <Lock className="w-6 h-6" />
                      )}

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-10 w-48">
                        <div className="bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl p-2 text-center shadow-lg">
                          <span className="font-bold text-emerald-400">Article {art.article_number}</span>
                          <p className="truncate">{art.title}</p>
                        </div>
                      </div>
                    </button>
                    <span className="mt-2 text-xs font-semibold text-slate-400 text-center max-w-[120px] truncate">
                      Art {art.article_number}: {art.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'lesson' && articleDetail && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setView('path')}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Path
            </button>

            <div className="mb-6">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Article {articleDetail.article_number}
              </span>
              <h2 className="text-2xl font-bold mt-2">{articleDetail.title}</h2>
              <p className="text-xs text-slate-400 mt-1">{articleDetail.part_title}</p>
            </div>

            {/* Clauses */}
            <div className="space-y-4 mb-8">
              {articleDetail.clauses.map((cl, i) => (
                <div key={i} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-400">({cl.clause_number})</span>
                    <p className="text-slate-300 leading-relaxed text-sm">{cl.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quiz Section */}
            {quizData.length > 0 && (
              <div className="border-t border-slate-800 pt-6 mb-8">
                <h3 className="font-bold text-base text-yellow-400 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5" /> Knowledge Check
                </h3>
                <p className="text-slate-200 font-medium mb-4">{quizData[0].question_text}</p>
                <div className="grid gap-3">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3 rounded-xl text-left text-sm font-semibold transition border ${
                        selectedOption === opt
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold mr-2">{opt}.</span> {quizData[0][`option_${opt.toLowerCase()}`]}
                    </button>
                  ))}
                </div>

                {selectedOption && !quizResult && (
                  <button
                    onClick={() => {
                      if (selectedOption === quizData[0].correct_option) {
                        setQuizResult('correct');
                      } else {
                        setQuizResult('incorrect');
                      }
                    }}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl transition"
                  >
                    Submit Answer
                  </button>
                )}

                {quizResult === 'correct' && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-center">
                    Correct! 🎉 {quizData[0].explanation}
                  </div>
                )}

                {quizResult === 'incorrect' && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-center">
                    Incorrect. Try reviewing the clauses above!
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCompleteArticle}
              disabled={quizData.length > 0 && quizResult !== 'correct'}
              className={`w-full font-bold py-4 rounded-2xl transition shadow-lg ${
                quizData.length > 0 && quizResult !== 'correct'
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              Complete Lesson (+15 XP)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
