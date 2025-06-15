<template>
  <div class="task-management">
    <!-- 页面头部 -->
    <PageHeader title="任务管理" subTitle="管理所有项目的处理任务">
      <template #icon>
        <schedule-outlined />
      </template>
      <template #tags>
        <a-tag color="blue">项目管理</a-tag>
        <a-tag color="green">任务管理</a-tag>
      </template>
      <template #extra>
        <a-button type="primary" @click="refreshTasks">
          <template #icon><reload-outlined /></template>
          刷新任务
        </a-button>
      </template>
    </PageHeader>

    <a-card :bordered="false" class="task-card">
      <!-- 任务过滤器 -->
      <div class="filter-container">
        <a-form layout="inline" :model="filterForm">
          <a-form-item label="任务名称">
            <a-input v-model:value="filterForm.name" placeholder="请输入任务名称" allow-clear />
          </a-form-item>
          <a-form-item label="任务类型">
            <a-select v-model:value="filterForm.type" placeholder="请选择类型" style="width: 120px" allow-clear>
              <a-select-option value="video">视频处理</a-select-option>
              <a-select-option value="image">图片处理</a-select-option>
              <a-select-option value="file">文件处理</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="任务状态">
            <a-select v-model:value="filterForm.status" placeholder="请选择状态" style="width: 120px" allow-clear>
              <a-select-option value="processing">处理中</a-select-option>
              <a-select-option value="completed">已完成</a-select-option>
              <a-select-option value="failed">失败</a-select-option>
              <a-select-option value="cancelled">已取消</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="所属项目">
            <a-select v-model:value="filterForm.projectId" placeholder="请选择项目" style="width: 180px" allow-clear>
              <a-select-option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </a-select-option>
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

      <!-- 任务列表 -->
      <a-table
        :columns="columns"
        :data-source="tasks"
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
        row-key="id"
      >
        <!-- 任务名称 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="task-name-cell">
              <span class="task-icon">
                <video-camera-outlined v-if="record.type === 'video'" />
                <file-image-outlined v-else-if="record.type === 'image'" />
                <file-outlined v-else />
              </span>
              <span>{{ record.name }}</span>
            </div>
          </template>

          <!-- 所属项目 -->
          <template v-if="column.key === 'project'">
            <a @click="viewProject(record.projectId)">{{ getProjectName(record.projectId) }}</a>
          </template>

          <!-- 任务状态 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>

          <!-- 任务进度 -->
          <template v-if="column.key === 'progress'">
            <div v-if="record.status === 'processing'">
              <div class="progress-text">
                <span>{{ record.progress }}%</span>
                <span>{{ formatTime(record.remainingTime) }}</span>
              </div>
              <a-progress :percent="record.progress" size="small" status="active" />
            </div>
            <span v-else>-</span>
          </template>

          <!-- 操作 -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="viewTaskDetail(record)" :disabled="record.status === 'processing'">
                详情
              </a-button>
              <a-button v-if="record.status === 'processing'" type="link" size="small" @click="pauseTask(record)">
                暂停
              </a-button>
              <a-button v-if="record.status === 'processing'" type="link" danger size="small" @click="cancelTask(record)">
                取消
              </a-button>
              <a-button v-if="['completed', 'failed', 'cancelled'].includes(record.status)" type="link" danger size="small" @click="deleteTask(record)">
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 取消任务确认对话框 -->
    <a-modal
      v-model:visible="cancelModal.visible"
      title="取消任务"
      @ok="confirmCancelTask"
      @cancel="cancelModal.visible = false"
      :confirmLoading="cancelModal.loading"
    >
      <p>确定要取消该任务吗？取消后无法恢复。</p>
    </a-modal>

    <!-- 删除任务确认对话框 -->
    <a-modal
      v-model:visible="deleteModal.visible"
      title="删除任务"
      @ok="confirmDeleteTask"
      @cancel="deleteModal.visible = false"
      :confirmLoading="deleteModal.loading"
    >
      <p>确定要删除该任务记录吗？此操作不可恢复。</p>
    </a-modal>

    <!-- 任务详情对话框 -->
    <a-modal
      v-model:visible="detailModal.visible"
      title="任务详情"
      @cancel="detailModal.visible = false"
      :footer="null"
      width="700px"
    >
      <div v-if="detailModal.task" class="task-detail">
        <a-descriptions bordered>
          <a-descriptions-item label="任务名称" :span="3">{{ detailModal.task.name }}</a-descriptions-item>
          <a-descriptions-item label="任务类型">{{ getTypeText(detailModal.task.type) }}</a-descriptions-item>
          <a-descriptions-item label="任务状态">
            <a-tag :color="getStatusColor(detailModal.task.status)">{{ getStatusText(detailModal.task.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="所属项目">{{ getProjectName(detailModal.task.projectId) }}</a-descriptions-item>
          <a-descriptions-item label="创建时间" :span="3">{{ formatDate(detailModal.task.createTime) }}</a-descriptions-item>
          <a-descriptions-item label="开始时间">{{ formatDate(detailModal.task.startTime) }}</a-descriptions-item>
          <a-descriptions-item label="完成时间" :span="2">{{ formatDate(detailModal.task.completionTime) }}</a-descriptions-item>
          <a-descriptions-item label="处理进度" :span="3">
            <a-progress 
              :percent="detailModal.task.progress" 
              :status="getProgressStatus(detailModal.task.status)" 
            />
          </a-descriptions-item>
          <a-descriptions-item label="任务参数" :span="3">
            <pre>{{ JSON.stringify(detailModal.task.params || {}, null, 2) }}</pre>
          </a-descriptions-item>
          <a-descriptions-item v-if="detailModal.task.result" label="任务结果" :span="3">
            <pre>{{ JSON.stringify(detailModal.task.result, null, 2) }}</pre>
          </a-descriptions-item>
          <a-descriptions-item v-if="detailModal.task.error" label="错误信息" :span="3">
            <div class="error-message">{{ detailModal.task.error }}</div>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  ScheduleOutlined,
  ReloadOutlined,
  SearchOutlined,
  VideoCameraOutlined,
  FileImageOutlined,
  FileOutlined
} from '@ant-design/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { useProjectStore } from '@/store/project';

// 路由
const router = useRouter();
const projectStore = useProjectStore();

// 加载状态
const loading = ref(false);

// 任务列表
const tasks = ref([]);

// 项目列表
const projects = computed(() => projectStore.getProjectList);

// 分页信息
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true
});

