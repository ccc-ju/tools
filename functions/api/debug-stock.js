// 专门用于调试 Stock API 问题的测试函数
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
        console.log('🧪 开始 Stock API 调试测试...');
        
        // 测试用的产品编号
        const testProductNo = 'MG8K4ZA/A';
        
        // 构建完整的测试URL - 完全模拟前端请求
        const testParams = new URLSearchParams({
            'fae': 'true',
            'pl': 'true',
            'mts.0': 'regular',
            'mts.1': 'compact',
            'parts.0': testProductNo,
            'searchNearby': 'true',
            'store': 'R409'
        });
        
        const testResults = [];
        
        // 测试1: 使用完整参数
        console.log('📝 测试1: 使用完整参数集');
        const fullUrl = `https://www.apple.com/hk-zh/shop/fulfillment-messages?${testParams.toString()}`;
        console.log('🔗 完整测试URL:', fullUrl);
        
        const fullHeaders = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'cache-control': 'no-cache',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'referer': 'https://www.apple.com/hk-zh/shop/buy-iphone',
            'cookie': 'geo=CN; dslang=HK-ZH; site=HKG'
        };
        
        try {
            const response1 = await fetch(fullUrl, {
                method: 'GET',
                headers: fullHeaders
            });
            
            const result1 = {
                test: '完整参数测试',
                status: response1.status,
                statusText: response1.statusText,
                headers: Object.fromEntries(response1.headers.entries()),
                success: response1.ok
            };
            
            if (response1.ok) {
                const data = await response1.json();
                result1.dataKeys = Object.keys(data);
                result1.hasStores = !!(data?.body?.content?.pickupMessage?.stores?.length);
                result1.storeCount = data?.body?.content?.pickupMessage?.stores?.length || 0;
            } else {
                result1.errorText = await response1.text();
            }
            
            testResults.push(result1);
        } catch (error) {
            testResults.push({
                test: '完整参数测试',
                error: error.message,
                success: false
            });
        }
        
        // 测试2: 简化参数 (类似 pickup API)
        console.log('📝 测试2: 使用简化参数集');
        const simpleParams = new URLSearchParams({
            'fae': 'true',
            'parts.0': testProductNo,
            'searchNearby': 'true',
            'store': 'R409'
        });
        
        const simpleUrl = `https://www.apple.com/hk-zh/shop/fulfillment-messages?${simpleParams.toString()}`;
        console.log('🔗 简化测试URL:', simpleUrl);
        
        try {
            const response2 = await fetch(simpleUrl, {
                method: 'GET',
                headers: fullHeaders
            });
            
            const result2 = {
                test: '简化参数测试',
                status: response2.status,
                statusText: response2.statusText,
                success: response2.ok
            };
            
            if (response2.ok) {
                const data = await response2.json();
                result2.dataKeys = Object.keys(data);
                result2.hasStores = !!(data?.body?.content?.pickupMessage?.stores?.length);
                result2.storeCount = data?.body?.content?.pickupMessage?.stores?.length || 0;
            } else {
                result2.errorText = await response2.text();
            }
            
            testResults.push(result2);
        } catch (error) {
            testResults.push({
                test: '简化参数测试',
                error: error.message,
                success: false
            });
        }
        
        // 测试3: 对比 pickup API（确保 pickup 确实工作）
        console.log('📝 测试3: 对比 pickup API');
        const pickupParams = new URLSearchParams({
            'fae': 'true',
            'mts.0': 'regular',
            'mts.1': 'compact',
            'searchNearby': 'true',
            'store': 'R409',
            'product': testProductNo
        });
        
        const pickupUrl = `https://www.apple.com/hk-zh/shop/pickup-message-recommendations?${pickupParams.toString()}`;
        console.log('🔗 Pickup对比URL:', pickupUrl);
        
        try {
            const response3 = await fetch(pickupUrl, {
                method: 'GET',
                headers: fullHeaders
            });
            
            const result3 = {
                test: 'Pickup API 对比',
                status: response3.status,
                statusText: response3.statusText,
                success: response3.ok
            };
            
            if (response3.ok) {
                const data = await response3.json();
                result3.dataKeys = Object.keys(data);
                result3.hasStores = !!(data?.body?.content?.pickupMessage?.stores?.length);
                result3.storeCount = data?.body?.content?.pickupMessage?.stores?.length || 0;
            } else {
                result3.errorText = await response3.text();
            }
            
            testResults.push(result3);
        } catch (error) {
            testResults.push({
                test: 'Pickup API 对比',
                error: error.message,
                success: false
            });
        }
        
        // 返回测试结果
        const finalResult = {
            timestamp: new Date().toISOString(),
            testProduct: testProductNo,
            cloudflareRegion: request.cf?.colo || 'unknown',
            results: testResults,
            analysis: {
                stockApiWorking: testResults.filter(r => r.test.includes('参数测试') && r.success).length > 0,
                pickupApiWorking: testResults.filter(r => r.test.includes('Pickup') && r.success).length > 0,
                recommendation: ''
            }
        };
        
        // 生成建议
        if (finalResult.analysis.pickupApiWorking && !finalResult.analysis.stockApiWorking) {
            finalResult.analysis.recommendation = '建议检查 Stock API 的参数配置，可能需要调整参数格式或删除某些参数';
        } else if (!finalResult.analysis.pickupApiWorking && !finalResult.analysis.stockApiWorking) {
            finalResult.analysis.recommendation = '两个API都失败，可能是网络或认证问题';
        } else if (finalResult.analysis.stockApiWorking) {
            finalResult.analysis.recommendation = 'Stock API 工作正常，可能是间歇性问题';
        }
        
        console.log('✅ Stock API 调试测试完成');
        console.log('📊 测试结果:', JSON.stringify(finalResult, null, 2));
        
        return new Response(JSON.stringify(finalResult, null, 2), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('❌ Stock API 调试测试失败:', error);
        
        return new Response(JSON.stringify({
            error: 'Stock API debug test failed',
            message: error.message,
            stack: error.stack,
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