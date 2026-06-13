export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { llmConfig, extractConfig, analysisConfig } from '@/lib/config';
import mammoth from 'mammoth';

/**
 * POST /api/extract-text
 * Accepts a file upload (PDF or DOCX) and extracts text content.
 * - PDF: base64-encodes and sends to LLM API with vision capabilities
 * - DOCX: parses using mammoth for raw text extraction
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > extractConfig.maxFileSize) {
      return Response.json(
        { error: `File too large. Maximum size is ${Math.round(extractConfig.maxFileSize / (1024 * 1024))}MB.` },
        { status: 400 }
      );
    }

    const fileName = file.name?.toLowerCase?.() ?? '';
    const ext = fileName.slice(fileName.lastIndexOf('.'));
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (ext === '.pdf' || file.type === 'application/pdf') {
      // PDF: Use LLM vision API to extract text
      if (!llmConfig.apiKey) {
        return Response.json({ error: 'LLM API key not configured' }, { status: 500 });
      }

      const base64 = buffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64}`;

      const apiUrl = `${llmConfig.apiUrl.replace(/\/$/, '')}/chat/completions`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmConfig.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Startup Intelligence Agent',
        },
        body: JSON.stringify({
          model: llmConfig.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: dataUrl },
                },
                {
                  type: 'text',
                  text: 'Extract ALL text content from this document. Return ONLY the raw text, preserving paragraphs. No commentary, no markdown formatting, no summaries — just the exact text from the document.',
                },
              ],
            },
          ],
          max_tokens: extractConfig.extractMaxTokens,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        console.error('LLM extraction error:', response.status, errText);
        return Response.json({ error: 'Failed to extract text from PDF' }, { status: 500 });
      }

      const data = await response.json();
      text = data?.choices?.[0]?.message?.content ?? '';
    } else if (
      ext === '.docx' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // DOCX: Use mammoth for text extraction
      const result = await mammoth.extractRawText({ buffer });
      text = result?.value ?? '';
    } else {
      return Response.json({ error: 'Unsupported file type. Please upload a PDF or DOCX file.' }, { status: 400 });
    }

    if (!text?.trim()) {
      return Response.json({ error: 'No text content found in document' }, { status: 400 });
    }

    // Truncate to max input length
    const maxLen = analysisConfig.maxInputLength;
    const originalLength = text.length;
    const truncated = originalLength > maxLen;
    const finalText = truncated ? text.slice(0, maxLen) : text;

    return Response.json({
      text: finalText,
      fileName: file.name,
      truncated,
      originalLength,
    });
  } catch (err: any) {
    console.error('Extract-text error:', err);
    return Response.json(
      { error: err?.message ?? 'Failed to extract text from document' },
      { status: 500 }
    );
  }
}
