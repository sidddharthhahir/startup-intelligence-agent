export const dynamic = "force-dynamic";

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callLLM } from '@/lib/llm';
import { llmConfig, analysisConfig } from '@/lib/config';

// ─────────────────────────────────────────────
// STEP 1 SCHEMA: Research + Critical Analysis
// ─────────────────────────────────────────────
const STEP1_SCHEMA = {
  name: "startup_research_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      ideaScore: { type: "number" },
      confidence: { type: "string" },
      confidenceReasoning: { type: "string" },
      verdict: { type: "string" },
      verdictReasoning: { type: "string" },
      demandLevel: { type: "string" },
      marketSaturation: { type: "string" },
      researchSummary: {
        type: "object",
        properties: {
          marketSize: { type: "string" },
          tam: { type: "string" },
          sam: { type: "string" },
          som: { type: "string" },
          trends: { type: "array", items: { type: "string" } },
          competitors: { type: "array", items: { type: "string" } },
          competitorWeaknesses: { type: "array", items: { type: "string" } },
          targetAudience: { type: "string" },
          buyerPersona: { type: "string" }
        },
        required: ["marketSize", "tam", "sam", "som", "trends", "competitors", "competitorWeaknesses", "targetAudience", "buyerPersona"],
        additionalProperties: false
      },
      strengths: { type: "array", items: { type: "string" } },
      weaknesses: { type: "array", items: { type: "string" } },
      differentiation: { type: "array", items: { type: "string" } },
      risks: { type: "array", items: { type: "string" } },
      opportunities: { type: "array", items: { type: "string" } },
      reasoningBasis: { type: "array", items: { type: "string" } }
    },
    required: ["ideaScore", "confidence", "confidenceReasoning", "verdict", "verdictReasoning", "demandLevel", "marketSaturation", "researchSummary", "strengths", "weaknesses", "differentiation", "risks", "opportunities", "reasoningBasis"],
    additionalProperties: false
  }
};

// ─────────────────────────────────────────────
// STEP 2 SCHEMA: Execution Plan
// ─────────────────────────────────────────────
const STEP2_SCHEMA = {
  name: "startup_execution_plan",
  strict: true,
  schema: {
    type: "object",
    properties: {
      mvpPlan: {
        type: "object",
        properties: {
          coreFeatures: { type: "array", items: { type: "string" } },
          userFlow: { type: "array", items: { type: "string" } },
          techStack: { type: "array", items: { type: "string" } },
          architecture: { type: "string" },
          buildTimeline: { type: "string" }
        },
        required: ["coreFeatures", "userFlow", "techStack", "architecture", "buildTimeline"],
        additionalProperties: false
      },
      monetization: {
        type: "object",
        properties: {
          model: { type: "string" },
          revenueStreams: { type: "array", items: { type: "string" } },
          pricingTiers: { type: "array", items: { type: "string" } },
          unitEconomics: { type: "string" }
        },
        required: ["model", "revenueStreams", "pricingTiers", "unitEconomics"],
        additionalProperties: false
      },
      goToMarket: {
        type: "object",
        properties: {
          channels: { type: "array", items: { type: "string" } },
          strategy: { type: "string" },
          timeline: { type: "string" },
          firstHundredUsers: { type: "string" }
        },
        required: ["channels", "strategy", "timeline", "firstHundredUsers"],
        additionalProperties: false
      },
      landingPageContent: {
        type: "object",
        properties: {
          headline: { type: "string" },
          subheadline: { type: "string" },
          valueProps: { type: "array", items: { type: "string" } },
          cta: { type: "string" },
          socialProof: { type: "string" }
        },
        required: ["headline", "subheadline", "valueProps", "cta", "socialProof"],
        additionalProperties: false
      },
      pitchSummary: {
        type: "object",
        properties: {
          problem: { type: "string" },
          solution: { type: "string" },
          market: { type: "string" },
          product: { type: "string" },
          businessModel: { type: "string" },
          uniqueAdvantage: { type: "string" }
        },
        required: ["problem", "solution", "market", "product", "businessModel", "uniqueAdvantage"],
        additionalProperties: false
      }
    },
    required: ["mvpPlan", "monetization", "goToMarket", "landingPageContent", "pitchSummary"],
    additionalProperties: false
  }
};

