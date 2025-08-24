import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
// 导入全局样式
import './style.css'
import './styles/variables.less'

// 创建应用实例
const app = createApp(App)

// 注册插件
app.use(router)
app.use(store)
app.use(Antd)

// 开发环境下的 Mock 服务已关闭，改为直连后端
async function setupMockService() {
  // return;
  // if (import.meta.env.DEV) {
  //   try {
  //     const { worker } = await import('./mock/browser')
  //     await worker.start({
  //       serviceWorker: { url: '/mockServiceWorker.js' },
  //       onUnhandledRequest: 'bypass',
  //     })
  //     console.log('[MSW] Mock服务启动成功')
  //   } catch (error) {
  //     console.error('[MSW] Mock服务启动失败:', error)
  //   }
  // }
}

// 启动应用
async function bootstrap() {
  // 关闭 Mock，直接连接后端
  // await setupMockService()
  
  // 然后挂载应用
  app.mount('#app')
  
  console.log('应用启动完成')
}

bootstrap().catch(error => {
  console.error('应用启动失败:', error)
})
