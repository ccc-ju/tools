import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://www.apple.com',
        changeOrigin: true,
        rewrite: (path) => {
          console.log('🔄 代理重写路径:', path);
          // 直接转发到苹果API
          if (path.includes('/api/stock')) {
            const newPath = path.replace('/api/stock', '/hk-zh/shop/fulfillment-messages');
            console.log('📦 Stock API 重写:', path, '->', newPath);
            return newPath;
          }
          if (path.includes('/api/pickup')) {
            const newPath = path.replace('/api/pickup', '/hk-zh/shop/pickup-message-recommendations');
            console.log('🚚 Pickup API 重写:', path, '->', newPath);
            return newPath;
          }
          console.log('⚠️ 未匹配的路径:', path);
          return path
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 添加必要的headers - 基于官网curl命令更新
            proxyReq.setHeader('accept', '*/*')
            proxyReq.setHeader('accept-language', 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6')
            proxyReq.setHeader('cache-control', 'no-cache')
            proxyReq.setHeader('pragma', 'no-cache')
            proxyReq.setHeader('priority', 'u=1, i')
            proxyReq.setHeader('referer', 'https://www.apple.com/hk-zh/shop/buy-iphone/iphone-17-pro/6.3-%E5%90%8B%E9%A1%AF%E7%A4%BA%E5%99%A8-512gb-%E9%8A%80%E8%89%B2')
            proxyReq.setHeader('sec-ch-ua', '"Chromium";v="140", "Not=A?Brand";v="24", "Microsoft Edge";v="140"')
            proxyReq.setHeader('sec-ch-ua-mobile', '?0')
            proxyReq.setHeader('sec-ch-ua-platform', '"macOS"')
            proxyReq.setHeader('sec-fetch-dest', 'empty')
            proxyReq.setHeader('sec-fetch-mode', 'cors')
            proxyReq.setHeader('sec-fetch-site', 'same-origin')
            proxyReq.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0')
            proxyReq.setHeader('x-aos-ui-fetch-call-1', 'ehq6zhukzb-mfvw9d70')
            
            // 添加完整的Cookie - 基于官网curl命令
            const fullCookie = 'pltvcid=undefined; dssf=1; dssid2=b984ac11-c4b1-4a10-93a8-2ae95f8d4ae9; pxro=2; geo=CN; s_cc=true; as_rumid=7ebf3e68-dd48-4ebf-8aa6-cf6d3dcead39; as_loc=fd25e72f936faccfc325cd4def2ef02909380297b11e4ade664a4960049f19923f8fa2ae555fa3687e44195bb4dce82a4186fcde4534bb0bdd7210f1b53a7e1eaf755e5ec353b581be0a2b7557cbe0503861cc64c5b3b4ce87fcaf350458342f; rtsid=%7BHK%3D%7Bt%3Da%3Bi%3DR409%3B%7D%3B%7D; dslang=HK-ZH; site=HKG; pldfltcid=eef686981d724268bb75d0fe67e308a0031; as_cn=~pkA9hk889hQT-iXybLLdYwgT3rcrhYtIsad1fB3_AU4=; itspod=31; acn01=5INmvMgR+QLw/OGHF/ps4sPuvV2jEDEuX5z6RhYP2wAjdxsWAjs+; as_disa=AAAjAAABAXdESaHqKNLxDCanjanjQf9VYRzVWmIa9WBrQk2WQHNMiTo-dkqyRS80aOA0hA-TAAIBzKf8ZTOoxh2T6DGISmheUq40i53bSxsyapmqDOGu2xA=; as_rec=b3dd6261d988bd7fefcdbf865a1b752ece4ad34331f12dd463a3ad8a7381109e1fd2e5fda17f28bbc466a9bcdd78b41d781a40eb8d257f2666be579f131c9276a970315be01ede9ac10a68acf1a776fa; as_uct=0; POD=cn~zh; nn-user-journey=%7B%22value%22%3A%7B%22os%22%3A%22%22%2C%22device%22%3A%22macOS%22%2C%22journey%22%3A%7B%22lastPath%22%3A%22%2Fzh-cn%2F102597%22%2C%22stitchPath%22%3A%5B%22https%3A%2F%2Fwww.google.com%2F%22%2C%22%2Fzh-cn%2F102597%22%5D%7D%7D%2C%22expiry%22%3A1758098219204%7D; as_sfa=Mnxoay16aHxoay16aHx8emhfSEt8Y29uc3VtZXJ8aW50ZXJuZXR8MHwwfDE; as_pcts=J_595ZQwGa+C+pogSophZUj7HhlNPDptN5FD_6NHtlm0oVp3AAIDIOsQVL0+yN8vDX3hM4aylklb_4u2wJ7yv2tAJ6cFeneC8RaN8:2nC+9f3mIUN0zNp0YZ1aL0:2fchDH92-F3kRms:-pcbt5WIgpcc4BxDRGSMm86mUivsal07ekpoLqGGT37121WgVq0O0; s_fid=55B9E7C2A6A472C3-1C76ED1FCB0964A0; as_dc=ucp6; sh_spksy=.; s_vi=[CS]v1|3468FDEEBCE31A82-600005EA4BF985DA[CE]; as_atb=1.0|MjAyNS0wOS0yMiAwNjo0NjoxMQ|084bc9bddc1820b96a2e6d8998de5f7d27419013; shld_bt_ck=nqe4TjX1Lr0TMxPFzDGNJQ|1758599172|KGbGiP48aU6zMWdtIt-okZ1gqfjshl2aIMcuM0KSX5h33sVxnN8HaTK_SEyPt0QXbJ9MrfsXAGbkD8jsQcN-UxY3Zp8Nma5H_1IJxUPOMBNgsqY776E8wehS9V37TYC4HT3knbkwnxpeE0MwjGP9T8wFl2ZsnKS_Trd55cftmF_onPErQQ70qqd_jW3Nxsi-9bma-fXZYb6k9VutSHGINxkk2CZI80D4HP0WYjFBk06e2t_lF7PJPhXVJgBVZNX3m0TboB-yE02LZP4vvqkZj-SYeZbf5OGudXjMvkZS0EZtrSkmiz5eHFmxImUpDB7niCAH-ClaYji7wfw79yv8XA|mNs5V3hN3uJMFVsyV-uxTMqEckg; shld_bt_m=LYkShD3TPRe0jY3ai6eIMA|1758599181|cDnLx0LD6tFoyDrY5geJIA|YXzVzKS9SFJt9cf4gbzpgSoaIMk; s_sq=appleglobal%3D%2526c.%2526a.%2526activitymap.%2526page%253Dretail%252520-%252520store%252520list%252520%252528hk%252529%2526link%253Diphone%252520-%252520%25252Fhk-zh%25252Fshop%25252Fgoto%25252Fbuy_iphone%252520-%252520globalnav%2526region%253Dglobalnav%2526pageIDType%253D1%2526.activitymap%2526.a%2526.c%2526pid%253Dretail%252520-%252520store%252520list%252520%252528hk%252529%2526pidt%253D1%2526oid%253Dhttps%25253A%25252F%25252Fwww.apple.com%25252Fhk-zh%25252Fshop%25252Fgoto%25252Fbuy_iphone%2526ot%253DA'
            proxyReq.setHeader('cookie', fullCookie)
            
            console.log('🍪 代理请求Headers已设置完成');
          })
        }
      }
    }
  }
})