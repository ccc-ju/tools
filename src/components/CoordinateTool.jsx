import { useState } from 'react'
import { copyWithFallback } from '../utils/clipboard'
import { convertCoordinates, calculateDistance, calculateDistanceFast } from '../utils/coordinates'

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

  const handleCalculateDistance = () => {
    const lng1 = parseFloat(point1Lng)
    const lat1 = parseFloat(point1Lat)
    const lng2 = parseFloat(point2Lng)
    const lat2 = parseFloat(point2Lat)

    if (isNaN(lng1) || isNaN(lat1) || isNaN(lng2) || isNaN(lat2)) {
      setDistanceResult('请输入有效的经纬度')
      setDistanceFastResult('')
      return
    }

    if (lng1 < -180 || lng1 > 180 || lat1 < -90 || lat1 > 90 ||
      lng2 < -180 || lng2 > 180 || lat2 < -90 || lat2 > 90) {
      setDistanceResult('坐标范围错误')
      setDistanceFastResult('经度[-180,180]，纬度[-90,90]')
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
          return `${dist.toFixed(2)} 米`
        } else {
          return `${(dist / 1000).toFixed(3)} 公里 (${dist.toFixed(2)} 米)`
        }
      }

      setDistanceResult(formatDistance(distance))
      setDistanceFastResult(formatDistance(distanceFast))
    } catch (e) {
      setDistanceResult('计算失败')
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
          <h2>坐标系转换</h2>
          <div className="flex">
            <button className="btn" onClick={handleClear}>清空</button>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>原始坐标</div>
          <div className="coordinate-input-row">
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
              <option value="WGS84">WGS84 - GPS原始坐标(Google Maps/国外地图)</option>
              <option value="GCJ02">GCJ02 - 国测局坐标(高德/腾讯)</option>
              <option value="BD09">BD09 - 百度坐标(百度地图专用)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>目标坐标系</div>
          <select
            value={targetCoordSys}
            onChange={(e) => setTargetCoordSys(e.target.value)}
          >
            <option value="WGS84">WGS84 - GPS原始坐标(Google Maps/国外地图)</option>
            <option value="GCJ02">GCJ02 - 国测局坐标(高德/腾讯)</option>
            <option value="BD09">BD09 - 百度坐标(百度地图专用)</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button className="btn dark" onClick={handleConvert}>转换坐标</button>
        </div>

        <div>
          <div className="muted" style={{ marginBottom: '6px' }}>转换结果</div>
          <div className="coordinate-result-row">
            <input value={resultLng} readOnly placeholder="经度结果" />
            <input value={resultLat} readOnly placeholder="纬度结果" />
            <button className="btn" onClick={handleCopyResult}>复制</button>
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

      <div className="card">
        <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2>📏 经纬度距离计算</h2>
          <div className="flex">
            <button className="btn" onClick={handleClearDistance}>清空</button>
          </div>
        </div>

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
          <div style={{ fontSize: '14px', color: '#ff9800' }}>
            ⚠️ <strong>重要提示：</strong>计算距离时，两个点必须使用<strong>相同的坐标系</strong>！
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
            • 如果两个点的坐标系不同（如一个WGS84，一个GCJ02），会导致距离计算严重偏差（可能几百米）<br />
            • 请先在上方"坐标系转换"中将它们转换为同一坐标系，再进行距离计算<br />
            • 距离计算本身与坐标系无关，只要两点坐标系一致，结果就是准确的
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>点 1 坐标</div>
          <div className="row" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              value={point1Lng}
              onChange={(e) => setPoint1Lng(e.target.value)}
              placeholder="经度 (Longitude)"
            />
            <input
              value={point1Lat}
              onChange={(e) => setPoint1Lat(e.target.value)}
              placeholder="纬度 (Latitude)"
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>点 2 坐标</div>
          <div className="row" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              value={point2Lng}
              onChange={(e) => setPoint2Lng(e.target.value)}
              placeholder="经度 (Longitude)"
            />
            <input
              value={point2Lat}
              onChange={(e) => setPoint2Lat(e.target.value)}
              placeholder="纬度 (Latitude)"
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button className="btn dark" onClick={handleCalculateDistance}>计算距离</button>
        </div>

        <div className="grid-2">
          <div>
            <div className="muted" style={{ marginBottom: '6px' }}>
              🎯 精确计算 (Haversine公式)
            </div>
            <input
              value={distanceResult}
              readOnly
              placeholder="距离结果"
              style={{ fontWeight: '500', color: '#2196f3' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              使用球面三角学精确计算，适用于任意距离
            </div>
          </div>
          <div>
            <div className="muted" style={{ marginBottom: '6px' }}>
              ⚡ 快速估算 (平面近似)
            </div>
            <input
              value={distanceFastResult}
              readOnly
              placeholder="距离结果"
              style={{ fontWeight: '500', color: '#4caf50' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              平面几何快速计算，适用于数百公里内短距离
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(33, 150, 243, 0.05)', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            <strong>💡 算法说明：</strong><br />
            • <strong>Haversine公式</strong>：考虑地球曲率的精确球面距离计算<br />
            • <strong>平面近似</strong>：将地球局部视为平面，使用勾股定理快速计算<br />
            • 对于几十公里内的短距离，两种方法结果非常接近<br />
            • 距离越远，平面近似的误差会略微增大（但仍在可接受范围）
          </div>
        </div>
      </div>

      <div className="card">
        <h2>📍 坐标系详细说明</h2>

        <div className="coord-info-section">
          <div style={{ marginBottom: '16px' }}>
            <strong className="coord-wgs84">🌍 WGS84 (World Geodetic System 1984)</strong><br />
            <span className="coord-text">• 国际标准GPS坐标系，全球通用</span><br />
            <span className="coord-text">• 使用平台：Google Maps、OpenStreetMap、GPS设备、国外地图服务</span><br />
            <span className="coord-text">• 特点：真实地理坐标，无偏移加密</span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong className="coord-gcj02">🇨🇳 GCJ02 (国家测绘局02坐标系)</strong><br />
            <span className="coord-text">• 中国国家测绘局制定的加密坐标系，俗称"火星坐标"</span><br />
            <span className="coord-text">• 使用平台：高德地图、腾讯地图、苹果地图(中国)、谷歌地图(中国)</span><br />
            <span className="coord-text">• 特点：在WGS84基础上加密偏移，保护国家地理信息安全</span>
          </div>

          <div>
            <strong className="coord-bd09">🅱️ BD09 (百度09坐标系)</strong><br />
            <span className="coord-text">• 百度公司在GCJ02基础上再次加密的坐标系</span><br />
            <span className="coord-text">• 使用平台：百度地图、百度API相关服务</span><br />
            <span className="coord-text">• 特点：双重加密，仅百度系产品使用</span>
          </div>
        </div>

        <div className="coord-tip-section">
          <strong className="coord-text">💡 使用建议：</strong><br />
          <span className="coord-text">• 从GPS设备获取的坐标通常是WGS84</span><br />
          <span className="coord-text">• 在国内地图应用中显示需转换为对应坐标系</span><br />
          <span className="coord-text">• 不同坐标系间的偏移可达几百米，转换很重要</span>
        </div>

        <div className="coord-ref-section">
          <strong className="coord-text">📊 偏移程度参考：</strong><br />
          <span className="coord-text">• WGS84 → GCJ02：通常偏移50-500米</span><br />
          <span className="coord-text">• GCJ02 → BD09：通常偏移50-200米</span><br />
          <span className="coord-text">• WGS84 → BD09：通常偏移100-600米</span>
        </div>
      </div>
    </>
  )
}

export default CoordinateTool