// 过滤表单
const filterForm = reactive({
  name: '',
  type: undefined,
  status: undefined,
  projectId: undefined
});

// 表格列定义
const columns = [
  {
    title: '任务名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    width: '25%'
  },
  {
    title: '所属项目',
    key: 'project',
    dataIndex: 'projectId',
    width: '15%'
  },
  {
    title: '任务类型',
    dataIndex: 'type',
    key: 'type',
    width: '10%',
    filters: [
      { text: '视频处理', value: 'video' },
      { text: '图片处理', value: 'image' },
      { text: '文件处理', value: 'file' }
    ],
    onFilter: (value, record) => record.type === value,
    render: (type) => getTypeText(type)
  },
  {
    title: '状态',
    key: 'status',
    dataIndex: 'status',
    width: '10%',
    filters: [
      { text: '处理中', value: 'processing' },
      { text: '已完成', value: 'completed' },
      { text: '失败', value: 'failed' },
      { text: '已取消', value: 'cancelled' }
    ],
    onFilter: (value, record) => record.status === value
  },
  {
    title: '进度',
    key: 'progress',
    dataIndex: 'progress',
    width: '20%'
  },
  {
    title: '操作',
    key: 'action',
    width: '20%',
    fixed: 'right'
  }
];

// 取消任务确认对话框
const cancelModal = reactive({
  visible: false,
  taskId: null,
  loading: false
});

