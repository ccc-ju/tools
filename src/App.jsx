import { useState } from 'react'
import TimestampTool from './components/TimestampTool'
import StringDiffTool from './components/StringDiffTool'
import CoordinateTool from './components/CoordinateTool'

function App() {
  const [activeTab, setActiveTab] = useState('ts')

  const tabs = [
    { id: 'ts', label: '时间戳转换', component: TimestampTool },
    { id: 'diff', label: '字符串对比', component: StringDiffTool },
    { id: 'coord', label: '坐标系转换', component: CoordinateTool }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="container">
      <header>
        <div className="header-row">
          <h1>工具箱</h1>
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