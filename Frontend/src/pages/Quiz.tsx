import { useEffect, useState } from 'react';
import api from '../api/axios';
import { BrainCircuit, CheckCircle2, XCircle, ChevronRight, RefreshCw, Loader2, History, AlertCircle } from 'lucide-react';

type Question = { question: string; options: string[]; answer: string };
type QuizAttempt = { id: string; topic: string; score: number; total_questions: number; created_at?: string };

const QUIZ_STORAGE_KEY = 'vidyamitra_quiz_state_v1';

export default function Quiz() {
  const [jobRole, setJobRole] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const res = await api.get('/quiz/history');
      setHistory(Array.isArray(res.data?.history) ? res.data.history : []);
    } catch (e) {
      console.error('Failed to load quiz history', e);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setJobRole(parsed.jobRole || '');
        setQuestions(Array.isArray(parsed.questions) ? parsed.questions : []);
        setCurrentIndex(typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0);
        setScore(typeof parsed.score === 'number' ? parsed.score : 0);
        setShowResult(!!parsed.showResult);
        setSelectedAnswer(parsed.selectedAnswer ?? null);
      } catch {
        // ignore
      }
    }
    void loadHistory();
  }, []);

  useEffect(() => {
    if (questions.length > 0 && currentIndex >= questions.length) {
      setCurrentIndex(0);
    }
  }, [questions, currentIndex]);

  useEffect(() => {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ jobRole, questions, currentIndex, score, showResult, selectedAnswer }));
  }, [jobRole, questions, currentIndex, score, showResult, selectedAnswer]);

  const startQuiz = async () => {
    if (!jobRole.trim()) return;
    setLoading(true);
    setError(null);
    setShowResult(false);
    setScore(0);
    setCurrentIndex(0);
    setSelectedAnswer(null);

    try {
      const res = await api.get(`/quiz/generate?role=${encodeURIComponent(jobRole)}`);
      setQuestions(Array.isArray(res.data?.questions) ? res.data.questions : []);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || 'Could not generate quiz right now.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (option: string) => {
    if (!currentQuestion || selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === currentQuestion.answer) setScore((prev) => prev + 1);
  };

  const nextQuestion = async () => {
    if (!currentQuestion) {
      setQuestions([]);
      setCurrentIndex(0);
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;
    const finalScore = isCorrect ? score + 1 : score;
    const nextIndex = currentIndex + 1;

    setSelectedAnswer(null);
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      return;
    }

    setScore(finalScore);
    setShowResult(true);

    try {
      const submitRes = await api.post('/quiz/submit', {
        topic: jobRole,
        score: finalScore,
        total_questions: questions.length,
      });

      if (submitRes.data?.attempt) setHistory((prev) => [submitRes.data.attempt, ...prev].slice(0, 30));
      else await loadHistory();

      window.dispatchEvent(new Event('progress-updated'));
    } catch (err) {
      console.error('Failed to sync quiz results', err);
    }
  };

  const scorePct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="page-wrap max-w-5xl">
      <header className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <BrainCircuit className="h-7 w-7 text-sky-300" /> AI Knowledge Check
          </h1>
          <p className="page-subtitle">Test your technical depth for your target role with adaptive questions.</p>
        </div>
      </header>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {history.length > 0 && (
        <section className="surface-card mb-6 p-4 sm:p-5">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5 text-sky-300" /> Quiz History
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {history.slice(0, 6).map((item) => (
              <div key={item.id} className="surface-card-soft flex items-center justify-between p-3 text-sm">
                <span className="text-slate-200">{item.topic}</span>
                <span className="font-semibold text-emerald-300">{item.score}/{item.total_questions}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {questions.length === 0 && !loading && (
        <section className="surface-card p-6 text-center sm:p-8">
          <div className="mx-auto max-w-xl space-y-4">
            <input
              type="text"
              placeholder="Enter Job Role (e.g. Java Developer)"
              className="field"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
            <button onClick={startQuiz} disabled={!jobRole.trim()} className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-60">
              Generate Quiz
            </button>
          </div>
        </section>
      )}

      {loading && (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-sky-400" />
          <p className="mt-3 text-slate-400">AI is crafting your exam...</p>
        </div>
      )}

      {questions.length > 0 && !showResult && !loading && currentQuestion && (
        <section className="surface-card p-5 sm:p-8">
          <div className="mb-4 flex justify-between text-xs font-semibold text-slate-400 sm:text-sm">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>Score: {score}</span>
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>

          <h2 className="mb-6 text-lg font-semibold sm:text-xl">{currentQuestion.question}</h2>

          <div className="grid gap-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                disabled={!!selectedAnswer}
                onClick={() => handleAnswer(option)}
                className={`rounded-xl border p-4 text-left text-sm transition sm:text-base ${
                  selectedAnswer === option
                    ? option === currentQuestion.answer
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                      : 'border-rose-500 bg-rose-500/20 text-rose-200'
                    : selectedAnswer && option === currentQuestion.answer
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                      : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-sky-400/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{option}</span>
                  {selectedAnswer === option && option === currentQuestion.answer && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                  {selectedAnswer === option && option !== currentQuestion.answer && <XCircle className="h-5 w-5 shrink-0" />}
                </div>
              </button>
            ))}
          </div>

          {selectedAnswer && (
            <button onClick={nextQuestion} className="btn-primary mt-6 w-full py-3">
              {currentIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'} <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </section>
      )}

      {questions.length > 0 && !loading && !currentQuestion && (
        <div className="surface-card p-6 text-center text-slate-300">
          Saved quiz state was outdated. Start a fresh quiz.
          <button onClick={() => { setQuestions([]); setCurrentIndex(0); setShowResult(false); }} className="btn-secondary mx-auto mt-4">
            Reset Quiz
          </button>
        </div>
      )}

      {showResult && (
        <section className="surface-card p-7 text-center sm:p-10">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-sky-500/10 p-4">
            <BrainCircuit className="h-12 w-12 text-sky-300" />
          </div>
          <h2 className="text-3xl font-black">Quiz Complete!</h2>
          <p className="mt-2 text-slate-300">
            You scored <span className="font-black text-sky-300">{score}</span> out of {questions.length} ({scorePct}%)
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button onClick={startQuiz} className="btn-primary w-full py-3">
              <RefreshCw className="h-4 w-4" /> Retake Quiz
            </button>
            <button onClick={() => { setQuestions([]); setShowResult(false); }} className="btn-secondary w-full py-3">
              Try New Topic
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

