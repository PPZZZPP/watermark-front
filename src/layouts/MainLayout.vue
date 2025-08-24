<template>
  <a-layout class="layout-container">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="layout-sider"
    >
      <div class="logo">
        <h2 v-if="!collapsed">视频水印系统</h2>
        <h2 v-else>VW</h2>
      </div>
      
      <!-- 侧边菜单 -->
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
      >
        <a-sub-menu key="project-management">
          <template #icon><home-outlined /></template>
          <template #title>项目管理</template>
          <a-menu-item key="project-dashboard" @click="() => router.push('/dashboard/project')">
            <template #icon><appstore-outlined /></template>
            <span>项目概览</span>
          </a-menu-item>
          <a-menu-item key="task-management" @click="() => router.push('/dashboard/tasks')">
            <template #icon><schedule-outlined /></template>
            <span>任务管理</span>
          </a-menu-item>
        </a-sub-menu>
        
        <a-sub-menu key="watermark-management">
          <template #icon><unordered-list-outlined /></template>
          <template #title>水印管理</template>
          <a-menu-item key="watermark-embed" @click="() => router.push('/dashboard/watermark/embed')">
            <template #icon><video-camera-outlined/></template>
            <span>水印嵌入</span>
          </a-menu-item>
          <a-menu-item key="watermark-extract" @click="() => router.push('/dashboard/watermark/extract')">
            <template #icon><video-camera-outlined/></template>
            <span>水印提取</span>
          </a-menu-item>
        </a-sub-menu>

        <a-sub-menu key="rule-management" v-if="isAdmin">
          <template #icon><setting-outlined /></template>
          <template #title>合规模块</template>
          <a-menu-item key="compliance-records" @click="() => router.push('/dashboard/compliance/records')">
            <template #icon><team-outlined /></template>
            <span>合规审计记录</span>
          </a-menu-item>
        </a-sub-menu>
        
        <a-menu-item key="apiDocs" @click="() => router.push('/dashboard/api/docs')">
          <template #icon><setting-outlined /></template>
          <span>接口模块</span>
        </a-menu-item>
        
        <!-- 系统管理菜单（仅管理员可见） -->
        <a-sub-menu key="system-management" v-if="isAdmin">
          <template #icon><setting-outlined /></template>
          <template #title>系统管理</template>
          <a-menu-item key="user-management" @click="() => router.push('/dashboard/system/user')">
            <template #icon><team-outlined /></template>
            <span>用户管理</span>
          </a-menu-item>
          <a-menu-item key="model-management" @click="() => router.push('/dashboard/system/model')">
            <template #icon><experiment-outlined /></template>
            <span>模型管理</span>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    
    <a-layout class="layout-right">
      <!-- 顶部导航 -->
      <a-layout-header class="layout-header">
        <div class="header-left">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
          
          <div class="breadcrumb-container">
            <Breadcrumb />
          </div>
        </div>
        
        <div class="header-right">
          <div class="header-actions">
            <a-badge dot>
              <bell-outlined class="header-icon" />
            </a-badge>
            <a-badge count="5">
              <message-outlined class="header-icon" />
            </a-badge>
          </div>
          
          <a-dropdown :trigger="['click']">
            <span class="user-dropdown">
              <a-avatar class="user-avatar">
                <template #icon><user-outlined /></template>
              </a-avatar>
              <span class="username">{{ userInfo.username || '用户' }}</span>
              <down-outlined />
            </span>
            <template #overlay>
              <a-menu class="user-dropdown-menu">
                <a-menu-item key="profile" @click="() => router.push('/dashboard/profile')">
                  <user-outlined /> 个人信息
                </a-menu-item>
                <!-- <a-menu-item key="settings" @click="() => router.push('/dashboard/settings')">
                  <setting-outlined /> 账号设置
                </a-menu-item> -->
                <a-menu-divider />
                <a-menu-item key="logout" @click="handleLogout">
                  <logout-outlined /> 退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      
      <!-- 内容区域 -->
      <a-layout-content class="layout-content">
        <!-- 路由视图 -->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import {
  UserOutlined,
  HomeOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  TeamOutlined,
  AppstoreOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  UnorderedListOutlined,
  LoadingOutlined,
  SettingOutlined,
  BellOutlined,
  MessageOutlined,
  DownOutlined,
  LogoutOutlined,
  ExperimentOutlined,
  ProjectOutlined,
  ScheduleOutlined
} from '@ant-design/icons-vue';

