import { createContext, useContext, useState, useEffect } from 'react'
import zh from '../locales/zh'
import en from '../locales/en'

// 翻译资源
const translations = { zh, en }

// 检测浏览器语言，返回 'zh' 或 'en'
const detectBrowserLanguage = () => {
    const browserLang = navigator.language || navigator.userLanguage || 'en'
    // 如果浏览器语言以 'zh' 开头（如 zh-CN, zh-TW），则使用中文
    return browserLang.startsWith('zh') ? 'zh' : 'en'
}

// 获取初始语言：优先 localStorage，其次浏览器检测
const getInitialLanguage = () => {
    const saved = localStorage.getItem('language')
    if (saved && (saved === 'zh' || saved === 'en')) {
        return saved
    }
    return detectBrowserLanguage()
}

// 创建语言上下文
const LanguageContext = createContext(null)

// 语言提供者组件
export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(getInitialLanguage)

    // 保存语言选择到 localStorage
    useEffect(() => {
        localStorage.setItem('language', language)
    }, [language])

    // 切换语言
    const toggleLanguage = () => {
        setLanguage(prev => prev === 'zh' ? 'en' : 'zh')
    }

    // 翻译函数：支持嵌套键如 'app.title'
    const t = (key) => {
        const keys = key.split('.')
        let value = translations[language]

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k]
            } else {
                // 如果找不到翻译，返回 key
                console.warn(`Translation missing for key: ${key}`)
                return key
            }
        }

        return value
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

// 自定义 Hook 用于获取语言相关功能
export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

export default LanguageContext
