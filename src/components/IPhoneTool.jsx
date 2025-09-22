import { useState, useEffect, useRef } from 'react'

const IPhoneTool = () => {
    const [isMonitoring, setIsMonitoring] = useState(false)
    const [monitorResults, setMonitorResults] = useState([])
    const [interval, setInterval] = useState(30) // 默认30秒
    const [notification, setNotification] = useState('')
    const [loading, setLoading] = useState(false)
    const intervalRef = useRef(null)

    // iPhone 17 产品列表 - 简化选择
    const products = {
        // iPhone 17 Air
        'iPhone 17 Air': {
            '256G': {
                '天蓝色': 'MG2P4ZA/A',
                '浅金色': 'MG2N4ZA/A',
                '浮云白色': 'MG2M4ZA/A',
                '太空黑': 'MG2L4ZA/A'
            },
            '512G': {
                '天蓝色': 'MG2V4ZA/A',
                '浅金色': 'MG2U4ZA/A',
                '浮云白色': 'MG2T4ZA/A',
                '太空黑': 'MG2Q4ZA/A'
            },
            '1TB': {
                '天蓝色': 'MG304ZA/A',
                '浅金色': 'MG2Y4ZA/A',
                '浮云白色': 'MG2X4ZA/A',
                '太空黑': 'MG2W4ZA/A'
            }
        },
        // iPhone 17 Pro
        'iPhone 17 Pro': {
            '256G': {
                '银色': 'MG8G4ZA/A',
                '宇宙橙色': 'MG8H4ZA/A',
                '深墨蓝色': 'MG8J4ZA/A'
            },
            '512G': {
                '银色': 'MG8K4ZA/A',
                '宇宙橙色': 'MG8M4ZA/A',
                '深墨蓝色': 'MG8N4ZA/A'
            },
            '1TB': {
                '银色': 'MG8P4ZA/A',
                '宇宙橙色': 'MG8Q4ZA/A',
                '深墨蓝色': 'MG8R4ZA/A'
            }
        },
        // iPhone 17 Pro Max
        'iPhone 17 Pro Max': {
            '256G': {
                '银色': 'MFYM4ZA/A',
                '宇宙橙色': 'MFYN4ZA/A',
                '深墨蓝色': 'MFYP4ZA/A'
            },
            '512G': {
                '银色': 'MFYQ4ZA/A',
                '宇宙橙色': 'MFYT4ZA/A',
                '深墨蓝色': 'MFYU4ZA/A'
            },
            '1TB': {
                '银色': 'MFYV4ZA/A',
                '宇宙橙色': 'MFYW4ZA/A',
                '深墨蓝色': 'MFYX4ZA/A'
            },
            '2TB': {
                '银色': 'MFYY4ZA/A',
                '宇宙橙色': 'MG004ZA/A',
                '深墨蓝色': 'MG014ZA/A'
            }
        }
    }

    const [selectedModel, setSelectedModel] = useState('iPhone 17 Air')
    const [selectedStorage, setSelectedStorage] = useState('256G')
    const [selectedColor, setSelectedColor] = useState('天蓝色')

    // 获取当前选中的产品编号
    const getCurrentProductNo = () => {
        return products[selectedModel]?.[selectedStorage]?.[selectedColor] || ''
    }

    // 检查库存 - 真实API调用
    const checkStock = async (productNo) => {
        setLoading(true)
        try {
            let stockData = null
            let pickupData = null
            
            console.log('开始请求苹果API...')
            
            try {
                // 使用Vite代理请求库存信息
                const stockUrl = `/api/stock/?fae=true&pl=true&mts.0=regular&mts.1=compact&parts.0=${productNo}&searchNearby=true&store=R409`
                console.log('请求库存信息:', stockUrl)
                
                const stockResponse = await fetch(stockUrl, {
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
                    }
                })
                
                if (stockResponse.ok) {
                    stockData = await stockResponse.json()
                    console.log('Stock data received:', stockData)
                } else {
                    console.error('Stock request failed:', stockResponse.status, stockResponse.statusText)
                }
                
                // 请求取货信息
                const pickupUrl = `/api/pickup/?fae=true&mts.0=regular&mts.1=compact&searchNearby=true&store=R409&product=${productNo}`
                console.log('请求取货信息:', pickupUrl)
                
                const pickupResponse = await fetch(pickupUrl, {
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
                    }
                })
                
                if (pickupResponse.ok) {
                    pickupData = await pickupResponse.json()
                    console.log('Pickup data received:', pickupData)
                } else {
                    console.error('Pickup request failed:', pickupResponse.status, pickupResponse.statusText)
                }
                
            } catch (requestError) {
                console.error('请求失败:', requestError)
                throw new Error(`请求苹果API失败: ${requestError.message}。请检查网络连接或代理配置。`)
            }
            
            // 检查是否有数据返回
            if (!stockData && !pickupData) {
                throw new Error('无法获取苹果库存数据，请检查网络连接或重新启动开发服务器')
            }
            
            // 解析库存信息
            const stockInfo = parseStockData(stockData, pickupData, productNo)
            return stockInfo
        } catch (error) {
            console.error(`检查产品 ${productNo} 库存时出错:`, error)
            return {
                available: false,
                error: error.message,
                lastChecked: new Date().toLocaleString(),
                stores: [],
                totalStores: 0,
                availableStores: 0
            }
        } finally {
            setLoading(false)
        }
    }
    
    // 解析库存数据 - 重新设计解析逻辑
    const parseStockData = (stockData, pickupData, productNo) => {
        try {
            console.log('=== 重新解析苹果API数据 ===');
            console.log('Product No:', productNo);
            
            // 首先打印完整的数据结构用于分析
            if (stockData) {
                console.log('📦 Stock API 完整响应:', JSON.stringify(stockData, null, 2));
            }
            if (pickupData) {
                console.log('🚚 Pickup API 完整响应:', JSON.stringify(pickupData, null, 2));
            }
            
            const storesMap = new Map()
            
            // 解析库存数据
            const stockStores = stockData?.body?.content?.pickupMessage?.stores || []
            console.log(`📍 在Stock API中找到 ${stockStores.length} 个门店`);
            
            stockStores.forEach((store, index) => {
                console.log(`\n--- Stock门店 ${index + 1} ---`);
                console.log('原始数据:', JSON.stringify(store, null, 2));
                
                // 提取门店基础信息
                const storeNumber = store.storeNumber
                const storeName = store.storeName
                
                if (!storeNumber) {
                    console.log('⚠️ 门店缺少storeNumber，跳过');
                    return;
                }
                
                // 检查产品可用性
                const productAvailability = store.partsAvailability?.[productNo]
                console.log(`🔍 产品 ${productNo} 可用性:`, productAvailability);
                
                let available = false
                let status = 'unavailable'
                let displayMessage = '暂无库存'
                
                if (productAvailability) {
                    // 检查所有可能表示可用的字段
                    const pickupDisplay = productAvailability.pickupDisplay
                    const pickupSearchQuote = productAvailability.pickupSearchQuote
                    const storeSelectionEnabled = productAvailability.storeSelectionEnabled
                    const messageTypes = productAvailability.messageTypes
                    
                    console.log('🔍 检查可用性字段:', {
                        pickupDisplay,
                        pickupSearchQuote, 
                        storeSelectionEnabled,
                        messageTypes
                    });
                    
                    // 判断是否有库存（严格按照苹果API逻辑）
                    if (pickupDisplay === 'available') {
                        available = true
                        status = 'available'
                        displayMessage = '有库存'
                    } else if (pickupSearchQuote === 'available') {
                        available = true
                        status = 'available' 
                        displayMessage = '可取货'
                    } else if (storeSelectionEnabled === true) {
                        available = true
                        status = 'selectable'
                        displayMessage = '可选择'
                    } else {
                        // 没有库存的情况
                        available = false
                        status = pickupDisplay || pickupSearchQuote || 'unavailable'
                        displayMessage = pickupDisplay || pickupSearchQuote || '暂无库存'
                    }
                } else {
                    console.log('❌ 未找到产品可用性信息');
                }
                
                // 提取地址信息 - 检查所有可能的地址字段
                let storeAddress = ''
                let storeCity = ''
                let storePhone = ''
                
                // 方法1: 检查 retailStore 对象
                if (store.retailStore) {
                    console.log('🏪 retailStore信息:', store.retailStore);
                    const retailAddr = store.retailStore.address
                    if (retailAddr) {
                        storeAddress = [retailAddr.street, retailAddr.city, retailAddr.state].filter(Boolean).join(', ')
                        storeCity = retailAddr.city || retailAddr.state || ''
                    }
                    storePhone = store.retailStore.phoneNumber || ''
                }
                
                // 方法2: 检查直接的 address 字段
                if (!storeAddress && store.address) {
                    console.log('🏠 address信息:', store.address);
                    storeAddress = [store.address.street, store.address.city, store.address.state].filter(Boolean).join(', ')
                    storeCity = store.address.city || store.address.state || ''
                }
                
                // 方法3: 检查其他可能的地址字段
                if (!storeAddress) {
                    storeAddress = store.storeAddress || store.fullAddress || ''
                }
                
                if (!storePhone) {
                    storePhone = store.phoneNumber || store.phone || ''
                }
                
                if (!storeCity) {
                    storeCity = store.city || '香港'
                }
                
                console.log(`✅ 解析结果 - ${storeName}:`, {
                    available,
                    status,
                    displayMessage,
                    address: storeAddress,
                    city: storeCity,
                    phone: storePhone
                });
                
                storesMap.set(storeNumber, {
                    storeId: storeNumber,
                    storeName: storeName || '未知门店',
                    available: available,
                    pickupDisplay: displayMessage,
                    address: storeAddress,
                    city: storeCity,
                    phone: storePhone
                })
            })
            
            // 解析Pickup数据（如果有的话）
            const pickupStores = pickupData?.body?.content?.pickupMessage?.stores || []
            console.log(`\n🚚 在Pickup API中找到 ${pickupStores.length} 个门店`);
            
            pickupStores.forEach((store, index) => {
                console.log(`\n--- Pickup门店 ${index + 1} ---`);
                console.log('原始数据:', JSON.stringify(store, null, 2));
                
                const storeNumber = store.storeNumber
                const storeName = store.storeName
                
                if (!storeNumber) {
                    console.log('⚠️ Pickup门店缺少storeNumber，跳过');
                    return;
                }
                
                const existingStore = storesMap.get(storeNumber)
                
                // 检查产品可用性
                const productAvailability = store.partsAvailability?.[productNo]
                console.log(`🔍 Pickup产品 ${productNo} 可用性:`, productAvailability);
                
                let available = false
                let displayMessage = '暂无库存'
                
                if (productAvailability) {
                    const pickupDisplay = productAvailability.pickupDisplay
                    const pickupSearchQuote = productAvailability.pickupSearchQuote
                    const storeSelectionEnabled = productAvailability.storeSelectionEnabled
                    
                    if (pickupDisplay === 'available') {
                        available = true
                        displayMessage = '有库存'
                    } else if (pickupSearchQuote === 'available') {
                        available = true
                        displayMessage = '可取货'
                    } else if (storeSelectionEnabled === true) {
                        available = true
                        displayMessage = '可选择'
                    } else {
                        available = false
                        displayMessage = pickupDisplay || pickupSearchQuote || '暂无库存'
                    }
                }
                
                // 提取地址信息
                let storeAddress = ''
                let storeCity = ''
                let storePhone = ''
                
                if (store.retailStore?.address) {
                    const addr = store.retailStore.address
                    storeAddress = [addr.street, addr.city, addr.state].filter(Boolean).join(', ')
                    storeCity = addr.city || addr.state || ''
                    storePhone = store.retailStore.phoneNumber || ''
                } else if (store.address) {
                    storeAddress = [store.address.street, store.address.city, store.address.state].filter(Boolean).join(', ')
                    storeCity = store.address.city || store.address.state || ''
                }
                
                if (!storePhone) {
                    storePhone = store.phoneNumber || store.phone || ''
                }
                
                if (existingStore) {
                    // 合并信息（优先保留已有的有库存状态）
                    if (available && !existingStore.available) {
                        existingStore.available = true
                        existingStore.pickupDisplay = displayMessage
                    }
                    if (storeAddress && !existingStore.address) {
                        existingStore.address = storeAddress
                    }
                    if (storePhone && !existingStore.phone) {
                        existingStore.phone = storePhone
                    }
                    console.log(`🔄 更新门店 ${storeNumber}:`, existingStore);
                } else {
                    // 新增门店
                    storesMap.set(storeNumber, {
                        storeId: storeNumber,
                        storeName: storeName || '未知门店',
                        available: available,
                        pickupDisplay: displayMessage,
                        address: storeAddress,
                        city: storeCity || '香港',
                        phone: storePhone
                    })
                    console.log(`➕ 新增门店 ${storeNumber}`);
                }
            })
            
            // 最终结果统计
            const stores = Array.from(storesMap.values())
            const availableStores = stores.filter(s => s.available)
            const hasAvailableStock = availableStores.length > 0
            
            console.log('\n📊 最终统计结果:');
            console.log(`总门店数: ${stores.length}`);
            console.log(`有库存门店数: ${availableStores.length}`);
            console.log(`整体库存状态: ${hasAvailableStock ? '有库存' : '无库存'}`);
            
            stores.forEach((store, index) => {
                console.log(`门店${index + 1}: ${store.storeName} - ${store.available ? '✅有库存' : '❌无库存'} (${store.pickupDisplay})`);
            });
            
            // 检查全局可用性
            const globalAvailable = stockData?.body?.content?.pickupMessage?.availableNow || 
                                   pickupData?.body?.content?.pickupMessage?.availableNow ||
                                   false
            
            console.log('🌐 全局可用状态:', globalAvailable);
            
            return {
                available: hasAvailableStock,
                lastChecked: new Date().toLocaleString(),
                stores: stores,
                totalStores: stores.length,
                availableStores: availableStores.length,
                debugInfo: {
                    stockApiStatus: stockData ? '✅ 成功' : '❌ 失败',
                    pickupApiStatus: pickupData ? '✅ 成功' : '❌ 失败',
                    stockStoresCount: stockStores.length,
                    pickupStoresCount: pickupStores.length,
                    totalStoresFound: stores.length,
                    availableStoresFound: availableStores.length
                }
            }
        } catch (error) {
            console.error('解析库存数据失败:', error)
            return {
                available: false,
                error: `解析数据失败: ${error.message}`,
                lastChecked: new Date().toLocaleString(),
                stores: [],
                totalStores: 0,
                availableStores: 0
            }
        }
    }

    // 开始监控
    const startMonitoring = async () => {
        const productNo = getCurrentProductNo()
        if (!productNo) {
            setNotification('请选择要监控的产品')
            return
        }

        setIsMonitoring(true)
        setNotification('开始监控库存...')

        // 立即检查一次
        await checkCurrentProduct()

        // 设置定时检查
        intervalRef.current = setInterval(async () => {
            await checkCurrentProduct()
        }, interval * 1000)
    }

    // 停止监控
    const stopMonitoring = () => {
        setIsMonitoring(false)
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setNotification('已停止监控')
    }

    // 检查当前选中的产品
    const checkCurrentProduct = async () => {
        const productNo = getCurrentProductNo()
        if (!productNo) return

        const stockInfo = await checkStock(productNo)
        const productName = `${selectedModel} ${selectedStorage} ${selectedColor}`
        
        const result = {
            name: productName,
            productNo,
            ...stockInfo,
            timestamp: new Date().getTime()
        }
        
        setMonitorResults(prevResults => {
            // 检查是否已经有相同产品的最近结果（避免重复）
            const recentResult = prevResults.find(r => 
                r.name === result.name && 
                r.productNo === result.productNo &&
                Math.abs(r.timestamp - result.timestamp) < 10000 // 10秒内的结果视为重复
            )
            
            if (recentResult) {
                // 如果有重复结果，更新现有结果而不是添加新的
                console.log('🔄 更新现有结果，避免重复');
                return prevResults.map(r => 
                    r.name === result.name && r.productNo === result.productNo ? result : r
                )
            }
            
            // 保留最近10条记录
            const newResults = [result, ...prevResults].slice(0, 10)
            console.log('➕ 添加新的监控结果');
            return newResults
        })
        
        // 如果有库存，发送通知
        if (stockInfo.available) {
            setNotification(`🎉 ${productName} 有库存了！`)
            // 浏览器通知
            if (Notification.permission === 'granted') {
                new Notification('iPhone 库存提醒', {
                    body: `${productName} 现在有库存了！`,
                    icon: '/favicon.ico'
                })
            }
        }
    }

    // 手动检查库存
    const handleManualCheck = async () => {
        const productNo = getCurrentProductNo()
        if (!productNo) {
            setNotification('请选择要检查的产品')
            return
        }
        setNotification('正在检查库存...')
        await checkCurrentProduct()
        setNotification('检查完成')
    }

    // 请求通知权限
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    // 清理定时器
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    return (
        <div className="tool-container">
            <h2>iPhone 17 系列香港库存监控</h2>
            
            {/* 产品选择器 */}
            <div className="product-selector">
                <h3>选择产品配置</h3>
                <div className="selector-row">
                    <div className="selector-group">
                        <label>型号:</label>
                        <select 
                            value={selectedModel} 
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={isMonitoring}
                        >
                            {Object.keys(products).map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="selector-group">
                        <label>容量:</label>
                        <select 
                            value={selectedStorage} 
                            onChange={(e) => setSelectedStorage(e.target.value)}
                            disabled={isMonitoring}
                        >
                            {Object.keys(products[selectedModel] || {}).map(storage => (
                                <option key={storage} value={storage}>{storage}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="selector-group">
                        <label>颜色:</label>
                        <select 
                            value={selectedColor} 
                            onChange={(e) => setSelectedColor(e.target.value)}
                            disabled={isMonitoring}
                        >
                            {Object.keys(products[selectedModel]?.[selectedStorage] || {}).map(color => (
                                <option key={color} value={color}>{color}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="selected-product">
                    <strong>当前选择:</strong> {selectedModel} {selectedStorage} {selectedColor}
                    <br />
                    <small>产品编号: {getCurrentProductNo()}</small>
                </div>
            </div>
            
            {/* 控制面板 */}
            <div className="control-panel">
                <div className="control-row">
                    <label>
                        检查间隔：
                        <select 
                            value={interval} 
                            onChange={(e) => setInterval(Number(e.target.value))}
                            disabled={isMonitoring}
                        >
                            <option value={10}>10秒</option>
                            <option value={30}>30秒</option>
                            <option value={60}>1分钟</option>
                            <option value={300}>5分钟</option>
                        </select>
                    </label>
                    
                    <div className="button-group">
                        <button 
                            onClick={() => setMonitorResults([])}
                            disabled={monitorResults.length === 0}
                            className="btn-secondary"
                            title="清空所有结果"
                        >
                            清空结果
                        </button>
                        <button 
                            onClick={handleManualCheck}
                            disabled={isMonitoring || loading || !getCurrentProductNo()}
                            className="btn-secondary"
                        >
                            {loading ? '检查中...' : '手动检查'}
                        </button>
                        {!isMonitoring ? (
                            <button 
                                onClick={startMonitoring}
                                disabled={loading || !getCurrentProductNo()}
                                className="btn-primary"
                            >
                                开始监控
                            </button>
                        ) : (
                            <button 
                                onClick={stopMonitoring}
                                className="btn-danger"
                            >
                                停止监控
                            </button>
                        )}
                    </div>
                </div>
                
                {notification && (
                    <div className={`notification ${notification.includes('🎉') ? 'success' : ''}`}>
                        {notification}
                    </div>
                )}
            </div>

            {/* 监控结果 */}
            {monitorResults.length > 0 && (
                <div className="results-section">
                    <h3>库存监控结果</h3>
                    <div className="results-list">
                        {monitorResults.slice(0, 10).map((result, index) => (
                            <div key={`${result.productNo}-${result.timestamp}`} className={`result-item ${result.available ? 'available' : 'unavailable'}`}>
                                <div className="result-header">
                                    <strong>{result.name}</strong>
                                    <span className={`status ${result.available ? 'available' : 'unavailable'}`}>
                                        {result.available ? '✅ 有库存' : '❌ 无库存'}
                                    </span>
                                </div>
                                <div className="result-details">
                                    <small>检查时间: {result.lastChecked}</small>
                                    {result.totalStores > 0 ? (
                                        <small>门店统计: {result.availableStores}/{result.totalStores} 有库存</small>
                                    ) : (
                                        <small>未获取到门店信息</small>
                                    )}
                                    {result.debugInfo && (
                                        <small className="debug-info">
                                            API状态: 库存{result.debugInfo.stockApiStatus} | 取货{result.debugInfo.pickupApiStatus} | 
                                            门店数: {result.debugInfo.stockStoresCount}+{result.debugInfo.pickupStoresCount}={result.debugInfo.totalStoresFound} | 
                                            有库存: {result.debugInfo.availableStoresFound}
                                        </small>
                                    )}
                                    {result.error && (
                                        <small className="error">错误: {result.error}</small>
                                    )}
                                </div>
                                
                                {/* 门店详情 */}
                                {result.stores && result.stores.length > 0 ? (
                                    <div className="stores-section">
                                        <h4>门店库存详情</h4>
                                        <div className="stores-list">
                                            {result.stores.map((store) => (
                                                <div key={store.storeId} className={`store-item ${store.available ? 'store-available' : 'store-unavailable'}`}>
                                                    <div className="store-header">
                                                        <strong>{store.storeName}</strong>
                                                        <span className={`store-status ${store.available ? 'available' : 'unavailable'}`}>
                                                            {store.available ? '🟢 有库存' : '🔴 无库存'}
                                                        </span>
                                                    </div>
                                                    <div className="store-details">
                                                        <small>状态: {store.pickupDisplay}</small>
                                                        {store.address && (
                                                            <small>地址: {store.address}</small>
                                                        )}
                                                        {store.city && (
                                                            <small>城市: {store.city}</small>
                                                        )}
                                                        {store.phone && (
                                                            <small>电话: {store.phone}</small>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-stores-section">
                                        <p className="no-stores-message">
                                            {result.error ? '由于连接错误，无法获取门店信息' : 'API返回的数据中不包含门店信息'}
                                        </p>
                                        <small className="debug-info">
                                            请检查代理服务配置或API返回数据结构
                                        </small>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 使用说明 */}
            <div className="help-section">
                <h3>使用说明</h3>
                <ul>
                    <li>选择要监控的iPhone型号、容量和颜色</li>
                    <li>点击“手动检查”获取真实库存数据</li>
                    <li>设置检查间隔（建议不要太频繁，避免被限制访问）</li>
                    <li>点击“开始监控”自动检查库存</li>
                    <li>有库存时会显示通知提醒和详细门店信息</li>
                    <li>支持浏览器通知（需要授权）</li>
                </ul>
                <div className="info-box">
                    <h4>📋 关于数据源</h4>
                    <p>本工具直接调用苹果香港官网的库存API获取真实数据。</p>
                    <p>功能说明：</p>
                    <ul>
                        <li>🔍 <strong>手动检查</strong>：获取所有香港苹果门店的实时库存状态</li>
                        <li>🔄 <strong>自动监控</strong>：定时检查库存，有库存时自动通知</li>
                        <li>🗑️ <strong>清空结果</strong>：清除所有显示的监控结果</li>
                    </ul>
                    <p>需要服务器端代理支持：</p>
                    <ul>
                        <li>部署代理服务在 <code>/api/proxy</code> 路径</li>
                        <li>传递必要的 Headers 和 Cookies</li>
                        <li>如果代理不可用，会显示连接错误</li>
                    </ul>
                </div>
                <p className="warning">
                    ⚠️ 注意：此工具仅供学习和个人使用，请遵守苹果官网的使用条款。
                    频繁请求可能被限制访问，建议合理设置检查间隔。
                </p>
            </div>
        </div>
    )
}

export default IPhoneTool