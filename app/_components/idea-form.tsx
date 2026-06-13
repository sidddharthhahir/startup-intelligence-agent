'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Zap, Upload, FileText, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EXAMPLE_IDEAS = [
  'An AI tool that generates personalized workout plans based on gym equipment photos',
  'A marketplace connecting local farmers directly with restaurants for same-day delivery',
  'A browser extension that summarizes and fact-checks news articles in real-time',
];

export function IdeaForm({ onSubmit, prefillIdea = '' }: { onSubmit: (idea: string) => void; prefillIdea?: string }) {
  const [idea, setIdea] = useState(prefillIdea);
  const [extracting, setExtracting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefillIdea) setIdea(prefillIdea);
  }, [prefillIdea]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea?.trim()?.length >= 10) {
      onSubmit(idea.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (idea?.trim()?.length >= 10) {
        onSubmit(idea.trim());
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const validExtensions = ['.pdf', '.docx'];
    const ext = file.name?.toLowerCase?.().slice(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      toast.error('Please upload a PDF or DOCX file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Extraction failed' }));
        throw new Error(errData?.error ?? 'Failed to extract text');
      }

      const data = await res.json();
      if (data?.text) {
        setIdea(data.text);
        setUploadedFileName(data.fileName ?? file.name);
        if (data.truncated) {
          toast.info(`Document truncated to ${(data.originalLength / 1000).toFixed(0)}K \u2192 5K chars for analysis.`);
        } else {
          toast.success(`Text extracted from ${file.name}`);
        }
      } else {
        throw new Error('No text content found in document');
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to extract text from document');
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearUpload = () => {
    setUploadedFileName(null);
    setIdea('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl bg-card border border-border/50 p-1" style={{ boxShadow: 'var(--shadow-md)' }}>
          <textarea
            value={idea}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setIdea(e.target.value);
              if (uploadedFileName) setUploadedFileName(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Describe your startup idea in detail... What problem does it solve? Who is the target audience?"
            className="w-full min-h-[140px] bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none resize-none text-base"
            maxLength={5000}
          />
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/30">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono">
                {idea?.length ?? 0}/5000
              </span>

              {/* File upload indicator */}
              {uploadedFileName && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                  <FileText className="h-3 w-3" />
                  <span className="max-w-[120px] truncate">{uploadedFileName}</span>
                  <button type="button" onClick={clearUpload} className="hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* File upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                title="Upload PDF or DOCX file"
              >
                {extracting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {extracting ? 'Extracting...' : 'Upload'}
              </button>

              <button
                type="submit"
                disabled={(idea?.trim()?.length ?? 0) < 10 || extracting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send className="h-4 w-4" />
                {prefillIdea ? 'Re-Analyze' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="text-center mt-2">
          <span className="text-[10px] text-muted-foreground">
            <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Ctrl</kbd>+<kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> to submit &middot; Supports PDF &amp; DOCX upload
          </span>
        </div>
      </form>

      {!prefillIdea && (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Try an example:
          </p>
          <div className="flex flex-col gap-2">
            {(EXAMPLE_IDEAS ?? []).map((ex: string, i: number) => (
              <button
                key={i}
                onClick={() => { setIdea(ex); setUploadedFileName(null); }}
                className="text-left px-4 py-3 rounded-lg bg-muted/50 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {prefillIdea && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">Edit your idea above and re-submit for a fresh analysis</p>
        </div>
      )}
    </div>
  );
}
