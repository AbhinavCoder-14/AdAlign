import 'dotenv/config'

const TEXT_MODEL = 'groq/compound-mini'
const GEMINI_MODEL = 'gemini-2.5-flash-lite'
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const JSON_RETRY_SUFFIX = '\n\nReturn only valid JSON. No markdown, no explanation.'

// Keep below provider limits (default 28 RPM to stay under a 30 RPM ceiling).
const GROQ_RPM_LIMIT = Number(process.env.GROQ_RPM_LIMIT || 28)
const MIN_REQUEST_INTERVAL = Math.ceil(60000 / Math.max(GROQ_RPM_LIMIT, 1))
const MAX_HTTP_RETRIES = 3
const MAX_JSON_REPAIR_RETRIES = 1

type QueueTask = {
  run: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}

const requestQueue: QueueTask[] = []
let isProcessing = false
let lastRequestAt = 0

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForRateWindow() {
  const elapsed = Date.now() - lastRequestAt
  const waitMs = MIN_REQUEST_INTERVAL - elapsed

  if (waitMs > 0) {
    await sleep(waitMs)
  }
}

function enqueueGroqRequest<T>(run: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue.push({
      run,
      resolve: value => resolve(value as T),
      reject,
    })
    void processQueue()
  })
}

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return

  isProcessing = true
  while (requestQueue.length > 0) {
    const task = requestQueue.shift()
    if (task) {
      try {
        await waitForRateWindow()
        const result = await task.run()
        lastRequestAt = Date.now()
        task.resolve(result)
      } catch (error) {
        task.reject(error)
      }
    }
  }
  isProcessing = false
}

function getApiKey() {
  return process.env.GROQ_API_KEY || ''
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || ''
}

function extractJsonText(raw: string) {
  return raw.replace(/```json|```/gi, '').trim()
}

function parseJson<T>(raw: string): T {
  const clean = extractJsonText(raw)
  return JSON.parse(clean) as T
}

function parseJsonRobust<T>(raw: string): T {
  try {
    return parseJson<T>(raw)
  } catch {
    const clean = extractJsonText(raw)
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')

    if (start !== -1 && end > start) {
      return JSON.parse(clean.slice(start, end + 1)) as T
    }

    throw new Error('Unable to parse model JSON output.')
  }
}

function readCandidateText(payload: any): string {
  const text = payload?.choices?.[0]?.message?.content

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Groq returned an empty response.')
  }

  return text
}

async function requestGroq(body: Record<string, unknown>) {
  return enqueueGroqRequest(async () => {
    let attempt = 0

    while (true) {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        return response.json()
      }

      const errorBody = await response.text()
      const isRetryable = response.status === 429 || response.status >= 500

      if (!isRetryable || attempt >= MAX_HTTP_RETRIES) {
        throw new Error(`Groq request failed (${response.status}): ${errorBody.slice(0, 240)}`)
      }

      const backoff = Math.min(12000, 1200 * 2 ** attempt)
      const jitter = Math.floor(Math.random() * 300)
      await sleep(backoff + jitter)
      attempt += 1
    }
  })
}

async function requestAndParse<T>(body: Record<string, unknown>): Promise<T> {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY.')
  }
  const first = await requestGroq(body)
  const firstText = readCandidateText(first)

  try {
    return parseJsonRobust<T>(firstText)
  } catch {
    let repairAttempt = 0

    while (repairAttempt < MAX_JSON_REPAIR_RETRIES) {
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
        return parseJsonRobust<T>(retryText)
      } catch {
        repairAttempt += 1
      }
    }

    throw new Error(`Groq returned invalid JSON: ${extractJsonText(firstText).slice(0, 300)}`)
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
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  })
}


// for vision
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
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  })
}

function readGeminiCandidateText(payload: any): string {
  const parts = payload?.candidates?.[0]?.content?.parts

  if (!Array.isArray(parts)) {
    throw new Error('Gemini returned an empty response.')
  }

  const textPart = parts.find(part => typeof part?.text === 'string' && part.text.trim())

  if (!textPart?.text) {
    throw new Error('Gemini returned an empty response.')
  }

  return textPart.text
}

async function requestGemini(body: Record<string, unknown>) {
  const apiKey = getGeminiApiKey()

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY.')
  }

  let attempt = 0

  while (true) {
    const response = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (response.ok) {
      return response.json()
    }

    const errorBody = await response.text()
    const isRetryable = response.status === 429 || response.status >= 500

    if (!isRetryable || attempt >= MAX_HTTP_RETRIES) {
      throw new Error(`Gemini request failed (${response.status}): ${errorBody.slice(0, 240)}`)
    }

    const backoff = Math.min(12000, 1200 * 2 ** attempt)
    const jitter = Math.floor(Math.random() * 300)
    await sleep(backoff + jitter)
    attempt += 1
  }
}

export async function callGemini<T = unknown>(prompt: string, system?: string): Promise<T> {
  const baseBody: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  }

  if (system) {
    baseBody.systemInstruction = {
      role: 'system',
      parts: [{ text: system }],
    }
  }

  const first = await requestGemini(baseBody)
  const firstText = readGeminiCandidateText(first)

  try {
    return parseJsonRobust<T>(firstText)
  } catch {
    let repairAttempt = 0

    while (repairAttempt < MAX_JSON_REPAIR_RETRIES) {
      const retry = await requestGemini({
        ...baseBody,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${prompt}${JSON_RETRY_SUFFIX}` }],
          },
        ],
      })
      const retryText = readGeminiCandidateText(retry)

      try {
        return parseJsonRobust<T>(retryText)
      } catch {
        repairAttempt += 1
      }
    }

    throw new Error(`Gemini returned invalid JSON: ${extractJsonText(firstText).slice(0, 300)}`)
  }
}
