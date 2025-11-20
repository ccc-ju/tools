export async function onRequest(context) {
    const { request } = context;

    // Get client IP from Cloudflare headers
    let clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '';

    // Check for 'ip' query parameter to override
    const url = new URL(request.url);
    const queryIp = url.searchParams.get('ip');
    if (queryIp) {
        clientIp = queryIp;
    }

    // Determine target IP
    let targetIp = '';
    const isPrivate = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.') || clientIp.startsWith('172.');

    if (clientIp && (!isPrivate || queryIp)) {
        targetIp = clientIp;
    }

    // Helper to fetch from ipwho.is
    const fetchIpwho = async (ip) => {
        let url = 'https://ipwho.is/';
        if (ip) url += ip;

        const res = await fetch(url, {
            headers: { 'User-Agent': 'OnlineToolbox/1.0' }
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'API error');
        return data;
    };

    // Helper to fetch from ip-api.com (fallback)
    const fetchIpApi = async (ip) => {
        // ip-api.com doesn't support https on free tier, but we can try http
        // Cloudflare Workers can fetch http.
        let url = `http://ip-api.com/json/${ip || ''}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query`;

        const res = await fetch(url, {
            headers: { 'User-Agent': 'OnlineToolbox/1.0' }
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (data.status !== 'success') throw new Error(data.message || 'API error');

        // Map to ipwho.is format
        return {
            success: true,
            ip: data.query,
            type: 'IPv4', // ip-api mostly v4, but can be v6
            country: data.country,
            country_code: data.countryCode,
            region: data.regionName,
            region_code: data.region,
            city: data.city,
            latitude: data.lat,
            longitude: data.lon,
            connection: {
                asn: data.as ? parseInt(data.as.split(' ')[0].replace('AS', '')) : null,
                org: data.org,
                isp: data.isp,
                domain: ''
            },
            timezone: {
                id: data.timezone,
                utc: '', // ip-api doesn't provide UTC offset directly easily without more fields
                current_time: ''
            }
        };
    };

    let data = null;
    let source = 'primary';

    try {
        // Try primary source
        try {
            data = await fetchIpwho(targetIp);
        } catch (e) {
            console.log('Primary API failed, trying fallback:', e.message);
            // If primary fails, try fallback
            data = await fetchIpApi(targetIp);
            source = 'fallback';
        }

        // Normalize ISP for China (reuse existing logic)
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
                if (isp.includes('street') || isp.includes('road') || isp.includes('no.')) {
                    newIsp = data.connection?.org || data.connection?.isp;
                }
            }

            if (data.connection) {
                data.connection.isp = newIsp;
            }
        }

        // Add source info header for debugging
        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
            'X-Data-Source': source
        };

        return new Response(JSON.stringify(data), { headers });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
