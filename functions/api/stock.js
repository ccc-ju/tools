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
        
        // 特别处理 stock API 的参数，确保完全匹配本地 Vite 代理
        const requiredParams = [
            'fae', 'pl', 'mts.0', 'mts.1', 'parts.0', 'searchNearby', 'store'
        ];
        
        // 转发所有查询参数，优先保证必要参数
        for (const [key, value] of searchParams.entries()) {
            appleApiUrl.searchParams.append(key, value);
        }
        
        // 记录完整的参数信息用于调试
        console.log('📝 请求参数详情:');
        console.log('- fae:', searchParams.get('fae'));
        console.log('- pl:', searchParams.get('pl'));
        console.log('- mts.0:', searchParams.get('mts.0'));
        console.log('- mts.1:', searchParams.get('mts.1'));
        console.log('- parts.0:', searchParams.get('parts.0'));
        console.log('- searchNearby:', searchParams.get('searchNearby'));
        console.log('- store:', searchParams.get('store'));

        console.log('🔄 代理重写路径: /api/stock -> /hk-zh/shop/fulfillment-messages');
        console.log('📦 Stock API 重写: 请求Apple API:', appleApiUrl.toString());

        // 构建请求头 - Cloudflare 兼容版本（移除不支持的浏览器头部）
        const headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'referer': 'https://www.apple.com/hk-zh/shop/buy-iphone',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'cookie': 'geo=CN; dslang=HK-ZH; site=HKG; s_cc=true; POD=cn~zh'
        };
        
        console.log('🔧 正在构建 Cloudflare 兼容的请求头...');

        // 发送请求到苹果 API
        console.log('🚀 向苹果 API发送请求:', appleApiUrl.toString());
        console.log('📝 请求头信息:', JSON.stringify(headers, null, 2));
        
        const response = await fetch(appleApiUrl.toString(), {
            method: 'GET',
            headers: headers
        });

        console.log('📊 苹果 API 响应状态:', response.status, response.statusText);
        console.log('📊 响应头信息:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        
        if (!response.ok) {
            let errorText = 'Unknown error';
            let errorDetails = {};
            
            try {
                errorText = await response.text();
                console.error('❌ 苹果 API 错误响应内容:', errorText);
                
                // 尝试解析为 JSON 获取更多信息
                try {
                    errorDetails = JSON.parse(errorText);
                } catch (parseError) {
                    console.log('⚠️ 错误响应不是 JSON 格式');
                }
            } catch (e) {
                console.error('⚙️ 无法读取错误响应内容:', e.message);
            }
            
            console.error('❌ 苹果 Stock API 详细错误信息:');
            console.error('- 响应状态:', response.status);
            console.error('- 状态文本:', response.statusText);
            console.error('- 请求 URL:', appleApiUrl.toString());
            console.error('- 请求头:', JSON.stringify(headers, null, 2));
            console.error('- 错误内容:', errorText);
            
            // 返回更详细的错误信息
            return new Response(JSON.stringify({
                error: 'Apple Stock API request failed',
                status: response.status,
                statusText: response.statusText,
                requestUrl: appleApiUrl.toString(),
                errorContent: errorText,
                errorDetails: errorDetails,
                timestamp: new Date().toISOString()
            }), {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }

        const data = await response.json();
        console.log('✅ 苹果 API 响应成功，数据键:', Object.keys(data));
        console.log('📊 响应数据大小:', JSON.stringify(data).length, '字节');

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