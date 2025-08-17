<template>
  <div class="watermark-embed-container">
    <PageHeader title="水印嵌入" subTitle="为已上传视频批量添加水印">
      <template #icon>
        <picture-outlined />
      </template>
      <template #tags>
        <a-tag color="blue">水印管理</a-tag>
        <a-tag color="purple">水印嵌入</a-tag>
      </template>
    </PageHeader>

    <div class="wm-section">
      <a-spin :spinning="initialLoading">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card title="选择项目" size="small" :bodyStyle="{ padding: '12px' }" style="margin-bottom: 16px">
            <a-space direction="vertical" size="middle" style="width:100%">
              <a-input-search v-model:value="projectSearch" placeholder="搜索项目名称" @search="loadProjects" allow-clear />

              <a-list :data-source="projects" :loading="projectLoading" item-layout="horizontal" class="wm-template-list">
                <template #renderItem="{ item }">
                  <a-list-item :class="['wm-template-item', { active: item.id === selectedProjectId }]" @click="() => selectProject(item.id)">
                    <a-list-item-meta>
                      <template #title>
                        <a-typography-text strong>{{ item.name }}</a-typography-text>
                        <a-tag style="margin-left: 8px">{{ getStatusText(item.status) }}</a-tag>
                      </template>
                      <template #description>
                        <span>创建时间：{{ formatDate(item.createTime) }}</span>
                      </template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>
            </a-space>
          </a-card>
          
        </a-col>

        <a-col :span="18">
          <a-card v-if="embeddedPreview" title="已生成嵌入视频" size="small" :bodyStyle="{ padding: '12px' }">
            <div class="wm-preview">
              <div class="wm-preview-stage">
                <img :src="embeddedPreview.coverUrl" alt="preview" class="wm-preview-base" />
              </div>
              <div class="wm-preview-hint">文件名：{{ embeddedPreview.filename }}，模型：{{ embeddedPreview.model }}</div>
            </div>
            <a-space style="margin-top:8px">
              <a-button type="primary">下载嵌入视频</a-button>
            </a-space>
          </a-card>

          <a-card v-else title="生成嵌入视频" size="small" :bodyStyle="{ padding: '12px' }">
            <a-form layout="inline">
              <a-form-item label="模型" style="min-width: 220px">
                <a-select v-model:value="selectedModel" :options="modelOptions" style="width: 200px" placeholder="请选择已发布模型" />
              </a-form-item>
              <a-form-item label="水印信息" style="min-width: 320px">
                <a-input v-model:value="watermarkText" style="width: 280px" placeholder="请输入水印信息" />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" :disabled="!selectedProjectId || !selectedModel" :loading="applyLoading" @click="generateEmbedded">生成</a-button>
              </a-form-item>
            </a-form>
          </a-card>

          
        </a-col>
      </a-row>
      </a-spin>
    </div>
  </div>
  
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { PictureOutlined } from '@ant-design/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import request from '@/utils/request';
import { useRoute } from 'vue-router';
import { useSystemStore } from '@/store/system';

// 删除模板/视频旧逻辑相关状态

// 加载/刷新
const initialLoading = ref(true);
const applyLoading = ref(false);
const route = useRoute();

// 项目选择（从项目列表获取）
const selectedProjectId = ref('');
const projects = ref([]);
const projectLoading = ref(false);
const projectSearch = ref('');
const embeddedPreview = ref(null);
const selectedModel = ref('');
const modelOptions = ref([]);
const watermarkText = ref('');

// 删除模板/视频旧逻辑相关方法

const loadProjects = async () => {
  projectLoading.value = true;
  try {
    const res = await request({ url: '/api/project/list', method: 'get', params: { page: 1, pageSize: 100, name: projectSearch.value || undefined } });
    projects.value = res.data?.list || [];
  } finally {
    projectLoading.value = false;
  }
};

const selectProject = (id) => {
  selectedProjectId.value = id;
};

const getStatusText = (status) => ({ pending: '待处理', processing: '处理中', completed: '已完成', failed: '失败' }[status] || '未知');
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const systemStore = useSystemStore();
const loadModels = async () => {
  // 优先通过系统模型 Store 获取“已发布”模型，与模型管理页保持一致
  try {
    const res = await systemStore.getModelListAction({ page: 1, pageSize: 100, status: 'published' });
    const list = res?.data?.list || systemStore.modelList || [];
    modelOptions.value = list.map(m => ({ label: m.name, value: m.code }));
  } catch (e) {
    // 回退到直调接口
    const res = await request({ url: '/system/model/list', method: 'get', params: { page: 1, pageSize: 100, status: 'published' } });
    const list = res?.data?.list || [];
    modelOptions.value = list.map(m => ({ label: m.name, value: m.code }));
  }
  if (!selectedModel.value && modelOptions.value.length > 0) {
    selectedModel.value = modelOptions.value[0].value;
  }
};

watch(selectedProjectId, async (pid) => {
  if (!pid) { embeddedPreview.value = null; return; }
  const res = await request({ url: `/api/project/${pid}`, method: 'get' });
  embeddedPreview.value = res.data?.embeddedVideo || null;
});

const generateEmbedded = async () => {
  if (!selectedProjectId.value) return;
  applyLoading.value = true;
  try {
    await request({ url: '/api/watermark/embed', method: 'post', data: { projectId: selectedProjectId.value, model: selectedModel.value, watermarkText: watermarkText.value } });
    message.success('生成成功');
    const res = await request({ url: `/api/project/${selectedProjectId.value}`, method: 'get' });
    embeddedPreview.value = res.data?.embeddedVideo || null;
  } finally {
    applyLoading.value = false;
  }
};

const positionName = (code) => positions.value.find(p => p.code === code)?.name || code || '-';

onMounted(async () => {
  try {
    // 初始化项目ID（从路由）
    if (route.query.projectId) {
      selectedProjectId.value = String(route.query.projectId);
    }
    await Promise.all([loadProjects(), loadModels()]);
  } finally {
    initialLoading.value = false;
  }
});
</script>

<style lang="less" scoped>
.watermark-embed-container {
  background-color: #f0f2f5;
  min-height: calc(100vh - 184px);
}

.wm-section {
  background-color: #fff;
  padding: 24px;
  margin: 16px 0;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.wm-template-list {
  max-height: 340px;
  overflow-y: auto;
}

.wm-template-item {
  cursor: pointer;
  border-radius: 6px;
  padding: 6px 8px;
  transition: background 0.2s ease;
  &:hover { background: #fafafa; }
  &.active { background: #e6f4ff; }
}

.wm-preview {
  display: flex;
  align-items: center;
  gap: 16px;
}

.wm-preview-stage {
  position: relative;
  width: 420px;
  height: 236px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.wm-preview-base {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wm-overlay {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  letter-spacing: 1px;
}

.wm-image-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.25);
  color: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.wm-preview-hint {
  color: rgba(0,0,0,0.45);
}

/* 响应式 */
@media (max-width: 768px) {
  .wm-section { padding: 16px; }
}
</style>

<!-- 水印嵌入模块 -->