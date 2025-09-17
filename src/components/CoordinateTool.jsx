import { useState } from 'react'
import { copyWithFallback } from '../utils/clipboard'
import { convertCoordinates } from '../utils/coordinates'

function CoordinateTool() {
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

  const handleConvert = () => {
    const lng = parseFloat(sourceLng)
    const lat = parseFloat(sourceLat)
    
    if (isNaN(lng) || isNaN(lat)) {
      setResultLng('请输入有效的经纬度')
      setResultLat('')
      return
    }
    
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      setResultLng('坐标范围错误')
      setResultLat('经度[-180,180]，纬度[-90,90]')
      return
    }
    
    try {
      const result = convertCoordinates(lng, lat, sourceCoordSys, targetCoordSys)
      setResultLng(result[0].toFixed(8))
      setResultLat(result[1].toFixed(8))
    } catch (e) {
      setResultLng('转换失败')
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
        results.push(`${line} - 格式错误`)
        continue
      }
      
      const lng = parseFloat(parts[0])
      const lat = parseFloat(parts[1])
      
      if (isNaN(lng) || isNaN(lat)) {
        results.push(`${line} - 无效坐标`)
        continue
      }
      
      try {
        const result = convertCoordinates(lng, lat, batchSourceCoordSys, batchTargetCoordSys)
        results.push(`${result[0].toFixed(8)},${result[1].toFixed(8)}`)
      } catch (e) {
        results.push(`${line} - 转换失败`)
      }
    }
    
    setBatchOutput(results.join('\n'))
  }

  return (
    <>
      <div className="card">
        <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2>坐标系转换</h2>
          <div className="flex">
            <button className="btn" onClick={handleClear}>清空</button>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>原始坐标</div>
          <div className="row" style={{ gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <input 
                value={sourceLng}
                onChange={(e) => setSourceLng(e.target.value)}
                placeholder="经度 (Longitude)" 
              />
            </div>
            <div>
              <input 
                value={sourceLat}
                onChange={(e) => setSourceLat(e.target.value)}
                placeholder="纬度 (Latitude)" 
              />
            </div>
            <select 
              value={sourceCoordSys}
              onChange={(e) => setSourceCoordSys(e.target.value)}
            >
              <option value="WGS84">WGS84 (国际标准)</option>
              <option value="GCJ02">GCJ02 (火星坐标系)</option>
              <option value="BD09">BD09 (百度坐标系)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>目标坐标系</div>
          <select 
            value={targetCoordSys}
            onChange={(e) => setTargetCoordSys(e.target.value)}
          >
            <option value="WGS84">WGS84 (国际标准)</option>
            <option value="GCJ02">GCJ02 (火星坐标系)</option>
            <option value="BD09">BD09 (百度坐标系)</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button className="btn dark" onClick={handleConvert}>转换坐标</button>
        </div>

        <div>
          <div className="muted" style={{ marginBottom: '6px' }}>转换结果</div>
          <div className="row" style={{ gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
            <input value={resultLng} readOnly placeholder="经度结果" />
            <input value={resultLat} readOnly placeholder="纬度结果" />
            <button className="btn" onClick={handleCopyResult}>复制</button>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <div className="muted">
            <strong>坐标系说明：</strong><br/>
            • <strong>WGS84</strong>：国际标准，GPS设备、Google Earth等使用<br/>
            • <strong>GCJ02</strong>：中国国家测绘局加密坐标，高德、腾讯地图等使用<br/>
            • <strong>BD09</strong>：百度加密坐标，百度地图使用
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2>批量转换</h2>
          <div className="flex">
            <button className="btn" onClick={handleBatchConvert}>批量转换</button>
            <button className="btn" onClick={() => copyWithFallback(batchOutput)}>复制结果</button>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <div className="muted" style={{ marginBottom: '6px' }}>输入坐标（每行一个，格式：经度,纬度）</div>
            <textarea 
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder={`116.397128,39.916527
121.473701,31.230416
113.264435,23.129163`}
            />
          </div>
          <div>
            <div className="muted" style={{ marginBottom: '6px' }}>转换结果</div>
            <textarea value={batchOutput} readOnly />
          </div>
        </div>

        <div className="row" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
          <div>
            <label className="muted">源坐标系：</label>
            <select 
              value={batchSourceCoordSys}
              onChange={(e) => setBatchSourceCoordSys(e.target.value)}
            >
              <option value="WGS84">WGS84</option>
              <option value="GCJ02">GCJ02</option>
              <option value="BD09">BD09</option>
            </select>
          </div>
          <div>
            <label className="muted">目标坐标系：</label>
            <select 
              value={batchTargetCoordSys}
              onChange={(e) => setBatchTargetCoordSys(e.target.value)}
            >
              <option value="WGS84">WGS84</option>
              <option value="GCJ02">GCJ02</option>
              <option value="BD09">BD09</option>
            </select>
          </div>
        </div>
      </div>
    </>
  )
}

export default CoordinateTool