import { Change } from "@/types"


export function injectChanges(rawHTML:string,changes:Change[]): string {

    let modified = rawHTML

    for (const change of changes){
        if(!change.original || !change.rewritten){
            continue
        }

        const escaped = change.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(escaped,"g")


        if (regex.test(modified)) {
            modified = modified.replace(regex, change.rewritten)
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

