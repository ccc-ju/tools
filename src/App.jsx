import { useState, useEffect } from 'react'
import TimestampTool from './components/TimestampTool'
import StringDiffTool from './components/StringDiffTool'
import CoordinateTool from './components/CoordinateTool'

function App() {
    const [activeTab, setActiveTab] = useState('ts')
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // 检查本地存储，如果没有则默认为浅色模式
        const saved = localStorage.getItem('theme')
        if (saved) return saved === 'dark'
        return false // 默认浅色模式
    })

    const tabs = [
        { id: 'ts', label: '时间戳转换', component: TimestampTool },
        { id: 'diff', label: '字符串对比', component: StringDiffTool },
        { id: 'coord', label: '坐标系转换', component: CoordinateTool }
    ]

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

    // 应用主题
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    }, [isDarkMode])

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode)
    }

    return (
        <div className="container">
            <header>
                <div className="header-row">
                    <h1>工具箱</h1>
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
                    >
                        {isDarkMode ? '🌞 浅色' : '🌙 深色'}
                    </button>
                </div>
                <div className="tabs" role="tablist" aria-label="工具切换">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className="tab"
                            role="tab"
                            aria-controls={`panel-${tab.id}`}
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <section role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
                {ActiveComponent && <ActiveComponent />}
            </section>

            <footer>© {new Date().getFullYear()} – Devin - juju</footer>
        </div>
    )
}

export default App