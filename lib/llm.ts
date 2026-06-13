/**
 * Provider-agnostic LLM client using the OpenAI-compatible chat/completions API.
 * Works with: OpenAI, Abacus AI, Groq, Together AI, Fireworks, Mistral,
 *             Ollama, LM Studio, vLLM, or any OpenAI-compatible endpoint.
 */

import { llmConfig } from './config';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: any }>;
}

export interface LLMCallOptions {
  messages: LLMMessage[];
  maxTokens: number;
  temperature?: number;
  schema?: any; // JSON schema for structured output
  retries?: number;
}

/**
 * Attempt to salvage malformed JSON from LLM responses.
 * Handles common issues: trailing commas, truncated output, markdown fences.
 */
export function salvageJSON(raw: string): any {
  // Strip markdown code fences
  let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  // Try parsing directly
  try { return JSON.parse(cleaned); } catch {}
  // If truncated, try closing open braces/brackets
  let attempt = cleaned;
  const opens = (attempt.match(/[{[]/g) ?? []).length;
  const closes = (attempt.match(/[}\]]/g) ?? []).length;
  const diff = opens - closes;
  if (diff > 0) {
    // Simple heuristic: close with } (most LLM outputs are objects)
    attempt += '}'.repeat(diff);
    // Remove trailing commas again after appending
    attempt = attempt.replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(attempt); } catch {}
  }
  throw new Error('Failed to parse LLM response as JSON even after salvage attempt');
}

/**
 * Call the configured LLM provider with automatic retry and structured output support.
 * Returns the parsed JSON response when a schema is provided, or raw text otherwise.
 */
export async function callLLM(options: LLMCallOptions): Promise<any> {
  const {
    messages,
    maxTokens,
    temperature = llmConfig.temperature,
    schema,
    retries = llmConfig.maxRetries,
  } = options;

  const apiUrl = `${llmConfig.apiUrl.replace(/\/$/, '')}/chat/completions`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 2s, 4s, 8s...
        await new Promise(r => setTimeout(r, 2000 * attempt));
        console.log(`LLM retry attempt ${attempt}/${retries}`);
      }

      const body: any = {
        model: llmConfig.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      };

      // Add structured output if schema is provided
      if (schema) {
        body.response_format = {
          type: 'json_schema',
          json_schema: schema,
        };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmConfig.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Startup Intelligence Agent',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        const err = new Error(`LLM API error: ${response.status} - ${errText}`);
        // Don't retry on client errors (except 429 rate limit)
        if ([400, 401, 403].includes(response.status)) throw err;
        throw err;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in LLM response');

      if (!schema) return content;
      try { return JSON.parse(content); } catch { return salvageJSON(content); }
    } catch (err: any) {
      lastError = err;
      // Don't retry on 4xx client errors (except 429)
      if (err?.message?.includes('400') || err?.message?.includes('401') || err?.message?.includes('403')) {
        throw err;
      }
    }
  }

  throw lastError ?? new Error('LLM call failed after retries');
}
