import { Change } from "@/types"

function normalizeText(value: unknown): string | null {
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)

    if (Array.isArray(value)) {
        const parts = value
            .filter(item => typeof item === 'string')
            .map(item => (item as string).trim())
            .filter(Boolean)

        return parts.length > 0 ? parts.join(' ') : null
    }

    return null
}

export function injectChanges(rawHTML:string,changes:Change[]): string {

    let modified = rawHTML

    for (const change of changes){
        const original = normalizeText((change as unknown as { original?: unknown }).original)
        const rewritten = normalizeText((change as unknown as { rewritten?: unknown }).rewritten)

        if(!original || !rewritten){
            continue
        }

        const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(escaped,"g")


        if (regex.test(modified)) {
            modified = modified.replace(regex, rewritten)
        }

    }
    return modified


    
}


export function isInjectionSafe(original:string,modified:string):boolean {
    const origTags = (original.match(/<[^>]+>/g) || []).length
    const modTags = (modified.match(/<[^>]+>/g) || []).length
    const diff = Math.abs(origTags - modTags) / Math.max(origTags, 1)
    return diff < 0.05 // less than 5% structural change
}

