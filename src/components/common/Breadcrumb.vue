<template>
  <a-breadcrumb class="breadcrumb-container">
    <a-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="index">
      <router-link v-if="item.path && index !== breadcrumbItems.length - 1" :to="item.path">
        {{ item.title }}
      </router-link>
      <span v-else>{{ item.title }}</span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// 路由实例
const route = useRoute();

// 面包屑数据
const breadcrumbItems = ref([
  {
    title: '首页',
    path: '/dashboard'
  }
]);

// 更新面包屑数据
const updateBreadcrumb = () => {
  // 面包屑始终从仪表盘开始
  breadcrumbItems.value = [
    {
      title: '首页',
      path: '/dashboard'
    }
  ];
  
  // 根据当前路由动态生成面包屑
  if (route.matched && route.matched.length > 0) {
    const matchedRoutes = route.matched.filter(item => item.meta && item.meta.title);
    
    matchedRoutes.forEach(item => {
      // 如果当前路由就是仪表盘，不添加重复项
      if (item.path === '/dashboard') {
        return;
      }
      
      // 如果有父级标题，添加父级标题作为面包屑项
      if (item.meta.parentTitle) {
        breadcrumbItems.value.push({
          title: item.meta.parentTitle,
          path: null // 父级标题通常不可点击
        });
      }
      
      breadcrumbItems.value.push({
        title: item.meta.title,
        path: item.redirect || item.path
      });
    });
  }
};

// 在组件挂载时初始化面包屑
onMounted(() => {
  updateBreadcrumb();
});

// 监听路由变化，更新面包屑
watch(
  () => route.path,
  () => {
    updateBreadcrumb();
  }
);
</script>

<style scoped>
.breadcrumb-container {
  margin: 0;
  padding: 0;
  background-color: transparent;
  font-size: 14px;
}

:deep(.ant-breadcrumb-link) {
  font-size: 14px;
  position: relative;
}

:deep(.ant-breadcrumb-link a) {
  color: rgba(0, 0, 0, 0.65);
  transition: color 0.3s, text-decoration 0.3s;
  text-decoration: none;
  position: relative;
}

:deep(.ant-breadcrumb-link a:hover) {
  color: #1890ff;
}

:deep(.ant-breadcrumb-link a:after) {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #1890ff;
  transition: width 0.3s;
}

:deep(.ant-breadcrumb-link a:hover:after) {
  width: 100%;
}

:deep(.ant-breadcrumb-separator) {
  margin: 0 8px;
  color: rgba(0, 0, 0, 0.45);
}

:deep(.ant-breadcrumb-link span) {
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}
</style> 