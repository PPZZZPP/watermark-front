<template>
  <div class="model-training-container">
    <a-card title="模型训练" :bordered="false">
      <template #extra>
        <a-button type="primary" @click="startTraining" :loading="trainingLoading" :disabled="!canStartTraining">
          <template #icon><play-circle-outlined /></template>
          开始训练
        </a-button>
      </template>
      
      <a-row :gutter="24">
        <!-- 左侧：训练数据集上传 + 验证数据集上传 -->
        <a-col :span="12">
          <a-card title="训练数据集" size="small" :bordered="false" class="inner-card">
            <div class="upload-container">
              <a-upload-dragger
                name="dataset"
                :multiple="false"
                :before-upload="beforeDatasetUpload"
                :customRequest="uploadDataset"
                :file-list="datasetFileList"
                @change="handleDatasetChange"
              >
                <p class="ant-upload-drag-icon">
                  <inbox-outlined />
                </p>
                <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p class="ant-upload-hint">
                  支持上传ZIP格式的数据集，包含原始视频和水印信息
                </p>
              </a-upload-dragger>
            </div>
            
            <div class="dataset-info" v-if="currentDataset">
              <a-descriptions title="当前数据集信息" size="small" :column="1" bordered>
                <a-descriptions-item label="数据集名称">{{ currentDataset.name }}</a-descriptions-item>
                <a-descriptions-item label="文件大小">{{ formatFileSize(currentDataset.size) }}</a-descriptions-item>
                <a-descriptions-item label="上传时间">{{ currentDataset.uploadTime }}</a-descriptions-item>
                <a-descriptions-item label="样本数量">{{ currentDataset.sampleCount }}</a-descriptions-item>
              </a-descriptions>
            </div>
          </a-card>

          <a-card title="验证数据集" size="small" :bordered="false" class="inner-card">
            <a-upload-dragger
              name="val_dataset"
              :multiple="false"
              :before-upload="beforeValUpload"
              :customRequest="uploadValDataset"
              :file-list="valFileList"
              @change="handleValChange"
            >
              <p class="ant-upload-drag-icon">
                <inbox-outlined />
              </p>
              <p class="ant-upload-text">点击或拖拽验证数据集（ZIP）上传</p>
              <p class="ant-upload-hint">大小不超过 1GB</p>
            </a-upload-dragger>
          </a-card>
        </a-col>
        
        <!-- 右侧：训练参数配置 + 验证数据集上传 -->
        <a-col :span="12">
          <a-card title="训练参数配置" size="small" :bordered="false" class="inner-card">
            <a-form :model="trainingParams" layout="vertical">
              <a-form-item label="模型名称" name="modelName">
                <a-input v-model:value="trainingParams.modelName" placeholder="请输入模型名称" />
              </a-form-item>

              <a-form-item label="适用场景" name="scenario">
                <a-select v-model:value="trainingParams.scenario" placeholder="请选择适用场景">
                  <a-select-option value="movie">电影</a-select-option>
                  <a-select-option value="tv">电视节目</a-select-option>
                  <a-select-option value="live">直播</a-select-option>
                  <a-select-option value="game">游戏</a-select-option>
                  <a-select-option value="education">教育视频</a-select-option>
                </a-select>
              </a-form-item>
              
              <a-form-item label="训练轮数" name="epochs">
                <a-input-number v-model:value="trainingParams.epochs" :min="1" :max="100" style="width: 100%" />
              </a-form-item>
              
              <a-form-item label="批次大小" name="batchSize">
                <a-input-number v-model:value="trainingParams.batchSize" :min="1" :max="128" style="width: 100%" />
              </a-form-item>
              
              <a-form-item label="学习率" name="learningRate">
                <a-input-number
                  v-model:value="trainingParams.learningRate"
                  :min="0.0001"
                  :max="0.1"
                  :step="0.0001"
                  :precision="4"
                  style="width: 100%"
                />
              </a-form-item>
              
              <a-form-item label="高级参数">
                <a-collapse>
                  <a-collapse-panel key="1" header="高级训练参数">
                    <a-form-item label="优化器" name="optimizer">
                      <a-select v-model:value="trainingParams.optimizer" placeholder="请选择优化器">
                        <a-select-option value="adam">Adam</a-select-option>
                        <a-select-option value="sgd">SGD</a-select-option>
                        <a-select-option value="rmsprop">RMSprop</a-select-option>
                      </a-select>
                    </a-form-item>
                    
                    <a-form-item label="数据增强" name="dataAugmentation">
                      <a-switch v-model:checked="trainingParams.dataAugmentation" />
                    </a-form-item>
                    
                    <a-form-item label="早停策略" name="earlyStop">
                      <a-switch v-model:checked="trainingParams.earlyStop" />
                    </a-form-item>
                  </a-collapse-panel>
                </a-collapse>
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>
      </a-row>
      
      <!-- 训练进度 -->
      <a-card title="训练进度" size="small" :bordered="false" class="inner-card" v-if="isTraining">
        <a-row :gutter="24">
          <a-col :span="24">
            <a-progress :percent="trainingProgress" status="active" />
          </a-col>
        </a-row>
        
        <a-row :gutter="24" style="margin-top: 16px">
          <a-col :span="12">
            <a-statistic title="当前轮数" :value="`${currentEpoch}/${trainingParams.epochs}`" />
          </a-col>
          <a-col :span="12">
            <a-statistic title="预计剩余时间" :value="remainingTime" />
          </a-col>
        </a-row>
        
        <a-row :gutter="24" style="margin-top: 16px">
          <a-col :span="24">
            <a-card title="训练日志" size="small" :bordered="false" class="log-card">
              <div class="log-content">
                <p v-for="(log, index) in trainingLogs" :key="index" :class="{ 'error-log': log.type === 'error' }">
                  {{ log.time }} - {{ log.message }}
                </p>
              </div>
            </a-card>
          </a-col>
        </a-row>
        
        <a-row :gutter="24" style="margin-top: 16px">
          <a-col :span="24" style="text-align: center">
            <a-button type="danger" @click="stopTraining">
              <template #icon><stop-outlined /></template>
              停止训练
            </a-button>
          </a-col>
        </a-row>
      </a-card>
      
      <!-- 历史训练记录 -->
      <a-card title="历史训练记录" size="small" :bordered="false" class="inner-card">
        <a-table
          :columns="historyColumns"
          :data-source="trainingHistory"
          :pagination="{ pageSize: 5 }"
          size="small"
          :scroll="{ x: 800 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
            </template>
            
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="goToEvaluation(record)" v-if="record.status === 'completed'">
                  前往评估
                </a-button>
                <a-button type="link" size="small" @click="continueTraining(record)" v-if="record.status === 'stopped'">
                  继续训练
                </a-button>
                <a-button type="link" danger size="small" @click="deleteTrainingRecord(record)">
                  删除
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { 
  PlayCircleOutlined, 
  InboxOutlined, 
  StopOutlined 
} from '@ant-design/icons-vue';
import { useSystemStore } from '@/store/system';

