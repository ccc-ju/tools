import { useState, useEffect } from 'react'
import { copyWithFallback } from '../utils/clipboard'

function IpTool() {
    const [ipv4Data, setIpv4Data] = useState(null)
    const [ipv6Data, setIpv6Data] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchIpDetails = async (ip) => {
        try {
            // Add timestamp to prevent caching
            const response = await fetch(`/api/ip?ip=${ip}&t=${Date.now()}`)
            if (!response.ok) throw new Error('Network response was not ok')
            const data = await response.json()
            if (!data.success) throw new Error(data.message || 'Failed to fetch IP details')
            return data
        } catch (e) {
            console.error(`Failed to fetch details for ${ip}:`, e)
            return null
        }
    }

    const detectIpv4 = async () => {
        const sources = [
            { url: 'https://api4.ipify.org?format=json', type: 'json', field: 'ip' },
            { url: 'https://api-ipv4.ip.sb/ip', type: 'text' },
            { url: 'https://ipv4.icanhazip.com', type: 'text' },
            { url: 'https://v4.ident.me', type: 'text' }
        ]

        try {
            const promises = sources.map(async (source) => {
                try {
                    const res = await fetch(`${source.url}${source.url.includes('?') ? '&' : '?'}t=${Date.now()}`)
                    if (!res.ok) throw new Error('Network error')
                    let ip = ''
                    if (source.type === 'json') {
                        const json = await res.json()
                        ip = json[source.field]
                    } else {
                        ip = (await res.text()).trim()
                    }
                    // Simple validation
                    if (ip && ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
                        return ip
                    }
                    throw new Error('Invalid IP format')
                } catch (e) {
                    throw e
                }
            })

            return await Promise.any(promises)
        } catch (e) {
            console.log('All IPv4 sources failed')
            return null
        }
    }

    const fetchAllIps = async () => {
        setLoading(true)
        setError(null)
        setIpv4Data(null)
        setIpv6Data(null)

        try {
            // 1. Try to detect IPv4
            let v4Ip = await detectIpv4()

            // 2. Try to detect IPv6
            let v6Ip = null
            try {
                const v6Res = await fetch(`https://api6.ipify.org?format=json&t=${Date.now()}`)
                if (v6Res.ok) {
                    const v6Json = await v6Res.json()
                    v6Ip = v6Json.ip
                }
            } catch (e) {
                console.log('IPv6 detection failed or not available')
            }

            if (!v4Ip && !v6Ip) {
                // Fallback to default endpoint if both detections fail
                try {
                    const defaultRes = await fetch(`/api/ip?t=${Date.now()}`)
                    if (defaultRes.ok) {
                        const data = await defaultRes.json()
                        if (data.success) {
                            if (data.ip.includes(':')) {
                                setIpv6Data(data)
                            } else {
                                setIpv4Data(data)
                            }
                        }
                    }
                } catch (e) {
                    throw new Error('无法获取 IP 信息，请检查网络连接')
                }
            } else {
                // Immediately show IP addresses (without details)
                if (v4Ip) {
                    setIpv4Data({ ip: v4Ip, success: true })
                }
                if (v6Ip && v6Ip !== v4Ip) {
                    setIpv6Data({ ip: v6Ip, success: true })
                }

                // Mark initial loading as done (IP is shown)
                setLoading(false)

                // Then fetch details asynchronously
                if (v4Ip) {
                    fetchIpDetails(v4Ip).then(data => {
                        if (data) setIpv4Data(data)
                    })
                }
                if (v6Ip && v6Ip !== v4Ip) {
                    fetchIpDetails(v6Ip).then(data => {
                        if (data) setIpv6Data(data)
                    })
                }

                return // Early return to skip the loading=false at the end
            }

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllIps()
    }, [])

    const handleCopy = (text) => {
        copyWithFallback(text)
    }

    const renderIpCard = (data, type) => {
        if (!data) return null
        const isV6 = type === 'IPv6'
        const isLoadingDetails = data.ip && !data.country // Has IP but no details yet

        return (
            <div style={{ marginBottom: '24px', opacity: isV6 ? 0.8 : 1 }}>
                <div className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div className="muted">{type} 地址</div>
                    {isV6 && <span style={{ fontSize: '12px', background: '#eee', padding: '2px 6px', borderRadius: '4px', color: '#666' }}>次选</span>}
                </div>

                <div className="flex" style={{ gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: isV6 ? '18px' : '24px', fontWeight: 'bold', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {data.ip}
                    </div>
                    <button className="btn small" onClick={() => handleCopy(data.ip)}>复制</button>
                </div>

                {isLoadingDetails ? (
                    <div className="muted" style={{ fontSize: '14px', fontStyle: 'italic' }}>
                        正在加载详细信息...
                    </div>
                ) : (
                    <>
                        <div className="grid-2">
                            <div>
                                <div className="muted" style={{ marginBottom: '6px' }}>地理位置</div>
                                <div style={{ fontSize: '16px', marginBottom: '12px' }}>
                                    {data.country} - {data.region} - {data.city}
                                </div>
                            </div>
                            <div>
                                <div className="muted" style={{ marginBottom: '6px' }}>运营商</div>
                                <div style={{ fontSize: '16px' }}>
                                    {data.connection?.isp || '-'}
                                </div>
                            </div>
                        </div>

                        {/* Only show extra details for primary IP (IPv4) or if it's the only one */}
                        {(!isV6 || !ipv4Data) && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '14px' }}>
                                    <div className="muted">经纬度:</div>
                                    <div>{data.latitude}, {data.longitude}</div>
                                    <div className="muted">时区:</div>
                                    <div>{data.timezone?.id} (UTC{data.timezone?.utc})</div>
                                    <div className="muted">ASN:</div>
                                    <div>{data.connection?.asn || '-'}</div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        )
    }

    const renderExternalChecks = () => {
        if (loading || (!ipv4Data && !ipv6Data)) return null

        const primaryIp = ipv4Data?.ip || ipv6Data?.ip

        return (
            <div style={{ marginTop: '24px' }}>
                <div className="muted" style={{ marginBottom: '12px', fontSize: '15px' }}>三方IP专业检测</div>
                <div className="muted" style={{ marginBottom: '12px', fontSize: '13px' }}>
                    点击下方链接跳转到专业平台查看详细报告
                </div>
                <div className="flex" style={{ gap: '10px', flexWrap: 'wrap' }}>
                    <a
                        href={`https://www.abuseipdb.com/check/${primaryIp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ textDecoration: 'none' }}
                    >
                        📋 AbuseIPDB (黑名单查询)
                    </a>
                    <a
                        href={`https://scamalytics.com/ip/${primaryIp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ textDecoration: 'none' }}
                    >
                        🛡️ Scamalytics (欺诈分检测)
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="card">
            <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>IP 地址查询</h2>
                <button className="btn" onClick={fetchAllIps} disabled={loading}>
                    {loading ? '查询中...' : '刷新'}
                </button>
            </div>

            {error && (
                <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px' }}>
                    查询出错: {error}
                </div>
            )}

            {ipv4Data && renderIpCard(ipv4Data, 'IPv4')}
            {ipv6Data && renderIpCard(ipv6Data, 'IPv6')}

            {renderExternalChecks()}

            {!ipv4Data && !ipv6Data && !loading && !error && (
                <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
                    未能获取到 IP 信息
                </div>
            )}
        </div>
    )
}

export default IpTool
