// 坐标转换工具函数
const PI = Math.PI
const A = 6378245.0
const EE = 0.00669342162296594323

function outOfChina(lng, lat) {
  return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271)
}

function transformLat(lng, lat) {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0
  return ret
}

function transformLng(lng, lat) {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0
  return ret
}

// WGS84 to GCJ02
function wgs84ToGcj02(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat]
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = lat / 180.0 * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI)
  dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI)
  return [lng + dLng, lat + dLat]
}

// GCJ02 to WGS84
function gcj02ToWgs84(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat]
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = lat / 180.0 * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI)
  dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI)
  return [lng - dLng, lat - dLat]
}

// GCJ02 to BD09
function gcj02ToBd09(lng, lat) {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * PI * 3000.0 / 180.0)
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * PI * 3000.0 / 180.0)
  const bdLng = z * Math.cos(theta) + 0.0065
  const bdLat = z * Math.sin(theta) + 0.006
  return [bdLng, bdLat]
}

// BD09 to GCJ02
function bd09ToGcj02(lng, lat) {
  const x = lng - 0.0065
  const y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * PI * 3000.0 / 180.0)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * PI * 3000.0 / 180.0)
  const gcjLng = z * Math.cos(theta)
  const gcjLat = z * Math.sin(theta)
  return [gcjLng, gcjLat]
}

// 主转换函数
export function convertCoordinates(lng, lat, fromSys, toSys) {
  if (fromSys === toSys) return [lng, lat]

  let result = [lng, lat]

  // 先转换到GCJ02作为中间坐标系
  if (fromSys === 'WGS84') {
    result = wgs84ToGcj02(lng, lat)
  } else if (fromSys === 'BD09') {
    result = bd09ToGcj02(lng, lat)
  }

  // 从GCJ02转换到目标坐标系
  if (toSys === 'WGS84') {
    result = gcj02ToWgs84(result[0], result[1])
  } else if (toSys === 'BD09') {
    result = gcj02ToBd09(result[0], result[1])
  }

  return result
}

/**
 * 使用 Haversine 公式计算两点之间的球面距离（精确方法）
 * 注意：两个点必须使用相同的坐标系！
 * 虽然计算本身使用WGS84椭球体参数，但对于同一坐标系内的点，结果是准确的
 * 
 * @param {number} lng1 - 第一个点的经度
 * @param {number} lat1 - 第一个点的纬度
 * @param {number} lng2 - 第二个点的经度
 * @param {number} lat2 - 第二个点的纬度
 * @returns {number} 距离（单位：米）
 */
export function calculateDistance(lng1, lat1, lng2, lat2) {
  const EARTH_RADIUS = 6378137 // 地球半径（米），使用WGS84椭球体赤道半径

  // 将角度转换为弧度
  const rad = (angle) => angle * Math.PI / 180

  const radLat1 = rad(lat1)
  const radLat2 = rad(lat2)
  const deltaLat = rad(lat2 - lat1)
  const deltaLng = rad(lng2 - lng1)

  // Haversine 公式
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distance = EARTH_RADIUS * c

  return distance
}

/**
 * 快速估算两点之间的距离（简化方法，适用于短距离）
 * 注意：两个点必须使用相同的坐标系！
 * 这个方法在几百公里范围内误差较小，计算速度更快
 * 
 * @param {number} lng1 - 第一个点的经度
 * @param {number} lat1 - 第一个点的纬度
 * @param {number} lng2 - 第二个点的经度
 * @param {number} lat2 - 第二个点的纬度
 * @returns {number} 距离（单位：米）
 */
export function calculateDistanceFast(lng1, lat1, lng2, lat2) {
  // 纬度每度约111km
  const LAT_PER_METER = 111000

  // 计算中心纬度，用于计算经度系数
  const avgLat = (lat1 + lat2) / 2
  const rad = avgLat * Math.PI / 180

  // 该纬度下经度每度对应的米数
  const lngPerMeter = LAT_PER_METER * Math.cos(rad)

  // 计算经纬度差值对应的米数
  const dx = (lng2 - lng1) * lngPerMeter
  const dy = (lat2 - lat1) * LAT_PER_METER

  // 勾股定理计算直线距离
  const distance = Math.sqrt(dx * dx + dy * dy)

  return distance
}