// ─────────────────────────────────────────────
// STEP 3 SCHEMA: Sample Landing Page HTML
// ─────────────────────────────────────────────
const STEP3_SCHEMA = {
  name: "sample_landing_page",
  strict: true,
  schema: {
    type: "object",
    properties: {
      html: { type: "string" }
    },
    required: ["html"],
    additionalProperties: false
  }
};

// ═══════════════════════════════════════════════
// SYSTEM PROMPTS
// ═══════════════════════════════════════════════

const STEP1_SYSTEM = `You are an elite startup due-diligence analyst combining Sequoia-level pattern-recognition, 3x-exited founder instinct, and McKinsey analytical rigor.

## ANALYTICAL FRAMEWORK (5 LENSES)

1. **Problem Validity**: Real problem? Active workarounds? Painkiller vs vitamin? Switching motivation?
2. **Market Reality**: TAM/SAM/SOM with REAL data (mark estimates as "estimated"). Market trajectory.
3. **Competitive Landscape**: Name REAL companies with specific weaknesses. Assess saturation. Include indirect competitors.
4. **Execution Feasibility**: Can 2-4 people build MVP in 4-8 weeks? Technical/regulatory barriers? Cold-start problems?
5. **Timing & Moat**: Why NOW? What defensibility exists (network effects, data moat, switching costs)?

## SCORING RUBRIC
1-2: Fundamentally flawed. 3: Weak — severe structural issues. 4-5: Mediocre — significant gaps. 6: Decent — needs pivots. 7: Strong — clear opportunity. 8: Very strong — seed-fundable. 9-10: Exceptional — rare.
Most ideas score 4-6. Score 7+ only with compelling evidence across all lenses.

## VERDICT: "Build" (7+) | "Pivot" (4-6) | "Drop" (1-3)
## CONFIDENCE: "High" (public data, known market) | "Medium" (emerging, limited data) | "Low" (novel, speculative)

## REASONING TRANSPARENCY (CRITICAL)
- For every market claim, state WHERE the number came from. If it's your own estimate, say "AI-estimated based on [reasoning]".
- Name 3-5 REAL competitors with funding/revenue/users where known.
- Each competitor weakness must be specific and verifiable.
- Trends must reference real reports or observable data.
- If unsure, say "estimated" — NEVER present guesses as facts.
- NEVER invent company names, statistics, or research reports.
- Populate reasoningBasis with 5-8 entries: reasoning explanations and assumptions behind your key conclusions.

## CALIBRATION CHECK
Before finalizing your score, verify:
1. Does the score match the verdict? (Build ≥ 7, Pivot 4-6, Drop ≤ 3)
2. Are weaknesses reflected in the score? (3+ serious weaknesses → score ≤ 5)
3. Is the confidence level honest? (novel market + no data → "Low", not "Medium")
4. Would you invest your own money at this score? If not, lower it.

## OUTPUT RULES
- verdictReasoning: 2-3 direct sentences. Each bullet: ONE specific, actionable sentence. No filler.
- buyerPersona: One sentence (role, pain, context). Arrays: 3-5 items max. Be skeptical by default.`;

const STEP2_SYSTEM = `You are an elite startup execution strategist who has helped 100+ startups go from idea to first revenue.

## EXECUTION FRAMEWORK
You receive a startup idea AND its validated research. Create a battle-ready execution plan for a 2-4 person team.

### MVP Design: Single core feature that proves the thesis. 3-6 features max. Speed > perfection. Map critical user flow in 4-7 steps. Provide week-by-week buildTimeline.
### Tech Stack: Pick SPECIFIC technologies ("Next.js + Supabase + Vercel" not "frontend + backend"). Optimize for dev speed.
### Monetization: Specific model name, 2-3 revenue streams, SPECIFIC prices with tier names, unit economics in one sentence.
### Go-To-Market: 3-5 SPECIFIC channels with tactics, distribution thesis in 2-3 sentences, phase-based timeline, CONCRETE first-100-users plan.
### Landing Page Copy (PAS Framework): headline (max 8 words, lead with outcome), subheadline (specificity), 3-4 value props (action verbs, benefits not features), specific low-friction CTA, realistic social proof.
### Pitch Summary (YC Format): Each field = 1-2 razor-sharp sentences.

## RULES
- Pivot verdict? Plan the IMPROVED direction. Drop verdict? Minimal reference plan.
- NO generic advice. Every recommendation specific to THIS idea. NO motivational fluff.`;

