<template>
  <div class="project-detail-container">
    <div class="pd-section">
      <a-spin :spinning="loading">
        <div class="detail-header">
          <div class="detail-title">
            <a-button class="back-button" @click="goBack">
              <template #icon><left-outlined /></template>
              返回
            </a-button>
            <h2>{{ currentProject?.name || '项目详情' }}</h2>
          </div>
          <div class="detail-actions">
            <a-button type="primary" @click="handleExport">
              <template #icon><download-outlined /></template>
              导出项目
            </a-button>
            <a-button type="primary" danger style="margin-left: 8px" @click="handleDelete">
              <template #icon><delete-outlined /></template>
              删除项目
            </a-button>
          </div>
        </div>

        <!-- 项目信息 -->
        <div class="project-info" v-if="currentProject">
          <a-descriptions title="基本信息" bordered size="middle" :column="3">
            <a-descriptions-item label="项目名称">{{ currentProject.name }}</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{ formatDate(currentProject.createTime) }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="getStatusColor(currentProject.status)">{{ getStatusText(currentProject.status) }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="视频数量">{{ currentProject.videoCount || 0 }}</a-descriptions-item>
            <a-descriptions-item label="项目描述" :span="2">{{ currentProject.description || '暂无描述' }}</a-descriptions-item>
          </a-descriptions>

          <div class="video-sections">
            <!-- 原视频 -->
            <a-card title="原视频" size="small" class="video-card">
              <template v-if="currentProject.originalVideo">
                <div class="video-body">
                  <div class="video-thumb">
                    <img :src="currentProject.originalVideo.coverUrl" alt="原视频封面" />
                  </div>
                  <div class="video-meta">
                    <div class="meta-title" :title="currentProject.originalVideo.filename">{{ currentProject.originalVideo.filename }}</div>
                    <div class="meta-items">
                      <span class="meta-item">大小：{{ formatFileSize(currentProject.originalVideo.size) }}</span>
                      <span class="meta-item">上传时间：{{ formatDate(currentProject.originalVideo.uploadTime) }}</span>
                    </div>
                    <div class="video-actions">
                      <a-space>
                        <a-button size="small" @click="downloadOriginal">下载原视频</a-button>
                      </a-space>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <a-empty description="未上传原视频" />
              </template>
            </a-card>

            <!-- 嵌入视频 -->
            <a-card title="嵌入视频" size="small" class="video-card">
              <template v-if="currentProject.embeddedVideo">
                <div class="video-body">
                  <div class="video-thumb">
                    <img :src="currentProject.embeddedVideo.coverUrl" alt="嵌入视频封面" />
                  </div>
                  <div class="video-meta">
                    <div class="meta-title" :title="currentProject.embeddedVideo.filename">{{ currentProject.embeddedVideo.filename }}</div>
                    <a-space wrap class="meta-tags">
                      <a-tag color="geekblue">模型：{{ currentProject.embeddedVideo.model }}</a-tag>
                      <a-tag v-if="currentProject.embeddedVideo.watermarkText" color="green">水印：{{ currentProject.embeddedVideo.watermarkText }}</a-tag>
                    </a-space>
                    <div class="video-actions">
                      <a-space>
                        <a-button type="primary" size="small" @click="downloadEmbedded">下载嵌入视频</a-button>
                      </a-space>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <a-result status="info" title="尚未生成嵌入视频" sub-title="请前往水印嵌入页面生成">
                  <template #extra>
                    <a-button type="primary" @click="goEmbed">前往水印嵌入</a-button>
                  </template>
                </a-result>
              </template>
            </a-card>
          </div>

          <!-- 处理进度 -->
          <div class="progress-container" v-if="currentProject.status === 'processing'">
            <h3>处理进度</h3>
            <div class="progress-info">
              <div class="progress-text">
                <span>总进度</span>
                <span>{{ currentProject.progress || 0 }}%</span>
              </div>
              <a-progress :percent="currentProject.progress || 0" status="active" />
            </div>
          </div>
        </div>

        <!-- 视频列表 -->
        <div class="video-list">
          <div class="section-header">
            <h3>待提取视频</h3>
            <a-space>
              <a-button type="primary" @click="goExtract">
                <template #icon><plus-outlined /></template>
                新建提取
              </a-button>
            </a-space>
          </div>

          <a-table
            :columns="columns"
            :data-source="currentProject?.toExtractVideos || []"
            :pagination="tablePagination"
            :loading="videoLoading"
            @change="handleTableChange"
            row-key="id"
          >
            <!-- 视频预览 -->
            <template #bodyCell="{ column, record }">
              <!-- 状态 -->
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
              </template>

              <!-- 进度 -->
              <template v-if="column.key === 'progress'">
                <div v-if="record.status === 'processing'">
                  <a-progress :percent="record.progress || 0" size="small" />
                </div>
                <span v-else>-</span>
              </template>

              <!-- 水印信息 -->
              <template v-if="column.key === 'watermarkInfo'">
                <a-typography-text code v-if="record.watermarkInfo">{{ record.watermarkInfo }}</a-typography-text>
                <span v-else>-</span>
              </template>

              <!-- 模型 -->
              <template v-if="column.key === 'model'">
                <span>{{ record.model || '-' }}</span>
              </template>

              <!-- 说明 -->
              <template v-if="column.key === 'note'">
                <span>{{ record.note || '-' }}</span>
              </template>

              <!-- 操作 -->
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small" @click="handleDownloadVideo(record)">下载</a-button>
                  <a-button type="link" size="small">检测报告导出</a-button>
                  <a-button type="link" size="small" danger @click="handleDeleteToExtract(record)">删除</a-button>
                </a-space>
              </template>
            </template>

            <!-- 空状态 -->
            <template #emptyText>
            <a-empty description="暂无待提取视频" />
            </template>
          </a-table>
        </div>
      </a-spin>
    </div>
    
    <!-- 添加视频对话框 -->
    <a-modal
      v-model:visible="videoModal.visible"
      title="添加视频"
      @ok="handleVideoModalOk"
      @cancel="handleVideoModalCancel"
      :confirmLoading="videoModal.loading"
    >
      <a-upload
        name="file"
        :multiple="true"
        :file-list="fileList"
        :before-upload="beforeUpload"
        @remove="handleRemove"
      >
        <a-button>
          <template #icon><upload-outlined /></template>
          选择视频文件
        </a-button>
        <div style="margin-top: 8px; color: rgba(0, 0, 0, 0.45);">
          支持格式: MP4, AVI, MOV, WMV, 最大文件大小: 500MB
        </div>
      </a-upload>
    </a-modal>
    
    <!-- 视频预览对话框 -->
    <a-modal
      v-model:visible="previewModal.visible"
      :title="previewModal.title"
      @cancel="previewModal.visible = false"
      :footer="null"
      width="800px"
    >
      <div class="video-player">
        <video
          v-if="previewModal.videoUrl"
          :src="previewModal.videoUrl"
          controls
          style="width: 100%;"
        ></video>
      </div>
    </a-modal>
    
    <!-- 删除确认对话框 -->
    <a-modal
      v-model:visible="deleteModal.visible"
      title="删除确认"
      @ok="confirmDelete"
      @cancel="deleteModal.visible = false"
      :confirmLoading="deleteModal.loading"
    >
      <p>确定要删除{{ deleteModal.isVideo ? '该视频' : '该项目' }}吗？此操作不可恢复。</p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { 
  LeftOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons-vue';
import { useProjectStore } from '@/store/project';
import TaskMonitor from '@/components/project/TaskMonitor.vue';

// 路由和状态
const router = useRouter();
const route = useRoute();
const projectStore = useProjectStore();

// 加载状态
const loading = computed(() => projectStore.getLoading);
const videoLoading = ref(false);

// 当前项目ID
const projectId = computed(() => route.params.id);

// 当前项目
const currentProject = computed(() => projectStore.getCurrentProject);

// 待提取列表不单独维护，直接来自 currentProject.toExtractVideos

// 表格分页
const tablePagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true
});

