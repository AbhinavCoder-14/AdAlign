export type AdAnalysis = {
  headline: string
  cta: string
  tone: string
  audience: string
  offer: string
  differentiator: string
}

export type PageAnalysis = {
  headline: string
  subheadline: string
  cta: string
  valueProp: string
  audience: string
  tone: string
}

export type Gap = {
  element: string
  adSays: string
  pageSays: string
  severity: 'high' | 'medium' | 'low'
  reason: string
}

export type GapAnalysis = {
  matchScore: number
  summary: string
  gaps: Gap[]
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