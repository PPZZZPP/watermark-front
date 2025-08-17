<template>
  <div class="project-dashboard-container">
    <PageHeader title="项目概览" subTitle="管理您的视频水印项目">
      <template #icon>
        <project-outlined />
      </template>
      <template #tags>
        <a-tag color="blue">项目管理</a-tag>
        <a-tag color="purple">项目概览</a-tag>
      </template>
      <template #extra>
        <a-button type="primary" @click="handleCreateProject">
          <template #icon><plus-outlined /></template>
          创建项目
        </a-button>
      </template>
    </PageHeader>

    <div class="pd-section">
      
      <!-- 筛选器 -->
      <div class="filter-container">
        <a-form layout="inline" :model="filterForm">
          <a-form-item label="项目名称">
            <a-input v-model:value="filterForm.name" placeholder="请输入项目名称" allow-clear />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="filterForm.status" placeholder="请选择状态" style="width: 120px" allow-clear>
              <a-select-option value="pending">待处理</a-select-option>
              <a-select-option value="processing">处理中</a-select-option>
              <a-select-option value="completed">已完成</a-select-option>
              <a-select-option value="failed">失败</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch">
              <template #icon><search-outlined /></template>
              搜索
            </a-button>
            <a-button style="margin-left: 8px" @click="handleReset">
              <template #icon><reload-outlined /></template>
              重置
            </a-button>
          </a-form-item>
        </a-form>
      </div>
      
      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedRowKeys.length > 0">
        <a-alert
          type="info"
          show-icon
          :message="`已选择 ${selectedRowKeys.length} 个项目`"
          style="margin-right: 16px"
        />
        <a-button type="primary" danger @click="handleBatchDelete">
          <template #icon><delete-outlined /></template>
          批量删除
        </a-button>
        <a-button type="primary" style="margin-left: 8px" @click="handleBatchExport">
          <template #icon><export-outlined /></template>
          批量导出
        </a-button>
      </div>
      
      <!-- 项目列表 -->
      <div class="project-list">
        <a-spin :spinning="loading">
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6" v-for="project in projects" :key="project.id">
              <a-card 
                class="project-card" 
                hoverable 
                @click="viewProject(project.id)"
              >
                <template #cover>
                  <div class="project-cover">
                    <img :src="project.coverUrl || '/placeholder-video.png'" alt="项目封面" />
                    <div class="project-status">
                      <a-tag :color="getStatusColor(project.status)">{{ getStatusText(project.status) }}</a-tag>
                    </div>
                    <a-checkbox 
                      class="project-checkbox" 
                      :checked="selectedRowKeys.includes(project.id)"
                      @click.stop="toggleSelection(project.id)"
                    />
                  </div>
                </template>
                
                <a-card-meta :title="project.name">
                  <template #description>
                    <div class="project-info">
                      <p>创建时间：{{ formatDate(project.createTime) }}</p>
                      <p>视频数量：{{ project.videoCount }}</p>
                      <!-- 进度条 -->
                      <div v-if="project.status === 'processing'">
                        <div class="progress-label">
                          <span>处理进度</span>
                          <span>{{ project.progress }}%</span>
                        </div>
                        <a-progress :percent="project.progress" size="small" />
                      </div>
                    </div>
                  </template>
                </a-card-meta>
                
                <div class="project-actions">
                  <a-button type="text" @click.stop="handleEdit(project)">
                    <template #icon><edit-outlined /></template>
                  </a-button>
                  <a-button type="text" @click.stop="handleDelete(project)">
                    <template #icon><delete-outlined /></template>
                  </a-button>
                  <a-button type="text" @click.stop="handleExport(project)">
                    <template #icon><download-outlined /></template>
                  </a-button>
                </div>
              </a-card>
            </a-col>
          </a-row>
          
          <!-- 空状态 -->
          <a-empty v-if="projects.length === 0" description="暂无项目数据" />
          
          <!-- 分页 -->
          <div class="pagination-container">
            <a-pagination
              v-model:current="pagination.current"
              v-model:pageSize="pagination.pageSize"
              :total="pagination.total"
              show-size-changer
              show-quick-jumper
              @change="handlePageChange"
              @showSizeChange="handlePageSizeChange"
            />
          </div>
        </a-spin>
      </div>
    </div>
    
    <!-- 创建/编辑项目对话框 -->
    <a-modal
      v-model:visible="projectModal.visible"
      :title="projectModal.isEdit ? '编辑项目' : '创建项目'"
      @ok="handleProjectModalOk"
      @cancel="handleProjectModalCancel"
      :confirmLoading="projectModal.loading"
    >
      <a-form :model="projectForm" :rules="projectRules" ref="projectFormRef">
        <a-form-item name="name" label="项目名称">
          <a-input v-model:value="projectForm.name" placeholder="请输入项目名称" />
        </a-form-item>
        <a-form-item name="description" label="项目描述">
          <a-textarea v-model:value="projectForm.description" placeholder="请输入项目描述" :rows="4" />
        </a-form-item>
        <a-form-item name="originalVideo" label="原视频">
          <a-upload
            :before-upload="file => { projectForm.originalVideo = { filename: file.name, size: file.size }; return false; }"
            :max-count="1"
            accept="video/*"
            :file-list="projectForm.originalVideo ? [{ name: projectForm.originalVideo.filename, uid: '-1' }] : []"
            @remove="() => projectForm.originalVideo = null"
          >
            <a-button>选择原视频</a-button>
          </a-upload>
          <div style="color: rgba(0,0,0,0.45); margin-top: 6px;">一个项目只能上传一个原视频</div>
        </a-form-item>
      </a-form>
    </a-modal>
    
    <!-- 删除确认对话框 -->
    <a-modal
      v-model:visible="deleteModal.visible"
      title="删除确认"
      @ok="confirmDelete"
      @cancel="deleteModal.visible = false"
      :confirmLoading="deleteModal.loading"
    >
      <p>确定要删除{{ deleteModal.isBatch ? '选中的项目' : '该项目' }}吗？此操作不可恢复。</p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { ProjectOutlined } from '@ant-design/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { 
  PlusOutlined, 
  SearchOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  DownloadOutlined,
  ExportOutlined
} from '@ant-design/icons-vue';
import { useProjectStore } from '@/store/project';

