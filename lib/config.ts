// ─────────────────────────────────────────────
// LLM PROVIDER CONFIGURATION
// ─────────────────────────────────────────────

export const llmConfig = {
  /** Base URL for the chat completions endpoint (WITHOUT /chat/completions) */
  apiUrl: process.env.LLM_API_URL || 'https://openrouter.ai/api/v1',
  /** API key for authentication */
  apiKey: process.env.LLM_API_KEY || process.env.OPENROUTER_API_KEY || '',
  /** Model identifier — see https://openrouter.ai/models */
  model: process.env.LLM_MODEL || 'google/gemini-2.5-flash',
  /** Max retry attempts for transient failures */
  maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '2', 10),
  /** Default temperature for analysis (lower = more deterministic) */
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.4'),
};

// ─────────────────────────────────────────────
// PDF GENERATION CONFIGURATION
// ─────────────────────────────────────────────
// PDF export uses browser print (no external API needed).
// This config is kept for potential future use.
export const pdfConfig = {};

// ─────────────────────────────────────────────
// TEXT EXTRACTION CONFIGURATION
// ─────────────────────────────────────────────

export const extractConfig = {
  /** Max file upload size in bytes (default 10MB) */
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(10 * 1024 * 1024), 10),
  /** Max tokens for PDF text extraction LLM call */
  extractMaxTokens: parseInt(process.env.EXTRACT_MAX_TOKENS || '4000', 10),
};

// ─────────────────────────────────────────────
// ANALYSIS SETTINGS (COST OPTIMIZATION)
// ─────────────────────────────────────────────
// Tune these to control token usage and costs.
export const analysisConfig = {
  /** Maximum input length in characters */
  maxInputLength: parseInt(process.env.MAX_INPUT_LENGTH || '5000', 10),
  /** Skip sample landing page generation (saves ~4000 tokens per analysis) */
  skipSamplePage: process.env.SKIP_SAMPLE_PAGE !== 'false',
  /** Max tokens for Step 1: Research & Analysis */
  step1MaxTokens: parseInt(process.env.STEP1_MAX_TOKENS || '3000', 10),
  /** Max tokens for Step 2: Execution Planning */
  step2MaxTokens: parseInt(process.env.STEP2_MAX_TOKENS || '2500', 10),
  /** Max tokens for Step 3: Sample Landing Page */
  step3MaxTokens: parseInt(process.env.STEP3_MAX_TOKENS || '4000', 10),
  /** Temperature for sample page generation (slightly higher for creativity) */
  step3Temperature: parseFloat(process.env.STEP3_TEMPERATURE || '0.5'),
  /** Enable duplicate detection — skip re-analysis of identical ideas within N hours */
  dedupeHours: parseInt(process.env.DEDUPE_HOURS || '24', 10),
};

