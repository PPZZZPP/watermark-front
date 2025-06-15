<template>
  <div class="login-container">
    <div class="login-background">
      <div class="login-bg-gradient"></div>
      <div class="login-particles" ref="particles"></div>
    </div>

    <div class="login-content">
      <div class="login-left">
        <div class="login-title-area">
          <div class="login-logo">
            <svg viewBox="0 0 24 24" class="login-logo-icon">
              <path d="M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z" fill="currentColor" />
            </svg>
          </div>
          <h1 class="login-system-title">视频水印系统</h1>
          <p class="login-system-subtitle">高效管理您的视频水印</p>
        </div>
        <div class="login-features">
          <div class="login-feature-item">
            <check-circle-outlined class="login-feature-icon" />
            <span>高效批量处理视频水印</span>
          </div>
          <div class="login-feature-item">
            <check-circle-outlined class="login-feature-icon" />
            <span>多种水印模板灵活选择</span>
          </div>
          <div class="login-feature-item">
            <check-circle-outlined class="login-feature-icon" />
            <span>强大的任务管理与监控</span>
          </div>
        </div>
        <div class="login-version">
          <span>V 1.0.0</span>
        </div>
      </div>

      <div class="login-form-wrapper">
        <div class="login-welcome">
          <h2 class="login-form-title">欢迎回来</h2>
          <p class="login-form-desc">登录您的账户继续使用系统</p>
        </div>
        
        <a-form
          :model="loginForm"
          :rules="rules"
          @finish="handleSubmit"
          ref="formRef"
          class="login-form"
          layout="vertical"
        >
          <a-form-item name="username" label="用户名">
            <a-input
              v-model:value="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              class="login-input"
              :status="loginErrors.username ? 'error' : ''"
              @focus="clearError('username')"
            >
              <template #prefix>
                <user-outlined />
              </template>
            </a-input>
            <div v-if="loginErrors.username" class="login-error-message">{{ loginErrors.username }}</div>
          </a-form-item>
          
          <a-form-item name="password" label="密码">
            <a-input-password
              v-model:value="loginForm.password"
              placeholder="请输入密码"
              size="large"
              class="login-input"
              :status="loginErrors.password ? 'error' : ''"
              @focus="clearError('password')"
            >
              <template #prefix>
                <lock-outlined />
              </template>
            </a-input-password>
            <div v-if="loginErrors.password" class="login-error-message">{{ loginErrors.password }}</div>
          </a-form-item>
          
          <div class="login-form-remember">
            <a-checkbox v-model:checked="loginForm.remember">
              记住我
            </a-checkbox>
            <a class="login-form-forgot">
              忘记密码？
            </a>
          </div>
          
          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              class="login-form-button"
              :loading="loading"
              size="large"
              block
            >
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </a-button>
          </a-form-item>
          
          <div class="login-form-divider">
            <span>还没有账号？</span>
          </div>
          
          <a-button class="register-button" block size="large" @click="() => router.push('/register')">
            <template #icon><user-add-outlined /></template>
            立即注册
          </a-button>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  UserOutlined, 
  LockOutlined, 
  CheckCircleOutlined,
  UserAddOutlined,
  ThunderboltOutlined
} from '@ant-design/icons-vue';
import { useUserStore } from '@/store/user';
import { validateUsername } from '@/utils/validate';

// 路由和状态
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 表单引用
const formRef = ref(null);
// 加载状态
const loading = ref(false);
// 调试模式
const debugMode = ref(true);
// 粒子效果引用
const particles = ref(null);

// 填充测试账号
const fillTestAccount = () => {
  if (debugMode.value) {
    loginForm.username = 'admin';
    loginForm.password = 'admin123';
  }
};

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  remember: false,
});

// 登录错误信息
const loginErrors = reactive({
  username: '',
  password: ''
});

