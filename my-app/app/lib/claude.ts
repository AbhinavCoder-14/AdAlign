import Anthropic from '@anthropic-ai/sdk'

import 'dotenv/config'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })


export async function callClaude(prompt:string,system?:string) {

    const res = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    temperature: 0,
    ...(system && { system }),
    messages: [{ role: 'user', content: prompt }]
  })

  const text = res.content[0].type === 'text' ? res.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()

  try{
    return JSON.parse(clean)
  }catch{
    throw new Error(`Claude returned invalid JSON: ${clean.slice(0, 300)}`)

  }
}


export async function callClaudeVision(base64: string, mimeType: string, prompt: string) {
  const res = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    temperature: 0,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType as any,
            data: base64
          }
        },
        { type: 'text', text: prompt }
      ]
    }]
  })


  const text = res.content[0].type === "text" ? res.content[0].text : ""
  const clean = text.replace(/```json|```/g, '').trim()

    try{
        return JSON.parse(clean)
    }catch{
    throw new Error(`Claude returned invalid JSON: ${clean.slice(0, 300)}`)
  }
}