// 删除任务确认对话框
const deleteModal = reactive({
  visible: false,
  taskId: null,
  loading: false
});

// 任务详情对话框
const detailModal = reactive({
  visible: false,
  task: null
});

// 获取状态颜色
const getStatusColor = (status) => {
  const statusMap = {
    processing: 'blue',
    completed: 'green',
    failed: 'red',
    cancelled: 'orange'
  };
  return statusMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  };
  return statusMap[status] || '未知';
};

// 获取类型文本
const getTypeText = (type) => {
  const typeMap = {
    video: '视频处理',
    image: '图片处理',
    file: '文件处理'
  };
  return typeMap[type] || '未知';
};

// 获取进度条状态
const getProgressStatus = (status) => {
  if (status === 'processing') return 'active';
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'exception';
  return 'normal';
};

// 获取项目名称
const getProjectName = (projectId) => {
  const project = projects.value.find(p => p.id === projectId);
  return project ? project.name : '未知项目';
};

// 格式化剩余时间
const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return '计算中...';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `剩余 ${hours}小时${minutes}分钟`;
  } else if (minutes > 0) {
    return `剩余 ${minutes}分钟${secs}秒`;
  } else {
    return `剩余 ${secs}秒`;
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 刷新任务列表
const refreshTasks = async () => {
  try {
    loading.value = true;
    
    // 加载项目列表
    if (projects.value.length === 0) {
      await projectStore.fetchProjects();
    }
    
    // 这里应该调用API获取任务列表
    // 模拟数据
    setTimeout(() => {
      // 生成随机任务数据
      const generateTasks = () => {
        const taskTypes = ['video', 'image', 'file'];
        const taskStatuses = ['processing', 'completed', 'failed', 'cancelled'];
        const taskNames = [
          '视频水印处理',
          '批量添加水印',
          '视频格式转换',
          '视频剪辑处理',
          '水印提取任务'
        ];
        
        // 生成20个随机任务
        return Array(20).fill(0).map((_, index) => {
          const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
          const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
          const name = `${taskNames[Math.floor(Math.random() * taskNames.length)]} ${index + 1}`;
          const projectId = `project-${Math.floor(Math.random() * 4) + 1}`;
          const createTime = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString();
          const startTime = new Date(new Date(createTime).getTime() + 1000 * 60).toISOString();
          const completionTime = status !== 'processing' ? 
            new Date(new Date(startTime).getTime() + Math.random() * 86400000).toISOString() : null;
          
          return {
            id: `task-${index + 1}`,
            name,
            type,
            status,
            progress: status === 'processing' ? Math.floor(Math.random() * 100) : 100,
            remainingTime: status === 'processing' ? Math.floor(Math.random() * 3600) : 0,
            createTime,
            startTime,
            completionTime,
            projectId,
            params: {
              inputFile: `input_${Math.floor(Math.random() * 1000)}.mp4`,
              outputFile: `output_${Math.floor(Math.random() * 1000)}.mp4`,
              watermarkPosition: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'][Math.floor(Math.random() * 4)],
              watermarkOpacity: Math.floor(Math.random() * 100),
              watermarkSize: Math.floor(Math.random() * 50) + 10
            },
            result: status === 'completed' ? {
              outputUrl: `https://example.com/output_${Math.floor(Math.random() * 1000)}.mp4`,
              processTime: Math.floor(Math.random() * 3600),
              fileSize: Math.floor(Math.random() * 100000000)
            } : null,
            error: status === 'failed' ? [
              '处理超时',
              '文件格式不支持',
              '水印参数无效',
              '输入文件损坏',
              '服务器资源不足'
            ][Math.floor(Math.random() * 5)] : null
          };
        });
      };
      
      const allTasks = generateTasks();
      
      // 应用过滤
      let filteredTasks = [...allTasks];
      
      if (filterForm.name) {
        filteredTasks = filteredTasks.filter(task => 
          task.name.toLowerCase().includes(filterForm.name.toLowerCase())
        );
      }
      
      if (filterForm.type) {
        filteredTasks = filteredTasks.filter(task => task.type === filterForm.type);
      }
      
      if (filterForm.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filterForm.status);
      }
      
      if (filterForm.projectId) {
        filteredTasks = filteredTasks.filter(task => task.projectId === filterForm.projectId);
      }
      
      // 分页
      pagination.total = filteredTasks.length;
      const startIndex = (pagination.current - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      tasks.value = filteredTasks.slice(startIndex, endIndex);
      
      loading.value = false;
    }, 500);
  } catch (error) {
    message.error('加载任务列表失败：' + (error.message || '未知错误'));
    loading.value = false;
  }
};

// 处理表格变化
const handleTableChange = (pag, filters, sorter) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  refreshTasks();
};