// 路由和状态
const router = useRouter();
const projectStore = useProjectStore();

// 加载状态
const loading = computed(() => projectStore.getLoading);

// 项目列表
const projects = computed(() => projectStore.getProjectList);

// 分页信息
const pagination = computed(() => projectStore.getPagination);

// 选中的行
const selectedRowKeys = ref([]);

// 筛选表单
const filterForm = reactive({
  name: '',
  status: undefined
});

// 项目表单
const projectFormRef = ref(null);
const projectForm = reactive({
  name: '',
  description: '',
  originalVideo: null
});

// 项目表单规则
const projectRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '项目名称长度应为2-50个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '项目描述最多500个字符', trigger: 'blur' }
    ],
    originalVideo: [
      { required: true, message: '请上传原视频', trigger: 'change' }
    ]
};

// 项目模态框状态
const projectModal = reactive({
  visible: false,
  isEdit: false,
  currentId: null,
  loading: false
});

// 删除模态框状态
const deleteModal = reactive({
  visible: false,
  isBatch: false,
  currentId: null,
  loading: false
});

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
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// 切换选择状态
const toggleSelection = (id) => {
  const index = selectedRowKeys.value.indexOf(id);
  if (index === -1) {
    selectedRowKeys.value.push(id);
  } else {
    selectedRowKeys.value.splice(index, 1);
  }
};

// 处理搜索
const handleSearch = async () => {
  try {
    await projectStore.fetchProjects({
      name: filterForm.name,
      status: filterForm.status
    });
  } catch (error) {
    message.error('搜索失败：' + (error.message || '未知错误'));
  }
};

// 处理重置
const handleReset = () => {
  filterForm.name = '';
  filterForm.status = undefined;
  handleSearch();
};

// 处理页码变化
const handlePageChange = (page, pageSize) => {
  projectStore.pagination.current = page;
  projectStore.pagination.pageSize = pageSize;
  handleSearch();
};

// 处理每页条数变化
const handlePageSizeChange = (current, size) => {
  projectStore.pagination.current = 1;
  projectStore.pagination.pageSize = size;
  handleSearch();
};

// 查看项目详情
const viewProject = (id) => {
  router.push(`/dashboard/project/${id}`);
};

// 处理创建项目
const handleCreateProject = () => {
  projectForm.name = '';
  projectForm.description = '';
  projectModal.isEdit = false;
  projectModal.currentId = null;
  projectModal.visible = true;
};

