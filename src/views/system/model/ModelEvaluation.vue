<template>
  <div class="model-evaluation-container">
    <a-card title="模型评估" :bordered="false">
      <!-- 模型选择 -->
      <a-form layout="inline" class="model-select-form">
        <a-form-item label="选择模型">
          <a-select
            v-model:value="selectedModel"
            style="width: 250px"
            placeholder="请选择要评估的模型"
            @change="handleModelChange"
          >
            <a-select-option v-for="model in availableModels" :key="model.id" :value="model.id">
              {{ model.name }} ({{ model.type }})
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="loadModelDetails" :loading="loading" :disabled="!selectedModel">
            <template #icon><reload-outlined /></template>
            加载模型
          </a-button>
        </a-form-item>
      </a-form>
      
      <a-divider />
      
      <!-- 模型详情 -->
      <div v-if="modelDetails" class="model-details">
        <a-descriptions title="模型信息" bordered :column="3">
          <a-descriptions-item label="模型名称">{{ modelDetails.name }}</a-descriptions-item>
          <a-descriptions-item label="模型类型">{{ modelDetails.type }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ modelDetails.createTime }}</a-descriptions-item>
          <a-descriptions-item label="训练数据集">{{ modelDetails.dataset }}</a-descriptions-item>
          <a-descriptions-item label="训练轮数">{{ modelDetails.epochs }}</a-descriptions-item>
          <a-descriptions-item label="水印强度">{{ modelDetails.watermarkStrength }}</a-descriptions-item>
        </a-descriptions>
      </div>
      
      <!-- 评估选项卡 -->
      <a-tabs v-model:activeKey="activeTabKey" class="evaluation-tabs" v-if="modelDetails">
        <!-- 视频帧对比 -->
        <a-tab-pane key="frameComparison" tab="视频帧对比">
          <div class="frame-comparison">
            <a-row :gutter="24">
              <a-col :span="24" class="upload-section">
                <a-upload-dragger
                  name="video"
                  :multiple="false"
                  :before-upload="beforeVideoUpload"
                  :customRequest="uploadVideo"
                  :showUploadList="false"
                >
                  <p class="ant-upload-drag-icon">
                    <video-camera-outlined />
                  </p>
                  <p class="ant-upload-text">点击或拖拽视频文件到此区域</p>
                  <p class="ant-upload-hint">
                    支持上传MP4、AVI等常见视频格式，大小不超过50MB
                  </p>
                </a-upload-dragger>
              </a-col>
            </a-row>
            
            <a-row :gutter="24" v-if="videoProcessed" class="comparison-result">
              <a-col :span="24">
                <a-card title="水印嵌入效果对比" size="small">
                  <a-row :gutter="16">
                    <a-col :span="12">
                      <div class="frame-container">
                        <h4>原始视频帧</h4>
                        <div class="frame-image">
                          <img :src="originalFrame" alt="原始视频帧" />
                          <div class="zoom-controls">
                            <a-button type="primary" size="small" @click="toggleZoom('original')">
                              <template #icon>
                                <zoom-in-outlined v-if="!originalZoomed" />
                                <zoom-out-outlined v-else />
                              </template>
                              {{ originalZoomed ? '缩小' : '放大' }}
                            </a-button>
                          </div>
                        </div>
                      </div>
                    </a-col>
                    <a-col :span="12">
                      <div class="frame-container">
                        <h4>水印嵌入后视频帧</h4>
                        <div class="frame-image">
                          <img :src="watermarkedFrame" alt="水印嵌入后视频帧" />
                          <div class="zoom-controls">
                            <a-button type="primary" size="small" @click="toggleZoom('watermarked')">
                              <template #icon>
                                <zoom-in-outlined v-if="!watermarkedZoomed" />
                                <zoom-out-outlined v-else />
                              </template>
                              {{ watermarkedZoomed ? '缩小' : '放大' }}
                            </a-button>
                          </div>
                        </div>
                      </div>
                    </a-col>
                  </a-row>
                  
                  <a-row :gutter="16" style="margin-top: 16px">
                    <a-col :span="24">
                      <a-slider v-model:value="currentFrame" :min="1" :max="totalFrames" @change="changeFrame" />
                      <div class="frame-controls">
                        <span>第 {{ currentFrame }} 帧 / 共 {{ totalFrames }} 帧</span>
                        <div>
                          <a-button-group>
                            <a-button @click="prevFrame" :disabled="currentFrame <= 1">
                              <template #icon><left-outlined /></template>
                              上一帧
                            </a-button>
                            <a-button @click="nextFrame" :disabled="currentFrame >= totalFrames">
                              下一帧
                              <template #icon><right-outlined /></template>
                            </a-button>
                          </a-button-group>
                        </div>
                      </div>
                    </a-col>
                  </a-row>
                  
                  <a-row :gutter="16" style="margin-top: 16px">
                    <a-col :span="24">
                      <a-card title="水印嵌入分析" size="small">
                        <a-row :gutter="16">
                          <a-col :span="8">
                            <a-statistic title="PSNR" :value="framePSNR" :precision="2" suffix="dB" />
                          </a-col>
                          <a-col :span="8">
                            <a-statistic title="SSIM" :value="frameSSIM" :precision="4" />
                          </a-col>
                          <a-col :span="8">
                            <a-statistic title="视觉差异" :value="visualDifference" :precision="2" suffix="%" />
                          </a-col>
                        </a-row>
                        
                        <a-divider />
                        
                        <p>
                          <strong>分析结果：</strong> 
                          该模型在视频帧中嵌入水印的视觉质量{{ qualityLevel }}。
                          PSNR值{{ psnrAnalysis }}，SSIM值{{ ssimAnalysis }}，
                          表明水印嵌入对原始视频的视觉影响{{ impactLevel }}。
                        </p>
                      </a-card>
                    </a-col>
                  </a-row>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>
        
        <!-- 鲁棒性测试 -->
        <a-tab-pane key="robustnessTest" tab="鲁棒性测试">
          <div class="robustness-test">
            <a-row :gutter="24">
              <a-col :span="24" class="upload-section">
                <a-upload-dragger
                  name="testset"
                  :multiple="false"
                  :before-upload="beforeTestsetUpload"
                  :customRequest="uploadTestset"
                  :showUploadList="false"
                >
                  <p class="ant-upload-drag-icon">
                    <folder-outlined />
                  </p>
                  <p class="ant-upload-text">点击或拖拽测试集文件到此区域</p>
                  <p class="ant-upload-hint">
                    支持上传ZIP格式的测试数据集，包含各种攻击场景下的视频样本
                  </p>
                </a-upload-dragger>
              </a-col>
            </a-row>
            
            <a-row :gutter="24" v-if="testsetUploaded" style="margin-top: 16px">
              <a-col :span="24">
                <a-card title="测试集信息" size="small">
                  <a-descriptions bordered :column="2">
                    <a-descriptions-item label="测试集名称">{{ testsetInfo.name }}</a-descriptions-item>
                    <a-descriptions-item label="样本数量">{{ testsetInfo.sampleCount }}</a-descriptions-item>
                    <a-descriptions-item label="攻击类型数">{{ testsetInfo.attackTypes.length }}</a-descriptions-item>
                    <a-descriptions-item label="文件大小">{{ formatFileSize(testsetInfo.size) }}</a-descriptions-item>
                  </a-descriptions>
                  
                  <a-divider />
                  
                  <a-button type="primary" @click="startRobustnessTest" :loading="testingLoading" block>
                    <template #icon><experiment-outlined /></template>
                    开始鲁棒性测试
                  </a-button>
                </a-card>
              </a-col>
            </a-row>
            
            <a-row :gutter="24" v-if="testResults" style="margin-top: 16px">
              <a-col :span="24">
                <a-card title="测试结果" size="small">
                  <a-row :gutter="16">
                    <a-col :span="8">
                      <a-statistic title="平均解码准确率" :value="testResults.averageAccuracy" :precision="2" suffix="%" />
                    </a-col>
                    <a-col :span="8">
                      <a-statistic title="最高准确率" :value="testResults.maxAccuracy" :precision="2" suffix="%" />
                    </a-col>
                    <a-col :span="8">
                      <a-statistic title="最低准确率" :value="testResults.minAccuracy" :precision="2" suffix="%" />
                    </a-col>
                  </a-row>
                  
                  <a-divider />
                  
                  <h4>各攻击类型准确率</h4>
                  <a-table
                    :columns="attackColumns"
                    :data-source="testResults.attackResults"
                    :pagination="false"
                    size="small"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'accuracy'">
                        <a-progress :percent="record.accuracy" :status="getAccuracyStatus(record.accuracy)" size="small" />
                      </template>
                    </template>
                  </a-table>
                  
                  <a-divider />
                  
                  <h4>鲁棒性评估结果</h4>
                  <p>
                    该模型在面对{{ testResults.attackResults.length }}种不同攻击类型时，
                    平均解码准确率为{{ testResults.averageAccuracy.toFixed(2) }}%，
                    表明模型具有{{ getRobustnessLevel(testResults.averageAccuracy) }}的鲁棒性。
                    {{ getRobustnessAnalysis(testResults) }}
                  </p>
                  
                  <a-divider />
                  
                  <a-button type="primary" @click="downloadTestReport">
                    <template #icon><download-outlined /></template>
                    下载测试报告
                  </a-button>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { 
  ReloadOutlined, 
  VideoCameraOutlined, 
  ZoomInOutlined,
  ZoomOutOutlined,
  LeftOutlined,
  RightOutlined,
  FolderOutlined,
  ExperimentOutlined,
  DownloadOutlined
} from '@ant-design/icons-vue';
import { useSystemStore } from '@/store/system';

