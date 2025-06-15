<template>
  <div class="user-profile-container">
    <!-- 页面头部 -->
    <PageHeader title="个人信息" subTitle="查看和修改您的个人信息">
      <template #icon>
        <user-outlined />
      </template>
      <template #tags>
        <a-tag color="blue">用户中心</a-tag>
        <a-tag color="green">个人资料</a-tag>
      </template>
      <template #extra>
        <a-button type="primary" @click="handleRefresh">
          <template #icon><reload-outlined /></template>
          刷新
        </a-button>
      </template>
    </PageHeader>
    
    <!-- 合并的内容区域 - 左右分栏 -->
    <div class="profile-content">
      <!-- 左侧个人信息卡片 -->
      <div class="profile-sidebar">
        <div class="profile-card">
          <div class="profile-header">
            <a-avatar :size="200" class="profile-avatar">
              <template #icon><user-outlined /></template>
            </a-avatar>
            <div class="profile-info">
              <h2 class="profile-name">{{ userForm.nickname || userForm.username }}</h2>
              <p class="profile-role">{{ getRoleName(userForm.role) }}</p>
            </div>
          </div>
          
          <div class="profile-stats">
            <div class="profile-stat-item">
              <p class="stat-number">12</p>
              <p class="stat-title">处理视频</p>
            </div>
            <div class="profile-stat-item">
              <p class="stat-number">5</p>
              <p class="stat-title">模板</p>
            </div>
            <div class="profile-stat-item">
              <p class="stat-number">26</p>
              <p class="stat-title">任务</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 中间分隔线 -->
      <div class="profile-divider"></div>
      
      <!-- 右侧主要内容区域 -->
      <div class="profile-main">
        <!-- 选项卡导航 -->
        <div class="profile-tabs">
          <a-tabs v-model:activeKey="activeTabKey">
            <a-tab-pane key="basic" tab="基本信息">
              <a-form
                :model="userForm"
                :rules="rules"
                @finish="handleSubmit"
                ref="formRef"
                layout="vertical"
              >
                <a-row :gutter="24">
                  <a-col :span="12">
                    <a-form-item name="username" label="用户名">
                      <a-input v-model:value="userForm.username" disabled />
                    </a-form-item>
                  </a-col>
                  
                  <a-col :span="12">
                    <a-form-item name="nickname" label="昵称">
                      <a-input v-model:value="userForm.nickname" placeholder="请输入昵称" />
                    </a-form-item>
                  </a-col>
                </a-row>
                
                <a-row :gutter="24">
                  <a-col :span="12">
                    <a-form-item name="email" label="邮箱">
                      <a-input v-model:value="userForm.email" placeholder="请输入邮箱" />
                    </a-form-item>
                  </a-col>
                  
                  <a-col :span="12">
                    <a-form-item name="phone" label="手机号">
                      <a-input v-model:value="userForm.phone" placeholder="请输入手机号" />
                    </a-form-item>
                  </a-col>
                </a-row>
                
                <a-row :gutter="24">
                  <a-col :span="24">
                    <a-form-item name="bio" label="个人简介">
                      <a-textarea v-model:value="userForm.bio" placeholder="请输入个人简介" :rows="4" />
                    </a-form-item>
                  </a-col>
                </a-row>
                
                <a-form-item>
                  <a-space>
                    <a-button type="primary" html-type="submit" :loading="loading">
                      保存修改
                    </a-button>
                    <a-button @click="resetForm">
                      重置
                    </a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-tab-pane>
            
            <a-tab-pane key="security" tab="安全设置">
              <a-list class="security-list" item-layout="horizontal">
                <a-list-item>
                  <a-list-item-meta title="密码设置">
                    <template #description>
                      定期修改密码可以保障账号安全
                    </template>
                    <template #avatar>
                      <a-avatar style="background-color: #1890ff">
                        <template #icon><lock-outlined /></template>
                      </a-avatar>
                    </template>
                  </a-list-item-meta>
                  <template #extra>
                    <a-button @click="showChangePasswordModal">修改密码</a-button>
                  </template>
                </a-list-item>
                
                <a-list-item>
                  <a-list-item-meta title="绑定手机">
                    <template #description>
                      {{ userForm.phone ? `已绑定手机：${userForm.phone}` : '绑定手机号便于接收通知' }}
                    </template>
                    <template #avatar>
                      <a-avatar style="background-color: #52c41a">
                        <template #icon><mobile-outlined /></template>
                      </a-avatar>
                    </template>
                  </a-list-item-meta>
                  <template #extra>
                    <a-button @click="showBindPhoneModal">{{ userForm.phone ? '修改' : '绑定' }}</a-button>
                  </template>
                </a-list-item>
                
                <a-list-item>
                  <a-list-item-meta title="账号注销">
                    <template #description>
                      注销后账号数据将无法恢复
                    </template>
                    <template #avatar>
                      <a-avatar style="background-color: #f5222d">
                        <template #icon><delete-outlined /></template>
                      </a-avatar>
                    </template>
                  </a-list-item-meta>
                  <template #extra>
                    <a-button danger @click="showDeleteAccountModal">注销账号</a-button>
                  </template>
                </a-list-item>
              </a-list>
            </a-tab-pane>
            
            <a-tab-pane key="notification" tab="消息通知">
              <div class="notification-empty">
                <a-empty description="消息通知功能即将上线" />
              </div>
            </a-tab-pane>
          </a-tabs>
        </div>
      </div>
    </div>
    
    <!-- 修改密码模态框 -->
    <a-modal
      v-model:visible="changePasswordModalVisible"
      title="修改密码"
      :confirm-loading="passwordLoading"
      @ok="handleChangePassword"
    >
      <a-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef">
        <a-form-item name="oldPassword" label="当前密码">
          <a-input-password v-model:value="passwordForm.oldPassword" placeholder="请输入当前密码" />
        </a-form-item>
        <a-form-item name="newPassword" label="新密码">
          <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item name="confirmPassword" label="确认新密码">
          <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { useUserStore } from '@/store/user';
