import { useState, useEffect } from 'react'
import { useLanguage } from './utils/i18n'
import TimestampTool from './components/TimestampTool'
import StringDiffTool from './components/StringDiffTool'
import CoordinateTool from './components/CoordinateTool'
import IpTool from './components/IpTool'

function App() {
    const { t, language, toggleLanguage } = useLanguage()
    const [activeTab, setActiveTab] = useState('ts')
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // 检查本地存储，如果没有则默认为浅色模式
        const saved = localStorage.getItem('theme')
        if (saved) return saved === 'dark'
        return false // 默认浅色模式
    })
    const [showScrollToTop, setShowScrollToTop] = useState(false)

    const tabs = [
        { id: 'ts', labelKey: 'app.tabs.timestamp', component: TimestampTool },
        { id: 'diff', labelKey: 'app.tabs.diff', component: StringDiffTool },
        { id: 'coord', labelKey: 'app.tabs.coord', component: CoordinateTool },
        { id: 'ip', labelKey: 'app.tabs.ip', component: IpTool }
    ]

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

    // 应用主题
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    }, [isDarkMode])

    // 监听滚动事件，控制回到顶部按钮的显示
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            setShowScrollToTop(scrollTop > 300) // 滚动超过300px时显示按钮
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode)
    }

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    return (
        <div className="container">
            <header>
                <div className="header-row">
                    <h1>{t('app.title')}</h1>
                    <div className="header-controls">
                        <button
                            className="lang-toggle"
                            onClick={toggleLanguage}
                            aria-label={language === 'zh' ? 'Switch to English' : '切换到中文'}
                        >
                            {language === 'zh' ? '🇺🇸 EN' : '🇨🇳 中文'}
                        </button>
                        <button
                            className="theme-toggle"
                            onClick={toggleTheme}
                            aria-label={isDarkMode ? t('app.switchToLight') : t('app.switchToDark')}
                        >
                            {isDarkMode ? t('app.lightMode') : t('app.darkMode')}
                        </button>
                    </div>
                </div>
                <div className="tabs" role="tablist" aria-label={t('app.title')}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className="tab"
                            role="tab"
                            aria-controls={`panel-${tab.id}`}
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </div>
            </header>

            <section role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
                {ActiveComponent && <ActiveComponent />}
            </section>

            <footer>© {new Date().getFullYear()} – <a href="https://home.cjuju.us.kg/" target="_blank" rel="noopener noreferrer">Devin-juju</a></footer>

            {/* 全局回到顶部按钮 */}
            {showScrollToTop && (
                <button
                    className="scroll-to-top"
                    onClick={scrollToTop}
                    aria-label={t('app.scrollToTop')}
                    title={t('app.scrollToTop')}
                >
                    ↑
                </button>
            )}
        </div>
    )
}

export default App