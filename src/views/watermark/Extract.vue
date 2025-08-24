<template>
  <div class="watermark-extract-container">
    <PageHeader title="水印提取" subTitle="从视频中检测并提取隐/显式水印">
      <template #icon>
        <picture-outlined />
      </template>
      <template #tags>
        <a-tag color="blue">水印管理</a-tag>
        <a-tag color="purple">水印提取</a-tag>
      </template>
    </PageHeader>

    <div class="wm-section">
      <a-spin :spinning="initialLoading">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-card title="选择项目" size="small" :bodyStyle="{ padding: '12px' }">
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

        <a-col :span="16">
          <a-card :title="`待提取视频（${currentProject?.name || '未选择项目'}）`" size="small" :bodyStyle="{ padding: '12px' }">
            <template #extra>
              <a-space>
                <a-tag v-if="currentProject?.status" color="blue">{{ getStatusText(currentProject.status) }}</a-tag>
                <a-button size="small" @click="refreshToExtractList" :disabled="!selectedProjectId">刷新</a-button>
                <a-button size="small" :disabled="!selectedProjectId" @click="openUploadModal">
                  <template #icon><upload-outlined /></template>
                  选择视频
                </a-button>
              </a-space>
            </template>
            <a-table
              row-key="id"
              :data-source="toExtractList"
              :columns="videoColumns"
              :pagination="videoPagination"
              :loading="videoLoading"
              :row-selection="{ type: 'radio', selectedRowKeys: selectedKeys, onChange: onSelectChange }"
              size="middle"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'status'">
                  <a-tag :color="statusColorMap[record.status] || 'default'">{{ getStatusText(record.status) }}</a-tag>
                </template>
                <template v-else-if="column.dataIndex === 'progress'">
                  <a-progress :percent="record.progress || 0" size="small" :status="record.status==='failed' ? 'exception' : (record.status==='completed' ? 'success' : 'active')" />
                </template>
                <template v-else-if="column.dataIndex === 'watermarkInfo'">
                  <a-typography-text code v-if="record.watermarkInfo">{{ record.watermarkInfo }}</a-typography-text>
                  <span v-else>-</span>
                </template>
                <template v-else-if="column.dataIndex === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="() => extractRecord(record)" :loading="extractLoading">提取</a-button>
                    <a-button type="link" size="small" @click="() => downloadRecord(record)">下载</a-button>
                    <a-button type="link" size="small" danger @click="() => deleteRecord(record)">删除</a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>

          <!-- 上传待提取视频弹窗 -->
          <a-modal
            v-model:open="uploadModalVisible"
            title="上传待提取视频"
            :confirm-loading="uploadLoading"
            ok-text="开始上传"
            cancel-text="取消"
            @ok="uploadToExtract"
            @cancel="closeUploadModal"
            destroyOnClose
          >
            <a-alert type="info" message="支持批量选择视频文件，将实际上传并保存到服务器资源目录（/uploads/to-extract/{projectId}）" show-icon style="margin-bottom: 12px" />
            <a-upload :before-upload="beforeUpload" :file-list="fileList" @remove="onRemove" :multiple="true" accept="video/*">
              <a-button>
                <template #icon><upload-outlined /></template>
                选择视频文件
              </a-button>
            </a-upload>
            <div style="margin-top: 8px; color: rgba(0,0,0,.45);">已选择 {{ fileList.length }} 个文件</div>
          </a-modal>

          
        </a-col>
      </a-row>
      </a-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PictureOutlined, UploadOutlined } from '@ant-design/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import request from '@/utils/request';
import { useRoute } from 'vue-router';

const initialLoading = ref(true);
const route = useRoute();

// 项目与待提取
const projects = ref([]);
const projectLoading = ref(false);
const projectSearch = ref('');
const selectedProjectId = ref('');
const fileList = ref([]);
const toExtractList = ref([]);
const videoLoading = ref(false);
const videoPagination = reactive({ current: 1, pageSize: 8, total: 0, showTotal: (t) => `共 ${t} 条` });
const selectedKeys = ref([]);
const selectedVideoId = ref('');
const currentProject = ref(null);
const uploadModalVisible = ref(false);
const uploadLoading = ref(false);

const onSelectChange = (keys) => {
  selectedKeys.value = keys;
  selectedVideoId.value = keys[0];
};

