import { useState } from 'react'
import { useLanguage } from '../utils/i18n'
import { copyWithFallback } from '../utils/clipboard'
import { convertCoordinates, calculateDistance, calculateDistanceFast } from '../utils/coordinates'

function CoordinateTool() {
  const { t, language } = useLanguage()
  const [sourceLng, setSourceLng] = useState('')
  const [sourceLat, setSourceLat] = useState('')
  const [sourceCoordSys, setSourceCoordSys] = useState('WGS84')
  const [targetCoordSys, setTargetCoordSys] = useState('GCJ02')
  const [resultLng, setResultLng] = useState('')
  const [resultLat, setResultLat] = useState('')

  const [batchInput, setBatchInput] = useState('')
  const [batchOutput, setBatchOutput] = useState('')
  const [batchSourceCoordSys, setBatchSourceCoordSys] = useState('WGS84')
  const [batchTargetCoordSys, setBatchTargetCoordSys] = useState('GCJ02')

  // 距离计算相关状态
  const [point1Lng, setPoint1Lng] = useState('')
  const [point1Lat, setPoint1Lat] = useState('')
  const [point2Lng, setPoint2Lng] = useState('')
  const [point2Lat, setPoint2Lat] = useState('')
  const [distanceResult, setDistanceResult] = useState('')
  const [distanceFastResult, setDistanceFastResult] = useState('')

  const handleConvert = () => {
    const lng = parseFloat(sourceLng)
    const lat = parseFloat(sourceLat)

    if (isNaN(lng) || isNaN(lat)) {
      setResultLng(t('coord.validCoordError'))
      setResultLat('')
      return
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      setResultLng(t('coord.rangeError'))
      setResultLat(t('coord.rangeHint'))
      return
    }

    try {
      const result = convertCoordinates(lng, lat, sourceCoordSys, targetCoordSys)
      setResultLng(result[0].toFixed(8))
      setResultLat(result[1].toFixed(8))
    } catch (e) {
      setResultLng(t('coord.convertFailed'))
      setResultLat(e.message)
    }
  }

  const handleClear = () => {
    setSourceLng('')
    setSourceLat('')
    setResultLng('')
    setResultLat('')
  }

  const handleCopyResult = () => {
    const result = `${resultLng},${resultLat}`
    copyWithFallback(result)
  }

  const handleBatchConvert = () => {
    const lines = batchInput.split('\n').filter(line => line.trim())
    const results = []

    for (const line of lines) {
      const parts = line.trim().split(',')
      if (parts.length !== 2) {
        results.push(`${line} - ${t('coord.formatError')}`)
        continue
      }

      const lng = parseFloat(parts[0])
      const lat = parseFloat(parts[1])

      if (isNaN(lng) || isNaN(lat)) {
        results.push(`${line} - ${t('coord.invalidCoord')}`)
        continue
      }

      try {
        const result = convertCoordinates(lng, lat, batchSourceCoordSys, batchTargetCoordSys)
        results.push(`${result[0].toFixed(8)},${result[1].toFixed(8)}`)
      } catch (e) {
        results.push(`${line} - ${t('coord.convertFailed')}`)
      }
    }

    setBatchOutput(results.join('\n'))
  }

  const handleCalculateDistance = () => {
    const lng1 = parseFloat(point1Lng)
    const lat1 = parseFloat(point1Lat)
    const lng2 = parseFloat(point2Lng)
    const lat2 = parseFloat(point2Lat)

    if (isNaN(lng1) || isNaN(lat1) || isNaN(lng2) || isNaN(lat2)) {
      setDistanceResult(t('coord.validCoordError'))
      setDistanceFastResult('')
      return
    }

    if (lng1 < -180 || lng1 > 180 || lat1 < -90 || lat1 > 90 ||
      lng2 < -180 || lng2 > 180 || lat2 < -90 || lat2 > 90) {
      setDistanceResult(t('coord.rangeError'))
      setDistanceFastResult(t('coord.rangeHint'))
      return
    }

    try {
      // 使用精确的Haversine公式
      const distance = calculateDistance(lng1, lat1, lng2, lat2)
      // 使用快速估算方法
      const distanceFast = calculateDistanceFast(lng1, lat1, lng2, lat2)

      // 格式化距离显示
      const formatDistance = (dist) => {
        if (dist < 1000) {
          return `${dist.toFixed(2)} ${t('coord.meters')}`
        } else {
          return `${(dist / 1000).toFixed(3)} ${t('coord.kilometers')} (${dist.toFixed(2)} ${t('coord.meters')})`
        }
      }

      setDistanceResult(formatDistance(distance))
      setDistanceFastResult(formatDistance(distanceFast))
    } catch (e) {
      setDistanceResult(t('coord.convertFailed'))
      setDistanceFastResult(e.message)
    }
  }

  const handleClearDistance = () => {
    setPoint1Lng('')
    setPoint1Lat('')
    setPoint2Lng('')
    setPoint2Lat('')
    setDistanceResult('')
    setDistanceFastResult('')
  }

  return (
    <>
      <div className="card">
        <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2>{t('coord.title')}</h2>
          <div className="flex">
            <button className="btn" onClick={handleClear}>{t('coord.clear')}</button>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>{t('coord.sourceCoord')}</div>
          <div className="coordinate-input-row">
            <div>
              <input
                value={sourceLng}
                onChange={(e) => setSourceLng(e.target.value)}
                placeholder={t('coord.longitude')}
              />
            </div>
            <div>
              <input
                value={sourceLat}
                onChange={(e) => setSourceLat(e.target.value)}
                placeholder={t('coord.latitude')}
              />
            </div>
            <select
              value={sourceCoordSys}
              onChange={(e) => setSourceCoordSys(e.target.value)}
            >
              <option value="WGS84">{t('coord.wgs84Option')}</option>
              <option value="GCJ02">{t('coord.gcj02Option')}</option>
              <option value="BD09">{t('coord.bd09Option')}</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>{t('coord.targetCoordSys')}</div>
          <select
            value={targetCoordSys}
            onChange={(e) => setTargetCoordSys(e.target.value)}
          >
            <option value="WGS84">{t('coord.wgs84Option')}</option>
            <option value="GCJ02">{t('coord.gcj02Option')}</option>
            <option value="BD09">{t('coord.bd09Option')}</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button className="btn dark" onClick={handleConvert}>{t('coord.convert')}</button>
        </div>

        <div>
          <div className="muted" style={{ marginBottom: '6px' }}>{t('coord.result')}</div>
          <div className="coordinate-result-row">
            <input value={resultLng} readOnly placeholder={t('coord.lngResult')} />
            <input value={resultLat} readOnly placeholder={t('coord.latResult')} />
            <button className="btn" onClick={handleCopyResult}>{t('coord.copy')}</button>
          </div>
        </div>

      </div>

      <div className="card">
        <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2>{t('coord.batchTitle')}</h2>
          <div className="flex">
            <button className="btn" onClick={handleBatchConvert}>{t('coord.batchConvert')}</button>
            <button className="btn" onClick={() => copyWithFallback(batchOutput)}>{t('coord.copyResult')}</button>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <div className="muted" style={{ marginBottom: '6px' }}>{t('coord.batchInputHint')}</div>
            <textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder={`116.397128,39.916527
121.473701,31.230416
113.264435,23.129163`}
            />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: '6px' }}>{t('coord.result')}</div>
            <textarea value={batchOutput} readOnly />
          </div>
        </div>

        <div className="row" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
          <div>
            <label className="muted">{t('coord.sourceCoordSys')}</label>
            <select
              value={batchSourceCoordSys}
              onChange={(e) => setBatchSourceCoordSys(e.target.value)}
            >
              <option value="WGS84">{t('coord.wgs84Short')}</option>
              <option value="GCJ02">{t('coord.gcj02Short')}</option>
              <option value="BD09">{t('coord.bd09Short')}</option>
            </select>
          </div>
          <div>
            <label className="muted">{t('coord.targetCoordSysLabel')}</label>
            <select
              value={batchTargetCoordSys}
              onChange={(e) => setBatchTargetCoordSys(e.target.value)}
            >
              <option value="WGS84">{t('coord.wgs84Short')}</option>
              <option value="GCJ02">{t('coord.gcj02Short')}</option>
              <option value="BD09">{t('coord.bd09Short')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2>{t('coord.distanceTitle')}</h2>
          <div className="flex">
            <button className="btn" onClick={handleClearDistance}>{t('coord.clear')}</button>
          </div>
        </div>

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
          <div style={{ fontSize: '14px', color: '#ff9800' }}>
            <strong>{t('coord.distanceWarning')}</strong>{t('coord.distanceWarningText')}
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
            {t('coord.distanceWarningDetail1')}<br />
            {t('coord.distanceWarningDetail2')}<br />
            {t('coord.distanceWarningDetail3')}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>{t('coord.point1')}</div>
          <div className="row" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              value={point1Lng}
              onChange={(e) => setPoint1Lng(e.target.value)}
              placeholder={t('coord.longitude')}
            />
            <input
              value={point1Lat}
              onChange={(e) => setPoint1Lat(e.target.value)}
              placeholder={t('coord.latitude')}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>{t('coord.point2')}</div>
          <div className="row" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              value={point2Lng}
              onChange={(e) => setPoint2Lng(e.target.value)}
              placeholder={t('coord.longitude')}
            />
            <input
              value={point2Lat}
              onChange={(e) => setPoint2Lat(e.target.value)}
              placeholder={t('coord.latitude')}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button className="btn dark" onClick={handleCalculateDistance}>{t('coord.calculate')}</button>
        </div>

        <div className="grid-2">
          <div>
            <div className="muted" style={{ marginBottom: '6px' }}>
              {t('coord.preciseCalc')}
            </div>
            <input
              value={distanceResult}
              readOnly
              placeholder={t('coord.distanceResult')}
              style={{ fontWeight: '500', color: '#2196f3' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {t('coord.preciseHint')}
            </div>
          </div>
          <div>
            <div className="muted" style={{ marginBottom: '6px' }}>
              {t('coord.fastCalc')}
            </div>
            <input
              value={distanceFastResult}
              readOnly
              placeholder={t('coord.distanceResult')}
              style={{ fontWeight: '500', color: '#4caf50' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {t('coord.fastHint')}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(33, 150, 243, 0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            <strong>{t('coord.algorithmExplain')}</strong><br />
            {t('coord.haversineExplain')}<br />
            {t('coord.flatExplain')}<br />
            {t('coord.shortDistanceHint')}<br />
            {t('coord.longDistanceHint')}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>{t('coord.coordSysTitle')}</h2>

        <div className="coord-info-section">
          <div style={{ marginBottom: '16px' }}>
            <strong className="coord-wgs84">{t('coord.wgs84Title')}</strong><br />
            <span className="coord-text">{t('coord.wgs84Desc1')}</span><br />
            <span className="coord-text">{t('coord.wgs84Desc2')}</span><br />
            <span className="coord-text">{t('coord.wgs84Desc3')}</span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong className="coord-gcj02">{t('coord.gcj02Title')}</strong><br />
            <span className="coord-text">{t('coord.gcj02Desc1')}</span><br />
            <span className="coord-text">{t('coord.gcj02Desc2')}</span><br />
            <span className="coord-text">{t('coord.gcj02Desc3')}</span>
          </div>

          <div>
            <strong className="coord-bd09">{t('coord.bd09Title')}</strong><br />
            <span className="coord-text">{t('coord.bd09Desc1')}</span><br />
            <span className="coord-text">{t('coord.bd09Desc2')}</span><br />
            <span className="coord-text">{t('coord.bd09Desc3')}</span>
          </div>
        </div>

        <div className="coord-tip-section">
          <strong className="coord-text">{t('coord.usageTips')}</strong><br />
          <span className="coord-text">{t('coord.usageTip1')}</span><br />
          <span className="coord-text">{t('coord.usageTip2')}</span><br />
          <span className="coord-text">{t('coord.usageTip3')}</span>
        </div>

        <div className="coord-ref-section">
          <strong className="coord-text">{t('coord.offsetRef')}</strong><br />
          <span className="coord-text">{t('coord.offsetRef1')}</span><br />
          <span className="coord-text">{t('coord.offsetRef2')}</span><br />
          <span className="coord-text">{t('coord.offsetRef3')}</span>
        </div>
      </div>
    </>
  )
}

export default CoordinateTool