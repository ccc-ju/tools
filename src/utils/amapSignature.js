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
        clientKey: 'ee869215498b7a7216d8964cfc303041',
        clientSecret: '33ade82ee5b0b367f73077832e879f03'
    },
    nanning: {
        name: '南宁',
        nameEn: 'Nanning',
        clientKey: '2ffe59f5939a7f00102f2b3091b6e216',
        clientSecret: 'ea0ccae79fd87857ad60c3c64e683756'
    },
    quzhou1: {
        name: '衢州1',
        nameEn: 'Quzhou 1',
        clientKey: '934c26e878d8eeb0253705d153c97334',
        clientSecret: '39b4a34f0b17e8ef0b4cdfa3a6b273e9'
    },
    quzhou2: {
        name: '衢州2',
        nameEn: 'Quzhou 2',
        clientKey: 'd05d7417d6f70eb5f6cbf8a72a824844',
        clientSecret: 'b6c8e84fc756d898ccf3897c5a1625a0'
    }
}