// 表单校验规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { validator: (_, value) => {
      if (!value || validateUsername(value)) {
        return Promise.resolve();
      }
      return Promise.reject('用户名格式不正确');
    }, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少为8位', trigger: 'blur' },
  ],
};

// 清除特定字段的错误信息
const clearError = (field) => {
  loginErrors[field] = '';
}; 

// 处理表单提交
const handleSubmit = async (values) => {
  try {
    // 重置错误信息
    loginErrors.username = '';
    loginErrors.password = '';
    
    loading.value = true;
    console.log('Login组件 - 提交登录表单:', values);
    
    // 添加重试机制
    let retryCount = 0;
    const maxRetries = 2;
    let lastError = null;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`Login组件 - 尝试登录 (${retryCount > 0 ? '重试' + retryCount : '首次'})`);
        const result = await userStore.loginAction(values);
        
        if (result.code === 200) {
          // 打印token到控制台
          console.log('Login组件 - 登录成功，Token:', result.data.token);
          
          message.success('登录成功');
          
          // 延迟跳转，确保token保存完成
          setTimeout(() => {
            // 如果有重定向地址，则跳转到重定向地址
            const redirect = route.query.redirect || '/dashboard';
            // 强制页面刷新并跳转，确保重新加载状态
            window.location.href = redirect;
          }, 500);
          
          // 登录成功，跳出循环
          return;
        } else {
          // 非200状态码，抛出错误
          throw new Error(result.message || '登录失败');
        }
      } catch (error) {
        lastError = error;
        
        // 如果是500错误，尝试重试
        if (error.code === 500 || (error.response && error.response.status === 500)) {
          console.error(`Login组件 - 登录失败 (500错误)，重试 ${retryCount + 1}/${maxRetries}`);
          retryCount++;
          
          if (retryCount <= maxRetries) {
            // 等待一段时间再重试
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        } else {
          // 其他错误直接抛出
          break;
        }
      }
    }
    
    // 如果执行到这里，说明重试失败或者是非500错误
    throw lastError;
  } catch (error) {
    console.error('Login组件 - 登录失败:', error);
    
    // 设置具体的错误信息
    if (error.message && error.message.includes('用户名')) {
      loginErrors.username = error.message || '用户名不正确';
    } else if (error.message && error.message.includes('密码')) {
      loginErrors.password = error.message || '密码不正确';
    } else if (error.code === 500 || (error.response && error.response.status === 500)) {
      message.error('服务器内部错误，请稍后再试');
    } else {
      message.error(error.message || '登录失败，请检查用户名和密码');
    }
  } finally {
    loading.value = false;
  }
};

// 创建粒子效果
const createParticles = () => {
  if (!particles.value) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particles.value.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const particlesArray = [];
  
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 1 - 0.5;
      this.speedY = Math.random() * 1 - 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.x > canvas.width || this.x < 0) {
        this.speedX = -this.speedX;
      }
      
      if (this.y > canvas.height || this.y < 0) {
        this.speedY = -this.speedY;
      }
    }
    
    draw() {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // 初始化粒子
  const init = () => {
    for (let i = 0; i < 50; i++) {
      particlesArray.push(new Particle());
    }
  };
  
  // 动画循环
  let animationId;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesArray.forEach(particle => {
      particle.update();
      particle.draw();
    });
    animationId = requestAnimationFrame(animate);
  };
  
  // 窗口大小变化时调整画布大小
  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  
  // 初始化粒子并开始动画
  init();
  animate();
  window.addEventListener('resize', handleResize);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('resize', handleResize);
    cancelAnimationFrame(animationId);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };
};

// 生命周期钩子
onMounted(() => {
  const cleanup = createParticles();
  
  // 检查URL参数中是否有快速登录标志
  if (route.query.quickLogin === 'true' || debugMode.value) {
    fillTestAccount();
  }
  
  onUnmounted(() => {
    if (cleanup) cleanup();
  });
});
</script>

