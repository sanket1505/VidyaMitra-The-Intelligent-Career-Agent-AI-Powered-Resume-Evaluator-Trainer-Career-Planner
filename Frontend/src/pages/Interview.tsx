import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { Mic, Square, Loader2, Volume2, Sparkles, History, AlertCircle } from 'lucide-react';

type InterviewState = 'selection' | 'in-progress' | 'completed';
type Message = { role: 'user' | 'assistant'; content: string };

type InterviewHistory = {
  id: string;
  role_applied_for: string;
  readiness_score: number;
  created_at?: string;
};

type SpeechWindow = Window & {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
};

const INTERVIEW_STORAGE_KEY = 'vidyamitra_interview_state_v1';

export default function Interview() {
  const [currentState, setCurrentState] = useState<InterviewState>('selection');
  const [jobRole, setJobRole] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState<InterviewHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const loadHistory = async () => {
    try {
      const res = await api.get('/interview/history');
      setHistory(Array.isArray(res.data?.history) ? res.data.history : []);
    } catch (e) {
      console.error('Failed to load interview history', e);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem(INTERVIEW_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCurrentState(parsed.currentState || 'selection');
        setJobRole(parsed.jobRole || '');
        setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
      } catch {
        // ignore
      }
    }

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (Recognition) {
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }

    void loadHistory();

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(INTERVIEW_STORAGE_KEY, JSON.stringify({ currentState, jobRole, messages }));
  }, [currentState, jobRole, messages]);

  useEffect(() => {
    if (currentState === 'in-progress' && (!jobRole.trim() || messages.length === 0)) {
      setCurrentState('selection');
    }
  }, [currentState, jobRole, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  const speakAIResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startInterview = async () => {
    if (!jobRole.trim()) return;
    setError(null);
    setCurrentState('in-progress');
    const firstQuestion = `Hello! Let's start the interview for the ${jobRole} position. Can you tell me about yourself and your background?`;
    setMessages([{ role: 'assistant', content: firstQuestion }]);
    speakAIResponse(firstQuestion);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      window.speechSynthesis.cancel();
      if (transcript.trim()) void sendVoiceMessage(transcript.trim());
      setTranscript('');
      return;
    }

    setTranscript('');
    recognitionRef.current.start();
    setIsListening(true);
    window.speechSynthesis.cancel();
  };

  const sendVoiceMessage = async (spokenText: string) => {
    const lastAssistantMessage = messages.slice().reverse().find((message) => message.role === 'assistant');
    const lastQuestion = lastAssistantMessage ? lastAssistantMessage.content : 'Tell me about yourself.';
    const newMessages = [...messages, { role: 'user', content: spokenText } as Message];
    setMessages(newMessages);
    setIsProcessing(true);

    try {
      const response = await api.post('/interview/evaluate', {
        role: jobRole,
        question: lastQuestion,
        answer: spokenText,
      });

      const data = response.data;
      const aiReply = `${data.feedback} ${data.next_question}`;
      setMessages([...newMessages, { role: 'assistant', content: aiReply }]);
      speakAIResponse(aiReply);
      setError(null);
    } catch (e: any) {
      console.error('Failed to send message', e);
      setError(e?.response?.data?.detail || 'Could not evaluate this answer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const finishInterview = async () => {
    setCurrentState('completed');
    window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();

    try {
      const estimatedScore = Math.min(95, Math.max(50, messages.length * 8));
      await api.post('/interview/submit', {
        role_applied_for: jobRole,
        readiness_score: estimatedScore,
        feedback: { summary: 'Voice Interview Session', messages_exchanged: messages.length },
      });
      await loadHistory();
      window.dispatchEvent(new Event('progress-updated'));
    } catch (e) {
      console.error('Failed to sync interview results', e);
    }
  };

  return (
    <div className="page-wrap max-w-5xl">
      {currentState === 'selection' && (
        <>
          <header className="page-header">
            <div>
              <h1 className="page-title">AI Voice Interview</h1>
              <p className="page-subtitle">Practice speaking answers with live AI follow-up questions.</p>
            </div>
          </header>

          {history.length > 0 && (
            <section className="surface-card mb-6 p-4 sm:p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <History className="h-5 w-5 text-sky-300" /> Interview History
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {history.slice(0, 6).map((item) => (
                  <div key={item.id} className="surface-card-soft flex items-center justify-between p-3 text-sm">
                    <span className="text-slate-200">{item.role_applied_for}</span>
                    <span className="font-semibold text-emerald-300">Score {item.readiness_score}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3 text-sm text-rose-100">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          <section className="surface-card p-6 sm:p-8">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-sky-500/12 p-4">
                <Mic className="h-10 w-10 text-sky-300" />
              </div>
            </div>
            <p className="mx-auto mb-6 max-w-2xl text-center text-slate-300">Put on your headphones. The AI will speak to you, and you answer using your microphone.</p>
            <label className="block text-sm">
              <span className="mb-2 block text-slate-300">Target Job Role</span>
              <input
                type="text"
                placeholder="e.g. Full Stack Python Developer"
                className="field"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
              />
            </label>
            <button onClick={startInterview} disabled={!jobRole.trim()} className="btn-primary mt-5 w-full py-3 text-base disabled:cursor-not-allowed disabled:opacity-55">
              Start Voice Interview
            </button>
          </section>
        </>
      )}

      {currentState === 'in-progress' && (
        <section className="surface-card flex h-[78vh] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70 bg-slate-950/45 px-4 py-4 sm:px-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100 sm:text-lg">
              <Volume2 className="h-5 w-5 text-sky-300" /> Interviewing for: <span className="text-sky-300">{jobRole}</span>
            </h2>
            <button onClick={finishInterview} className="btn-secondary border-rose-500/40 bg-rose-500/10 text-rose-200 hover:border-rose-400/60 hover:text-rose-100">
              End Interview
            </button>
          </div>

          <div className="soft-scrollbar flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[88%] rounded-2xl p-4 text-sm sm:text-[15px] ${msg.role === 'assistant' ? 'rounded-tl-sm border border-slate-700 bg-slate-800/70 text-slate-100' : 'rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white'}`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {transcript && (
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-sky-500/35 bg-sky-500/10 p-4 text-sm italic text-sky-100">
                  <p>{transcript}</p>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-700 bg-slate-800/70 p-4 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 p-3 text-xs text-rose-100 sm:text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-800/70 bg-slate-950/45 p-5 text-center">
            <p className="mb-4 text-xs font-medium text-slate-400 sm:text-sm">{isListening ? 'Listening... tap square when done speaking.' : 'Tap the microphone and answer confidently.'}</p>
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full text-white transition-all sm:h-[72px] sm:w-[72px] ${
                isListening
                  ? 'scale-105 animate-pulse bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_12px_24px_rgba(244,63,94,0.35)]'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_12px_24px_rgba(37,99,235,0.3)] hover:brightness-110'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isListening ? <Square className="h-8 w-8 fill-current" /> : <Mic className="h-8 w-8" />}
            </button>
          </div>
        </section>
      )}

      {currentState === 'completed' && (
        <section className="surface-card mt-8 space-y-5 p-8 text-center sm:p-10">
          <div className="mx-auto inline-flex rounded-full bg-emerald-500/12 p-4">
            <Sparkles className="h-9 w-9 text-emerald-300" />
          </div>
          <h2 className="text-3xl font-black sm:text-4xl">Interview Completed</h2>
          <p className="mx-auto max-w-xl text-slate-300">Great session. Practicing out loud is the fastest way to build confidence.</p>
          <button onClick={() => setCurrentState('selection')} className="btn-primary px-8 py-3">
            Start Another Session
          </button>
        </section>
      )}
    </div>
  );
}

