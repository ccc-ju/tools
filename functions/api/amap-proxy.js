/**
 * 高德API CORS代理 - Cloudflare Pages Function
 * 白名单限制只允许访问高德相关域名
 */

const ALLOWED_TARGETS = [
    'et-api.amap.com',
    'restapi.amap.com',
    'webapi.amap.com',
    'ditu.amap.com'
]

export async function onRequest(context) {
    const { request } = context
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('target')

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
                'Access-Control-Max-Age': '86400'
            }
        })
    }

    if (!targetUrl) {
        return Response.json(
            { error: 'Missing target URL parameter', usage: 'Use ?target=https://your-api-url' },
            { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        )
    }

    let parsedTarget
    try {
        parsedTarget = new URL(targetUrl)
    } catch (e) {
        return Response.json(
            { error: 'Invalid target URL', target: targetUrl },
            { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
        )
    }

    // 检查域名白名单
    if (!ALLOWED_TARGETS.includes(parsedTarget.hostname)) {
        return Response.json(
            { error: 'Target domain not allowed', allowedDomains: ALLOWED_TARGETS, requestedDomain: parsedTarget.hostname },
            { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } }
        )
    }

    try {
        // 构建代理请求 - 只传递必要的headers，避免干扰目标API
        const proxyHeaders = new Headers()
        proxyHeaders.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
        proxyHeaders.set('Accept', 'application/json, text/plain, */*')

        const proxyInit = {
            method: request.method,
            headers: proxyHeaders
        }

        // 转发请求体
        if (request.method === 'POST' || request.method === 'PUT') {
            proxyHeaders.set('Content-Type', request.headers.get('Content-Type') || 'application/json')
            proxyInit.body = await request.text()
        }

        const response = await fetch(targetUrl, proxyInit)
        const responseBody = await response.text()

        return new Response(responseBody, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept'
            }
        })
    } catch (error) {
        return Response.json(
            { error: 'Proxy request failed', message: error.message, target: targetUrl },
            { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
        )
    }
}