// 系统存储
const systemStore = useSystemStore();

// 加载状态
const loading = ref(false);
const testingLoading = ref(false);

// 当前选择的模型
const selectedModel = ref(null);
// 模型详情
const modelDetails = ref(null);
// 当前活动标签页
const activeTabKey = ref('frameComparison');

// 可用模型列表
const availableModels = ref([
  { id: 1, name: 'WatermarkModel_v1', type: 'CNN' },
  { id: 2, name: 'WatermarkModel_v2', type: 'Transformer' },
  { id: 3, name: 'WatermarkModel_v3', type: 'Hybrid' },
]);

// 视频帧对比相关状态
const videoProcessed = ref(false);
const originalFrame = ref('');
const watermarkedFrame = ref('');
const originalZoomed = ref(false);
const watermarkedZoomed = ref(false);
const currentFrame = ref(1);
const totalFrames = ref(100);
const framePSNR = ref(35.8);
const frameSSIM = ref(0.9842);
const visualDifference = ref(1.58);

// 鲁棒性测试相关状态
const testsetUploaded = ref(false);
const testsetInfo = ref(null);
const testResults = ref(null);

// 攻击类型列
const attackColumns = [
  {
    title: '攻击类型',
    dataIndex: 'attackType',
    key: 'attackType',
  },
  {
    title: '样本数量',
    dataIndex: 'sampleCount',
    key: 'sampleCount',
  },
  {
    title: '解码准确率',
    dataIndex: 'accuracy',
    key: 'accuracy',
  },
];