// 处理编辑项目
const handleEdit = (project) => {
  projectForm.name = project.name;
  projectForm.description = project.description || '';
  projectModal.isEdit = true;
  projectModal.currentId = project.id;
  projectModal.visible = true;
};

// 处理项目模态框确认
const handleProjectModalOk = async () => {
  try {
    projectModal.loading = true;
    
    // 表单验证
    await projectFormRef.value.validate();
    
    if (projectModal.isEdit) {
      // 编辑项目
      await projectStore.updateProject(projectModal.currentId, {
        name: projectForm.name,
        description: projectForm.description
      });
      message.success('项目更新成功');
    } else {
      // 创建项目
      await projectStore.createProject({
        name: projectForm.name,
        description: projectForm.description,
        originalVideo: projectForm.originalVideo
      });
      message.success('项目创建成功');
    }
    
    projectModal.visible = false;
  } catch (error) {
    console.error('项目操作失败:', error);
    message.error('操作失败：' + (error.message || '未知错误'));
  } finally {
    projectModal.loading = false;
  }
};

// 处理项目模态框取消
const handleProjectModalCancel = () => {
  projectModal.visible = false;
};

// 处理删除项目
const handleDelete = (project) => {
  deleteModal.isBatch = false;
  deleteModal.currentId = project.id;
  deleteModal.visible = true;
};

// 处理批量删除
const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的项目');
    return;
  }
  
  deleteModal.isBatch = true;
  deleteModal.visible = true;
};

// 确认删除
const confirmDelete = async () => {
  try {
    deleteModal.loading = true;
    
    if (deleteModal.isBatch) {
      // 批量删除
      await projectStore.batchDeleteProjects(selectedRowKeys.value);
      message.success('批量删除成功');
      selectedRowKeys.value = [];
    } else {
      // 单个删除
      await projectStore.deleteProject(deleteModal.currentId);
      message.success('删除成功');
    }
    
    deleteModal.visible = false;
  } catch (error) {
    message.error('删除失败：' + (error.message || '未知错误'));
  } finally {
    deleteModal.loading = false;
  }
};

// 处理导出项目
const handleExport = async (project) => {
  try {
    await projectStore.exportProjects([project.id]);
    message.success('导出成功');
  } catch (error) {
    message.error('导出失败：' + (error.message || '未知错误'));
  }
};

// 处理批量导出
const handleBatchExport = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要导出的项目');
    return;
  }
  
  try {
    await projectStore.exportProjects(selectedRowKeys.value);
    message.success('批量导出成功');
  } catch (error) {
    message.error('批量导出失败：' + (error.message || '未知错误'));
  }
};

// 更新处理中项目的进度
const updateProjectProgress = async () => {
  const processingProjects = projects.value.filter(p => p.status === 'processing');
  
  for (const project of processingProjects) {
    try {
      await projectStore.fetchProjectProgress(project.id);
    } catch (error) {
      console.error(`获取项目 ${project.id} 进度失败:`, error);
    }
  }
};

// 生命周期钩子
onMounted(async () => {
  try {
    // 加载项目列表
    await projectStore.fetchProjects();
    
    // 设置定时器，定期更新进度
    progressTimer = setInterval(updateProjectProgress, 5000);
  } catch (error) {
    message.error('加载项目列表失败：' + (error.message || '未知错误'));
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
.project-dashboard-container {
  background-color: #f5f5f5;
  min-height: calc(100vh - 184px);
}

.pd-section {
  background-color: #fff;
  padding: 24px;
  margin: 16px 0;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

  .filter-container {
    margin-bottom: 24px;
  }
  
  .batch-actions {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background-color: #f8f8f8;
    border-radius: 4px;
  }
  
  .project-list {
    .project-card {
      height: 100%;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .project-cover {
        position: relative;
        height: 160px;
        overflow: hidden;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .project-status {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 1;
        }
        
        .project-checkbox {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 1;
        }
      }
      
      .project-info {
        margin-top: 8px;
        
        p {
          margin-bottom: 4px;
          color: rgba(0, 0, 0, 0.65);
        }
        
        .progress-label {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          margin-bottom: 4px;
          color: rgba(0, 0, 0, 0.65);
        }
      }
      
      .project-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
        border-top: 1px solid #f0f0f0;
        padding-top: 12px;
      }
    }
  }
  
  .pagination-container {
    margin-top: 24px;
    text-align: right;
  }
@media (max-width: 768px) {
  .pd-section { padding: 16px; }
}
</style> 