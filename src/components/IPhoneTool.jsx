import { useState, useEffect, useRef } from 'react'

const IPhoneTool = () => {
    const [isMonitoring, setIsMonitoring] = useState(false)
    const [monitorResults, setMonitorResults] = useState([])
    const [interval, setInterval] = useState(30) // 默认30秒
    const [notification, setNotification] = useState('')
    const [loading, setLoading] = useState(false)
    const [lastCheckTime, setLastCheckTime] = useState('')
    const [nextCheckCountdown, setNextCheckCountdown] = useState(0)
    const [requestCounter, setRequestCounter] = useState(0)
    const intervalRef = useRef(null)
    const countdownRef = useRef(null)
    const isMonitoringRef = useRef(false) // 使用ref保存监控状态，避免闭包问题
    const currentIntervalRef = useRef(30) // 保存当前使用的间隔时间，初始化为30秒
    
    // 仅在interval有有效值时才更新ref，避免undefined覆盖有效值
    if (interval && interval !== undefined && !isNaN(interval) && interval > 0) {
        if (currentIntervalRef.current !== interval) {
            currentIntervalRef.current = interval;
            console.log('🔄 更新 currentIntervalRef 为:', interval, '秒');
        }
    } else {
        // 如果interval无效，确保ref有一个合理的默认值
        if (!currentIntervalRef.current || currentIntervalRef.current === undefined) {
            currentIntervalRef.current = 30;
            console.log('⚠️ interval无效，设置 currentIntervalRef 默认值为: 30秒');
        }
    }
    
    // 使用useEffect监听interval状态变化，但只在有效时更新ref
    useEffect(() => {
        if (interval && interval !== undefined && !isNaN(interval) && interval > 0) {
            if (currentIntervalRef.current !== interval) {
                currentIntervalRef.current = interval;
                console.log('🔄 useEffect同步间隔到ref:', interval, '秒');
            }
        } else {
            console.log('⚠️ useEffect检测到interval无效:', interval, '，保持ref值:', currentIntervalRef.current);
        }
    }, [interval]);

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
        const productNo = products[selectedModel]?.[selectedStorage]?.[selectedColor] || ''
        // console.log('📍 获取产品编号:', {
        //     selectedModel,
        //     selectedStorage, 
        //     selectedColor,
        //     productNo
        // });
        return productNo;
    }

    // 检查库存 - 真实API调用
    const checkStock = async (productNo) => {
        setLoading(true)
        try {
            let stockData = null
            let pickupData = null
            
            console.log('开始请求苹果API...')
            
            try {
                // 构建API URL - 兼容开发环境和生产环境
                const stockUrl = `/api/stock?fae=true&pl=true&mts.0=regular&mts.1=compact&parts.0=${productNo}&searchNearby=true&store=R409`
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
                    console.log('✅ Stock data received:', stockData)
                } else {
                    console.error('❌ Stock request failed:', stockResponse.status, stockResponse.statusText)
                    // 尝试获取详细的错误信息
                    try {
                        const errorData = await stockResponse.json();
                        console.error('📋 Stock API 详细错误:', errorData);
                    } catch (e) {
                        const errorText = await stockResponse.text();
                        console.error('📋 Stock API 错误文本:', errorText);
                    }
                }
                
                // 请求取货信息
                const pickupUrl = `/api/pickup?fae=true&mts.0=regular&mts.1=compact&searchNearby=true&store=R409&product=${productNo}`
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
                throw new Error(`请求苹果API失败: ${requestError.message}。请检查网络连接。`)
            }
            
            // 检查是否有数据返回
            if (!stockData && !pickupData) {
                throw new Error('无法获取苹果库存数据，请检查网络连接')
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
            
            const storesMap = new Map()
            
            // 解析库存数据
            const stockStores = stockData?.body?.content?.pickupMessage?.stores || []
            console.log(`📍 在Stock API中找到 ${stockStores.length} 个门店`);
            
            stockStores.forEach((store, index) => {
                console.log(`\n--- Stock门店 ${index + 1} ---`);
                //console.log('原始数据:', JSON.stringify(store, null, 2));
                
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
        console.log('🚀 开始监控，当前状态检查:');
        console.log('- interval 状态:', interval, '(类型:', typeof interval, ')');
        console.log('- currentIntervalRef.current:', currentIntervalRef.current, '(类型:', typeof currentIntervalRef.current, ')');
        console.log('- isMonitoring:', isMonitoring);
        
        const productNo = getCurrentProductNo()
        if (!productNo) {
            setNotification('请选择要监控的产品')
            return
        }

        // 强制停止之前的监控（完全清理状态）
        console.log('🧹 强制清理所有旧状态和定时器');
        
        // 先设置状态为停止，确保所有正在运行的定时器能正确退出
        isMonitoringRef.current = false;
        
        // 清理旧的定时器
        if (intervalRef.current) {
            console.log('🧹 清理旧的主定时器:', intervalRef.current);
            clearTimeout(intervalRef.current);
            intervalRef.current = null;
        }
        
        if (countdownRef.current) {
            console.log('🧹 清理旧的倒计时定时器:', countdownRef.current);
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        
        // 等待一小段时间确保异步操作完成
        await new Promise(resolve => setTimeout(resolve, 100));

        // 重置所有监控状态和计数器（基于记忆经验：停止监控后再次启动时，应主动清空已检查次数和最后检查时间）
        console.log('🔄 重置所有监控状态，当前间隔:', interval, '秒');
        setIsMonitoring(true);
        isMonitoringRef.current = true; // 同步更新ref状态
        setRequestCounter(0); // 清空已检查次数
        setLastCheckTime(''); // 清空最后检查时间
        setNotification('🚀 正在启动监控，即将进行首次检查...');
        setNextCheckCountdown(0); // 重置倒计时
        setMonitorResults([]); // 清空之前的监控结果
        
        // 保存当前间隔时间到 ref 中（应用记忆中的多重 fallback 机制）
        let effectiveInterval = interval;
        if (!effectiveInterval || effectiveInterval === undefined || isNaN(effectiveInterval) || effectiveInterval <= 0) {
            effectiveInterval = currentIntervalRef.current;
        }
        if (!effectiveInterval || effectiveInterval === undefined || isNaN(effectiveInterval) || effectiveInterval <= 0) {
            effectiveInterval = 30; // 最终的fallback
        }
        currentIntervalRef.current = effectiveInterval;
        console.log('✅ 已重置监控状态：已检查次数=0，最后检查时间=空，结果列表已清空，间隔设置为:', effectiveInterval, '秒，保存到ref:', currentIntervalRef.current);

        // React严格模式下防止重复执行
        let hasExecutedFirstCheck = false;
        
        // 立即检查一次
        console.log('📦 立即进行第一次检查');
        
        const performFirstCheck = async () => {
            if (hasExecutedFirstCheck) {
                console.log('⚠️ 首次检查已执行，跳过重复执行');
                return;
            }
            hasExecutedFirstCheck = true;
            
            try {
                await checkCurrentProduct(true); // 传递 isFirstCheck 标记
            } catch (error) {
                console.error('❌ 首次检查失败:', error);
                setNotification('⚠️ 首次检查失败，但监控将继续运行');
            }
        }

        // 执行第一次检查
        await performFirstCheck();
        
        // 检查监控是否仍然活跃（防止在首次检查时被停止或发现库存）
        if (!isMonitoringRef.current) {
            console.log('⚠️ 首次检查后监控已停止，不设置定时器');
            return;
        }

        // 设置定时检查 - 只在首次检查完成且监控仍活跃时设置
        console.log(`⏰ 首次检查完成，设置定时器，间隔: ${interval}秒`);
        
        // 保存当前间隔时间到闭包中，避免作用域问题
        const checkInterval = currentIntervalRef.current || interval || 30; // 应用多重 fallback
        console.log('📋 保存检查间隔:', checkInterval, '秒，已保存到 ref:', currentIntervalRef.current);
        
        const scheduleNextCheck = (currentInterval) => {
            // 应用记忆中的多重 fallback 机制，确保间隔参数有效
            let actualInterval = currentInterval;
            console.log('🔧 scheduleNextCheck 参数检查开始 - 传入:', currentInterval, 'ref保存:', currentIntervalRef.current, 'state:', interval);
            
            if (!actualInterval || actualInterval === undefined || isNaN(actualInterval) || actualInterval <= 0) {
                console.log('⚠️ 传入参数无效，尝试使用 ref 值');
                actualInterval = currentIntervalRef.current;
            }
            if (!actualInterval || actualInterval === undefined || isNaN(actualInterval) || actualInterval <= 0) {
                console.log('⚠️ ref 值无效，尝试使用 state 值');
                actualInterval = interval;
            }
            if (!actualInterval || actualInterval === undefined || isNaN(actualInterval) || actualInterval <= 0) {
                console.error('⚠️ 所有间隔值都不有效，使用默认值 30 秒');
                actualInterval = 30;
                currentIntervalRef.current = 30;
            }
            
            console.log('🔧 scheduleNextCheck 最终确定使用间隔:', actualInterval, '秒');
            
            // 双重检查监控状态
            if (!isMonitoringRef.current) {
                console.log('⚠️ 监控已停止，不再调度下次检查');
                intervalRef.current = null;
                return null;
            }
            
            console.log('🔄 调度下次检查，启动倒计时，间隔:', actualInterval, '秒');
            
            // 设置倒计时显示
            setNextCheckCountdown(actualInterval);
            
            // 清理旧的倒计时定时器
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
            
            // 启动倒计时定时器
            countdownRef.current = setInterval(() => {
                setNextCheckCountdown(prev => {
                    if (!isMonitoringRef.current) {
                        console.log('⚠️ 倒计时期间监控被停止');
                        clearInterval(countdownRef.current);
                        countdownRef.current = null;
                        return 0;
                    }
                    
                    if (prev <= 1) {
                        console.log('⏰ 倒计时结束，等待定时器触发');
                        clearInterval(countdownRef.current);
                        countdownRef.current = null;
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            
            // 设置主检查定时器
            const timeoutId = setTimeout(async () => {
                const currentTime = new Date().toLocaleTimeString();
                console.log(`⏰ 定时检查触发 [${currentTime}] - 监控状态:`, isMonitoringRef.current);
                
                // 再次检查监控状态
                if (!isMonitoringRef.current) {
                    console.log('⚠️ 定时器触发时监控已停止，退出检查');
                    intervalRef.current = null;
                    return;
                }
                
                try {
                    console.log('🔍 开始执行定时检查...');
                    await checkCurrentProduct(false); // 非首次检查
                    console.log('✅ 定时检查完成');
                } catch (error) {
                    console.error('❌ 定时检查失败:', error);
                    if (isMonitoringRef.current) {
                        setNotification(`检查失败: ${error.message}，监控继续`);
                    }
                }
                
                // 检查是否需要调度下次检查 - 传递当前间隔值
                if (isMonitoringRef.current) {
                    console.log('📋 调度下次检查，使用间隔:', actualInterval, '秒');
                    scheduleNextCheck(actualInterval);
                } else {
                    console.log('⚠️ 监控已停止，不再调度');
                    intervalRef.current = null;
                }
            }, actualInterval * 1000);
            
            intervalRef.current = timeoutId;
            console.log('📋 已调度下次检查，定时器ID:', timeoutId, '间隔:', actualInterval, '秒');
            console.log('🔍 验证定时器ID保存:', intervalRef.current); // 验证保存是否成功
            return timeoutId;
        };
        
        // 启动第一次调度 - 传递正确的间隔参数
        console.log('🚀 准备启动监控循环，使用间隔:', currentIntervalRef.current, '秒');
        const firstTimerId = scheduleNextCheck(currentIntervalRef.current);
        console.log('🚀 监控循环已启动，首个定时器ID:', firstTimerId, '间隔:', currentIntervalRef.current, '秒');
    }



    // 停止监控
    const stopMonitoring = () => {
        console.log('🛑 停止监控，当前定时器ID:', intervalRef.current, '监控状态:', isMonitoringRef.current);
        
        // 先更新状态，防止定时器继续执行
        console.log('🚫 设置监控状态为停止');
        setIsMonitoring(false);
        isMonitoringRef.current = false; // 同步更新ref状态，防止定时器继续执行
        
        // 清理主定时器 - 基于记忆经验：使用clearTimeout清理定时器
        if (intervalRef.current) {
            console.log('🧹 清理主定时器:', intervalRef.current);
            clearTimeout(intervalRef.current); // 使用clearTimeout清理setTimeout定时器
            intervalRef.current = null;
            console.log('✅ 主定时器已清理');
        } else {
            console.log('⚠️ 主定时器已经为null，无需清理');
        }
        
        // 清理倒计时定时器
        if (countdownRef.current) {
            console.log('🧹 清理倒计时定时器:', countdownRef.current);
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            console.log('✅ 倒计时定时器已清理');
        }
        
        // 重置倒计时显示
        setNextCheckCountdown(0);
        setNotification('🛑 已停止监控');
        console.log('🏁 监控停止完成，所有定时器已清理，状态已重置，保持间隔:', currentIntervalRef.current, '秒');
    }



    // 检查当前选中的产品
    const checkCurrentProduct = async (isFirstCheck = false) => {
        console.log(`🔍 检查开始 ${isFirstCheck ? '(首次检查)' : '(定时检查)'} - 监控状态(ref):`, isMonitoringRef.current);
        
        // 首先检查是否还在监控状态
        if (!isMonitoringRef.current) {
            console.log('⚠️ 监控已停止，退出检查');
            return;
        }
        
        const productNo = getCurrentProductNo()
        if (!productNo) {
            console.log('⚠️ 没有产品编号');
            return
        }

        // 更新计数器和时间
        setRequestCounter(prev => prev + 1)
        setLastCheckTime(new Date().toLocaleString())
        setNotification('🔍 正在检查库存情况，请稍候...')

        try {
            const stockInfo = await checkStock(productNo)
            
            // 再次检查监控状态，防止在异步期间被停止
            if (!isMonitoringRef.current) {
                console.log('⚠️ 异步执行期间监控被停止，退出');
                return;
            }
            
            const productName = `${selectedModel} ${selectedStorage} ${selectedColor}`
            
            const result = {
                name: productName,
                productNo,
                ...stockInfo,
                timestamp: new Date().getTime()
            }
            
            console.log('📦 检查完成:', result.available ? '有库存' : '无库存');
            
            // 按照用户建议：每次都清空列表然后添加新结果，避免重复问题
            console.log('🗑️ 清空当前列表并添加新结果');
            setMonitorResults([result]);
            
            // 更新通知状态
            if (stockInfo.available) {
                setNotification(`🎉 ${productName} 有库存了！自动停止监控。`)
                // 浏览器通知
                if (Notification.permission === 'granted') {
                    new Notification('iPhone 库存提醒', {
                        body: `${productName} 现在有库存了！`,
                        icon: '/favicon.ico'
                    })
                }
                // 有库存时自动停止监控
                console.log('🎉 检测到有库存，自动停止监控');
                stopMonitoring();
                return; // 直接返回，不再启动倒计时
            } else {
                // 确保在监控时显示检查完成的状态
                const currentCount = requestCounter + 1 // 因为requestCounter还没有被更新到最新值
                if (isMonitoringRef.current) {
                    setNotification(`✅ 检查完成 - 暂无库存，继续监控中`)
                } else {
                    setNotification(`✅ 检查完成 - 暂无库存`)
                }
            }

            // 只有在监控中且无库存且非首次检查时，才需要额外启动倒计时
            // 但由于scheduleNextCheck已经处理了倒计时，这里只需要记录日志
            console.log('🔍 检查是否需要启动倒计时 - 监控状态(ref):', isMonitoringRef.current, '是否首次检查:', isFirstCheck, '定时器ID:', intervalRef.current);
            
            if (isFirstCheck) {
                console.log('📋 首次检查完成，定时器将自然触发下次检查，无需额外倒计时');
            } else if (!isMonitoringRef.current) {
                console.log('⚠️ 监控已停止，不需倒计时');
            } else if (!intervalRef.current) {
                console.log('⚠️ 定时器已被清理，监控可能需要重新启动');
            } else {
                console.log('📋 定时检查完成，倒计时已由scheduleNextCheck处理');
            }
        } catch (error) {
            console.error('❌ 检查失败:', error);
            setNotification(`检查失败: ${error.message}`);
            
            // 即使出错也要检查是否需要继续监控
            // 由于scheduleNextCheck已经处理了倒计时，这里不需要额外处理
            console.log('📋 检查失败，但监控继续，倒计时由scheduleNextCheck处理');

        }
    }

    // 手动检查库存
    const handleManualCheck = async () => {
        const productNo = getCurrentProductNo()
        if (!productNo) {
            setNotification('请选择要检查的产品')
            return
        }
        setNotification('🔍 正在手动检查库存，请稍候...')
        // 手动检查不影响监控流程，不启动倒计时
        await checkCurrentProduct(true) // 手动检查视为“首次检查”类型，不启动倒计时
        setNotification('✅ 手动检查完成')
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
                clearTimeout(intervalRef.current) // 改为clearTimeout
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current)
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
                            onChange={(e) => {
                                console.log('🗑️ 更改型号为:', e.target.value);
                                setSelectedModel(e.target.value);
                                // 重置容量和颜色选择
                                const newModelProducts = products[e.target.value] || {};
                                const firstStorage = Object.keys(newModelProducts)[0];
                                const firstColor = firstStorage ? Object.keys(newModelProducts[firstStorage])[0] : '';
                                setSelectedStorage(firstStorage || '256G');
                                setSelectedColor(firstColor || '天蓝色');
                            }}
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
                            onChange={(e) => {
                                console.log('🗑️ 更改容量为:', e.target.value);
                                setSelectedStorage(e.target.value);
                                // 重置颜色选择
                                const storageColors = products[selectedModel]?.[e.target.value] || {};
                                const firstColor = Object.keys(storageColors)[0];
                                setSelectedColor(firstColor || '天蓝色');
                            }}
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
                            onChange={(e) => {
                                console.log('🗑️ 更改颜色为:', e.target.value);
                                setSelectedColor(e.target.value);
                            }}
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
                            onChange={(e) => {
                                const newInterval = Number(e.target.value);
                                setInterval(newInterval);
                                currentIntervalRef.current = newInterval; // 立即更新 ref，不等待 useEffect
                                console.log('🔄 用户更改间隔为:', newInterval, '秒，已同步到 ref:', currentIntervalRef.current);
                            }}
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
                            onClick={() => {
                                console.log('🗑️ 清空结果 - 监控状态:', isMonitoring);
                                setMonitorResults([])
                                setNotification('🗄️ 已清空监控结果')
                            }}
                            disabled={monitorResults.length === 0}
                            className="btn-secondary"
                            title="清空监控结果列表，监控将继续运行"
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
                                title={!getCurrentProductNo() ? '请选择完整的产品配置' : '开始监控库存'}
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
                
                {/* 监控状态显示 */}
                {(isMonitoring || lastCheckTime || requestCounter > 0 || loading) && (
                    <div className="monitoring-status">
                        <div className="status-grid">
                            {isMonitoring && (
                                <div className="status-item">
                                    <span className="status-label">监控状态:</span>
                                    <span className="status-value active">🟢 运行中</span>
                                </div>
                            )}
                            {requestCounter > 0 && (
                                <div className="status-item">
                                    <span className="status-label">已检查次数:</span>
                                    <span className="status-value">{requestCounter} 次</span>
                                </div>
                            )}
                            {lastCheckTime && (
                                <div className="status-item">
                                    <span className="status-label">最后检查:</span>
                                    <span className="status-value">{lastCheckTime}</span>
                                </div>
                            )}
                            {/* {isMonitoring && nextCheckCountdown > 0 && (
                                <div className="status-item">
                                    <span className="status-label">下次检查:</span>
                                    <span className="status-value countdown">{nextCheckCountdown}秒后</span>
                                </div>
                            )} */}
                            {loading && (
                                <div className="status-item">
                                    <span className="status-label">请求状态:</span>
                                    <span className="status-value loading">⏳ 请求中...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 监控结果 */}
            {monitorResults.length > 0 && (
                <div className="results-section">
                    <h3>库存监控结果</h3>
                    <div className="results-list">
                        {monitorResults.slice(0, 10).map((result, index) => (
                            <div key={`${result.productNo}-${result.timestamp}-${index}`} className={`result-item ${result.available ? 'available' : 'unavailable'}`}>
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
                                    {/* {result.debugInfo && (
                                        <small className="debug-info">
                                            API状态: 库存{result.debugInfo.stockApiStatus} | 取货{result.debugInfo.pickupApiStatus} | 
                                            门店数: {result.debugInfo.stockStoresCount}+{result.debugInfo.pickupStoresCount}={result.debugInfo.totalStoresFound} | 
                                            有库存: {result.debugInfo.availableStoresFound}
                                        </small>
                                    )} */}
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
                    <p>技术实现：</p>
                    <ul>
                        <li>开发环境：使用 Vite 代理转发请求</li>
                        <li>生产环境：使用 Cloudflare Functions 代理</li>
                        <li>直接调用苹果香港官网API获取实时数据</li>
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