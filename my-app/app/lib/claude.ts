import 'dotenv/config'

const TEXT_MODEL = 'groq/compound-mini'
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const JSON_RETRY_SUFFIX = '\n\nReturn only valid JSON. No markdown, no explanation.'

function getApiKey() {
  return process.env.GROQ_API_KEY || ''
}

function extractJsonText(raw: string) {
  return raw.replace(/```json|```/gi, '').trim()
}

function parseJson<T>(raw: string): T {
  const clean = extractJsonText(raw)
  return JSON.parse(clean) as T
}

function readCandidateText(payload: any): string {
  const text = payload?.choices?.[0]?.message?.content

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Groq returned an empty response.')
  }

  return text
}

async function requestGroq(body: Record<string, unknown>) {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY.')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Groq request failed (${response.status}): ${errorBody.slice(0, 240)}`)
  }

  return response.json()
}

async function requestAndParse<T>(body: Record<string, unknown>): Promise<T> {
  const first = await requestGroq(body)
  const firstText = readCandidateText(first)

  try {
    return parseJson<T>(firstText)
  } catch {
    const retry = await requestGroq({
      ...body,
      messages: [
        ...(body.messages as Array<Record<string, unknown>>),
        {
          role: 'user',
          content: JSON_RETRY_SUFFIX,
        },
      ],
    })
    const retryText = readCandidateText(retry)

    try {
      return parseJson<T>(retryText)
    } catch {
      throw new Error(`Groq returned invalid JSON: ${extractJsonText(retryText).slice(0, 300)}`)
    }
  }
}

export async function callClaude<T = unknown>(prompt: string, system?: string): Promise<T> {
  const messages: Array<Record<string, unknown>> = []

  if (system) {
    messages.push({ role: 'system', content: system })
  }

  messages.push({ role: 'user', content: prompt })

  return requestAndParse<T>({
    model: TEXT_MODEL,
    messages,
    temperature: 0,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })
}

export async function callClaudeVision<T = unknown>(
  base64: string,
  mimeType: string,
  prompt: string,
): Promise<T> {
  return requestAndParse<T>({
    model: VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })
}
