import CryptoJS from 'crypto-js'

/**
 * 高德API签名工具
 * 支持 DIGEST (HMAC-SHA256) 和 TOKEN (MD5) 两种签名方式
 */

/**
 * DIGEST签名 - HMAC-SHA256
 * 1. 将所有参数按参数名排序
 * 2. 将参数值拼接成字符串
 * 3. 使用 HMAC-SHA256 计算签名
 */
export function generateDigestSign(params, secret) {
    const sortedKeys = Object.keys(params).sort()
    const paramValues = sortedKeys
        .map(key => params[key])
        .filter(val => val !== null && val !== undefined)
    const paramString = paramValues.join('')
    const hmac = CryptoJS.HmacSHA256(paramString, secret)
    return hmac.toString(CryptoJS.enc.Hex)
}

/**
 * TOKEN签名 - MD5
 * 1. 将所有参数按参数名排序
 * 2. 将参数值用分号拼接
 * 3. 末尾追加分号和密钥
 * 4. 使用 MD5 计算签名
 */
export function generateTokenSign(params, secret) {
    const sortedKeys = Object.keys(params).sort()
    const paramValues = sortedKeys
        .map(key => params[key])
        .filter(val => val !== null && val !== undefined)
    const paramString = paramValues.join(';')
    const finalString = paramString + ';' + secret
    return CryptoJS.MD5(finalString).toString()
}

/**
 * 构建完整URL
 * timestamp 参数放在第一位，其余参数按字母序排列
 */
export function buildFullUrl(baseUrl, params) {
    if (Object.keys(params).length === 0) return baseUrl

    const timestampValue = params.timestamp
    const otherParams = { ...params }
    delete otherParams.timestamp

    const sortedKeys = Object.keys(otherParams).sort()
    const queryParams = []

    if (timestampValue !== null && timestampValue !== undefined) {
        queryParams.push(`timestamp=${timestampValue}`)
    }

    sortedKeys.forEach(key => {
        if (otherParams[key] !== null && otherParams[key] !== undefined) {
            queryParams.push(`${key}=${otherParams[key]}`)
        }
    })

    const queryString = queryParams.join('&')
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}${queryString}`
}

/**
 * 城市配置预设
 */
export const cityConfigs = {
    shenzhen: {
        name: '深圳',
        nameEn: 'Shenzhen',
        clientKey: '',
        clientSecret: ''
    },
    nanning: {
        name: '南宁',
        nameEn: 'Nanning',
        clientKey: '',
        clientSecret: ''
    },
    quzhou1: {
        name: '衢州1',
        nameEn: 'Quzhou 1',
        clientKey: '',
        clientSecret: ''
    },
    quzhou2: {
        name: '衢州2',
        nameEn: 'Quzhou 2',
        clientKey: '',
        clientSecret: ''
    }
}
