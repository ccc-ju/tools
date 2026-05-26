import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useLanguage } from '../utils/i18n'
import { copyWithFallback } from '../utils/clipboard'
import {
    generateDigestSign,
    generateTokenSign,
    buildFullUrl,
    cityConfigs
} from '../utils/amapSignature'

// 响应数据大小限制（字符数）
const RESPONSE_DISPLAY_LIMIT = 50000 // 50KB 直接渲染
const RESPONSE_MAX_LIMIT = 500000 // 500KB 截断显示

// 独立的时间戳显示组件，避免每秒重渲染整个页面
const TimestampDisplay = memo(function TimestampDisplay() {
    const [ts, setTs] = useState(Date.now().toString())
    useEffect(() => {
        const timer = setInterval(() => setTs(Date.now().toString()), 1000)
        return () => clearInterval(timer)
    }, [])
    return <span style={{ fontFamily: 'monospace' }}>{ts}</span>
})

// 响应数据展示组件 - 处理大数据量
const ResponseViewer = memo(function ResponseViewer({ data, t }) {
    const [expanded, setExpanded] = useState(false)

    const { displayText, fullText, isTruncated, size } = useMemo(() => {
        const full = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)
        const len = full.length
        if (len <= RESPONSE_DISPLAY_LIMIT) {
            return { displayText: full, fullText: full, isTruncated: false, size: len }
        }
        const truncated = full.slice(0, RESPONSE_DISPLAY_LIMIT)
        return { displayText: truncated, fullText: full, isTruncated: true, size: len }
    }, [data])

    const handleCopy = useCallback(() => {
        copyWithFallback(fullText)
    }, [fullText])

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    return (
        <div>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="muted" style={{ fontSize: '12px' }}>
                        {t('amap.dataSize')}: {formatSize(size)}
                    </span>
                    {isTruncated && (
                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#92400e' }}>
                            {t('amap.truncated')}
                        </span>
                    )}
                </div>
                <button className="btn" onClick={handleCopy} style={{ fontSize: '12px', padding: '4px 10px' }}>
                    {t('amap.copyResponse')}
                </button>
            </div>
            <pre style={{ padding: '12px', background: '#1e293b', color: '#e2e8f0', borderRadius: '8px', fontSize: '12px', overflow: 'auto', maxHeight: '500px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {expanded ? fullText : displayText}
                {isTruncated && !expanded && '\n\n...'}
            </pre>
            {isTruncated && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button className="btn" onClick={() => setExpanded(!expanded)} style={{ fontSize: '12px' }}>
                        {expanded ? t('amap.collapse') : t('amap.expandAll')}
                    </button>
                    {size > RESPONSE_MAX_LIMIT && !expanded && (
                        <span className="muted" style={{ fontSize: '12px', alignSelf: 'center' }}>
                            ⚠️ {t('amap.largeDataWarning')}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
})

function AmapApiTool() {
    const { t } = useLanguage()

    // 基础配置
    const [apiUrl, setApiUrl] = useState('https://et-api.amap.com/support/survey/out/peopleflow/area/query')
    const [httpMethod, setHttpMethod] = useState('GET')
    const [signType, setSignType] = useState('DIGEST')
    const [selectedCity, setSelectedCity] = useState('shenzhen')

    // DIGEST 配置
    const [clientKey, setClientKey] = useState('ee869215498b7a7216d8964cfc303041')
    const [clientSecret, setClientSecret] = useState('33ade82ee5b0b367f73077832e879f03')

    // TOKEN 配置
    const [apiKey, setApiKey] = useState('d05d7417d6f70eb5f6cbf8a72a824844')
    const [apiSecret, setApiSecret] = useState('6eaa4cc617ebdcbb1546f989b3dd363b')
    const [appName, setAppName] = useState('dz-amap-sdzl')

    // 参数管理
    const [urlParams, setUrlParams] = useState([{ key: 'customAreaId', value: '' }])
    const [postParams, setPostParams] = useState([{ key: 'adcode', value: '440300' }])

    // 结果
    const [generatedUrl, setGeneratedUrl] = useState('')
    const [paramMap, setParamMap] = useState(null)
    const [response, setResponse] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('request')
    const [curlCommand, setCurlCommand] = useState('')
    const [requestDuration, setRequestDuration] = useState(null)

    // 请求中止控制器
    const abortControllerRef = useRef(null)

    // 城市选择
    const handleCityChange = useCallback((city) => {
        setSelectedCity(city)
        if (city && cityConfigs[city]) {
            setClientKey(cityConfigs[city].clientKey)
            setClientSecret(cityConfigs[city].clientSecret)
        }
    }, [])

    // 参数操作
    const addUrlParam = useCallback(() => setUrlParams(prev => [...prev, { key: '', value: '' }]), [])
    const removeUrlParam = useCallback((index) => setUrlParams(prev => prev.filter((_, i) => i !== index)), [])
    const updateUrlParam = useCallback((index, field, value) => {
        setUrlParams(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }, [])

    const addPostParam = useCallback(() => setPostParams(prev => [...prev, { key: '', value: '' }]), [])
    const removePostParam = useCallback((index) => setPostParams(prev => prev.filter((_, i) => i !== index)), [])
    const updatePostParam = useCallback((index, field, value) => {
        setPostParams(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }, [])

    // 构建参数映射
    const buildParamMap = useCallback(() => {
        const params = {}
        urlParams.forEach(p => {
            if (p.key && p.value) params[p.key] = p.value
        })
        params.timestamp = Date.now().toString()

        if (signType === 'DIGEST') {
            if (!clientKey || !clientSecret) {
                setError(t('amap.errorDigestConfig'))
                return null
            }
            params.clientKey = clientKey
            params.userKey = clientKey
            params.digest = generateDigestSign(params, clientSecret)
        } else {
            if (!apiKey || !apiSecret || !appName) {
                setError(t('amap.errorTokenConfig'))
                return null
            }
            params.key = apiKey
            params.appname = appName
            params.token = generateTokenSign(params, apiSecret)
        }
        return params
    }, [urlParams, signType, clientKey, clientSecret, apiKey, apiSecret, appName, t])

    // 生成URL
    const handleGenerateUrl = useCallback(() => {
        setError('')
        setResponse(null)
        if (!apiUrl) { setError(t('amap.errorNoUrl')); return }
        const params = buildParamMap()
        if (!params) return
        const fullUrl = buildFullUrl(apiUrl, params)
        setGeneratedUrl(fullUrl)
        setParamMap(params)
    }, [apiUrl, buildParamMap, t])

    // 浏览器访问
    const handleBrowserOpen = useCallback(() => {
        setError('')
        setResponse(null)
        if (!apiUrl) { setError(t('amap.errorNoUrl')); return }
        const params = buildParamMap()
        if (!params) return
        const fullUrl = buildFullUrl(apiUrl, params)
        setGeneratedUrl(fullUrl)
        setParamMap(params)
        window.open(fullUrl, '_blank')
    }, [apiUrl, buildParamMap, t])

    // 取消请求
    const handleAbort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
            setLoading(false)
        }
    }, [])

    // Fetch请求
    const handleFetchRequest = useCallback(async () => {
        setError('')
        setResponse(null)
        setRequestDuration(null)
        if (!apiUrl) { setError(t('amap.errorNoUrl')); return }
        const params = buildParamMap()
        if (!params) return
        const fullUrl = buildFullUrl(apiUrl, params)
        setGeneratedUrl(fullUrl)
        setParamMap(params)
        setLoading(true)

        // 创建中止控制器
        abortControllerRef.current = new AbortController()
        const startTime = performance.now()

        try {
            const requestUrl = `/api/amap-proxy?target=${encodeURIComponent(fullUrl)}`
            const requestConfig = { method: 'GET', signal: abortControllerRef.current.signal }

            if (httpMethod === 'POST') {
                requestConfig.method = 'POST'
                requestConfig.headers = { 'Content-Type': 'application/json' }
                const body = {}
                postParams.forEach(p => { if (p.key && p.value) body[p.key] = p.value })
                if (Object.keys(body).length > 0) requestConfig.body = JSON.stringify(body)
            }

            const res = await fetch(requestUrl, requestConfig)
            const text = await res.text()
            const duration = performance.now() - startTime

            let data
            try { data = JSON.parse(text) } catch { data = text }

            setRequestDuration(duration)
            setResponse({ status: res.status, statusText: res.statusText, ok: res.ok, data })
        } catch (err) {
            if (err.name === 'AbortError') {
                setError(t('amap.requestAborted'))
            } else {
                setError(t('amap.fetchError') + ': ' + err.message)
            }
        } finally {
            setLoading(false)
            abortControllerRef.current = null
        }
    }, [apiUrl, httpMethod, postParams, buildParamMap, t])

    // 生成CURL
    const handleGenerateCurl = useCallback(() => {
        setError('')
        if (!apiUrl) { setError(t('amap.errorNoUrl')); return }
        const params = buildParamMap()
        if (!params) return
        const fullUrl = buildFullUrl(apiUrl, params)
        setGeneratedUrl(fullUrl)
        setParamMap(params)

        let cmd = `curl -X ${httpMethod} "${fullUrl}"`
        cmd += ` -H "Content-Type: application/json"`
        cmd += ` -H "Accept: application/json"`

        if (httpMethod === 'POST') {
            const body = {}
            postParams.forEach(p => { if (p.key && p.value) body[p.key] = p.value })
            if (Object.keys(body).length > 0) cmd += ` -d '${JSON.stringify(body)}'`
        }
        setCurlCommand(cmd)
    }, [apiUrl, httpMethod, postParams, buildParamMap, t])

    // 复制操作
    const handleCopyUrl = useCallback(() => { if (generatedUrl) copyWithFallback(generatedUrl) }, [generatedUrl])
    const handleCopyCurl = useCallback(() => { if (curlCommand) copyWithFallback(curlCommand) }, [curlCommand])

    // 下载Shell脚本
    const handleDownloadScript = useCallback(() => {
        if (!curlCommand) return
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const content = `#!/bin/bash\n# 高德API请求脚本\n# 生成时间: ${new Date().toLocaleString()}\n\n${curlCommand}\n`
        const blob = new Blob([content], { type: 'text/plain' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `amap_api_request_${ts}.sh`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(a.href)
    }, [curlCommand])

    // 清空
    const handleClearAll = useCallback(() => {
        setApiUrl('https://et-api.amap.com/support/survey/out/peopleflow/area/query')
        setHttpMethod('GET')
        setUrlParams([{ key: 'customAreaId', value: '' }])
        setPostParams([{ key: 'adcode', value: '440300' }])
        setGeneratedUrl('')
        setParamMap(null)
        setResponse(null)
        setError('')
        setCurlCommand('')
        setRequestDuration(null)
        setSelectedCity('shenzhen')
        setClientKey(cityConfigs.shenzhen.clientKey)
        setClientSecret(cityConfigs.shenzhen.clientSecret)
    }, [])

    // 缓存参数JSON显示
    const paramMapDisplay = useMemo(() => {
        return paramMap ? JSON.stringify(paramMap, null, 2) : ''
    }, [paramMap])

    return (
        <div className="card">
            <h2>{t('amap.title')}</h2>
            <p className="muted" style={{ marginBottom: '20px' }}>{t('amap.subtitle')}</p>

            {/* 基础配置 */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>🔧 {t('amap.basicConfig')}</h3>
                <div className="grid-2" style={{ gap: '12px' }}>
                    <div>
                        <label className="muted" style={{ display: 'block', marginBottom: '4px' }}>API URL</label>
                        <input
                            type="text"
                            value={apiUrl}
                            onChange={e => setApiUrl(e.target.value)}
                            placeholder="https://et-api.amap.com/..."
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
                        />
                    </div>
                    <div>
                        <label className="muted" style={{ display: 'block', marginBottom: '4px' }}>{t('amap.httpMethod')}</label>
                        <select
                            value={httpMethod}
                            onChange={e => setHttpMethod(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 签名类型 */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>🔐 {t('amap.signType')}</h3>
                <div className="flex" style={{ gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: signType === 'DIGEST' ? 'var(--primary)' : 'var(--card)', color: signType === 'DIGEST' ? '#fff' : 'var(--text)' }}>
                        <input type="radio" name="signType" value="DIGEST" checked={signType === 'DIGEST'} onChange={() => setSignType('DIGEST')} style={{ display: 'none' }} />
                        DIGEST (HMAC-SHA256)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: signType === 'TOKEN' ? 'var(--primary)' : 'var(--card)', color: signType === 'TOKEN' ? '#fff' : 'var(--text)' }}>
                        <input type="radio" name="signType" value="TOKEN" checked={signType === 'TOKEN'} onChange={() => setSignType('TOKEN')} style={{ display: 'none' }} />
                        TOKEN (MD5)
                    </label>
                </div>
            </div>

            {/* DIGEST 配置 */}
            {signType === 'DIGEST' && (
                <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>{t('amap.digestConfig')}</h3>
                    <div style={{ marginBottom: '12px' }}>
                        <label className="muted" style={{ display: 'block', marginBottom: '4px' }}>{t('amap.selectCity')}</label>
                        <select
                            value={selectedCity}
                            onChange={e => handleCityChange(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
                        >
                            <option value="">{t('amap.selectCityPlaceholder')}</option>
                            {Object.entries(cityConfigs).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.name} ({cfg.nameEn})</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid-2" style={{ gap: '12px' }}>
                        <div>
                            <label className="muted" style={{ display: 'block', marginBottom: '4px' }}>Client Key</label>
                            <input type="text" value={clientKey} onChange={e => setClientKey(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontFamily: 'monospace', fontSize: '13px' }} />
                        </div>
                        <div>
                            <label className="muted" style={{ display: 'block', marginBottom: '4px' }}>Client Secret</label>
                            <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontFamily: 'monospace', fontSize: '13px' }} />
                        </div>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                        <label className="muted" style={{ display: 'block', marginBottom: '4px' }}>User Key <span style={{ fontSize: '11px' }}>({t('amap.autoSync')})</span></label>
                        <input type="text" value={clientKey} readOnly style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--hover-bg, #f5f5f5)', color: 'var(--muted)', fontFamily: 'monospace', fontSize: '13px' }} />
                    </div>
                </div>
            )}

            {/* TOKEN 配置 */}
            {signType === 'TOKEN' && (
                <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>{t('amap.tokenConfig')}</h3>
                    <div className="grid-2" style={{ gap: '12px' }}>
                        <div>
                            <label className="muted" style={{ display: 'block', marginBottom: '4px' }}>API Key</label>
                            <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontFamily: 'monospace', fontSize: '13px' }} />
                        </div>
                        <div>
                            <label className="muted" style={{ display: 'block', marginBottom: '4px' }}>API Secret</label>
                            <input type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontFamily: 'monospace', fontSize: '13px' }} />
                        </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <label className="muted" style={{ display: 'block', marginBottom: '4px' }}>App Name</label>
                        <input type="text" value={appName} onChange={e => setAppName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                    </div>
                </div>
            )}

            {/* URL参数 */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>📋 {t('amap.urlParams')}</h3>
                <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--green, #22c55e) 10%, var(--card))', border: '1px solid var(--green, #22c55e)', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                    <strong>{t('amap.autoTimestamp')}:</strong> timestamp = <TimestampDisplay />
                </div>
                {urlParams.map((param, index) => (
                    <div key={index} className="flex" style={{ gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder={t('amap.paramName')}
                            value={param.key}
                            onChange={e => updateUrlParam(index, 'key', e.target.value)}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
                        />
                        <input
                            type="text"
                            placeholder={t('amap.paramValue')}
                            value={param.value}
                            onChange={e => updateUrlParam(index, 'value', e.target.value)}
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
                        />
                        <button className="btn" onClick={() => removeUrlParam(index)} style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--red, #ef4444)' }}>✕</button>
                    </div>
                ))}
                <button className="btn" onClick={addUrlParam} style={{ fontSize: '13px' }}>+ {t('amap.addParam')}</button>
            </div>

            {/* POST参数 */}
            {httpMethod === 'POST' && (
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>📝 {t('amap.postParams')}</h3>
                    {postParams.map((param, index) => (
                        <div key={index} className="flex" style={{ gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder={t('amap.paramName')}
                                value={param.key}
                                onChange={e => updatePostParam(index, 'key', e.target.value)}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
                            />
                            <input
                                type="text"
                                placeholder={t('amap.paramValue')}
                                value={param.value}
                                onChange={e => updatePostParam(index, 'value', e.target.value)}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
                            />
                            <button className="btn" onClick={() => removePostParam(index)} style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--red, #ef4444)' }}>✕</button>
                        </div>
                    ))}
                    <button className="btn" onClick={addPostParam} style={{ fontSize: '13px' }}>+ {t('amap.addParam')}</button>
                </div>
            )}

            {/* 操作按钮 */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>⚡ {t('amap.actions')}</h3>
                <div className="flex" style={{ gap: '4px', marginBottom: '12px' }}>
                    <button
                        className="btn"
                        onClick={() => setActiveTab('request')}
                        style={{ background: activeTab === 'request' ? 'var(--primary)' : 'var(--card)', color: activeTab === 'request' ? '#fff' : 'var(--text)' }}
                    >
                        {t('amap.tabRequest')}
                    </button>
                    <button
                        className="btn"
                        onClick={() => setActiveTab('curl')}
                        style={{ background: activeTab === 'curl' ? 'var(--primary)' : 'var(--card)', color: activeTab === 'curl' ? '#fff' : 'var(--text)' }}
                    >
                        {t('amap.tabCurl')}
                    </button>
                </div>

                {activeTab === 'request' && (
                    <div className="flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn dark" onClick={handleGenerateUrl}>{t('amap.generateUrl')}</button>
                        <button className="btn" onClick={handleBrowserOpen}>{t('amap.browserOpen')}</button>
                        <button className="btn" onClick={handleFetchRequest} disabled={loading}>
                            {loading ? t('amap.sending') : t('amap.fetchRequest')}
                        </button>
                        {loading && (
                            <button className="btn" onClick={handleAbort} style={{ color: 'var(--red, #ef4444)' }}>
                                {t('amap.abort')}
                            </button>
                        )}
                        <button className="btn" onClick={handleCopyUrl}>{t('amap.copyUrl')}</button>
                        <button className="btn" onClick={handleClearAll}>{t('amap.clearAll')}</button>
                    </div>
                )}

                {activeTab === 'curl' && (
                    <div className="flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn dark" onClick={handleGenerateCurl}>{t('amap.generateCurl')}</button>
                        <button className="btn" onClick={handleCopyCurl}>{t('amap.copyCurl')}</button>
                        <button className="btn" onClick={handleDownloadScript}>{t('amap.downloadScript')}</button>
                    </div>
                )}
            </div>

            {/* 错误提示 */}
            {error && (
                <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            {/* 生成的URL */}
            {generatedUrl && (
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>🔗 {t('amap.generatedUrl')}</h3>
                    <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--green, #22c55e) 8%, var(--card))', border: '1px solid var(--green, #22c55e)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', color: 'var(--text)', maxHeight: '120px', overflow: 'auto' }}>
                        {generatedUrl}
                    </div>
                </div>
            )}

            {/* 参数详情 */}
            {paramMap && (
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>📊 {t('amap.paramDetails')}</h3>
                    <pre style={{ padding: '12px', background: 'var(--hover-bg, #f5f5f5)', borderRadius: '8px', fontSize: '12px', overflow: 'auto', color: 'var(--text)', border: '1px solid var(--border)', maxHeight: '200px' }}>
                        {paramMapDisplay}
                    </pre>
                </div>
            )}

            {/* CURL命令 */}
            {curlCommand && (
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>💻 CURL</h3>
                    <pre style={{ padding: '12px', background: '#1e293b', color: '#e2e8f0', borderRadius: '8px', fontSize: '12px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '200px' }}>
                        {curlCommand}
                    </pre>
                </div>
            )}

            {/* 响应结果 */}
            {response && (
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', marginBottom: '8px' }}>📨 {t('amap.response')}</h3>
                    <div style={{ padding: '8px 12px', marginBottom: '8px', borderRadius: '6px', fontSize: '13px', background: response.ok ? 'color-mix(in srgb, var(--green, #22c55e) 10%, var(--card))' : '#fee2e2', color: response.ok ? 'var(--green, #16a34a)' : '#dc2626', border: `1px solid ${response.ok ? 'var(--green, #22c55e)' : '#dc2626'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><strong>Status:</strong> {response.status} {response.statusText}</span>
                        {requestDuration != null && (
                            <span className="muted" style={{ fontSize: '12px' }}>
                                ⏱ {requestDuration < 1000 ? `${Math.round(requestDuration)}ms` : `${(requestDuration / 1000).toFixed(2)}s`}
                            </span>
                        )}
                    </div>
                    <ResponseViewer data={response.data} t={t} />
                </div>
            )}

            {/* 加载状态 */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="muted">{t('amap.sending')}...</div>
                </div>
            )}
        </div>
    )
}

export default AmapApiTool
