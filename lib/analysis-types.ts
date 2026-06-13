export interface PitchSummary {
  problem: string;
  solution: string;
  market: string;
  product: string;
  businessModel: string;
  uniqueAdvantage: string;
}

export interface AnalysisResult {
  ideaScore: number;
  confidence: string;
  confidenceReasoning: string;
  verdict: string;
  verdictReasoning: string;
  demandLevel: string;
  marketSaturation: string;
  researchSummary: {
    marketSize: string;
    tam: string;
    sam: string;
    som: string;
    trends: string[];
    competitors: string[];
    competitorWeaknesses: string[];
    targetAudience: string;
    buyerPersona: string;
  };
  strengths: string[];
  weaknesses: string[];
  differentiation: string[];
  risks: string[];
  opportunities: string[];
  mvpPlan: {
    coreFeatures: string[];
    userFlow: string[];
    techStack: string[];
    architecture: string;
    buildTimeline: string;
  };
  monetization: {
    model: string;
    revenueStreams: string[];
    pricingTiers: string[];
    unitEconomics: string;
  };
  goToMarket: {
    channels: string[];
    strategy: string;
    timeline: string;
    firstHundredUsers: string;
  };
  landingPageContent: {
    headline: string;
    subheadline: string;
    valueProps: string[];
    cta: string;
    socialProof: string;
  };
  reasoningBasis: string[];
  pitchSummary: PitchSummary;
  samplePageHtml?: string;
}

export interface AnalysisRecord {
  id: string;
  idea: string;
  score: number;
  confidence: string;
  verdict: string;
  result: AnalysisResult;
  createdAt: string;
}
