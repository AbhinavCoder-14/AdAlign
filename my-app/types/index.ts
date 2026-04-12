export type AdAnalysis = {
  headline: string
  cta: string
  audience: string
  offer: string
  differentiator: string
  urgencySignals: string
  specificClaim: string
  emotionalTrigger: string
  impliedPain: string
  trustSignals: string
  tone: string
}

export type PageAnalysis = {
  headline: string
  subheadline: string
  cta: string
  valueProp: string
  audience: string
  tone: string
  whatTheyDo: string
  keyFeatures: string[]
  painPointsAddressed: string[]
  keyBenefits: string[]
  uniqueValue: string
  trustSignals: string
  targetCustomerProfile: string
  pricingModel: string
  callouts: string[]
}

export type Gap = {
  element: string
  adSays: string
  pageSays: string
  severity: 'high' | 'medium' | 'low'
  reason: string
}

export type ConversionScore = {
  messageMatch: number
  specificity: number
  clarity: number
  trustAlignment: number
  urgency: number
}

export type GapAnalysis = {
  matchScore: number
  summary: string
  gaps: Gap[]
  conversionScore: ConversionScore
}

export type Change = {
  element: string
  original: string
  rewritten: string
  reason: string
}

export type RewriteResult = {
  changes: Change[]
  unchanged: string[]
}

export type AnalyzeResponse = {
  adAnalysis: AdAnalysis
  pageAnalysis: PageAnalysis
  gapAnalysis: GapAnalysis
  rewriteResult: RewriteResult
  originalHtml: string
  modifiedHtml: string
  warning?: string

}