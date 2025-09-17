import { useState, useEffect, useRef } from 'react'
import { copyWithFallback } from '../utils/clipboard'

function TimestampTool() {
  const [currentTime, setCurrentTime] = useState('')
  const [isRunning, setIsRunning] = useState(true)
  const [epochInput, setEpochInput] = useState(String(Date.now()))
  const [epochUnit, setEpochUnit] = useState('ms')
  const [epochOutput, setEpochOutput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [dateOutput, setDateOutput] = useState('')
  const intervalRef = useRef()

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date()
      const formatted = now.getFullYear() + '-' + 
        (now.getMonth() + 1).toString().padStart(2, '0') + '-' + 
        now.getDate().toString().padStart(2, '0') + ' ' + 
        now.getHours().toString().padStart(2, '0') + ':' + 
        now.getMinutes().toString().padStart(2, '0') + ':' + 
        now.getSeconds().toString().padStart(2, '0')
      setCurrentTime(formatted)
    }

    if (isRunning) {
      intervalRef.current = setInterval(updateCurrentTime, 250)
      updateCurrentTime()
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const handleEpochUnitChange = (newUnit) => {
    const prev = epochInput.trim()
    if (!prev) {
      setEpochUnit(newUnit)
      return
    }

    if (newUnit === 'ms' && epochUnit === 's') {
      setEpochInput(prev + '000')
    } else if (newUnit === 's' && epochUnit === 'ms') {
      setEpochInput(prev.endsWith('000') ? prev.slice(0, -3) : String(Math.floor(Number(prev) / 1000)))
    }
    setEpochUnit(newUnit)
  }

  const convertEpochToDate = () => {
    const raw = epochInput.trim()
    if (!raw) {
      setEpochOutput('')
      return
    }
    
    const n = Number(raw)
    if (Number.isNaN(n)) {
      setEpochOutput('格式错误')
      return
    }
    
    const tsMs = epochUnit === 'ms' ? n : n * 1000
    const d = new Date(tsMs)
    const formatted = d.getFullYear() + '-' + 
      (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
      d.getDate().toString().padStart(2, '0') + ' ' + 
      d.getHours().toString().padStart(2, '0') + ':' + 
      d.getMinutes().toString().padStart(2, '0') + ':' + 
      d.getSeconds().toString().padStart(2, '0')
    setEpochOutput(formatted)
  }

  const convertDateToEpoch = () => {
    const input = dateInput.trim()
    if (!input) {
      setDateOutput('')
      return
    }
    
    const s = input.replace('T', ' ')
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/)
    if (!m) {
      setDateOutput('格式错误，示例：2025-09-13 11:19:55')
      return
    }
    
    const [, y, M, d, h, mn, ss] = m
    const localDate = new Date(+y, +M - 1, +d, +h, +mn, +(ss || 0))
    setDateOutput(String(localDate.getTime()))
  }

  return (
    <div className="card">
      <h2>时间戳转换</h2>
      
      {/* 当前时间显示 */}
      <div style={{ marginBottom: '32px' }}>
        <div className="muted" style={{ marginBottom: '12px', fontWeight: '500' }}>当前时间</div>
        <div className="row" style={{ gridTemplateColumns: '1fr auto auto', gap: '16px', alignItems: 'center' }}>
          <input 
            value={currentTime} 
            readOnly 
            style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }} 
          />
          <button 
            className="btn" 
            onClick={toggleTimer}
            style={{ padding: '10px 20px', borderRadius: '8px' }}
          >
            {isRunning ? '停止' : '启动'}
          </button>
          <button 
            className="btn" 
            onClick={() => copyWithFallback(currentTime)}
            style={{ padding: '10px 20px', borderRadius: '8px' }}
          >
            复制
          </button>
        </div>
        <div className="muted" style={{ marginTop: '8px', fontSize: '12px' }}>实时显示当前时间</div>
      </div>

      {/* 时间戳转日期时间 */}
      <div style={{ marginBottom: '32px' }}>
        <div className="flex" style={{ alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⏰</span>
          <span className="muted" style={{ fontWeight: '500', fontSize: '16px' }}>时间戳转日期时间</span>
        </div>
        <div className="row" style={{ gridTemplateColumns: '2fr auto 1fr 2fr auto', gap: '16px', alignItems: 'center' }}>
          <input 
            value={epochInput}
            onChange={(e) => setEpochInput(e.target.value)}
            placeholder="1757745558769" 
            style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }} 
          />
          <select 
            value={epochUnit}
            onChange={(e) => handleEpochUnitChange(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '8px', minWidth: '100px' }}
          >
            <option value="ms">毫秒(ms)</option>
            <option value="s">秒(s)</option>
          </select>
          <button 
            className="btn dark" 
            onClick={convertEpochToDate}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: '500' }}
          >
            转换
          </button>
          <input 
            value={epochOutput}
            readOnly 
            placeholder="转换结果" 
            style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '14px', background: '#f8f9fa' }} 
          />
          <button 
            className="btn" 
            onClick={() => copyWithFallback(epochOutput)}
            style={{ padding: '10px 20px', borderRadius: '8px' }}
          >
            复制
          </button>
        </div>
      </div>

      {/* 日期时间转时间戳 */}
      <div>
        <div className="flex" style={{ alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📅</span>
          <span className="muted" style={{ fontWeight: '500', fontSize: '16px' }}>日期时间转时间戳</span>
        </div>
        <div className="row" style={{ gridTemplateColumns: '2fr 1fr 2fr auto auto', gap: '16px', alignItems: 'center' }}>
          <input 
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            placeholder="2025-09-13 14:39:18" 
            style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }} 
          />
          <button 
            className="btn dark" 
            onClick={convertDateToEpoch}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: '500' }}
          >
            转换
          </button>
          <input 
            value={dateOutput}
            readOnly 
            placeholder="转换结果" 
            style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '14px', background: '#f8f9fa' }} 
          />
          <select style={{ padding: '12px 16px', borderRadius: '8px', minWidth: '100px' }}>
            <option value="ms">毫秒(ms)</option>
          </select>
          <button 
            className="btn" 
            onClick={() => copyWithFallback(dateOutput)}
            style={{ padding: '10px 20px', borderRadius: '8px' }}
          >
            复制
          </button>
        </div>
        <div className="muted" style={{ marginTop: '8px', fontSize: '12px' }}>将输入的日期时间视为系统本地时区，转换为毫秒时间戳</div>
      </div>
    </div>
  )
}

export default TimestampTool