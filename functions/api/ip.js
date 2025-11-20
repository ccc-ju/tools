
export async function onRequest(context) {
    const { request } = context;

    // Get client IP from Cloudflare headers
    const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '';

    // Construct the target URL
    // If clientIp is available, query specific IP, otherwise ipwho.is will use the request IP (which would be the worker's IP)
    // But wait, ipwho.is allows querying specific IP via path: /8.8.8.8
    let targetUrl = 'https://ipwho.is/';

    // Only append IP if it's not a private/reserved IP (common in local dev)
    const isPrivate = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.') || clientIp.startsWith('172.');

    if (clientIp && !isPrivate) {
        targetUrl += clientIp;
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'OnlineToolbox/1.0'
            }
        });

        if (!response.ok) {
            return new Response(JSON.stringify({ success: false, message: 'Upstream API error' }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();

        // Normalize ISP for China
        if (data.success && data.country_code === 'CN') {
            const isp = (data.connection?.isp || '').toLowerCase();
            const org = (data.connection?.org || '').toLowerCase();

            let newIsp = data.connection?.isp;

            if (isp.includes('telecom') || isp.includes('chinanet') || org.includes('chinanet')) {
                newIsp = '中国电信';
            } else if (isp.includes('unicom') || org.includes('unicom')) {
                newIsp = '中国联通';
            } else if (isp.includes('mobile') || org.includes('mobile')) {
                newIsp = '中国移动';
            } else if (isp.includes('broadnet') || isp.includes('cbn') || org.includes('broadnet') || org.includes('cbn')) {
                newIsp = '中国广电';
            } else if (isp.includes('tie通') || isp.includes('dr.peng') || org.includes('dr.peng')) {
                newIsp = '长城宽带/鹏博士';
            } else if (isp.includes('education') || org.includes('education') || isp.includes('cernet')) {
                newIsp = '教育网';
            } else {
                // If ISP looks like an address (contains "Street", "Road", "No."), try to use Org or fallback
                if (isp.includes('street') || isp.includes('road') || isp.includes('no.')) {
                    newIsp = data.connection?.org || data.connection?.isp;
                }
            }

            if (data.connection) {
                data.connection.isp = newIsp;
            }
        }

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60' // Cache for 1 minute
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