<style lang="less" scoped>
// 登录页样式
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.login-bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a365d 0%, #153e75 25%, #2a4365 50%, #2c5282 75%, #2b6cb0 100%);
  opacity: 0.9;
}

.login-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.login-content {
  display: flex;
  width: 920px;
  height: 600px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 2;
  transition: all 0.3s ease;
}

.login-left {
  width: 380px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%);
    opacity: 0.6;
    z-index: 0;
    animation: pulse 15s infinite linear;
  }
  
  .login-title-area {
    padding-top: 40px;
    position: relative;
    z-index: 1;
  }
  
  .login-logo {
    margin-bottom: 24px;
    
    .login-logo-icon {
      width: 48px;
      height: 48px;
      color: white;
    }
  }
  
  .login-system-title {
    color: white;
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  .login-system-subtitle {
    color: rgba(255, 255, 255, 0.85);
    font-size: 16px;
    line-height: 1.5;
  }
  
  .login-features {
    margin-top: auto;
    position: relative;
    z-index: 1;
  }
  
  .login-feature-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    transition: transform 0.3s ease;
    
    &:hover {
      transform: translateX(5px);
    }
  }
  
  .login-feature-icon {
    color: #4ade80;
    font-size: 18px;
    margin-right: 12px;
  }
  
  .login-version {
    position: relative;
    z-index: 1;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 24px;
  }
}

.login-form-wrapper {
  flex: 1;
  padding: 48px;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  
  .login-welcome {
    margin-bottom: 32px;
  }
  
  .login-form-title {
    font-size: 28px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 8px;
  }
  
  .login-form-desc {
    color: rgba(0, 0, 0, 0.45);
    font-size: 16px;
  }
  
  .login-form {
    max-width: 100%;
  }
  
  .login-input {
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover, &:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }
  
  .login-error-message {
    color: #f5222d;
    font-size: 12px;
    margin-top: 4px;
  }
  
  .login-form-remember {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  
  .login-form-forgot {
    float: right;
    color: #3b82f6;
    cursor: pointer;
    
    &:hover {
      color: #60a5fa;
      text-decoration: underline;
    }
  }
  
  .login-form-button {
    height: 48px;
    font-size: 16px;
    margin-bottom: 16px;
    background-color: #3b82f6;
    border-color: #3b82f6;
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #2563eb;
      border-color: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  .login-form-divider {
    position: relative;
    text-align: center;
    margin: 16px 0;
    color: rgba(0, 0, 0, 0.45);
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 40%;
      height: 1px;
      background-color: #f0f0f0;
    }
    
    &::before {
      left: 0;
    }
    
    &::after {
      right: 0;
    }
    
    span {
      display: inline-block;
      padding: 0 10px;
      background: #ffffff;
      position: relative;
      z-index: 1;
    }
  }
  
  .register-button {
    border: 1px solid #3b82f6;
    color: #3b82f6;
    background: transparent;
    height: 48px;
    font-size: 16px;
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      color: #ffffff;
      border-color: #3b82f6;
      background-color: #3b82f6;
    }
  }
}

// 动画
@keyframes pulse {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 响应式样式
@media (max-width: 980px) {
  .login-content {
    width: 90%;
    flex-direction: column;
    height: auto;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .login-left {
    width: 100% !important;
    padding: 30px !important;
    max-height: 300px;
  }
  
  .login-title-area {
    padding-top: 20px !important;
  }
  
  .login-form-wrapper {
    padding: 30px !important;
  }
}

@media (max-width: 480px) {
  .login-content {
    width: 95%;
    border-radius: 12px;
  }
  
  .login-left {
    padding: 20px !important;
    max-height: 250px;
  }
  
  .login-form-wrapper {
    padding: 20px !important;
  }
  
  .login-welcome {
    margin-bottom: 20px !important;
  }
  
  .login-form-title {
    font-size: 24px !important;
  }
}
</style>