// 路由和状态
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 侧边栏折叠状态
const collapsed = ref(false);
// 选中的菜单项
const selectedKeys = ref(['dashboard']);

// 监听路由变化，更新选中的菜单项
watch(
  () => route.path,
  (path) => {
    if (path.includes('/dashboard/profile')) {
      selectedKeys.value = ['profile'];
    } else if (path.includes('/dashboard/project')) {
      selectedKeys.value = ['project-dashboard'];
    } else if (path.includes('/dashboard/tasks')) {
      selectedKeys.value = ['task-management'];
    } else if (path.includes('/dashboard/watermark/embed')) {
      selectedKeys.value = ['watermark-embed'];
    } else if (path.includes('/dashboard/watermark/extract')) {
      selectedKeys.value = ['watermark-extract'];
    } else if (path.includes('/dashboard/video-list')) {
      selectedKeys.value = ['video-list'];
    } else if (path.includes('/dashboard/video-processing')) {
      selectedKeys.value = ['video-processing'];
    } else if (path.includes('/dashboard/settings')) {
      selectedKeys.value = ['settings'];
    } else if (path.includes('/dashboard/system/user')) {
      selectedKeys.value = ['user-management'];
    } else if (path.includes('/dashboard/system/model')) {
      selectedKeys.value = ['model-management'];
    } else if (path.includes('/dashboard')) {
      selectedKeys.value = ['dashboard'];
    }
  },
  { immediate: true }
);

// 获取用户信息
const userInfo = computed(() => userStore.getUserInfo);

// 判断是否为管理员
// const isAdmin = computed(() => userInfo.value && userInfo.value.role === 'admin');
const isAdmin = computed(() => true);
// 加载用户信息
onMounted(async () => {
  try {
    await userStore.getUserInfoAction();
    
    // 保存用户信息到localStorage，供路由守卫使用
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value));
  } catch (error) {
    console.error('获取用户信息失败', error);
  }
});

// 处理退出登录
const handleLogout = () => {
  userStore.logoutAction();
  localStorage.removeItem('userInfo');
  router.push('/login');
};
</script>

<style lang="less" scoped>
// 主布局样式
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

// 侧边栏样式
.layout-sider {
  flex: 0 0 200px; /* 固定宽度不伸缩 */
  overflow-y: auto; /* 侧边栏内容过多时可滚动 */
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.15);
  z-index: 10;
  
  .logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #001529;
    padding: 0 24px;
    overflow: hidden;
    
    h2 {
      color: #fff;
      font-size: 18px;
      margin: 0;
      font-weight: 600;
      white-space: nowrap;
    }
  }
}

// 右侧布局
.layout-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 顶部导航样式
.layout-header {
  flex: 0 0 64px; /* 固定高度 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 0 16px;
  height: 64px;
  line-height: 64px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: relative;
  z-index: 9;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .trigger {
      font-size: 18px;
      cursor: pointer;
      transition: color 0.3s;
      color: rgba(0, 0, 0, 0.65);
      padding: 0 24px;
      
      &:hover {
        color: #1890ff;
      }
    }
    
    .breadcrumb-container {
      margin-left: 16px;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    
    .header-actions {
      display: flex;
      align-items: center;
      margin-right: 16px;
      
      .header-icon {
        font-size: 16px;
        padding: 0 12px;
        cursor: pointer;
        transition: color 0.3s;
        color: rgba(0, 0, 0, 0.65);
        
        &:hover {
          color: #1890ff;
        }
      }
    }
    
    .user-dropdown {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 0 12px;
      transition: all 0.3s;
      
      &:hover {
        background: rgba(0, 0, 0, 0.025);
      }
      
      .user-avatar {
        margin-right: 8px;
        background-color: #1890ff;
      }
      
      .username {
        margin-right: 8px;
      }
    }
  }
}

// 内容区域样式
.layout-content {
  flex: 1;
  overflow-y: auto; /* 只有内容区域滚动 */
  padding: 16px;
  background: transparent;
  min-height: 280px;
  position: relative;
}


// 用户下拉菜单
:deep(.user-dropdown-menu) {
  min-width: 160px;
}
</style>