// 系统存储
const systemStore = useSystemStore();

// 数据集文件列表
const datasetFileList = ref([]);
// 当前数据集信息
const currentDataset = ref(null);
// 训练加载状态
const trainingLoading = ref(false);
// 是否正在训练
const isTraining = ref(false);
// 训练进度
const trainingProgress = ref(0);
// 当前训练轮数
const currentEpoch = ref(0);
// 剩余时间
const remainingTime = ref('00:00:00');
// 训练日志
const trainingLogs = ref([]);

// 训练参数
const trainingParams = reactive({
  modelName: '',
  scenario: undefined,
  epochs: 20,
  batchSize: 32,
  learningRate: 0.001,
  optimizer: 'adam',
  dataAugmentation: true,
  earlyStop: true,
});

// 历史训练记录列
const historyColumns = [
  {
    title: '任务ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '模型名称',
    dataIndex: 'modelName',
    key: 'modelName',
  },
  {
    title: '训练状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '开始时间',
    dataIndex: 'startTime',
    key: 'startTime',
  },
  {
    title: '结束时间',
    dataIndex: 'endTime',
    key: 'endTime',
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
];

// 历史训练记录
const trainingHistory = ref([]);

// 计算是否可以开始训练
const canStartTraining = computed(() => {
  return currentDataset.value && 
         trainingParams.modelName && 
         !isTraining.value;
});

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取状态颜色
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'training':
      return 'processing';
    case 'stopped':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'training':
      return '训练中';
    case 'stopped':
      return '已停止';
    case 'failed':
      return '失败';
    default:
      return '未知';
  }
};

// 数据集上传前检查
const beforeDatasetUpload = (file) => {
  const isZip = file.type === 'application/zip' || 
                file.type === 'application/x-zip-compressed' || 
                file.name.endsWith('.zip');
  
  if (!isZip) {
    message.error('只能上传ZIP格式的数据集文件!');
  }
  
  const isLt2G = file.size / 1024 / 1024 / 1024 < 2;
  if (!isLt2G) {
    message.error('数据集大小不能超过2GB!');
  }
  
  return isZip && isLt2G;
};

// 上传数据集
const uploadDataset = ({ file, onSuccess, onError, onProgress }) => {
  // 模拟上传进度
  const timer = setInterval(() => {
    const percent = parseInt(Math.random() * 10 + 90);
    onProgress({ percent });
  }, 200);
  
  // 模拟上传完成
  setTimeout(() => {
    clearInterval(timer);
    
    // 设置当前数据集信息
    currentDataset.value = {
      name: file.name,
      size: file.size,
      uploadTime: new Date().toLocaleString(),
      sampleCount: Math.floor(Math.random() * 1000 + 1000), // 模拟样本数量
    };
    
    onSuccess();
    message.success(`${file.name} 上传成功`);
  }, 2000);
};

