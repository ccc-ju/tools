// Cloudflare Function for Apple Stock API
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    // 设置 CORS 头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    try {
        // 获取查询参数
        const searchParams = url.searchParams;
        
        // 验证必要参数
        if (!searchParams.has('parts.0')) {
            console.error('Missing required parameter: parts.0');
            return new Response(JSON.stringify({
                error: 'Missing required parameter: parts.0'
            }), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }
        
        // 构建苹果 API URL - 与 Vite 配置保持一致
        const appleApiUrl = new URL('https://www.apple.com/hk-zh/shop/fulfillment-messages');
        
        // 转发所有查询参数
        for (const [key, value] of searchParams.entries()) {
            appleApiUrl.searchParams.append(key, value);
        }

        console.log('🔄 代理重写路径: /api/stock -> /hk-zh/shop/fulfillment-messages');
        console.log('📦 Stock API 重写: 请求Apple API:', appleApiUrl.toString());

        // 构建请求头 - 与 Vite 配置中的完全一致
        const headers = {
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'referer': 'https://www.apple.com/hk-zh/shop/buy-iphone/iphone-17-pro/6.3-%E5%90%8B%E9%A1%AF%E7%A4%BA%E5%99%A8-512gb-%E9%8A%80%E8%89%B2',
            'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
            'x-aos-ui-fetch-call-1': 'ehq6zhukzb-mfvw9d70',
            'cookie': 'pltvcid=undefined; dssf=1; dssid2=b984ac11-c4b1-4a10-93a8-2ae95f8d4ae9; pxro=2; geo=CN; s_cc=true; as_rumid=7ebf3e68-dd48-4ebf-8aa6-cf6d3dcead39; as_loc=fd25e72f936faccfc325cd4def2ef02909380297b11e4ade664a4960049f19923f8fa2ae555fa3687e44195bb4dce82a4186fcde4534bb0bdd7210f1b53a7e1eaf755e5ec353b581be0a2b7557cbe0503861cc64c5b3b4ce87fcaf350458342f; rtsid=%7BHK%3D%7Bt%3Da%3Bi%3DR409%3B%7D%3B%7D; dslang=HK-ZH; site=HKG; pldfltcid=eef686981d724268bb75d0fe67e308a0031; as_cn=~pkA9hk889hQT-iXybLLdYwgT3rcrhYtIsad1fB3_AU4=; itspod=31; acn01=5INmvMgR+QLw/OGHF/ps4sPuvV2jEDEuX5z6RhYP2wAjdxsWAjs+; as_disa=AAAjAAABAXdESaHqKNLxDCanjanjQf9VYRzVWmIa9WBrQk2WQHNMiTo-dkqyRS80aOA0hA-TAAIBzKf8ZTOoxh2T6DGISmheUq40i53bSxsyapmqDOGu2xA=; as_rec=b3dd6261d988bd7fefcdbf865a1b752ece4ad34331f12dd463a3ad8a7381109e1fd2e5fda17f28bbc466a9bcdd78b41d781a40eb8d257f2666be579f131c9276a970315be01ede9ac10a68acf1a776fa; as_uct=0; POD=cn~zh'
        };

        // 发送请求到苹果 API
        console.log('🚀 向苹果 API发送请求:', appleApiUrl.toString());
        const response = await fetch(appleApiUrl.toString(), {
            method: 'GET',
            headers: headers
        });

        console.log('📊 苹果 API 响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 苹果 API 错误响应:', response.status, errorText);
            throw new Error(`Apple API responded with status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ 苹果 API 响应成功，数据键:', Object.keys(data));

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('❌ Cloudflare Stock Function 错误:', error.message);
        console.error('❌ 错误堆栈:', error.stack);
        
        return new Response(JSON.stringify({
            error: 'Failed to fetch stock data from Apple API',
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });
    }
}