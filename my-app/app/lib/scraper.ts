


export async function scraper(url:string) {


    const [jinaRes, htmlRes] = await Promise.all([
        fetch(`https://r.jina.ai/${url}`,{
            headers: { 'Accept': 'text/plain' },
              signal: AbortSignal.timeout(15000)
            }),

        fetch(url, { signal: AbortSignal.timeout(15000) })

    ])

    if(jinaRes.ok && htmlRes.ok){
        
        return {
            jinaRes: jinaRes.text(),
            htmlRes: htmlRes.text()
        }
    }

    return {
        jinaRes: '',
        htmlRes: ''
        }



    




    
}
