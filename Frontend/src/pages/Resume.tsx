import { useState } from 'react';
import api from '../api/axios';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

type ResumeFeedback = {
  strengths?: string[];
  weaknesses?: string[];
};

type ResumeResult = {
  score: number;
  feedback?: ResumeFeedback;
};

export default function Resume() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (nextFile: File | null) => {
    if (!nextFile) return;
    setFile(nextFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/resume/evaluate', formData, {
        headers: {
          'X-Target-Role': targetRole,
        },
      });
      setResult(response.data);
      window.dispatchEvent(new Event('progress-updated'));
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Failed to evaluate resume. Your session may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <h1 className="page-title">AI Resume Evaluation</h1>
          <p className="page-subtitle">Upload your resume for instant ATS scoring and actionable feedback.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="surface-card p-5 sm:p-6">
          <div className="space-y-5">
            <label className="block text-sm">
              <span className="mb-2 block text-slate-300">Target Job Role</span>
              <input
                type="text"
                placeholder="Frontend Developer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="resume-role-input field"
              />
            </label>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Upload Resume (PDF)</label>
              <div
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFileChange(e.dataTransfer.files?.[0] ?? null);
                }}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
                  dragActive ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700 bg-slate-800/45 hover:border-sky-400/60 hover:bg-slate-800/70'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
                <Upload className="mb-3 h-9 w-9 text-slate-500" />
                <p className="text-sm text-slate-200">{file ? file.name : 'Click or drag to upload'}</p>
                <p className="mt-1 text-xs text-slate-500">PDF up to 5MB</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="btn-primary w-full py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze Resume'}
            </button>
          </div>
        </section>

        <section className="surface-card min-h-[420px] p-5 sm:p-6">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="h-10 w-10 animate-spin text-sky-400" />
              <p>Parsing PDF and matching keywords...</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
                  <Sparkles className="h-3.5 w-3.5" /> ATS Match Score
                </p>
                <div className="mt-3 text-6xl font-black text-sky-300">
                  {result.score}
                  <span className="text-2xl text-slate-600">/100</span>
                </div>
              </div>

              {result.feedback && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-emerald-300">Strengths</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-200">
                      {result.feedback.strengths?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-amber-300">Areas to Improve</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-slate-200">
                      {result.feedback.weaknesses?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Synced to dashboard progress.
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <FileText className="mb-4 h-16 w-16 opacity-20" />
              <p>Upload a resume to see your analysis here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

