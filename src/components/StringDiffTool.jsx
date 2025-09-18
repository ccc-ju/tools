import { useState } from 'react'
import { copyWithFallback } from '../utils/clipboard'

function StringDiffTool() {
  const [leftText, setLeftText] = useState('')
  const [rightText, setRightText] = useState('')
  const [diffGroups, setDiffGroups] = useState([])
  const [picked, setPicked] = useState({})
  const [mergedResult, setMergedResult] = useState('')

  // 字符级别的对比算法
  const charLevelDiff = (str1, str2) => {
    const chars1 = Array.from(str1)
    const chars2 = Array.from(str2)
    const n = chars1.length
    const m = chars2.length
    
    // 动态规划计算最长公共子序列
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
    
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        if (chars1[i] === chars2[j]) {
          dp[i][j] = dp[i + 1][j + 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
        }
      }
    }
    
    // 回溯构建差异序列
    const result = []
    let i = 0, j = 0
    
    while (i < n && j < m) {
      if (chars1[i] === chars2[j]) {
        result.push({ type: 'eq', char1: chars1[i], char2: chars2[j] })
        i++
        j++
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        result.push({ type: 'del', char1: chars1[i], char2: null })
        i++
      } else {
        result.push({ type: 'add', char1: null, char2: chars2[j] })
        j++
      }
    }
    
    // 处理剩余字符
    while (i < n) {
      result.push({ type: 'del', char1: chars1[i], char2: null })
      i++
    }
    while (j < m) {
      result.push({ type: 'add', char1: null, char2: chars2[j] })
      j++
    }
    
    return result
  }

  const doDiff = () => {
    const charDiffs = charLevelDiff(leftText || '', rightText || '')
    const groups = []
    let i = 0
    
    while (i < charDiffs.length) {
      const cur = charDiffs[i]
      
      if (cur.type === 'eq') {
        // 收集连续的相同字符
        let text = cur.char1
        i++
        while (i < charDiffs.length && charDiffs[i].type === 'eq') {
          text += charDiffs[i].char1
          i++
        }
        groups.push({ kind: 'eq', a: text, b: text, key: groups.length })
        continue
      }
      
      // 收集连续的删除字符
      let dels = ''
      while (i < charDiffs.length && charDiffs[i].type === 'del') {
        dels += charDiffs[i].char1
        i++
      }
      
      // 收集连续的新增字符
      let adds = ''
      while (i < charDiffs.length && charDiffs[i].type === 'add') {
        adds += charDiffs[i].char2
        i++
      }
      
      // 根据删除和新增的情况创建组
      if (dels && adds) {
        groups.push({ kind: 'replace', a: dels, b: adds, key: groups.length })
      } else if (dels) {
        groups.push({ kind: 'del', a: dels, b: '', key: groups.length })
      } else if (adds) {
        groups.push({ kind: 'add', a: '', b: adds, key: groups.length })
      }
    }

    const newPicked = {}
    groups.forEach(g => {
      if (g.kind !== 'eq') newPicked[g.key] = 'right'
    })
    
    setDiffGroups(groups)
    setPicked(newPicked)
    renderMerged(groups, newPicked)
  }

  const renderMerged = (groups = diffGroups, pickedState = picked) => {
    const result = groups.map(g => 
      g.kind === 'eq' ? g.a : (pickedState[g.key] === 'left' ? g.a : g.b)
    ).join('')
    setMergedResult(result)
  }

  const handlePick = (key, side) => {
    const newPicked = { ...picked, [key]: side }
    setPicked(newPicked)
    renderMerged(diffGroups, newPicked)
  }

  // 简单的高亮渲染：相同部分绿色，不同部分红色
  const renderSimpleHighlightedText = (side) => {
    return diffGroups.map((group, index) => {
      const text = side === 'left' ? group.a : group.b
      
      if (group.kind === 'eq') {
        // 相同部分：绿色背景
        return (
          <span 
            key={index}
            style={{
              backgroundColor: '#dcfce7',
              color: '#166534'
            }}
          >
            {text}
          </span>
        )
      } else {
        // 不同部分：红色背景，可点击选择
        const isSelected = picked[group.key] === side
        return (
          <span 
            key={index}
            onClick={() => handlePick(group.key, side)}
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              cursor: 'pointer',
              border: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
              borderRadius: '3px',
              padding: '1px 2px'
            }}
            title={`点击选择${side === 'left' ? '左侧' : '右侧'}内容`}
          >
            {text || '∅'}
          </span>
        )
      }
    })
  }

  return (
    <div className="card">
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>字符串对比与手动合并</h2>
        <div className="flex" style={{ gap: '12px' }}>
          <button 
            className="btn dark" 
            onClick={doDiff}
          >
            开始对比
          </button>
          <button 
            className="btn" 
            onClick={() => {
              setLeftText('111')
              setRightText('121')
            }}
          >
            示例(111 vs 121)
          </button>
          <button 
            className="btn" 
            onClick={() => copyWithFallback(mergedResult)}
          >
            复制合并结果
          </button>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div>
          <div className="muted" style={{ marginBottom: '8px', fontWeight: '500' }}>原始字符串</div>
          <textarea 
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            placeholder="在这里粘贴左侧（原始）字符串" 
            style={{ borderRadius: '8px', padding: '16px', fontSize: '14px', minHeight: '120px' }}
          />
        </div>
        <div>
          <div className="muted" style={{ marginBottom: '8px', fontWeight: '500' }}>对比字符串</div>
          <textarea 
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            placeholder="在这里粘贴右侧（对比）字符串" 
            style={{ borderRadius: '8px', padding: '16px', fontSize: '14px', minHeight: '120px' }}
          />
        </div>
      </div>



      {/* 整体对比视图 */}
      {diffGroups.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="muted" style={{ marginBottom: '12px', fontWeight: '500' }}>📊 整体对比视图</div>
          <div className="grid-2">
            <div>
              <div className="muted" style={{ marginBottom: '8px', fontSize: '12px' }}>原始字符串（左侧）</div>
              <div style={{ 
                padding: '16px', 
                background: 'var(--card)', 
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontFamily: 'monospace', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontSize: '14px',
                lineHeight: '1.6',
                minHeight: '120px'
              }}>
                {renderSimpleHighlightedText('left')}
              </div>
            </div>
            <div>
              <div className="muted" style={{ marginBottom: '8px', fontSize: '12px' }}>对比字符串（右侧）</div>
              <div style={{ 
                padding: '16px', 
                background: 'var(--card)', 
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontFamily: 'monospace', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontSize: '14px',
                lineHeight: '1.6',
                minHeight: '120px'
              }}>
                {renderSimpleHighlightedText('right')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 快速选择按钮 */}
      {diffGroups.length > 0 && diffGroups.some(g => g.kind !== 'eq') && (
        <div style={{ marginBottom: '20px' }}>
          <div className="muted" style={{ marginBottom: '8px', fontWeight: '500' }}>🎯 快速选择</div>
          <div className="flex" style={{ gap: '12px' }}>
            <button 
              className="btn" 
              onClick={() => {
                const newPicked = {}
                diffGroups.forEach(g => {
                  if (g.kind !== 'eq') newPicked[g.key] = 'left'
                })
                setPicked(newPicked)
                renderMerged(diffGroups, newPicked)
              }}
            >
              全选左侧
            </button>
            <button 
              className="btn" 
              onClick={() => {
                const newPicked = {}
                diffGroups.forEach(g => {
                  if (g.kind !== 'eq') newPicked[g.key] = 'right'
                })
                setPicked(newPicked)
                renderMerged(diffGroups, newPicked)
              }}
            >
              全选右侧
            </button>
          </div>
        </div>
      )}

      {/* 合并结果 */}
      <div>
        <div className="muted" style={{ marginBottom: '8px', fontWeight: '500' }}>合并结果（可二次编辑）</div>
        <textarea 
          value={mergedResult}
          onChange={(e) => setMergedResult(e.target.value)}
          style={{ 
            borderRadius: '8px', 
            padding: '16px', 
            fontSize: '14px', 
            minHeight: '120px', 
            background: '#f8f9fa' 
          }} 
        />
      </div>
    </div>
  )
}

export default StringDiffTool