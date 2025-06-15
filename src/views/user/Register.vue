<template>
  <div class="register-container">
    <div class="register-background">
      <div class="register-bg-circle register-bg-circle-1"></div>
      <div class="register-bg-circle register-bg-circle-2"></div>
      <div class="register-bg-circle register-bg-circle-3"></div>
    </div>

    <div class="register-content">
      <div class="register-left">
        <div class="register-title-area">
          <h1 class="register-system-title">视频水印系统</h1>
          <p class="register-system-subtitle">创建您的账号</p>
        </div>
        <div class="register-features">
          <div class="register-feature-item">
            <check-circle-outlined class="register-feature-icon" />
            <span>一键注册，快速开始</span>
          </div>
          <div class="register-feature-item">
            <check-circle-outlined class="register-feature-icon" />
            <span>安全保障，数据加密</span>
          </div>
          <div class="register-feature-item">
            <check-circle-outlined class="register-feature-icon" />
            <span>专业服务，随时支持</span>
          </div>
        </div>
      </div>

      <div class="register-form-wrapper">
        <h2 class="register-form-title">注册</h2>
        <p class="register-form-desc">欢迎注册视频水印系统，只需几个简单步骤</p>
        
        <a-form
          :model="registerForm"
          :rules="rules"
          @finish="handleSubmit"
          layout="vertical"
          ref="formRef"
          class="register-form"
        >
          <a-form-item name="username" label="用户名">
            <a-input
              v-model:value="registerForm.username"
              placeholder="请输入用户名"
              size="large"
            >
              <template #prefix>
                <user-outlined />
              </template>
            </a-input>
          </a-form-item>
          
          <a-form-item name="email" label="邮箱">
            <a-input
              v-model:value="registerForm.email"
              placeholder="请输入电子邮箱"
              size="large"
            >
              <template #prefix>
                <mail-outlined />
              </template>
            </a-input>
          </a-form-item>
          
          <a-form-item name="password" label="密码">
            <a-input-password
              v-model:value="registerForm.password"
              placeholder="请输入密码"
              size="large"
            >
              <template #prefix>
                <lock-outlined />
              </template>
            </a-input-password>
          </a-form-item>
          
          <a-form-item name="confirmPassword" label="确认密码">
            <a-input-password
              v-model:value="registerForm.confirmPassword"
              placeholder="请再次输入密码"
              size="large"
            >
              <template #prefix>
                <safety-outlined />
              </template>
            </a-input-password>
          </a-form-item>
          
          <a-form-item name="agreement" valuePropName="checked">
            <a-checkbox v-model:checked="registerForm.agreement">
              我已阅读并同意 <a>服务条款</a> 和 <a>隐私政策</a>
            </a-checkbox>
          </a-form-item>
          
          <a-form-item>
            <a-button
              type="primary"
              html-type="submit"
              class="register-form-button"
              :loading="loading"
              size="large"
              block
            >
              立即注册
            </a-button>
          </a-form-item>
          
          <div class="register-form-divider">
            <span>已有账号？</span>
          </div>
          
          <a-button class="login-button" block size="large" @click="() => router.push('/login')">
            <template #icon><login-outlined /></template>
            返回登录
          </a-button>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  SafetyOutlined,
  CheckCircleOutlined,
  LoginOutlined 
} from '@ant-design/icons-vue';
import { useUserStore } from '@/store/user';
import { validateUsername, validateEmail, validatePassword } from '@/utils/validate';

// 路由
const router = useRouter();
const userStore = useUserStore();

// 表单引用
const formRef = ref(null);
// 加载状态
const loading = ref(false);

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreement: false,
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
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
    { validator: (_, value) => {
      if (!value || validateEmail(value)) {
        return Promise.resolve();
      }
      return Promise.reject('邮箱格式不正确');
    }, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少为8位', trigger: 'blur' },
    { validator: (_, value) => {
      if (!value || validatePassword(value)) {
        return Promise.resolve();
      }
      return Promise.reject('密码必须包含大小写字母和数字');
    }, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: (_, value) => {
      if (!value || value === registerForm.password) {
        return Promise.resolve();
      }
      return Promise.reject('两次输入的密码不一致');
    }, trigger: ['blur', 'change'] }
  ],
  agreement: [
    { 
      validator: (_, value) => {
        if (value) {
          return Promise.resolve();
        }
        return Promise.reject('请阅读并同意服务条款和隐私政策');
      }, 
      trigger: 'change' 
    }
  ]
};

// 处理表单提交
const handleSubmit = async (values) => {
  try {
    loading.value = true;
    const result = await userStore.registerAction(values);
    if (result.code === 200) {
      message.success('注册成功，请登录');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }
  } catch (error) {
    console.error('注册失败:', error);
    message.error(error.message || '注册失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="less" scoped>
// 注册页样式
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
  position: relative;
  overflow: hidden;
}

.register-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.register-bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.8;
  
  &-1 {
    width: 800px;
    height: 800px;
    background: linear-gradient(140deg, #52c41a 0%, #237804 100%);
    top: -200px;
    right: -200px;
    z-index: -1;
  }
  
  &-2 {
    width: 600px;
    height: 600px;
    background: linear-gradient(140deg, #1890ff 0%, #0050b3 100%);
    bottom: -200px;
    left: -100px;
    z-index: -2;
    opacity: 0.6;
  }
  
  &-3 {
    width: 300px;
    height: 300px;
    background: linear-gradient(140deg, #faad14 0%, #fa541c 100%);
    top: 20%;
    right: 15%;
    z-index: -3;
    opacity: 0.5;
  }
}

.register-content {
  display: flex;
  width: 920px;
  height: 600px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1;
}

.register-left {
  width: 380px;
  background: linear-gradient(140deg, #52c41a 0%, #237804 100%);
  color: white;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  
  .register-title-area {
    padding-top: 60px;
  }
  
  .register-system-title {
    color: white;
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  .register-system-subtitle {
    color: rgba(255, 255, 255, 0.85);
    font-size: 16px;
    line-height: 1.5;
  }
  
  .register-features {
    margin-top: auto;
  }
  
  .register-feature-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .register-feature-icon {
    color: #fadb14;
    font-size: 18px;
    margin-right: 12px;
  }
}

.register-form-wrapper {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background-color: #fafafa;
  
  .register-form-title {
    font-size: 24px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 8px;
  }
  
  .register-form-desc {
    color: rgba(0, 0, 0, 0.45);
    margin-bottom: 24px;
  }
  
  .register-form {
    max-width: 100%;
  }
  
  .register-form-button {
    height: 44px;
    font-size: 16px;
    margin-bottom: 16px;
    background-color: #1890ff;
    border-color: #1890ff;
    
    &:hover {
      background-color: #40a9ff;
      border-color: #40a9ff;
    }
  }
  
  .register-form-divider {
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
      background: #fafafa;
      position: relative;
      z-index: 1;
    }
  }
  
  .login-button {
    border: 1px solid #1890ff;
    color: #1890ff;
    background: transparent;
    height: 44px;
    font-size: 16px;
    
    &:hover {
      color: #40a9ff;
      border-color: #40a9ff;
    }
  }
}

// 响应式样式
@media (max-width: 980px) {
  .register-content {
    width: 90%;
    flex-direction: column;
    height: auto;
  }
  
  .register-left {
    width: 100% !important;
    padding: 30px !important;
  }
  
  .register-title-area {
    padding-top: 20px !important;
  }
}
</style> 