const STEP3_SYSTEM = `Generate a complete, self-contained HTML landing page that looks like a $10K agency built it.

DESIGN: Modern, clean, premium (Stripe/Linear/Vercel quality). ALL CSS inline or in <style> tag. NO external dependencies. Sophisticated color palette fitting the domain. System fonts. Responsive.

SECTIONS: 1) HERO with headline, subheadline, CTA, gradient 2) SOCIAL PROOF bar 3) VALUE PROPS as 3-4 cards with emoji icons 4) HOW IT WORKS (3 numbered steps) 5) CTA repeat section 6) Minimal footer

RULES: Output ONLY valid HTML (<!DOCTYPE html> to </html>). ALL styling self-contained. Placeholder # for hrefs. Immediately usable as index.html.`;

// ─────────────────────────────────────────────
// DUPLICATE DETECTION
// ─────────────────────────────────────────────
async function findRecentDuplicate(idea: string): Promise<any | null> {
  const hours = analysisConfig.dedupeHours;
  if (hours <= 0) return null;

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  try {
    const existing = await prisma.analysis.findFirst({
      where: {
        idea: { equals: idea },
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: 'desc' },
    });
    return existing;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idea = body?.idea;

    if (!idea || typeof idea !== 'string' || idea.trim().length < 10) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Please provide a startup idea with at least 10 characters.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!llmConfig.apiKey) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'LLM API key not configured. Set LLM_API_KEY in your .env file.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const trimmedIdea = idea.trim().slice(0, analysisConfig.maxInputLength);

    // Check for duplicate analysis (cost optimization)
    const duplicate = await findRecentDuplicate(trimmedIdea);
    if (duplicate) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const send = (data: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          send({ status: 'processing', step: 1, totalSteps: 3, message: 'Found recent analysis for this idea...' });
          send({ status: 'step_complete', step: 1 });
          send({ status: 'step_complete', step: 2 });
          send({ status: 'step_complete', step: 3 });
          send({ status: 'completed', result: JSON.parse(duplicate.result as string), analysisId: duplicate.id, cached: true });
          controller.close();
        }
      });
      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // ═══════════════════════════════════════
          // STEP 1: Market Research + Critical Analysis
          // ═══════════════════════════════════════
          send({ status: 'processing', step: 1, totalSteps: 3, message: 'Deep market research & critical analysis...' });

          const step1Result = await callLLM({
            messages: [
              { role: 'system', content: STEP1_SYSTEM },
              { role: 'user', content: `Perform full due-diligence analysis on this startup idea:\n\n"${trimmedIdea}"\n\nApply all 5 analytical lenses. Ground every claim in evidence. Be brutally honest.` }
            ],
            schema: STEP1_SCHEMA,
            maxTokens: analysisConfig.step1MaxTokens,
          });

          send({ status: 'step_complete', step: 1, message: 'Research complete. Building execution plan...' });

          // ═══════════════════════════════════════
          // STEP 2: Execution Plan
          // ═══════════════════════════════════════
          send({ status: 'processing', step: 2, totalSteps: 3, message: 'Generating MVP, monetization & go-to-market...' });

          const analysisContext = [
            `Score: ${step1Result.ideaScore}/10 | Verdict: ${step1Result.verdict}`,
            `Verdict Reasoning: ${step1Result.verdictReasoning}`,
            `Demand: ${step1Result.demandLevel} | Saturation: ${step1Result.marketSaturation}`,
            `Market: ${step1Result.researchSummary?.marketSize} (TAM: ${step1Result.researchSummary?.tam}, SAM: ${step1Result.researchSummary?.sam}, SOM: ${step1Result.researchSummary?.som})`,
            `Target: ${step1Result.researchSummary?.targetAudience}`,
            `Buyer Persona: ${step1Result.researchSummary?.buyerPersona}`,
            `Competitors: ${(step1Result.researchSummary?.competitors ?? []).join(', ')}`,
            `Strengths: ${(step1Result.strengths ?? []).join('; ')}`,
            `Weaknesses: ${(step1Result.weaknesses ?? []).join('; ')}`,
          ].join('\n');

          const step2Result = await callLLM({
            messages: [
              { role: 'system', content: STEP2_SYSTEM },
              { role: 'user', content: `Startup Idea: "${trimmedIdea}"\n\n=== VALIDATED RESEARCH ===\n${analysisContext}\n\nCreate a battle-ready execution plan. Be specific to THIS idea.` }
            ],
            schema: STEP2_SCHEMA,
            maxTokens: analysisConfig.step2MaxTokens,
          });

          send({ status: 'step_complete', step: 2, message: 'Execution plan ready.' });

          // Merge step 1 + step 2
          const mergedResult: any = { ...step1Result, ...step2Result };

          // ═══════════════════════════════════════
          // STEP 3: Sample Landing Page (configurable)
          // ═══════════════════════════════════════
          const shouldGenerateSample = !analysisConfig.skipSamplePage &&
            ['build', 'pivot'].includes((step1Result.verdict ?? '').toLowerCase());

          if (shouldGenerateSample) {
            send({ status: 'processing', step: 3, totalSteps: 3, message: 'Generating your sample landing page...' });

            try {
              const lp = step2Result.landingPageContent ?? {};
              const step3Result = await callLLM({
                messages: [
                  { role: 'system', content: STEP3_SYSTEM },
                  { role: 'user', content: `Generate a landing page for:\n\nIdea: "${trimmedIdea}"\nHeadline: ${lp.headline ?? 'N/A'}\nSubheadline: ${lp.subheadline ?? 'N/A'}\nValue Props: ${(lp.valueProps ?? []).join(' | ')}\nCTA: ${lp.cta ?? 'Get Started'}\nSocial Proof: ${lp.socialProof ?? ''}\nAudience: ${step1Result.researchSummary?.targetAudience ?? 'N/A'}` }
                ],
                schema: STEP3_SCHEMA,
                maxTokens: analysisConfig.step3MaxTokens,
                temperature: analysisConfig.step3Temperature,
              });

              if (step3Result?.html) {
                mergedResult.samplePageHtml = step3Result.html;
              }
            } catch (err: any) {
              console.error('Step 3 (sample page) error:', err?.message);
            }

            send({ status: 'step_complete', step: 3, message: 'Sample page generated!' });
          } else {
            send({ status: 'step_complete', step: 3, message: analysisConfig.skipSamplePage ? 'Sample page generation disabled.' : 'Skipped sample page (verdict: Drop).' });
          }

          // ═══════════════════════════════════════
          // SAVE & RETURN
          // ═══════════════════════════════════════
          let savedId: string | null = null;
          try {
            const saved = await prisma.analysis.create({
              data: {
                idea: trimmedIdea,
                score: mergedResult?.ideaScore ?? 0,
                confidence: mergedResult?.confidence ?? 'Unknown',
                verdict: mergedResult?.verdict ?? 'Unknown',
                result: JSON.stringify(mergedResult)
              }
            });
            savedId = saved.id;
          } catch (dbErr: any) {
            console.error('DB save error:', dbErr);
          }

          send({ status: 'completed', result: mergedResult, analysisId: savedId });
        } catch (err: any) {
          console.error('Analysis error:', err);
          send({ status: 'error', message: err?.message ?? 'Analysis failed. Please try again.' });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (err: any) {
    console.error('Analyze API error:', err);
    return new Response(
      JSON.stringify({ status: 'error', message: `Server error: ${err?.message ?? 'Unknown'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