// 计算属性：质量评估
const qualityLevel = computed(() => {
  if (framePSNR.value > 40) return '非常好';
  if (framePSNR.value > 35) return '良好';
  if (framePSNR.value > 30) return '一般';
  return '较差';
});

const psnrAnalysis = computed(() => {
  if (framePSNR.value > 40) return '非常高';
  if (framePSNR.value > 35) return '较高';
  if (framePSNR.value > 30) return '中等';
  return '较低';
});

const ssimAnalysis = computed(() => {
  if (frameSSIM.value > 0.98) return '非常高';
  if (frameSSIM.value > 0.95) return '较高';
  if (frameSSIM.value > 0.90) return '中等';
  return '较低';
});

const impactLevel = computed(() => {
  if (visualDifference.value < 1) return '几乎不可察觉';
  if (visualDifference.value < 2) return '轻微';
  if (visualDifference.value < 5) return '中等';
  return '明显';
});

// 处理模型选择变化
const handleModelChange = (value) => {
  console.log('选择模型:', value);
  modelDetails.value = null;
  videoProcessed.value = false;
  testsetUploaded.value = false;
  testResults.value = null;
};

// 加载模型详情
const loadModelDetails = () => {
  if (!selectedModel.value) {
    message.warning('请先选择一个模型');
    return;
  }
  
  loading.value = true;
  
  // 模拟加载模型详情
  setTimeout(() => {
    const model = availableModels.value.find(m => m.id === selectedModel.value);
    
    modelDetails.value = {
      name: model.name,
      type: model.type,
      createTime: '2023-06-15 14:30:00',
      dataset: 'VideoDataset_2023',
      epochs: 50,
      watermarkStrength: 7,
    };
    
    loading.value = false;
    message.success('模型加载成功');
  }, 1000);
};

