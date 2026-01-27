import { useState, useCallback, useRef } from 'react'
import { copyWithFallback } from '../utils/clipboard'

function StringDiffTool() {
    const [leftText, setLeftText] = useState('')
    const [rightText, setRightText] = useState('')
    const [diffGroups, setDiffGroups] = useState([])
    const [picked, setPicked] = useState({})
    const [mergedResult, setMergedResult] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingMessage, setProcessingMessage] = useState('')
    const abortControllerRef = useRef(null)

    // 优化的字符级别对比算法，支持大型字符串
    const charLevelDiff = (str1, str2) => {
        const maxLength = 50000 // 设置最大处理长度
        const totalLength = str1.length + str2.length

        // 如果字符串太大，使用简化的行级对比
        if (totalLength > maxLength) {
            return lineLevelDiff(str1, str2)
        }

        const chars1 = Array.from(str1)
        const chars2 = Array.from(str2)
        const n = chars1.length
        const m = chars2.length

        // 对于中等大小的字符串，使用优化的Myers算法
        if (totalLength > 10000) {
            return myersDiff(chars1, chars2)
        }

        // 对于小字符串，使用原来的动态规划算法
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

    // 简化的Myers算法实现
    const myersDiff = (chars1, chars2) => {
        const result = []
        let i = 0, j = 0

        while (i < chars1.length && j < chars2.length) {
            if (chars1[i] === chars2[j]) {
                result.push({ type: 'eq', char1: chars1[i], char2: chars2[j] })
                i++
                j++
            } else {
                // 简单的贪心策略：寻找下一个匹配点
                let found = false
                const lookAhead = Math.min(100, chars1.length - i, chars2.length - j)

                for (let k = 1; k <= lookAhead; k++) {
                    if (i + k < chars1.length && chars1[i + k] === chars2[j]) {
                        // 删除chars1中的字符
                        for (let l = 0; l < k; l++) {
                            result.push({ type: 'del', char1: chars1[i + l], char2: null })
                        }
                        i += k
                        found = true
                        break
                    }
                    if (j + k < chars2.length && chars1[i] === chars2[j + k]) {
                        // 添加chars2中的字符
                        for (let l = 0; l < k; l++) {
                            result.push({ type: 'add', char1: null, char2: chars2[j + l] })
                        }
                        j += k
                        found = true
                        break
                    }
                }

                if (!found) {
                    // 没找到匹配，当作替换处理
                    result.push({ type: 'del', char1: chars1[i], char2: null })
                    result.push({ type: 'add', char1: null, char2: chars2[j] })
                    i++
                    j++
                }
            }
        }

        // 处理剩余字符
        while (i < chars1.length) {
            result.push({ type: 'del', char1: chars1[i], char2: null })
            i++
        }
        while (j < chars2.length) {
            result.push({ type: 'add', char1: null, char2: chars2[j] })
            j++
        }

        return result
    }

    // 混合策略：行级对比 + 字符级精确对比
    const lineLevelDiff = (str1, str2) => {
        const lines1 = str1.split('\n')
        const lines2 = str2.split('\n')
        const result = []

        // 首先进行行级对比，找出相同和不同的行
        const lineChanges = getLineChanges(lines1, lines2)

        // 对每个变化进行处理
        for (const change of lineChanges) {
            if (change.type === 'eq') {
                // 相同行，直接添加
                const line = change.line + '\n'
                for (const char of line) {
                    result.push({ type: 'eq', char1: char, char2: char })
                }
            } else if (change.type === 'replace') {
                // 不同行，进行字符级精确对比
                const charDiff = getCharDiffForLines(change.oldLine, change.newLine)
                result.push(...charDiff)

                // 添加换行符的处理
                result.push({ type: 'eq', char1: '\n', char2: '\n' })
            } else if (change.type === 'del') {
                // 删除的行
                const line = change.line + '\n'
                for (const char of line) {
                    result.push({ type: 'del', char1: char, char2: null })
                }
            } else if (change.type === 'add') {
                // 新增的行
                const line = change.line + '\n'
                for (const char of line) {
                    result.push({ type: 'add', char1: null, char2: char })
                }
            }
        }

        return result
    }

    // 获取行级变化
    const getLineChanges = (lines1, lines2) => {
        const changes = []
        let i = 0, j = 0

        while (i < lines1.length && j < lines2.length) {
            if (lines1[i] === lines2[j]) {
                // 相同行
                changes.push({ type: 'eq', line: lines1[i] })
                i++
                j++
            } else {
                // 寻找最佳匹配策略
                const match = findBestLineMatch(lines1, lines2, i, j)

                if (match.type === 'replace') {
                    // 替换：两行都存在但内容不同，进行字符级对比
                    changes.push({
                        type: 'replace',
                        oldLine: lines1[i],
                        newLine: lines2[j]
                    })
                    i++
                    j++
                } else if (match.type === 'delete') {
                    // 删除：左侧有行，右侧没有对应行
                    for (let k = 0; k < match.count; k++) {
                        changes.push({ type: 'del', line: lines1[i + k] })
                    }
                    i += match.count
                } else if (match.type === 'insert') {
                    // 插入：右侧有行，左侧没有对应行
                    for (let k = 0; k < match.count; k++) {
                        changes.push({ type: 'add', line: lines2[j + k] })
                    }
                    j += match.count
                }
            }
        }

        // 处理剩余行
        while (i < lines1.length) {
            changes.push({ type: 'del', line: lines1[i] })
            i++
        }
        while (j < lines2.length) {
            changes.push({ type: 'add', line: lines2[j] })
            j++
        }

        return changes
    }

    // 寻找最佳行匹配策略
    const findBestLineMatch = (lines1, lines2, i, j) => {
        const lookAhead = Math.min(5, lines1.length - i, lines2.length - j)

        // 检查是否是简单的一对一替换
        if (i + 1 < lines1.length && j + 1 < lines2.length) {
            if (lines1[i + 1] === lines2[j + 1]) {
                return { type: 'replace' }
            }
        }

        // 寻找下一个匹配点
        for (let k = 1; k <= lookAhead; k++) {
            // 检查删除情况
            if (i + k < lines1.length && lines1[i + k] === lines2[j]) {
                return { type: 'delete', count: k }
            }
            // 检查插入情况
            if (j + k < lines2.length && lines1[i] === lines2[j + k]) {
                return { type: 'insert', count: k }
            }
        }

        // 默认为替换
        return { type: 'replace' }
    }

    // 对两行进行字符级精确对比
    const getCharDiffForLines = (line1, line2) => {
        const chars1 = Array.from(line1)
        const chars2 = Array.from(line2)
        const n = chars1.length
        const m = chars2.length

        // 对于行内对比，使用精确的动态规划算法
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

    const doDiff = useCallback(async () => {
        if (isProcessing) {
            // 如果正在处理，取消当前操作
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            return
        }

        const str1 = leftText || ''
        const str2 = rightText || ''
        const totalLength = str1.length + str2.length

        if (totalLength === 0) {
            setDiffGroups([])
            setPicked({})
            setMergedResult('')
            return
        }

        setIsProcessing(true)
        abortControllerRef.current = new AbortController()

        try {
            // 根据字符串大小显示不同的处理消息
            if (totalLength > 50000) {
                setProcessingMessage('处理大型文本中，使用混合策略（行级+字符级精确对比）...')
            } else if (totalLength > 10000) {
                setProcessingMessage('处理中等文本中，使用优化算法...')
            } else {
                setProcessingMessage('处理文本对比中...')
            }

            // 使用setTimeout让UI有机会更新
            await new Promise(resolve => setTimeout(resolve, 100))

            if (abortControllerRef.current?.signal.aborted) {
                return
            }

            const charDiffs = charLevelDiff(str1, str2)

            if (abortControllerRef.current?.signal.aborted) {
                return
            }

            setProcessingMessage('构建差异组中...')
            await new Promise(resolve => setTimeout(resolve, 50))

            const groups = []
            let i = 0

            while (i < charDiffs.length) {
                if (abortControllerRef.current?.signal.aborted) {
                    return
                }

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

                // 每处理1000个差异项就让出控制权
                if (groups.length % 1000 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                }
            }

            if (abortControllerRef.current?.signal.aborted) {
                return
            }

            const newPicked = {}
            groups.forEach(g => {
                if (g.kind !== 'eq') newPicked[g.key] = 'right'
            })

            setDiffGroups(groups)
            setPicked(newPicked)
            renderMerged(groups, newPicked)

        } catch (error) {
            console.error('Diff processing error:', error)
            alert('处理过程中出现错误，可能是文本过大导致的。请尝试使用较小的文本。')
        } finally {
            setIsProcessing(false)
            setProcessingMessage('')
            abortControllerRef.current = null
        }
    }, [leftText, rightText, isProcessing])

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
                        {text || <span style={{ opacity: 0.5, fontSize: '10px' }}>[空]</span>}
                    </span>
                )
            }
        })
    }

    return (
        <div className="card">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2>字符串对比与手动合并</h2>
                <div className="flex" style={{ gap: '12px', alignItems: 'center' }}>
                    {isProcessing && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--primary)',
                            fontSize: '14px'
                        }}>
                            <div style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid var(--primary)',
                                borderTop: '2px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            {processingMessage}
                        </div>
                    )}
                    <button
                        className={`btn ${isProcessing ? '' : 'dark'}`}
                        onClick={doDiff}
                        disabled={isProcessing && !abortControllerRef.current}
                    >
                        {isProcessing ? '取消处理' : '开始对比'}
                    </button>
                    <button
                        className="btn"
                        onClick={() => copyWithFallback(mergedResult)}
                        disabled={!mergedResult}
                    >
                        复制合并结果
                    </button>
                    <button
                        className="btn"
                        onClick={() => {
                            setLeftText('')
                            setRightText('')
                            setDiffGroups([])
                            setPicked({})
                            setMergedResult('')
                        }}
                        disabled={isProcessing}
                        style={{
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: '1px solid #fecaca'
                        }}
                    >
                        清空全部
                    </button>
                </div>
            </div>

            {/* 添加CSS动画 */}
            <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

            {/* 输入区域 */}
            <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div>
                    <div className="muted" style={{ marginBottom: '8px', fontWeight: '500' }}>
                        原始字符串
                        {leftText && (
                            <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                                ({leftText.length.toLocaleString()} 字符)
                            </span>
                        )}
                    </div>
                    <textarea
                        value={leftText}
                        onChange={(e) => setLeftText(e.target.value)}
                        placeholder="在这里粘贴左侧（原始）字符串"
                        style={{ borderRadius: '8px', padding: '16px', fontSize: '14px', minHeight: '120px' }}
                        disabled={isProcessing}
                    />
                </div>
                <div>
                    <div className="muted" style={{ marginBottom: '8px', fontWeight: '500' }}>
                        对比字符串
                        {rightText && (
                            <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                                ({rightText.length.toLocaleString()} 字符)
                            </span>
                        )}
                    </div>
                    <textarea
                        value={rightText}
                        onChange={(e) => setRightText(e.target.value)}
                        placeholder="在这里粘贴右侧（对比）字符串"
                        style={{ borderRadius: '8px', padding: '16px', fontSize: '14px', minHeight: '120px' }}
                        disabled={isProcessing}
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
                <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div className="muted" style={{ fontWeight: '500' }}>
                        合并结果（可二次编辑）
                        {mergedResult && (
                            <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                                ({mergedResult.length.toLocaleString()} 字符)
                            </span>
                        )}
                    </div>
                    <div className="flex" style={{ gap: '8px' }}>
                        <button
                            className="btn"
                            onClick={() => copyWithFallback(mergedResult)}
                            disabled={!mergedResult}
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                            📋 复制结果
                        </button>
                        <button
                            className="btn"
                            onClick={() => setMergedResult('')}
                            disabled={!mergedResult}
                            style={{
                                fontSize: '12px',
                                padding: '6px 12px',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fecaca'
                            }}
                        >
                            🗑️ 清空结果
                        </button>
                    </div>
                </div>
                <textarea
                    value={mergedResult}
                    onChange={(e) => setMergedResult(e.target.value)}
                    placeholder="合并结果将显示在这里..."
                    style={{
                        borderRadius: '8px',
                        padding: '16px',
                        fontSize: '14px',
                        minHeight: '120px',
                        background: 'var(--input-readonly-bg)'
                    }}
                />
            </div>
        </div>
    )
}

export default StringDiffTool