// 处理搜索
const handleSearch = () => {
  pagination.current = 1;
  refreshTasks();
};

// 处理重置
const handleReset = () => {
  filterForm.name = '';
  filterForm.type = undefined;
  filterForm.status = undefined;
  filterForm.projectId = undefined;
  pagination.current = 1;
  refreshTasks();
};

// 查看项目详情
const viewProject = (projectId) => {
  router.push(`/dashboard/project/${projectId}`);
};

// 查看任务详情
const viewTaskDetail = (task) => {
  detailModal.task = task;
  detailModal.visible = true;
};

// 暂停任务
const pauseTask = (task) => {
  message.success(`已暂停任务: ${task.name}`);
  
  // 这里应该调用API暂停任务
  // 模拟暂停成功
  const index = tasks.value.findIndex(t => t.id === task.id);
  if (index !== -1) {
    tasks.value[index].status = 'paused';
  }
};

// 取消任务
const cancelTask = (task) => {
  cancelModal.taskId = task.id;
  cancelModal.visible = true;
};

// 确认取消任务
const confirmCancelTask = async () => {
  try {
    cancelModal.loading = true;
    
    // 这里应该调用API取消任务
    // 模拟取消成功
    setTimeout(() => {
      const index = tasks.value.findIndex(t => t.id === cancelModal.taskId);
      if (index !== -1) {
        tasks.value[index].status = 'cancelled';
        tasks.value[index].completionTime = new Date().toISOString();
      }
      
      message.success('任务已取消');
      cancelModal.visible = false;
      cancelModal.loading = false;
    }, 500);
  } catch (error) {
    message.error('取消任务失败：' + (error.message || '未知错误'));
    cancelModal.loading = false;
  }
};

// 删除任务
const deleteTask = (task) => {
  deleteModal.taskId = task.id;
  deleteModal.visible = true;
};

// 确认删除任务
const confirmDeleteTask = async () => {
  try {
    deleteModal.loading = true;
    
    // 这里应该调用API删除任务
    // 模拟删除成功
    setTimeout(() => {
      tasks.value = tasks.value.filter(t => t.id !== deleteModal.taskId);
      
      message.success('任务已删除');
      deleteModal.visible = false;
      deleteModal.loading = false;
    }, 500);
  } catch (error) {
    message.error('删除任务失败：' + (error.message || '未知错误'));
    deleteModal.loading = false;
  }
};

// 生命周期钩子
onMounted(() => {
  refreshTasks();
});
</script>

<style lang="less" scoped>
.task-management {
  .task-card {
    margin-top: 16px;
  }
  
  .filter-container {
    margin-bottom: 16px;
  }
  
  .task-name-cell {
    display: flex;
    align-items: center;
    
    .task-icon {
      margin-right: 8px;
    }
  }
  
  .progress-text {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.65);
  }
  
  .task-detail {
    pre {
      background-color: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      max-height: 200px;
      overflow: auto;
      margin: 0;
    }
    
    .error-message {
      color: #ff4d4f;
    }
  }
}
</style> 