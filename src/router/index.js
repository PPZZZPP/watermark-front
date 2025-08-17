import { createRouter, createWebHistory } from 'vue-router';

// 布局组件
const MainLayout = () => import('@/layouts/MainLayout.vue');

// 用户管理模块
const Login = () => import('@/views/user/Login.vue');
const Register = () => import('@/views/user/Register.vue');
const UserProfile = () => import('@/views/user/UserProfile.vue');

// 项目管理模块
const ProjectDashboard = () => import('@/views/project/ProjectDashboard.vue');
const ProjectDetail = () => import('@/views/project/ProjectDetail.vue');
const TaskManagement = () => import('@/views/project/TaskManagement.vue');

// 系统管理模块
const UserManagement = () => import('@/views/system/UserManagement.vue');
const ModelManagement = () => import('@/views/system/ModelManagement.vue');

// 水印模块
const WatermarkEmbed = () => import('@/views/watermark/Embed.vue');
const WatermarkExtract = () => import('@/views/watermark/Extract.vue');
// 合规模块 & 接口文档
const ComplianceRecords = () => import('@/views/compliance/ComplianceRecords.vue');
const ApiDocs = () => import('@/views/api/ApiDocs.vue');

// 获取token的工具函数
const getToken = () => {
  return localStorage.getItem('token');
};

// 获取用户角色的工具函数
const getUserRole = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return userInfo.role || '';
  } catch (error) {
    console.error('获取用户角色失败:', error);
    return '';
  }
};

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false, title: '注册' },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: MainLayout,
    meta: { requiresAuth: true, title: '控制台' },
    children: [
      {
        path: '',
        redirect: '/dashboard/profile',
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: UserProfile,
        meta: { 
          requiresAuth: true, 
          title: '个人信息',
          parentTitle: '用户管理'
        },
      },

      // 项目管理 - 项目概览
      {
        path: 'project',
        name: 'ProjectDashboard',
        component: ProjectDashboard,
        meta: { 
          requiresAuth: true, 
          title: '项目概览',
          parentTitle: '项目管理'
        },
      },
      // 项目管理 - 项目详情
      {
        path: 'project/:id',
        name: 'ProjectDetail',
        component: ProjectDetail,
        meta: { 
          requiresAuth: true, 
          title: '项目详情',
          parentTitle: '项目管理'
        },
      },
      // 项目管理 - 任务管理
      {
        path: 'tasks',
        name: 'TaskManagement',
        component: TaskManagement,
        meta: { 
          requiresAuth: true, 
          title: '任务管理',
          parentTitle: '项目管理'
        },
      },
      
      // 系统管理 - 用户管理
      {
        path: 'system/user',
        name: 'UserManagement',
        component: UserManagement,
        meta: { 
          requiresAuth: true, 
          requiresAdmin: true,
          title: '用户管理',
          parentTitle: '系统管理'
        },
      },
      // 系统管理 - 模型管理
      {
        path: 'system/model',
        name: 'ModelManagement',
        component: ModelManagement,
        meta: { 
          requiresAuth: true, 
          requiresAdmin: true,
          title: '模型管理',
          parentTitle: '系统管理'
        },
      },

      // 水印管理 - 水印嵌入
      {
        path: 'watermark/embed',
        name: 'WatermarkEmbed',
        component: WatermarkEmbed,
        meta: {
          requiresAuth: true,
          title: '水印嵌入',
          parentTitle: '水印管理'
        }
      },
      // 水印管理 - 水印提取
      {
        path: 'watermark/extract',
        name: 'WatermarkExtract',
        component: WatermarkExtract,
        meta: {
          requiresAuth: true,
          title: '水印提取',
          parentTitle: '水印管理'
        }
      },
      // 合规模块 - 审计记录
      {
        path: 'compliance/records',
        name: 'ComplianceRecords',
        component: ComplianceRecords,
        meta: {
          requiresAuth: true,
          title: '合规审计记录',
          parentTitle: '合规模块'
        }
      },
      // 接口模块 - API 文档
      {
        path: 'api/docs',
        name: 'ApiDocs',
        component: ApiDocs,
        meta: {
          requiresAuth: true,
          title: '接口模块',
          parentTitle: '开发者'
        }
      },
      
      // 接口模块
      // {
      //   path: 'apiModel',
      //   name: 'ApiModel',
      //   component: ApiModel,
      // },
    ],
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  console.log('路由守卫 - 当前路由:', to.path);
  document.title = to.meta.title ? `${to.meta.title} - 视频水印系统` : '视频水印系统';

  // 读取多种存储中的token
  const token = getToken();
  console.log('路由守卫 - 当前Token:', token ? '已存在' : '不存在', token ? token.substring(0, 10) + '...' : '');
  
  // 判断该路由是否需要登录权限
  if (to.matched.some(record => record.meta.requiresAuth)) {
    console.log('路由守卫 - 此路由需要登录权限');
    
    if (!token) {
      console.log('路由守卫 - 未登录，跳转到登录页');
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 将要跳转的路由path作为参数
      });
    } else {
      // 检查是否需要管理员权限
      if (to.matched.some(record => record.meta.requiresAdmin)) {
        const role = getUserRole();
        if (role !== 'admin') {
          console.log('路由守卫 - 需要管理员权限，但当前用户不是管理员');
          next({ path: '/dashboard/profile' });
        } else {
          console.log('路由守卫 - 已登录且有管理员权限，允许访问');
          next();
        }
      } else {
        console.log('路由守卫 - 已登录，允许访问');
        next();
      }
    }
  } else if (to.path === '/login' && token) {
    // 如果已登录且要去登录页，重定向到仪表盘
    console.log('路由守卫 - 已登录用户访问登录页，重定向到仪表盘');
    next({ path: '/dashboard' });
  } else {
    console.log('路由守卫 - 无需登录权限，允许访问');
    next();
  }
});

export default router; 