// 表格列定义
const columns = [
  {
    title: '文件名',
    dataIndex: 'filename',
    key: 'filename',
    ellipsis: true,
  },
  {
    title: '大小',
    dataIndex: 'size',
    key: 'size',
    width: 120,
    sorter: (a, b) => a.size - b.size,
  },
  {
    title: '上传时间',
    dataIndex: 'uploadTime',
    key: 'uploadTime',
    width: 180,
    sorter: (a, b) => new Date(a.uploadTime) - new Date(b.uploadTime),
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '进度',
    key: 'progress',
    width: 150,
  },
  {
    title: '水印信息',
    key: 'watermarkInfo',
    width: 200,
  },
  {
    title: '模型',
    key: 'model',
    width: 120,
  },
  {
    title: '说明',
    key: 'note',
    width: 200,
  },
  {
    title: '操作',
    key: 'action',
    width: 220,
    fixed: 'right',
  },
];

// 添加视频模态框状态
const videoModal = reactive({
  visible: false,
  loading: false
});

// 视频预览模态框状态
const previewModal = reactive({
  visible: false,
  title: '',
  videoUrl: ''
});

// 删除确认模态框状态
const deleteModal = reactive({
  visible: false,
  isVideo: false,
  currentId: null,
  loading: false
});

// 文件列表
const fileList = ref([]);

