import { useState, useEffect } from 'react'
import { copyWithFallback } from '../utils/clipboard'

function IpTool() {
    const [ipData, setIpData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchIp = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('https://ipwho.is/')
            if (!response.ok) {
                throw new Error('网络请求失败')
            }
            const data = await response.json()
            if (!data.success) {
                throw new Error(data.message || '获取IP信息失败')
            }
            setIpData(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIp()
    }, [])

    const handleCopy = (text) => {
        copyWithFallback(text)
    }

    return (
        <div className="card">
            <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>IP 地址查询</h2>
                <button className="btn" onClick={fetchIp} disabled={loading}>
                    {loading ? '查询中...' : '刷新'}
                </button>
            </div>

            {error && (
                <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px' }}>
                    查询出错: {error}
                </div>
            )}

            {ipData && (
                <div className="grid-2">
                    <div>
                        <div className="muted" style={{ marginBottom: '6px' }}>公网 IP 地址</div>
                        <div className="flex" style={{ gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                {ipData.ip}
                            </div>
                            <button className="btn small" onClick={() => handleCopy(ipData.ip)}>复制</button>
                        </div>

                        <div className="muted" style={{ marginBottom: '6px' }}>地理位置</div>
                        <div style={{ fontSize: '18px', marginBottom: '20px' }}>
                            {ipData.country} - {ipData.region} - {ipData.city}
                        </div>
                    </div>

                    <div>
                        <div className="muted" style={{ marginBottom: '6px' }}>详细信息</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '14px' }}>
                            <div className="muted">运营商:</div>
                            <div>{ipData.connection?.isp || '-'}</div>

                            <div className="muted">经纬度:</div>
                            <div>{ipData.latitude}, {ipData.longitude}</div>

                            <div className="muted">时区:</div>
                            <div>{ipData.timezone?.id} (UTC{ipData.timezone?.utc})</div>

                            <div className="muted">ASN:</div>
                            <div>{ipData.connection?.asn || '-'}</div>
                        </div>
                    </div>
                </div>
            )}

            {!ipData && !loading && !error && (
                <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
                    点击刷新按钮获取 IP 信息
                </div>
            )}
        </div>
    )
}

export default IpTool
