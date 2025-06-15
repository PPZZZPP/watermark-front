<template>
  <div class="task-monitor">
    <div class="monitor-header">
      <h3 class="monitor-title">任务监控</h3>
      <a-button type="link" @click="refreshTasks">
        <template #icon><reload-outlined /></template>
        刷新
      </a-button>
    </div>
    
    <a-list
      class="task-list"
      :loading="loading"
      :data-source="processingTasks"
      :locale="{ emptyText: '暂无进行中的任务' }"
    >
      <template #renderItem="{ item }">
        <a-list-item class="task-item">
          <div class="task-info">
            <div class="task-name">
              <span class="task-icon">
                <video-camera-outlined v-if="item.type === 'video'" />
                <file-image-outlined v-else-if="item.type === 'image'" />
                <file-outlined v-else />
              </span>
              <span class="task-title">{{ item.name }}</span>
            </div>
            
            <div class="task-progress">
              <div class="progress-text">
                <span>{{ item.progress }}%</span>
                <span>{{ formatTime(item.remainingTime) }}</span>
              </div>
              <a-progress :percent="item.progress" size="small" status="active" />
            </div>
            
            <div class="task-actions">
              <a-tooltip title="暂停">
                <a-button type="text" size="small" @click="pauseTask(item)">
                  <template #icon><pause-outlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="取消">
                <a-button type="text" size="small" danger @click="cancelTask(item)">
                  <template #icon><close-outlined /></template>
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </a-list-item>
      </template>
    </a-list>
    
    <div class="completed-tasks" v-if="recentCompletedTasks.length > 0">
      <div class="section-divider">
        <span>最近完成的任务</span>
      </div>
      
      <a-list
        class="task-list"
        :data-source="recentCompletedTasks"
      >
        <template #renderItem="{ item }">
          <a-list-item class="task-item completed">
            <div class="task-info">
              <div class="task-name">
                <span class="task-icon">
                  <check-circle-outlined class="success-icon" v-if="item.status === 'completed'" />
                  <close-circle-outlined class="error-icon" v-else-if="item.status === 'failed'" />
                  <warning-outlined class="warning-icon" v-else-if="item.status === 'cancelled'" />
                </span>
                <span class="task-title">{{ item.name }}</span>
              </div>
              
              <div class="task-result">
                <a-tag :color="getStatusColor(item.status)">{{ getStatusText(item.status) }}</a-tag>
                <span class="completion-time">{{ formatDate(item.completionTime) }}</span>
              </div>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </div>
    
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  ReloadOutlined, 
  VideoCameraOutlined, 
  FileImageOutlined, 
  FileOutlined,
  PauseOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons-vue';

// 定义属性
const props = defineProps({
  // 是否显示最近完成的任务
  showCompleted: {
    type: Boolean,
    default: true
  },
  // 最大显示的已完成任务数量
  maxCompletedTasks: {
    type: Number,
    default: 5
  },
  // 项目ID，如果传入则只显示该项目的任务
  projectId: {
    type: String,
    default: ''
  }
});

// 加载状态
const loading = ref(false);

// 任务列表
const tasks = ref([]);

// 取消任务确认对话框
const cancelModal = reactive({
  visible: false,
  taskId: null,
  loading: false
});

// 定时器ID，用于定时刷新任务状态
let refreshTimer = null;

// 计算进行中的任务
const processingTasks = computed(() => {
  return tasks.value.filter(task => task.status === 'processing');
});

// 计算最近完成的任务
const recentCompletedTasks = computed(() => {
  if (!props.showCompleted) return [];
  
  return tasks.value
    .filter(task => ['completed', 'failed', 'cancelled'].includes(task.status))
    .sort((a, b) => new Date(b.completionTime) - new Date(a.completionTime))
    .slice(0, props.maxCompletedTasks);
});

// 获取状态颜色
const getStatusColor = (status) => {
  const statusMap = {
    completed: 'green',
    failed: 'red',
    cancelled: 'orange',
    processing: 'blue'
  };
  return statusMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
    processing: '处理中'
  };
  return statusMap[status] || '未知';
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
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 刷新任务列表
const refreshTasks = async () => {
  try {
    loading.value = true;
    
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
        
        // 生成10个随机任务
        return Array(10).fill(0).map((_, index) => {
          const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
          const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
          const name = `${taskNames[Math.floor(Math.random() * taskNames.length)]} ${index + 1}`;
          
          // 如果有项目ID，则过滤任务
          if (props.projectId && Math.random() > 0.5) {
            return null;
          }
          
          return {
            id: `task-${index}`,
            name,
            type,
            status,
            progress: status === 'processing' ? Math.floor(Math.random() * 100) : 100,
            remainingTime: status === 'processing' ? Math.floor(Math.random() * 3600) : 0,
            completionTime: status !== 'processing' ? new Date(Date.now() - Math.random() * 86400000).toISOString() : null,
            projectId: props.projectId || `project-${Math.floor(Math.random() * 5)}`
          };
        }).filter(Boolean);
      };
      
      tasks.value = generateTasks();
      loading.value = false;
    }, 500);
  } catch (error) {
    message.error('刷新任务列表失败：' + (error.message || '未知错误'));
    loading.value = false;
  }
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

// 生命周期钩子
onMounted(() => {
  // 初始加载任务列表
  refreshTasks();
  
  // 设置定时器，定期刷新任务状态
  refreshTimer = setInterval(refreshTasks, 10000);
});

onUnmounted(() => {
  // 清除定时器
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

// 暴露方法给父组件
defineExpose({
  refreshTasks
});
</script>

<style lang="less" scoped>
.task-monitor {
  .monitor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .monitor-title {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
  }
  
  .task-list {
    margin-bottom: 24px;
    
    .task-item {
      padding: 12px 0;
      
      &.completed {
        opacity: 0.8;
      }
      
      .task-info {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        .task-name {
          display: flex;
          align-items: center;
          
          .task-icon {
            margin-right: 8px;
            font-size: 16px;
          }
          
          .task-title {
            font-weight: 500;
          }
          
          .success-icon {
            color: #52c41a;
          }
          
          .error-icon {
            color: #f5222d;
          }
          
          .warning-icon {
            color: #faad14;
          }
        }
        
        .task-progress {
          .progress-text {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.65);
          }
        }
        
        .task-result {
          display: flex;
          align-items: center;
          
          .completion-time {
            margin-left: 8px;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.45);
          }
        }
        
        .task-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 4px;
        }
      }
    }
  }
  
  .section-divider {
    position: relative;
    text-align: center;
    margin: 16px 0;
    color: rgba(0, 0, 0, 0.45);
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 40%;
      height: 1px;
      background-color: #f0f0f0;
    }
    
    &::before {
      left: 0;
    }
    
    &::after {
      right: 0;
    }
    
    span {
      display: inline-block;
      padding: 0 10px;
      background: #ffffff;
      position: relative;
      z-index: 1;
    }
  }
}
</style>