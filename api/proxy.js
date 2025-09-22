// 简单的代理服务，用于绕过 CORS 限制
// 这个文件需要在服务器端运行

export default async function handler(req, res) {
    // 允许跨域请求
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    let url, method, headers
    
    if (req.method === 'GET') {
        // GET 请求从查询参数获取 URL
        url = req.query.url
        method = 'GET'
        headers = {
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'Referer': 'https://www.apple.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        }
    } else if (req.method === 'POST') {
        // POST 请求从请求体获取参数
        const body = req.body
        url = body.url
        method = body.method || 'GET'
        headers = body.headers || {}
        
        // 添加完整的 cookie 和 headers（基于您的 curl 示例）
        const completeCookies = 'pltvcid=undefined; dssf=1; dssid2=b984ac11-c4b1-4a10-93a8-2ae95f8d4ae9; pxro=2; geo=CN; s_cc=true; as_rumid=7ebf3e68-dd48-4ebf-8aa6-cf6d3dcead39; as_loc=fd25e72f936faccfc325cd4def2ef02909380297b11e4ade664a4960049f19923f8fa2ae555fa3687e44195bb4dce82a4186fcde4534bb0bdd7210f1b53a7e1eaf755e5ec353b581be0a2b7557cbe0503861cc64c5b3b4ce87fcaf350458342f; rtsid=%7BHK%3D%7Bt%3Da%3Bi%3DR409%3B%7D%3B%7D; dslang=HK-ZH; site=HKG; pldfltcid=eef686981d724268bb75d0fe67e308a0031; as_cn=~pkA9hk889hQT-iXybLLdYwgT3rcrhYtIsad1fB3_AU4=; as_pcts=x2Wyu9Z4-QH+RMWvHZG+c_tEwpzaCyy4fJMCrc1c5IjJXWUVA+cNs2U:RXUDUPdZOt4NeG:F7NSIQzA_0huSE0B_:X:kRtBLeT3KIw15flghBlQ-LCLocPJOcZTTkAFvC7moVr:GHwcDjj+FulmVo0isQBd7g:0cCRhc_yRqy_KSXACwFnXfGZKdGawLU+EuKqeQd37+SIBps3sA4-6QpAPM7s1+2KWbhv+G2wKmntGye98OoubUDHlB5zc3pKBJiGHITLiVz7RWLT:rPu7IApKe9V2TL; itspod=31; acn01=5INmvMgR+QLw/OGHF/ps4sPuvV2jEDEuX5z6RhYP2wAjdxsWAjs+; as_disa=AAAjAAABAXdESaHqKNLxDCanjanjQf9VYRzVWmIa9WBrQk2WQHNMiTo-dkqyRS80aOA0hA-TAAIBzKf8ZTOoxh2T6DGISmheUq40i53bSxsyapmqDOGu2xA=; as_rec=b3dd6261d988bd7fefcdbf865a1b752ece4ad34331f12dd463a3ad8a7381109e1fd2e5fda17f28bbc466a9bcdd78b41d781a40eb8d257f2666be579f131c9276a970315be01ede9ac10a68acf1a776fa; as_uct=0; POD=cn~zh'
        
        headers = {
            ...headers,
            'Cookie': completeCookies
        }
        
        // 确保有必要的 headers
        if (!headers['user-agent']) {
            headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0'
        }
        if (!headers['referer']) {
            headers['referer'] = 'https://www.apple.com/hk-zh/shop/buy-iphone/iphone-17-pro'
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' })
        return
    }

    if (!url) {
        res.status(400).json({ error: 'Missing URL parameter' })
        return
    }

    try {
        console.log('Proxying request to:', url)
        console.log('Headers:', JSON.stringify(headers, null, 2))
        
        const response = await fetch(decodeURIComponent(url), {
            method: method,
            headers: headers
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Response received, data keys:', Object.keys(data))
        
        res.status(200).json(data)
    } catch (error) {
        console.error('Proxy error:', error)
        res.status(500).json({ 
            error: 'Failed to fetch data',
            message: error.message 
        })
    }
}