import { useSystemStore } from '@/store/system';
import { 
  UserOutlined, 
  ReloadOutlined, 
  LockOutlined, 
  MobileOutlined, 
  DeleteOutlined,
  BellOutlined
} from '@ant-design/icons-vue';
import { validateEmail, validatePhone } from '@/utils/validate';

// 用户存储
const userStore = useUserStore();
const systemStore = useSystemStore();

// 表单引用
const formRef = ref(null);
const passwordFormRef = ref(null);

// 加载状态
const loading = ref(false);
const passwordLoading = ref(false);

// 当前活动标签页
const activeTabKey = ref('basic');

// 模态框状态
const changePasswordModalVisible = ref(false);

// 用户信息表单
const userForm = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  bio: ''
});

// 密码修改表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 表单校验规则
const rules = {
  nickname: [{ max: 20, message: '昵称长度不能超过20个字符', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { validator: (_, value) => {
      if (!value || validateEmail(value)) {
        return Promise.resolve();
      }
      return Promise.reject('邮箱格式不正确');
    }, trigger: 'blur' }
  ],
  phone: [
    { validator: (_, value) => {
      if (!value || validatePhone(value)) {
        return Promise.resolve();
      }
      return Promise.reject('手机号格式不正确');
    }, trigger: 'blur' }
  ],
  bio: [{ max: 200, message: '个人简介不能超过200个字符', trigger: 'blur' }]
};

// 密码修改表单校验规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少为8位', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, message: '密码必须包含大小写字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (_, value) => {
      if (!value || value === passwordForm.newPassword) {
        return Promise.resolve();
      }
      return Promise.reject('两次输入的密码不一致');
    }, trigger: ['blur', 'change'] }
  ]
};

// 角色列表
const roleList = ref([]);

// 获取角色名称
const getRoleName = (roleCode) => {
  if (!roleCode) return '普通用户';
  const role = roleList.value.find(r => r.code === roleCode);
  return role ? role.name : (roleCode === 'admin' ? '管理员' : '普通用户');
};