// 视频上传前检查
const beforeVideoUpload = (file) => {
  const isVideo = file.type.startsWith('video/');
  if (!isVideo) {
    message.error('只能上传视频文件!');
  }
  
  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    message.error('视频大小不能超过50MB!');
  }
  
  return isVideo && isLt50M;
};

// 上传视频
const uploadVideo = ({ file, onSuccess }) => {
  message.loading('正在处理视频...', 0);
  
  // 模拟视频处理
  setTimeout(() => {
    message.destroy();
    
    // 设置模拟数据
    originalFrame.value = 'https://via.placeholder.com/640x360.png?text=Original+Frame';
    watermarkedFrame.value = 'https://via.placeholder.com/640x360.png?text=Watermarked+Frame';
    currentFrame.value = 1;
    totalFrames.value = 100;
    
    // 随机生成PSNR和SSIM值
    framePSNR.value = (Math.random() * 10 + 30).toFixed(2);
    frameSSIM.value = (Math.random() * 0.1 + 0.9).toFixed(4);
    visualDifference.value = (Math.random() * 5).toFixed(2);
    
    videoProcessed.value = true;
    onSuccess();
    
    message.success(`视频 ${file.name} 处理成功`);
  }, 2000);
};

// 切换放大状态
const toggleZoom = (type) => {
  if (type === 'original') {
    originalZoomed.value = !originalZoomed.value;
  } else {
    watermarkedZoomed.value = !watermarkedZoomed.value;
  }
};

// 切换到上一帧
const prevFrame = () => {
  if (currentFrame.value > 1) {
    currentFrame.value--;
    changeFrame(currentFrame.value);
  }
};

// 切换到下一帧
const nextFrame = () => {
  if (currentFrame.value < totalFrames.value) {
    currentFrame.value++;
    changeFrame(currentFrame.value);
  }
};

// 改变当前帧
const changeFrame = (frameNumber) => {
  // 模拟帧变化
  originalFrame.value = `https://via.placeholder.com/640x360.png?text=Original+Frame+${frameNumber}`;
  watermarkedFrame.value = `https://via.placeholder.com/640x360.png?text=Watermarked+Frame+${frameNumber}`;
  
  // 随机生成新的PSNR和SSIM值
  framePSNR.value = (Math.random() * 10 + 30).toFixed(2);
  frameSSIM.value = (Math.random() * 0.1 + 0.9).toFixed(4);
  visualDifference.value = (Math.random() * 5).toFixed(2);
};

// 测试集上传前检查
const beforeTestsetUpload = (file) => {
  const isZip = file.type === 'application/zip' || 
                file.type === 'application/x-zip-compressed' || 
                file.name.endsWith('.zip');
  
  if (!isZip) {
    message.error('只能上传ZIP格式的测试集文件!');
  }
  
  const isLt200M = file.size / 1024 / 1024 < 200;
  if (!isLt200M) {
    message.error('测试集大小不能超过200MB!');
  }
  
  return isZip && isLt200M;
};

