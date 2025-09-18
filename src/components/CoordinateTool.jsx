import { useState } from 'react'
import { copyWithFallback } from '../utils/clipboard'
import { convertCoordinates } from '../utils/coordinates'
import { coordinateSystemInfo, usageScenarios } from '../utils/coordinateInfo'

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
              <option value="WGS84">WGS84 - GPS原始坐标 (Google Maps/国外地图)</option>
              <option value="GCJ02">GCJ02 - 国测局坐标 (高德/腾讯/苹果地图)</option>
              <option value="BD09">BD09 - 百度坐标 (百度地图专用)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>目标坐标系</div>
          <select 
            value={targetCoordSys}
            onChange={(e) => setTargetCoordSys(e.target.value)}
          >
            <option value="WGS84">WGS84 - GPS原始坐标 (Google Maps/国外地图)</option>
            <option value="GCJ02">GCJ02 - 国测局坐标 (高德/腾讯/苹果地图)</option>
            <option value="BD09">BD09 - 百度坐标 (百度地图专用)</option>
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

        <div style={{ marginTop: '24px' }}>
          <div className="muted">
            <strong>📍 坐标系详细说明：</strong>
          </div>
          
          <div style={{ marginTop: '12px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#2563eb' }}>🌍 WGS84 (World Geodetic System 1984)</strong><br/>
              <span style={{ color: '#6b7280' }}>• 国际标准GPS坐标系，全球通用</span><br/>
              <span style={{ color: '#6b7280' }}>• 使用平台：Google Maps、OpenStreetMap、GPS设备、国外地图服务</span><br/>
              <span style={{ color: '#6b7280' }}>• 特点：真实地理坐标，无偏移加密</span>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#dc2626' }}>🇨🇳 GCJ02 (国家测绘局02坐标系)</strong><br/>
              <span style={{ color: '#6b7280' }}>• 中国国家测绘局制定的加密坐标系，俗称"火星坐标"</span><br/>
              <span style={{ color: '#6b7280' }}>• 使用平台：高德地图、腾讯地图、苹果地图(中国)、谷歌地图(中国)</span><br/>
              <span style={{ color: '#6b7280' }}>• 特点：在WGS84基础上加密偏移，保护国家地理信息安全</span>
            </div>
            
            <div>
              <strong style={{ color: '#7c3aed' }}>🅱️ BD09 (百度09坐标系)</strong><br/>
              <span style={{ color: '#6b7280' }}>• 百度公司在GCJ02基础上再次加密的坐标系</span><br/>
              <span style={{ color: '#6b7280' }}>• 使用平台：百度地图、百度API相关服务</span><br/>
              <span style={{ color: '#6b7280' }}>• 特点：双重加密，仅百度系产品使用</span>
            </div>
          </div>
          
          <div style={{ marginTop: '12px', padding: '12px', background: '#fef3c7', borderRadius: '8px', fontSize: '12px' }}>
            <strong>💡 使用建议：</strong><br/>
            • 从GPS设备获取的坐标通常是WGS84<br/>
            • 在国内地图应用中显示需转换为对应坐标系<br/>
            • 不同坐标系间的偏移可达几百米，转换很重要
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
              <option value="WGS84">WGS84 - GPS原始</option>
              <option value="GCJ02">GCJ02 - 高德/腾讯</option>
              <option value="BD09">BD09 - 百度地图</option>
            </select>
          </div>
          <div>
            <label className="muted">目标坐标系：</label>
            <select 
              value={batchTargetCoordSys}
              onChange={(e) => setBatchTargetCoordSys(e.target.value)}
            >
              <option value="WGS84">WGS84 - GPS原始</option>
              <option value="GCJ02">GCJ02 - 高德/腾讯</option>
              <option value="BD09">BD09 - 百度地图</option>
            </select>
          </div>
        </div>
      </div>

    </>
  )
}

export default CoordinateTool