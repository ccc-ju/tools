import { useState } from 'react'
import { copyWithFallback } from '../utils/clipboard'

function StringDiffTool() {
  const [leftText, setLeftText] = useState('')
  const [rightText, setRightText] = useState('')
  const [diffGroups, setDiffGroups] = useState([])
  const [picked, setPicked] = useState({})
  const [mergedResult, setMergedResult] = useState('')

  const tokenize = (str) => {
    const arr = []
    let buf = ''
    const flush = () => {
      if (buf) {
        arr.push({ t: buf, k: 'w' })
        buf = ''
      }
    }
    for (const ch of str) {
      if (/\w|[\u4e00-\u9fa5]/.test(ch)) {
        buf += ch
      } else {
        flush()
        arr.push({ t: ch, k: 's' })
      }
    }
    flush()
    return arr
  }

  const lcs = (a, b) => {
    const n = a.length, m = b.length
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
    
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i].t === b[j].t ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
    
    const res = []
    let i = 0, j = 0
    while (i < n && j < m) {
      if (a[i].t === b[j].t) {
        res.push({ type: 'eq', token: a[i] })
        i++
        j++
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        res.push({ type: 'del', token: a[i++] })
      } else {
        res.push({ type: 'add', token: b[j++] })
      }
    }
    while (i < n) res.push({ type: 'del', token: a[i++] })
    while (j < m) res.push({ type: 'add', token: b[j++] })
    return res
  }

  const doDiff = () => {
    const A = tokenize(leftText || '')
    const B = tokenize(rightText || '')
    const seq = lcs(A, B)
    const groups = []
    let i = 0
    
    while (i < seq.length) {
      const cur = seq[i]
      if (cur.type === 'eq') {
        let text = cur.token.t
        i++
        while (i < seq.length && seq[i].type === 'eq') {
          text += seq[i].token.t
          i++
        }
        groups.push({ kind: 'eq', a: text, b: text, key: groups.length })
        continue
      }
      
      let dels = ''
      while (i < seq.length && seq[i].type === 'del') {
        dels += seq[i].token.t
        i++
      }
      
      let adds = ''
      while (i < seq.length && seq[i].type === 'add') {
        adds += seq[i].token.t
        i++
      }
      
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

  const getDiffBlockStyle = (kind) => {
    const colors = {
      eq: { bg: '#f0f9ff', border: '#e5e7eb' },
      add: { bg: '#f0fdf4', border: '#22c55e' },
      del: { bg: '#fef2f2', border: '#ef4444' },
      replace: { bg: '#fffbeb', border: '#f59e0b' }
    }
    return colors[kind] || colors.eq
  }

  const getDiffTitle = (kind) => {
    const titles = {
      eq: '✓ 一致',
      add: '+ 新增（右侧）',
      del: '- 删除（左侧）',
      replace: '⚠ 替换'
    }
    return titles[kind] || '未知'
  }

  return (
    <div className="card">
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>字符串对比与手动合并</h2>
        <div className="flex" style={{ gap: '12px' }}>
          <button 
            className="btn dark" 
            onClick={doDiff}
            style={{ padding: '10px 20px', borderRadius: '8px' }}
          >
            开始对比
          </button>
          <button 
            className="btn" 
            onClick={() => copyWithFallback(mergedResult)}
            style={{ padding: '10px 20px', borderRadius: '8px' }}
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

      {/* 差异对比结果 */}
      <div style={{ marginBottom: '24px' }}>
        {diffGroups.map(g => {
          const { bg, border } = getDiffBlockStyle(g.kind)
          return (
            <div 
              key={g.key}
              style={{ 
                background: bg, 
                border: `1px solid ${border}`, 
                borderRadius: '12px', 
                marginBottom: '16px', 
                overflow: 'hidden' 
              }}
            >
              {/* 标题栏 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px 16px', 
                borderBottom: '1px solid rgba(0,0,0,0.1)', 
                fontWeight: '500' 
              }}>
                {getDiffTitle(g.kind)}
                {g.kind !== 'eq' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        background: picked[g.key] === 'left' ? '#3b82f6' : '#fff',
                        color: picked[g.key] === 'left' ? '#fff' : '#000',
                        border: `1px solid ${picked[g.key] === 'left' ? '#3b82f6' : '#d1d5db'}`
                      }}
                      onClick={() => handlePick(g.key, 'left')}
                    >
                      选择左侧
                    </button>
                    <button
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        background: picked[g.key] === 'right' ? '#3b82f6' : '#fff',
                        color: picked[g.key] === 'right' ? '#fff' : '#000',
                        border: `1px solid ${picked[g.key] === 'right' ? '#3b82f6' : '#d1d5db'}`
                      }}
                      onClick={() => handlePick(g.key, 'right')}
                    >
                      选择右侧
                    </button>
                  </div>
                )}
              </div>
              
              {/* 内容区域 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1px', 
                background: '#e5e7eb' 
              }}>
                <div style={{ 
                  padding: '16px', 
                  background: '#fff', 
                  fontFamily: 'monospace', 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-all' 
                }}>
                  {g.a || '∅ 空内容'}
                </div>
                <div style={{ 
                  padding: '16px', 
                  background: '#fff', 
                  fontFamily: 'monospace', 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-all' 
                }}>
                  {g.b || '∅ 空内容'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

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