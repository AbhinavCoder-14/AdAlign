export async function scraper(url:string) {
    const [jinaRes, htmlRes] = await Promise.all([
        fetch(`https://r.jina.ai/${url}`, {
            headers: { Accept: 'text/plain' },
            signal: AbortSignal.timeout(15000),
        }),
        fetch(url, { signal: AbortSignal.timeout(15000) }),
    ])

    if (!jinaRes.ok || !htmlRes.ok) {
        throw new Error('Could not scrape the landing page.')
    }

    const [jinaText, htmlText] = await Promise.all([
        jinaRes.text(),
        htmlRes.text(),
    ])

    return {
        jinaRes: jinaText,
        htmlRes: htmlText,
    }
    
}