// 定时器ID，用于定时更新进度
let progressTimer = null;

// 获取状态颜色
const getStatusColor = (status) => {
  const statusMap = {
    pending: 'blue',
    processing: 'orange',
    completed: 'green',
    failed: 'red'
  };
  return statusMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  };
  return statusMap[status] || '未知';
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 返回上一页
const goBack = () => {
  router.push('/dashboard/project');
};

// 处理表格变化
const handleTableChange = (pagination, filters, sorter) => {
  tablePagination.current = pagination.current;
  tablePagination.pageSize = pagination.pageSize;
};

// 删除待提取视频
const handleDeleteToExtract = async (record) => {
  try {
    const { deleteToExtract } = await import('@/api/project');
    await deleteToExtract(projectId.value, record.id);
    message.success('删除成功');
    await projectStore.fetchProjectDetail(projectId.value);
  } catch (error) {
    message.error(error.message || '删除失败');
  }
};

// 下载原视频（mock）
const downloadOriginal = () => {
  message.success('开始下载原视频');
};

// 前往水印嵌入页（携带当前项目ID）
const goEmbed = () => {
  if (!projectId.value) return;
  router.push({ path: '/dashboard/watermark/embed', query: { projectId: String(projectId.value) } });
};

// 前往水印提取页（携带当前项目ID）
const goExtract = () => {
  if (!projectId.value) return;
  router.push({ path: '/dashboard/watermark/extract', query: { projectId: String(projectId.value) } });
};

// 处理添加视频
const handleAddVideo = () => {
  fileList.value = [];
  videoModal.visible = true;
};

// 上传前检查
const beforeUpload = (file) => {
  // 检查文件类型
  const isVideo = file.type.startsWith('video/');
  if (!isVideo) {
    message.error('只能上传视频文件!');
    return false;
  }
  
  // 检查文件大小
  const isLt500M = file.size / 1024 / 1024 < 500;
  if (!isLt500M) {
    message.error('视频大小不能超过500MB!');
    return false;
  }
  
  fileList.value = [...fileList.value, file];
  return false; // 阻止自动上传
};

// 处理删除文件
const handleRemove = (file) => {
  const index = fileList.value.indexOf(file);
  const newFileList = fileList.value.slice();
  newFileList.splice(index, 1);
  fileList.value = newFileList;
};

// 处理视频模态框确认
const handleVideoModalOk = async () => {
  if (fileList.value.length === 0) {
    message.warning('请选择要上传的视频文件');
    return;
  }
  
  try {
    videoModal.loading = true;
    
    // 这里应该调用API上传视频
    // 模拟上传成功
    setTimeout(() => {
      message.success('视频上传成功');
      videoModal.visible = false;
      
      // 重新加载视频列表
      loadVideos();
    }, 1000);
  } catch (error) {
    message.error('上传失败：' + (error.message || '未知错误'));
  } finally {
    videoModal.loading = false;
  }
};

// 处理视频模态框取消
const handleVideoModalCancel = () => {
  videoModal.visible = false;
};

// 处理预览视频
const handlePreviewVideo = (record) => {
  previewModal.title = record.filename;
  previewModal.videoUrl = '/sample-video.mp4'; // 这里应该是实际的视频URL
  previewModal.visible = true;
};

