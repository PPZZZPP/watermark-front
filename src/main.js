import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
// 导入全局样式
import './style.css'

// 创建应用实例
const app = createApp(App)

// 注册插件
app.use(router)
app.use(store)
app.use(Antd)

// 开发环境下启动模拟服务
async function setupMockService() {
  if (import.meta.env.DEV) {
    try {
      const { worker } = await import('./mock/browser')
      
      // 确保Service Worker正确初始化
      await worker.start({
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
        onUnhandledRequest: 'bypass', // 对于未处理的请求，直接通过
      })
      
      console.log('[MSW] Mock服务启动成功')
    } catch (error) {
      console.error('[MSW] Mock服务启动失败:', error)
    }
  }
}

// 启动应用
async function bootstrap() {
  // 先初始化Mock服务
  await setupMockService()
  
  // 然后挂载应用
  app.mount('#app')
  
  console.log('应用启动完成')
}

bootstrap().catch(error => {
  console.error('应用启动失败:', error)
})
