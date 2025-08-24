<template>
  <div class="model-publish-container">
    <a-card title="模型发布" :bordered="false" class="glass-card">
      <!-- 顶部筛选区域 -->
      <a-form layout="inline" style="margin-bottom: 16px">
        <a-form-item label="模型名称">
          <a-input v-model:value="query.name" placeholder="输入模型名称" allow-clear style="width: 220px" />
        </a-form-item>
        <a-form-item label="适用场景">
          <a-select v-model:value="query.scenario" allow-clear placeholder="选择场景" style="width: 200px">
            <a-select-option value="movie">电影</a-select-option>
            <a-select-option value="tv">电视节目</a-select-option>
            <a-select-option value="live">直播</a-select-option>
            <a-select-option value="game">游戏</a-select-option>
            <a-select-option value="education">教育视频</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="loadPublishedModels">查询</a-button>
            <a-button @click="resetQuery">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <!-- 模型列表表格（仅表格） -->
      <a-table
        :columns="publishedColumns"
        :data-source="publishedModels"
        :pagination="{ pageSize: 10 }"
        size="small"
        :loading="loadingPublished"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-if="column.key === 'scenarios'">
            <span>{{ (record.applicableScenarios || '').split(',').filter(Boolean).join(', ') || '-' }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewModelDetail(record)">详情</a-button>
              <a-popconfirm title="确定要删除此模型吗？" ok-text="确定" cancel-text="取消" @confirm="deleteModel(record)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { } from '@ant-design/icons-vue';
import { useSystemStore } from '@/store/system';

// 系统存储
const systemStore = useSystemStore();

// 查询参数
const query = reactive({
  name: '',
  scenario: undefined,
});

// 已发布模型列
const publishedColumns = [
  {
    title: '模型名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '模型代码',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: '发布人',
    dataIndex: 'publisher',
    key: 'publisher',
  },
  {
    title: '发布时间',
    dataIndex: 'publishTime',
    key: 'publishTime',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '适用场景',
    dataIndex: 'applicableScenarios',
    key: 'scenarios',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
  },
];

// 已发布模型列表（接口获取）
const publishedModels = ref([]);
const loadingPublished = ref(false);

const loadPublishedModels = async () => {
  loadingPublished.value = true;
  try {
    const res = await systemStore.getModelListAction({ page: 1, pageSize: 100, status: 'published', keyword: query.name, scenario: query.scenario });
    publishedModels.value = res?.data?.list || systemStore.modelList || [];
  } catch (e) {
    try {
      const p = new URLSearchParams({ page: '1', pageSize: '100', status: 'published', keyword: query.name || '', scenario: query.scenario || '' });
      const resp = await fetch('/system/model/list?' + p.toString());
      const json = await resp.json();
      if (json && json.code === 200) {
        publishedModels.value = json.data?.list || [];
      }
    } catch {}
  } finally {
    loadingPublished.value = false;
  }
};

// 获取状态颜色
const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'default';
    default:
      return 'default';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'active':
      return '已启用';
    case 'inactive':
      return '已停用';
    default:
      return '未知';
  }
};

// 查看模型详情
const viewModelDetail = (record) => {
  message.info(`查看模型详情: ${record.name}`);
};

const resetQuery = () => {
  query.name = '';
  query.scenario = undefined;
  loadPublishedModels();
};

// 删除模型（调用后端接口或使用现有 API）
const deleteModel = (record) => {
  publishedModels.value = publishedModels.value.filter(model => model.id !== record.id);
  message.success(`已删除模型: ${record.name}`);
};

onMounted(() => {
  loadPublishedModels();
});
</script>

<style lang="less" scoped>
.model-publish-container {
  .glass-card { background: rgba(255,255,255,0.72); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
}
.inner-card { margin-bottom: 24px; }
</style>