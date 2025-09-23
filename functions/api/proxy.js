// 备用代理方案 - 更接近 Vite 代理的实现
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
        // 获取原始请求的路径和参数
        const originalPath = url.pathname;
        const searchParams = url.search;
        
        console.log('🔄 原始请求路径:', originalPath);
        console.log('🔍 查询参数:', searchParams);
        
        // 直接根据路径重写 - 完全模拟 Vite 配置
        let targetPath = '';
        if (originalPath.includes('/api/stock')) {
            targetPath = originalPath.replace('/api/stock', '/hk-zh/shop/fulfillment-messages');
        } else if (originalPath.includes('/api/pickup')) {
            targetPath = originalPath.replace('/api/pickup', '/hk-zh/shop/pickup-message-recommendations');
        } else {
            throw new Error(`未知的API路径: ${originalPath}`);
        }
        
        // 构建完整的苹果API URL
        const appleApiUrl = `https://www.apple.com${targetPath}${searchParams}`;
        console.log('📦 重写后的Apple API URL:', appleApiUrl);
        
        // 使用简化但有效的请求头
        const headers = {
            'Accept': '*/*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'Referer': 'https://www.apple.com/hk-zh/',
            'Cookie': 'geo=CN; dslang=HK-ZH; site=HKG'
        };
        
        console.log('🚀 发送请求到苹果API...');
        console.log('📝 使用的请求头:', JSON.stringify(headers, null, 2));
        
        // 发送请求
        const response = await fetch(appleApiUrl, {
            method: 'GET',
            headers: headers
        });
        
        console.log('📊 苹果API响应状态:', response.status);
        
        if (!response.ok) {
            // 尝试读取错误信息
            let errorText = '';
            try {
                errorText = await response.text();
                console.error('❌ 苹果API错误响应内容:', errorText);
            } catch (e) {
                console.error('❌ 无法读取错误响应:', e.message);
            }
            
            return new Response(JSON.stringify({
                error: 'Apple API request failed',
                status: response.status,
                statusText: response.statusText,
                details: errorText
            }), {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }
        
        // 解析JSON响应
        const data = await response.json();
        console.log('✅ 苹果API响应成功，数据大小:', JSON.stringify(data).length);
        
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });
        
    } catch (error) {
        console.error('❌ 备用代理函数错误:', error.message);
        console.error('❌ 错误堆栈:', error.stack);
        
        return new Response(JSON.stringify({
            error: 'Proxy function error',
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