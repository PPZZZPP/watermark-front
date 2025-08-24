<template>
  <div class="model-management-container">
    <!-- 页面头部 -->
    <PageHeader title="模型管理" subTitle="管理水印模型的训练、评估和发布">
      <template #icon>
        <experiment-outlined />
      </template>
      <template #tags>
        <a-tag color="blue">系统管理</a-tag>
        <a-tag color="purple">模型管理</a-tag>
      </template>
    </PageHeader>

    <!-- 模块选择卡片 -->
    <div class="module-tabs">
      <a-tabs v-model:activeKey="activeTabKey" @change="handleTabChange">
        <a-tab-pane key="publish" tab="模型发布">
          <ModelPublish />
        </a-tab-pane>
        <a-tab-pane key="training" tab="模型训练">
          <ModelTraining />
        </a-tab-pane>
        <a-tab-pane key="evaluation" tab="模型评估">
          <ModelEvaluation />
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { ExperimentOutlined } from '@ant-design/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ModelTraining from './model/ModelTraining.vue';
import ModelEvaluation from './model/ModelEvaluation.vue';
import ModelPublish from './model/ModelPublish.vue';
import { useUserStore } from '@/store/user';

// 路由
const router = useRouter();
const route = useRoute();

// 用户存储
const userStore = useUserStore();

// 当前活动标签页
const activeTabKey = ref('training');

// 检查用户权限
const checkPermission = () => {
  const userInfo = userStore.getUserInfo;
  if (!userInfo || userInfo.role !== 'admin') {
    message.error('您没有权限访问此页面');
    router.push('/dashboard');
    return false;
  }
  return true;
};

// 处理标签页切换
const handleTabChange = (key) => {
  // 更新URL参数但不重新加载页面
  router.push({
    path: route.path,
    query: { tab: key }
  });
};

// 从URL参数初始化标签页
const initFromQuery = () => {
  const { tab } = route.query;
  if (tab && ['training', 'evaluation', 'publish'].includes(tab)) {
    activeTabKey.value = tab;
  }
};

// 监听路由变化
watch(() => route.query, (query) => {
  const { tab } = query;
  if (tab && ['training', 'evaluation', 'publish'].includes(tab)) {
    activeTabKey.value = tab;
  }
}, { immediate: true });

// 组件挂载时检查权限并初始化
onMounted(() => {
  checkPermission();
  initFromQuery();
});
</script>

<style lang="less" scoped>
.model-management-container {
  background-color: #f0f2f5;
  min-height: calc(100vh - 184px);
}

.module-tabs {
  background-color: #fff;
  padding: 24px;
  margin: 16px 0;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .module-tabs {
    padding: 16px;
  }
}
</style> 