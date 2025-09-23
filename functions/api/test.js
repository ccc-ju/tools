// Cloudflare Function 测试端点
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
        // 收集环境信息
        const envInfo = {
            timestamp: new Date().toISOString(),
            method: request.method,
            url: request.url,
            userAgent: request.headers.get('user-agent'),
            cloudflareInfo: {
                country: request.cf?.country,
                colo: request.cf?.colo,
                ip: request.headers.get('cf-connecting-ip'),
            },
            requestHeaders: Object.fromEntries(request.headers.entries()),
            searchParams: Object.fromEntries(url.searchParams.entries())
        };

        console.log('🧪 Cloudflare Functions 测试端点调用:', JSON.stringify(envInfo, null, 2));

        // 测试对苹果API的简单请求
        const testUrl = 'https://www.apple.com/hk-zh/shop/fulfillment-messages?fae=true&pl=true&mts.0=regular&mts.1=compact&parts.0=MG8K4ZA/A&searchNearby=true&store=R409';
        
        console.log('🔍 测试请求苹果API:', testUrl);
        
        const testResponse = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'cache-control': 'no-cache',
                'referer': 'https://www.apple.com/hk-zh/shop/buy-iphone/iphone-17-pro',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
                'cookie': 'pltvcid=undefined; dssf=1; geo=CN; s_cc=true; dslang=HK-ZH; site=HKG; rtsid=%7BHK%3D%7Bt%3Da%3Bi%3DR409%3B%7D%3B%7D'
            }
        });

        const testResult = {
            envInfo,
            appleApiTest: {
                status: testResponse.status,
                statusText: testResponse.statusText,
                headers: Object.fromEntries(testResponse.headers.entries()),
                success: testResponse.ok
            }
        };

        if (testResponse.ok) {
            try {
                const data = await testResponse.json();
                testResult.appleApiTest.dataKeys = Object.keys(data);
                testResult.appleApiTest.dataSize = JSON.stringify(data).length;
            } catch (e) {
                testResult.appleApiTest.parseError = e.message;
            }
        } else {
            try {
                testResult.appleApiTest.errorText = await testResponse.text();
            } catch (e) {
                testResult.appleApiTest.errorReadFailed = e.message;
            }
        }

        return new Response(JSON.stringify(testResult, null, 2), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('❌ 测试端点错误:', error);
        
        return new Response(JSON.stringify({
            error: 'Test endpoint error',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }, null, 2), {
            status: 500,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });
    }
}