// 上传测试集
const uploadTestset = ({ file, onSuccess }) => {
  message.loading('正在处理测试集...', 0);
  
  // 模拟测试集处理
  setTimeout(() => {
    message.destroy();
    
    // 设置模拟数据
    testsetInfo.value = {
      name: file.name,
      size: file.size,
      sampleCount: 120,
      attackTypes: ['旋转', '裁剪', '缩放', '压缩', '噪声', '滤镜', '截屏']
    };
    
    testsetUploaded.value = true;
    onSuccess();
    
    message.success(`测试集 ${file.name} 上传成功`);
  }, 1500);
};

// 开始鲁棒性测试
const startRobustnessTest = () => {
  if (!testsetUploaded.value) {
    message.warning('请先上传测试集');
    return;
  }
  
  testingLoading.value = true;
  message.loading('正在进行鲁棒性测试...', 0);
  
  // 模拟测试过程
  setTimeout(() => {
    message.destroy();
    testingLoading.value = false;
    
    // 生成模拟测试结果
    const attackResults = [
      { key: 1, attackType: '旋转', sampleCount: 15, accuracy: 92.5 },
      { key: 2, attackType: '裁剪', sampleCount: 18, accuracy: 85.3 },
      { key: 3, attackType: '缩放', sampleCount: 20, accuracy: 94.7 },
      { key: 4, attackType: '压缩', sampleCount: 22, accuracy: 78.2 },
      { key: 5, attackType: '噪声', sampleCount: 15, accuracy: 72.6 },
      { key: 6, attackType: '滤镜', sampleCount: 15, accuracy: 88.9 },
      { key: 7, attackType: '截屏', sampleCount: 15, accuracy: 65.4 },
    ];
    
    // 计算平均、最高、最低准确率
    const accuracies = attackResults.map(item => item.accuracy);
    const averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const maxAccuracy = Math.max(...accuracies);
    const minAccuracy = Math.min(...accuracies);
    
    testResults.value = {
      averageAccuracy,
      maxAccuracy,
      minAccuracy,
      attackResults,
    };
    
    message.success('鲁棒性测试完成');
  }, 3000);
};

// 获取准确率状态
const getAccuracyStatus = (accuracy) => {
  if (accuracy >= 90) return 'success';
  if (accuracy >= 70) return 'normal';
  return 'exception';
};

// 获取鲁棒性级别
const getRobustnessLevel = (accuracy) => {
  if (accuracy >= 90) return '极高';
  if (accuracy >= 80) return '较高';
  if (accuracy >= 70) return '中等';
  return '较低';
};

// 获取鲁棒性分析
const getRobustnessAnalysis = (results) => {
  // 找出最弱的攻击类型
  const weakestAttack = [...results.attackResults].sort((a, b) => a.accuracy - b.accuracy)[0];
  
  // 找出最强的攻击类型
  const strongestAttack = [...results.attackResults].sort((a, b) => b.accuracy - a.accuracy)[0];
  
  return `模型对${strongestAttack.attackType}攻击表现最好，准确率达到${strongestAttack.accuracy.toFixed(2)}%；
          对${weakestAttack.attackType}攻击最为敏感，准确率仅为${weakestAttack.accuracy.toFixed(2)}%。
          建议在后续版本中重点提高模型对${weakestAttack.attackType}类型攻击的抵抗能力。`;
};

// 下载测试报告
const downloadTestReport = () => {
  message.success('测试报告下载中...');
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style lang="less" scoped>
.model-select-form {
  margin-bottom: 16px;
}

.model-details {
  margin-bottom: 24px;
}

.evaluation-tabs {
  margin-top: 24px;
}

.upload-section {
  margin-bottom: 24px;
}

.comparison-result {
  margin-top: 24px;
}

.frame-container {
  text-align: center;
  
  h4 {
    margin-bottom: 12px;
  }
}

.frame-image {
  position: relative;
  border: 1px solid #f0f0f0;
  padding: 8px;
  border-radius: 4px;
  
  img {
    max-width: 100%;
    height: auto;
  }
}

.zoom-controls {
  position: absolute;
  top: 16px;
  right: 16px;
}

.frame-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
</style> 