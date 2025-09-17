// 剪贴板工具函数
export async function copyWithFallback(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return { ok: true }
    }
  } catch (e) {
    // 继续尝试fallback方法
  }
  
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return { ok: true }
  } catch (e) {
    // 最后的fallback失败
  }
  
  return { ok: false }
}