// 获取所有角色
const fetchAllRoles = async () => {
  try {
    const result = await systemStore.getAllRolesAction();
    if (result.code === 200) {
      roleList.value = result.data;
    }
  } catch (error) {
    console.error('获取角色列表失败:', error);
  }
};

// 初始化用户数据
const initUserData = async () => {
  try {
    // 从用户存储获取用户信息
    await userStore.getUserInfoAction();
    const userInfo = userStore.getUserInfo;
    
    // 填充表单数据
    userForm.username = userInfo.username || '';
    userForm.nickname = userInfo.nickname || '';
    userForm.email = userInfo.email || '';
    userForm.phone = userInfo.phone || '';
    userForm.bio = userInfo.bio || '';
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    message.error('获取用户信息失败，请刷新页面重试');
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    loading.value = true;
    
    // 提交更新后的用户信息
    const result = await userStore.updateUserInfoAction(userForm);
    
    if (result.code === 200) {
      message.success('个人信息更新成功');
    }
  } catch (error) {
    console.error('更新个人信息失败:', error);
    message.error(error.message || '更新个人信息失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  formRef.value.resetFields();
  initUserData();
};

// 刷新用户数据
const handleRefresh = () => {
  initUserData();
  message.success('已刷新用户数据');
};

// 显示修改密码模态框
const showChangePasswordModal = () => {
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  
  changePasswordModalVisible.value = true;
};

// 处理修改密码
const handleChangePassword = async () => {
  try {
    await passwordFormRef.value.validate();
    
    passwordLoading.value = true;
    
    // 提交修改密码请求
    await userStore.changePasswordAction({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });
    
    message.success('密码修改成功，请重新登录');
    changePasswordModalVisible.value = false;
    
    // 跳转到登录页
    setTimeout(() => {
      userStore.logoutAction();
      window.location.href = '/login';
    }, 1500);
  } catch (error) {
    console.error('修改密码失败:', error);
    if (error && error.errorFields) {
      // 表单验证错误
    } else {
      message.error(error.message || '修改密码失败，请稍后重试');
    }
  } finally {
    passwordLoading.value = false;
  }
};

// 显示绑定手机模态框
const showBindPhoneModal = () => {
  message.info('手机绑定功能即将上线');
};

// 显示注销账号模态框
const showDeleteAccountModal = () => {
  message.warn('账号注销功能即将上线');
};

// 组件挂载时加载用户数据
onMounted(async () => {
  await initUserData();
  await fetchAllRoles();
});
</script>

<style lang="less" scoped>
.user-profile-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 左右分栏布局 */
.profile-content {
  display: flex;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 左侧个人信息卡片 */
.profile-sidebar {
  flex: 0 0 600px;
  width: 600px;
}

.profile-card {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.profile-avatar {
  background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%);
  margin-bottom: 8px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.profile-role {
  margin: 4px 0 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.profile-stats {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.profile-stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.stat-title {
  margin: 4px 0 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

/* 中间分隔线 */
.profile-divider {
  width: 1px;
  background-color: #f0f0f0;
}

/* 右侧内容区 */
.profile-main {
  flex: 1;
  min-width: 0;
}

.profile-tabs {
  padding: 16px 24px;
}

.security-list {
  padding-top: 8px;
}

.security-list :deep(.ant-list-item) {
  padding: 16px 0;
}

.security-list :deep(.ant-list-item-meta-avatar) {
  margin-top: 4px;
}

.security-list :deep(.ant-avatar) {
  color: #fff;
}

.notification-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

/* 响应式样式 */
@media (max-width: 992px) {
  .profile-content {
    flex-direction: column;
  }
  
  .profile-sidebar {
    width: 100%;
    flex: none;
  }
  
  .profile-divider {
    display: none;
  }
  
  .profile-header {
    flex-direction: row;
    justify-content: center;
    gap: 24px;
  }
  
  .profile-info {
    align-items: flex-start;
    text-align: left;
  }
  
  .profile-stats {
    margin-top: 24px;
  }
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
  }
  
  .profile-info {
    align-items: center;
    text-align: center;
  }
}
</style> 