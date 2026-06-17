import { z } from "zod";

export const SurfaceAnalysisSchema = z.object({
  text: z.object({
    headline: z.string().nullable(),
    subheadline: z.string().nullable(),
    bodyText: z.array(z.string()),
    cta: z.string().nullable(),
    finePrint: z.array(z.string()),
    pricingMentions: z.array(z.string()),
  }),

  virual: z.object({
    dominantColours: z.array(z.string()),
    layoutType: z.enum([
      "minimal",
      "dense",
      "split",
      "hero-focused",
      "product-focused",
      "text-heavy",
    ]),

    imageryType: z.enum([
      "lifestyle",
      "product",
      "abstract",
      "person-aspirational",
      "person-relatable",
      "illustration",
      "none",
    ]),
    hasHumanFace: z.boolean(),

    faceEmotion: z
      .enum(["happy", "confident", "relieved", "stressed", "neutral"])
      .nullable(),

    brandElements: z.object({
      logoPresent: z.boolean(),
      brandName: z.string().nullable(),
      tagline: z.string().nullable(),
    }),

    designTone: z.enum([
      "urgent",
      "premium",
      "playful",
      "minimal",
      "bold",
      "trustworthy",
      "technical",
    ]),
  }),

  adFormat: z.object({
    type: z.enum([
      "static-image",
      "carousel-frame",
      "video-thumbnail",
      "story-format",
      "banner",
    ]),
    aspectRatio: z.enum(["square", "portrait", "landscape", "story"]),

    platformHint: z.enum([
      "instagram",
      "facebook",
      "google-display",
      "linkedin",
      "unknown",
    ]),
  }),
});

export type SurfaceAnalysis = z.infer<
  typeof SurfaceAnalysisSchema
>;




export const SemanticAnalysisSchema = z.object({
  explicitPromise: z.string(),

  impliedAudienceState: z.object({
    description: z.string(),

    awareness: z.enum([
      "unaware",
      "problem-aware",
      "solution-aware",
      "product-aware",
      "most-aware",
    ]),

    intent: z.enum([
      "browsing",
      "comparing",
      "ready-to-buy",
      "researching",
      "impulse",
    ]),
  }),

  assumedBeliefs: z.array(z.string()),

  conversionMechanism: z.object({
    primary: z.enum([
      "urgency",
      "desire",
      "fear",
      "social-proof",
      "curiosity",
      "authority",
      "identity",
      "relief",
    ]),

    secondary: z
      .enum([
        "urgency",
        "desire",
        "fear",
        "social-proof",
        "curiosity",
        "authority",
        "identity",
        "relief",
      ])
      .nullable(),
  }),

  offerStructure: z.object({
    type: z.enum([
      "discount",
      "free-trial",
      "demo",
      "direct-purchase",
      "lead-gen",
      "content",
      "waitlist",
    ]),

    frictionLevel: z.enum(["low", "medium", "high"]),

    commitmentRequired: z.enum(["email", "payment", "time", "none"]),
  }),

  competitorPositioning: z.object({
    impliesCompetitor: z.boolean(),
    positioningAngle: z.string().nullable(),
  }),

  specificityClaims: z.array(
    z.object({
      claim: z.string(),

      type: z.enum([
        "statistic",
        "testimonial",
        "feature",
        "guarantee",
        "social-proof",
      ]),

      verifiable: z.boolean(),
    }),
  ),

  toneVoice: z.object({
    register: z.enum([
      "formal",
      "conversational",
      "playful",
      "urgent",
      "technical",
      "empathetic",
    ]),

    brandPersonality: z.array(z.string()).max(3),
  }),
});

export type SemanticAnalysis = z.infer<
  typeof SemanticAnalysisSchema
>;


export const PsychologicalAnalysisSchema = z.object({
  jobToBeDone: z.object({
    functional: z.string(),
    emotional: z.string(),
    social: z.string().nullable(),
  }),

  clickMotivation: z.object({
    primaryDriver: z.string(),

    alternativeExplanations: z.array(
      z.string()
    ),
  }),

  emotionalStateOnArrival: z.object({
    state: z.enum([
      "hopeful",
      "skeptical",
      "curious",
      "urgent",
      "comparing",
      "relief-seeking",
      "validating",
    ]),

    description: z.string(),
  }),

  impliedPain: z.object({
    surface: z.string(),
    underlying: z.string(),
  }),

  trustBarriers: z.array(
    z.object({
      barrier: z.string(),

      severity: z.enum([
        "low",
        "medium",
        "high",
        "dealbreaker",
      ]),

      addressedByAd: z.boolean(),
    })
  ),

  purchaseReadiness: z.object({
    stage: z.enum([
      "awareness",
      "consideration",
      "decision",
    ]),

    blockers: z.array(z.string()),
    accelerators: z.array(z.string()),
  }),

  identityAngle: z.object({
    applicable: z.boolean(),
    description: z.string(),
  }),
});



export const CampaignBriefSchema = z.object({
  brandName: z.string(),
  archetype: z.enum([
    "urgency_discount",
    "pain_solution",
    "social_proof",
    "authority",
    "aspirational",
    "comparison",
    "community",
    "free_trial",
  ]),
  explicitPromise: z.string(),
  targetAudience: z.string(),
  emotionalState: z.string(),
  painPoints: z.array(z.string()),
  
  desiredOutcome: z.string(),
  primaryCTA: z.string(),
  visualStyle: z.object({
    colors: z.array(z.string()),
    mood: z.string(),
    density: z.string(),
  }),
  
  landingPageRequirements: z.array(z.string()),
  confidence: z.number(),
});

export type PsychologicalAnalysis =
  z.infer<typeof PsychologicalAnalysisSchema>;