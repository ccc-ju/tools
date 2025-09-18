// 坐标系信息配置
export const coordinateSystemInfo = {
  WGS84: {
    name: 'WGS84',
    fullName: 'World Geodetic System 1984',
    description: 'GPS原始坐标系',
    icon: '🌍',
    color: '#2563eb',
    usedBy: [
      'GPS设备',
      'Google Maps (海外)',
      'OpenStreetMap',
      'Google Earth',
      '国外地图服务',
      '卫星导航系统'
    ],
    features: [
      '国际标准坐标系',
      '全球通用',
      '无加密偏移',
      '真实地理坐标'
    ],
    accuracy: '最准确的地理坐标',
    note: '如果你的坐标来自GPS设备或国外地图服务，通常是WGS84格式'
  },
  
  GCJ02: {
    name: 'GCJ02',
    fullName: '国家测绘局02坐标系',
    description: '国测局加密坐标',
    icon: '🇨🇳',
    color: '#dc2626',
    usedBy: [
      '高德地图',
      '腾讯地图',
      '苹果地图 (中国)',
      '谷歌地图 (中国)',
      '搜狗地图',
      '阿里云地图'
    ],
    features: [
      '中国法定坐标系',
      '在WGS84基础上加密',
      '俗称"火星坐标"',
      '保护地理信息安全'
    ],
    accuracy: '相对WGS84有随机偏移',
    note: '中国境内大部分地图服务都使用此坐标系，偏移范围通常在50-500米'
  },
  
  BD09: {
    name: 'BD09',
    fullName: '百度09坐标系',
    description: '百度加密坐标',
    icon: '🅱️',
    color: '#7c3aed',
    usedBy: [
      '百度地图',
      '百度API',
      '百度LBS服务',
      '百度导航'
    ],
    features: [
      '百度独有坐标系',
      '在GCJ02基础上二次加密',
      '仅百度系产品使用',
      '双重偏移保护'
    ],
    accuracy: '相对GCJ02再次偏移',
    note: '如果你使用百度地图API或从百度地图获取坐标，需要使用BD09格式'
  }
}

// 常见使用场景
export const usageScenarios = [
  {
    scenario: '从GPS设备获取坐标',
    sourceSystem: 'WGS84',
    targetSystem: 'GCJ02',
    reason: '在国内地图应用中正确显示位置'
  },
  {
    scenario: '高德地图API开发',
    sourceSystem: 'WGS84',
    targetSystem: 'GCJ02',
    reason: '高德地图使用GCJ02坐标系'
  },
  {
    scenario: '百度地图API开发',
    sourceSystem: 'WGS84',
    targetSystem: 'BD09',
    reason: '百度地图使用BD09坐标系'
  },
  {
    scenario: '数据迁移到国外地图',
    sourceSystem: 'GCJ02',
    targetSystem: 'WGS84',
    reason: 'Google Maps等国外服务使用WGS84'
  },
  {
    scenario: '百度地图转高德地图',
    sourceSystem: 'BD09',
    targetSystem: 'GCJ02',
    reason: '不同厂商间的坐标系转换'
  }
]

// 获取坐标系信息
export function getCoordinateSystemInfo(system) {
  return coordinateSystemInfo[system] || null
}

// 获取推荐的转换场景
export function getRecommendedConversions(sourceSystem) {
  return usageScenarios.filter(scenario => scenario.sourceSystem === sourceSystem)
}