// 处理下载视频
const handleDownloadVideo = (record) => {
  // 这里应该调用API下载视频
  message.success('开始下载视频：' + record.filename);
};

// 处理删除视频
const handleDeleteVideo = (record) => {
  deleteModal.isVideo = true;
  deleteModal.currentId = record.id;
  deleteModal.visible = true;
};

// 处理导出项目
const handleExport = async () => {
  try {
    await projectStore.exportProjects([projectId.value]);
    message.success('项目导出成功');
  } catch (error) {
    message.error('导出失败：' + (error.message || '未知错误'));
  }
};

// 处理删除项目
const handleDelete = () => {
  deleteModal.isVideo = false;
  deleteModal.currentId = projectId.value;
  deleteModal.visible = true;
};

// 确认删除
const confirmDelete = async () => {
  try {
    deleteModal.loading = true;
    
    if (deleteModal.isVideo) {
      // 删除视频
      // 这里应该调用API删除视频
      setTimeout(() => {
        message.success('视频删除成功');
        deleteModal.visible = false;
        
        // 重新加载视频列表
        loadVideos();
        deleteModal.loading = false;
      }, 500);
    } else {
      // 删除项目
      await projectStore.deleteProject(projectId.value);
      message.success('项目删除成功');
      deleteModal.visible = false;
      
      // 返回项目列表页
      router.push('/dashboard/project');
    }
  } catch (error) {
    message.error('删除失败：' + (error.message || '未知错误'));
  } finally {
    deleteModal.loading = false;
  }
};

// 更新项目进度
const updateProjectProgress = async () => {
  if (!projectId.value || !currentProject.value || currentProject.value.status !== 'processing') {
    return;
  }
  
  try {
    await projectStore.fetchProjectProgress(projectId.value);
  } catch (error) {
    console.error('获取项目进度失败:', error);
  }
};

// 生命周期钩子
onMounted(async () => {
  if (!projectId.value) {
    message.error('项目ID不能为空');
    router.push('/dashboard/project');
    return;
  }
  
  try {
    // 加载项目详情
    await projectStore.fetchProjectDetail(projectId.value);
    
    // toExtract 列表来自详情，不单独加载
    
    // 设置定时器，定期更新进度
    progressTimer = setInterval(updateProjectProgress, 3000);
  } catch (error) {
    message.error('加载项目详情失败：' + (error.message || '未知错误'));
  }
});

onUnmounted(() => {
  // 清除定时器
  if (progressTimer) {
    clearInterval(progressTimer);
  }
});
</script>

<style lang="less" scoped>
.project-detail-container {
  background-color: #f0f2f5;
  min-height: calc(100vh - 184px);
}

.pd-section {
  background-color: #fff;
  padding: 24px;
  margin: 16px 0;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

  .video-sections {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 16px;
  }

  .video-card {
    .video-body {
      display: flex;
      gap: 30px;
      align-items: stretch;
    }
    .video-thumb {
      width: 350px;
      height: 174px;
      border-radius: 8px;
      overflow: hidden;
      background: #000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      img { width: 100%; height: 100%; object-fit: cover; display: block; }
    }
    .video-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      .meta-title {
        font-size: 16px;
        font-weight: 600;
        color: rgba(0,0,0,0.85);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
      .meta-items {
        color: rgba(0,0,0,0.45);
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        .meta-item { white-space: nowrap; }
      }
      .meta-tags { margin-top: 2px; }
      .video-actions { margin-top: 6px; }
    }
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .detail-title {
      display: flex;
      align-items: center;
      
      .back-button {
        margin-right: 16px;
      }
      
      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }
    }
  }
  
  .project-info {
    margin-bottom: 24px;
    
    .progress-container {
      margin-top: 24px;
      
      h3 {
        margin-bottom: 16px;
      }
      
      .progress-info {
        .progress-text {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
      }
    }
  }
    
  .video-list {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h3 {
        margin: 0;
      }
    }
  }
  
  .video-player {
    display: flex;
    justify-content: center;
    background: #000;
    border-radius: 4px;
    overflow: hidden;
  }

/* 响应式 */
@media (max-width: 768px) {
  .pd-section { padding: 16px; }
  .video-sections {
    grid-template-columns: 1fr;
  }
}
</style>