// 处理数据集上传变化
const handleDatasetChange = (info) => {
  datasetFileList.value = [...info.fileList].slice(-1); // 只保留最后一个文件
};

// 开始训练
const startTraining = async () => {
  if (!currentDataset.value) {
    message.warning('请先上传训练数据集');
    return;
  }
  
  if (!trainingParams.modelName) {
    message.warning('请输入模型名称');
    return;
  }
  try {
    trainingLoading.value = true;
    isTraining.value = true;
    trainingProgress.value = 0;
    currentEpoch.value = 0;
    trainingLogs.value = [];
    addTrainingLog('开始训练模型: ' + trainingParams.modelName);
    addTrainingLog('数据集: ' + currentDataset.value.name);
    // 调后端创建训练任务
    // await startTrainingTask({ modelName: trainingParams.modelName, paramsJson: JSON.stringify(trainingParams) });
    simulateTraining();
  } finally {
    // do nothing here
  }
};

// 停止训练
const stopTraining = () => {
  isTraining.value = false;
  trainingLoading.value = false;
  addTrainingLog('训练已手动停止', 'error');
  message.warning('训练已停止');
  
  // 添加到历史记录
  trainingHistory.value.unshift({
    id: Date.now(),
    modelName: trainingParams.modelName,
    modelType: trainingParams.modelType,
    startTime: new Date().toLocaleString(),
    duration: '已停止',
    status: 'stopped',
  });
};

// 添加训练日志
const addTrainingLog = (message, type = 'info') => {
  trainingLogs.value.push({
    time: new Date().toLocaleTimeString(),
    message,
    type,
  });
};

// 模拟训练进度
const simulateTraining = () => {
  let progress = 0;
  let epoch = 0;
  const totalEpochs = trainingParams.epochs;
  
  const interval = setInterval(() => {
    if (!isTraining.value) {
      clearInterval(interval);
      return;
    }
    
    progress += 1;
    trainingProgress.value = progress;
    
    // 更新当前轮数
    const newEpoch = Math.floor((progress / 100) * totalEpochs);
    if (newEpoch > epoch) {
      epoch = newEpoch;
      currentEpoch.value = epoch;
      addTrainingLog(`完成训练轮数 ${epoch}/${totalEpochs}, 损失: ${(Math.random() * 0.1).toFixed(4)}`);
    }
    
    // 更新剩余时间
    const remainingSeconds = Math.floor((100 - progress) * totalEpochs * 3);
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    remainingTime.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 训练完成
    if (progress >= 100) {
      clearInterval(interval);
      isTraining.value = false;
      trainingLoading.value = false;
      addTrainingLog('训练完成！');
      message.success('模型训练成功');
      
      // 添加到历史记录
      trainingHistory.value.unshift({
        id: Date.now(),
        modelName: trainingParams.modelName,
        modelType: trainingParams.modelType,
        startTime: new Date().toLocaleString(),
        duration: `${Math.floor(Math.random() * 3 + 1)}小时${Math.floor(Math.random() * 60)}分钟`,
        status: 'completed',
      });
    }
  }, 300);
};

// 查看训练详情
const viewTrainingDetail = (record) => {
  message.info(`查看训练详情: ${record.modelName}`);
};

// 继续训练
const continueTraining = (record) => {
  trainingParams.modelName = record.modelName;
  message.info(`继续训练模型: ${record.modelName}`);
};

// 删除训练记录
const deleteTrainingRecord = (record) => {
  trainingHistory.value = trainingHistory.value.filter(item => item.id !== record.id);
  message.success(`已删除训练记录: ${record.modelName}`);
};

const goToEvaluation = (record) => {
  message.success('跳转到模型评估页');
  // 这里可结合路由跳转到评估 tab
};

// 验证数据集上传相关
const valFileList = ref([]);
const beforeValUpload = (file) => {
  const isZip = file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.endsWith('.zip');
  if (!isZip) message.error('只能上传ZIP格式的验证集文件!');
  const isLt1G = file.size / 1024 / 1024 / 1024 < 1;
  if (!isLt1G) message.error('验证集大小不能超过1GB!');
  return isZip && isLt1G;
};
const uploadValDataset = ({ file, onSuccess }) => {
  setTimeout(() => {
    onSuccess();
    message.success(`${file.name} 上传成功`);
  }, 1200);
};
const handleValChange = (info) => {
  valFileList.value = [...info.fileList].slice(-1);
};
</script>

<style lang="less" scoped>
.inner-card {
  margin-bottom: 24px;
}

.upload-container {
  margin-bottom: 16px;
}

.dataset-info {
  margin-top: 16px;
}

.log-card {
  max-height: 200px;
  overflow-y: auto;
}

.log-content {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
  
  p {
    margin-bottom: 4px;
    white-space: pre-wrap;
    word-break: break-all;
  }
  
  .error-log {
    color: #ff4d4f;
  }
}
</style> 