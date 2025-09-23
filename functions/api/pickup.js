// Cloudflare Function for Apple Pickup API
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
        if (!searchParams.has('product')) {
            console.error('Missing required parameter: product');
            return new Response(JSON.stringify({
                error: 'Missing required parameter: product'
            }), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }
        
        // 构建苹果 API URL - 与 Vite 配置保持一致
        const appleApiUrl = new URL('https://www.apple.com/hk-zh/shop/pickup-message-recommendations');
        
        // 转发所有查询参数
        for (const [key, value] of searchParams.entries()) {
            appleApiUrl.searchParams.append(key, value);
        }

        console.log('🔄 代理重写路径: /api/pickup -> /hk-zh/shop/pickup-message-recommendations');
        console.log('🚚 Pickup API 重写: 请求Apple API:', appleApiUrl.toString());

        // 构建请求头 - Cloudflare 兼容版本（移除不支持的浏览器头部）
        const headers = {
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'referer': 'https://www.apple.com/hk-zh/shop/buy-iphone/iphone-17-pro',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'cookie': 'geo=CN; dslang=HK-ZH; site=HKG; s_cc=true; POD=cn~zh; rtsid=%7BHK%3D%7Bt%3Da%3Bi%3DR409%3B%7D%3B%7D'
        };
        
        console.log('🔧 正在构建 Cloudflare 兼容的请求头...');

        // 发送请求到苹果 API
        console.log('🚀 向苹果 Pickup API发送请求:', appleApiUrl.toString());
        console.log('📝 请求头信息:', JSON.stringify(headers, null, 2));
        
        const response = await fetch(appleApiUrl.toString(), {
            method: 'GET',
            headers: headers
        });

        console.log('📊 苹果 Pickup API 响应状态:', response.status, response.statusText);
        console.log('📊 响应头信息:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        
        if (!response.ok) {
            let errorText = 'Unknown error';
            try {
                errorText = await response.text();
            } catch (e) {
                console.error('⚙️ 无法读取错误响应内容:', e.message);
            }
            console.error('❌ 苹果 Pickup API 错误响应:', response.status, errorText);
            throw new Error(`Apple Pickup API responded with status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ 苹果 Pickup API 响应成功，数据键:', Object.keys(data));
        console.log('📊 响应数据大小:', JSON.stringify(data).length, '字节');

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('❌ Cloudflare Pickup Function 错误:', error.message);
        console.error('❌ 错误堆栈:', error.stack);
        
        return new Response(JSON.stringify({
            error: 'Failed to fetch pickup data from Apple API',
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