const videoColumns = [
  { title: '文件名', dataIndex: 'filename' },
  { title: '状态', dataIndex: 'status', width: 110 },
  { title: '进度', dataIndex: 'progress', width: 160 },
  { title: '模型', dataIndex: 'model', width: 120 },
  { title: '水印信息', dataIndex: 'watermarkInfo', width: 220 },
  { title: '操作', dataIndex: 'action', width: 180 }
];
const statusColorMap = { pending: 'default', processing: 'gold', completed: 'green', failed: 'red' };

// 提取参数与结果
const extractLoading = ref(false);
const result = ref(null);

const loadProjects = async () => {
  projectLoading.value = true;
  try {
    const res = await request({ url: '/api/project/list', method: 'get', params: { page: 1, pageSize: 100, name: projectSearch.value || undefined } });
    projects.value = res.data?.list || [];
  } finally {
    projectLoading.value = false;
  }
};

const selectProject = async (id) => {
  selectedProjectId.value = id;
  await refreshToExtractList();
};

const getStatusText = (status) => ({ pending: '待处理', processing: '处理中', completed: '已完成', failed: '失败' }[status] || '未知');
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const refreshToExtractList = async () => {
  if (!selectedProjectId.value) { toExtractList.value = []; return; }
  videoLoading.value = true;
  try {
    const res = await request({ url: `/api/project/${selectedProjectId.value}`, method: 'get' });
    currentProject.value = res.data || null;
    toExtractList.value = res.data?.toExtractVideos || [];
  } finally {
    videoLoading.value = false;
  }
};

const beforeUpload = (file) => { fileList.value = [...fileList.value, file]; return false; };
const onRemove = (file) => { fileList.value = fileList.value.filter(f => f.uid !== file.uid); };
const uploadToExtract = async () => {
  if (!selectedProjectId.value) { message.warning('请先选择项目'); return; }
  uploadLoading.value = true;
  try {
    for (const f of fileList.value) {
      const fd = new FormData();
      fd.append('file', f);
      await request({ url: `/api/project/${selectedProjectId.value}/to-extract`, method: 'post', data: fd, headers: { 'Content-Type': 'multipart/form-data' } });
    }
    message.success('上传成功');
    fileList.value = [];
    uploadModalVisible.value = false;
    await refreshToExtractList();
  } catch (e) {
    message.error(e.message || '上传失败');
  } finally {
    uploadLoading.value = false;
  }
};

const openUploadModal = () => {
  if (!selectedProjectId.value) { message.warning('请先选择项目'); return; }
  uploadModalVisible.value = true;
};
const closeUploadModal = () => {
  uploadModalVisible.value = false;
  fileList.value = [];
};

const extractRecord = async (record) => {
  if (!record?.id || !selectedProjectId.value) return;
  extractLoading.value = true;
  try {
    await request({ url: '/api/watermark/extract', method: 'post', data: { projectId: selectedProjectId.value, videoId: record.id } });
    await refreshToExtractList();
    message.success('提取完成');
  } finally {
    extractLoading.value = false;
  }
};

const downloadRecord = (record) => {
  message.success(`下载：${record.filename}`);
};

const deleteRecord = async (record) => {
  try {
    await request({ url: `/api/project/${selectedProjectId.value}/to-extract/${record.id}`, method: 'delete' });
    message.success('删除成功');
    await refreshToExtractList();
  } catch (e) {
    message.error(e.message || '删除失败');
  }
};

onMounted(async () => {
  try {
    await loadProjects();
    if (route.query.projectId) {
      selectedProjectId.value = String(route.query.projectId);
      await refreshToExtractList();
    }
  } finally {
    initialLoading.value = false;
  }
});
</script>

<style lang="less" scoped>
.watermark-extract-container {
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

/* 项目列表与选中态，高亮样式与嵌入页保持一致 */
.wm-template-list {
  max-height: 340px;
  overflow-y: auto;
}

.wm-template-item {
  cursor: pointer;
  border-radius: 6px;
  padding: 6px 8px;
  transition: background 0.2s ease;
}
.wm-template-item:hover { background: #fafafa; }
.wm-template-item.active { background: #e6f4ff; }

.wm-result-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 12px;
}
.wm-result-block { background: #fff; border-radius: 8px; }
.wm-result-title { font-weight: 600; margin-bottom: 8px; }
.wm-result-image { width: 100%; height: 220px; object-fit: cover; border-radius: 8px; background: #000; }
.wm-extract-text { padding: 12px; background: #fafafa; border-radius: 6px; }

/* 响应式 */
@media (max-width: 768px) {
  .wm-section { padding: 16px; }
}
</style>


