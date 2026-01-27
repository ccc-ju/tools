import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../utils/i18n'
import { copyWithFallback } from '../utils/clipboard'

function TimestampTool() {
    const { t } = useLanguage()
    const [currentTime, setCurrentTime] = useState('')
    const [isRunning, setIsRunning] = useState(true)
    const [epochInput, setEpochInput] = useState(String(Date.now()))
    const [epochUnit, setEpochUnit] = useState('ms')
    const [epochOutput, setEpochOutput] = useState('')
    const [dateInput, setDateInput] = useState('')
    const [dateOutput, setDateOutput] = useState('')
    const intervalRef = useRef()

    // 获取当前系统时间作为placeholder
    const getCurrentTimeString = () => {
        const now = new Date()
        return now.getFullYear() + '-' +
            (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
            now.getDate().toString().padStart(2, '0') + ' ' +
            now.getHours().toString().padStart(2, '0') + ':' +
            now.getMinutes().toString().padStart(2, '0') + ':' +
            now.getSeconds().toString().padStart(2, '0')
    }

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
            setEpochOutput(t('timestamp.formatError'))
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
            setDateOutput(t('timestamp.formatExample'))
            return
        }

        const [, y, M, d, h, mn, ss] = m
        const localDate = new Date(+y, +M - 1, +d, +h, +mn, +(ss || 0))
        setDateOutput(String(localDate.getTime()))
    }

    return (
        <div className="card">
            <h2>{t('timestamp.title')}</h2>

            {/* 当前时间显示 */}
            <div style={{ marginBottom: '32px' }}>
                <div className="muted" style={{ marginBottom: '12px', fontWeight: '500' }}>{t('timestamp.currentTime')}</div>
                <div className="timestamp-current-row">
                    <input
                        value={currentTime}
                        readOnly
                        style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}
                    />
                    <div className="timestamp-button-group">
                        <button
                            className="btn"
                            onClick={toggleTimer}
                        >
                            {isRunning ? t('timestamp.stop') : t('timestamp.start')}
                        </button>
                        <button
                            className="btn"
                            onClick={() => copyWithFallback(currentTime)}
                        >
                            {t('timestamp.copy')}
                        </button>
                    </div>
                </div>
                <div className="muted" style={{ marginTop: '8px', fontSize: '12px' }}>{t('timestamp.realTimeDisplay')}</div>
            </div>

            {/* 时间戳转日期时间 */}
            <div style={{ marginBottom: '32px' }}>
                <div className="flex" style={{ alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⏰</span>
                    <span className="muted" style={{ fontWeight: '500', fontSize: '16px' }}>{t('timestamp.epochToDate')}</span>
                </div>
                <div className="timestamp-convert-row epoch-to-date">
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
                        <option value="ms">{t('timestamp.milliseconds')}</option>
                        <option value="s">{t('timestamp.seconds')}</option>
                    </select>
                    <button
                        className="btn dark"
                        onClick={convertEpochToDate}
                        style={{ fontWeight: '500' }}
                    >
                        {t('timestamp.convert')}
                    </button>
                    <input
                        value={epochOutput}
                        readOnly
                        placeholder={t('timestamp.result')}
                        style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '14px', background: 'var(--input-readonly-bg)' }}
                    />
                    <div className="timestamp-button-group">
                        <button
                            className="btn"
                            onClick={() => copyWithFallback(epochOutput)}
                        >
                            {t('timestamp.copy')}
                        </button>
                    </div>
                </div>
            </div>

            {/* 日期时间转时间戳 */}
            <div>
                <div className="flex" style={{ alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📅</span>
                    <span className="muted" style={{ fontWeight: '500', fontSize: '16px' }}>{t('timestamp.dateToEpoch')}</span>
                </div>
                <div className="timestamp-convert-row date-to-epoch">
                    <input
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        placeholder={getCurrentTimeString()}
                        style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}
                    />
                    <button
                        className="btn dark"
                        onClick={convertDateToEpoch}
                        style={{ fontWeight: '500' }}
                    >
                        {t('timestamp.convert')}
                    </button>
                    <input
                        value={dateOutput}
                        readOnly
                        placeholder={t('timestamp.result')}
                        style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '14px', background: 'var(--input-readonly-bg)' }}
                    />
                    <select style={{ padding: '12px 16px', borderRadius: '8px', minWidth: '100px' }}>
                        <option value="ms">{t('timestamp.milliseconds')}</option>
                    </select>
                    <div className="timestamp-button-group">
                        <button
                            className="btn"
                            onClick={() => copyWithFallback(dateOutput)}
                        >
                            {t('timestamp.copy')}
                        </button>
                    </div>
                </div>
                <div className="muted" style={{ marginTop: '8px', fontSize: '12px' }}>{t('timestamp.timestampHint')}</div>
            </div>
        </div>
    )
}

export default TimestampTool