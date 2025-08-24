<template>
  <div class="model-evaluation-container" ref="rootEl">
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
              {{ model.name }}
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
          <a-descriptions-item label="发布人">{{ modelDetails.publisher || '-' }}</a-descriptions-item>
          <a-descriptions-item label="发布时间">{{ modelDetails.publishedAt || '-' }}</a-descriptions-item>
          <a-descriptions-item label="适用场景">{{ modelDetails.applicableScenarios || '-' }}</a-descriptions-item>
          <a-descriptions-item label="描述" :span="3">{{ modelDetails.description || '-' }}</a-descriptions-item>
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
                    支持上传MP4、AVI等常见视频格式，大小不超过500MB
                  </p>
                </a-upload-dragger>
              </a-col>
            </a-row>
            
            <a-row :gutter="16" v-if="videoProcessed" class="comparison-result">
              <a-col :span="12">
                <div class="video-container">
                  <h4 class="video-title">原始视频</h4>
                  <video
                    ref="originalVideoRef"
                    :src="originalVideoUrl"
                    :controls="false"
                    @loadedmetadata="onLoadedMetadata"
                    @timeupdate="onTimeUpdate"
                    style="width: 100%; max-height: 360px; background: #000"
                  />
                </div>
              </a-col>
              <a-col :span="12">
                <div class="video-container">
                  <h4 class="video-title">处理后视频</h4>
                  <video
                    ref="processedVideoRef"
                    :src="processedVideoUrl"
                    :controls="false"
                    @loadedmetadata="onLoadedMetadata"
                    @timeupdate="onTimeUpdate"
                    style="width: 100%; max-height: 360px; background: #000"
                  />
                </div>
              </a-col>
            </a-row>

            <!-- 统一外部控制条（避免回环抖动） -->
            <a-row v-if="videoProcessed" style="margin-top: 12px" :gutter="12">
              <a-col :span="24">
                <div class="control-bar">
                  <a-space :size="12" wrap>
                    <a-button type="primary" @click="playBoth">播放</a-button>
                    <a-button @click="pauseBoth">暂停</a-button>
                    <a-button @click="rewindBoth">回到开头</a-button>
                    <span class="label">进度</span>
                    <div class="progress-wrap">
                      <a-slider :min="0" :max="Math.max(1, duration)" v-model:value="position" @change="onSeekSlider" :tooltipOpen="true" />
                    </div>
                    <span class="time-text">{{ formatTime(position) }} / {{ formatTime(duration) }}</span>
                    <span class="label">倍速</span>
                    <a-select style="width: 90px" v-model:value="rate" @change="onRateChange">
                      <a-select-option :value="0.5">0.5x</a-select-option>
                      <a-select-option :value="1">1x</a-select-option>
                      <a-select-option :value="1.5">1.5x</a-select-option>
                      <a-select-option :value="2">2x</a-select-option>
                    </a-select>
                  </a-space>
                </div>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>
        
        <!-- 历史评估记录与指标表格（示例占位，可对接后端） -->
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

        <!-- 历史评估记录 -->
        <a-tab-pane key="history" tab="历史评估记录">
          <a-card size="small" :bordered="false">
            <a-table
              :columns="historyColumns"
              :data-source="evaluationHistory"
              :pagination="{ pageSize: 5 }"
              size="small"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
                </template>
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="openFrameCompare(record)">视频帧对比</a-button>
                    <a-button type="link" size="small" @click="publishModelFromEval(record)" :disabled="record.status !== 'evaluated'">发布模型</a-button>
                    <a-popconfirm title="确定删除该评估记录？" ok-text="确定" cancel-text="取消" @confirm="deleteEvaluation(record)">
                      <a-button type="link" danger size="small" :disabled="record.status === 'published'">删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
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
import { getEvaluationHistory, publishEvaluation, deleteEvaluationRecord, getModelList } from '@/api/system';
import { gsap, ScrollTrigger } from '@/plugins/gsap';

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

// 可用模型列表（从后端加载）
const availableModels = ref([]);

// 视频帧对比相关状态
const videoProcessed = ref(false);
const originalVideoUrl = ref('');
const processedVideoUrl = ref('');
const originalVideoRef = ref(null);
const processedVideoRef = ref(null);
const duration = ref(0);
const position = ref(0);
const rate = ref(1);
const isPlaying = ref(false);
let rafId = 0;

// GSAP 动画上下文
const rootEl = ref(null);
let gsapCtx;

// 鲁棒性测试相关状态
const testsetUploaded = ref(false);
const testsetInfo = ref(null);
const testResults = ref(null);
// 历史评估记录
const historyColumns = [
  { title: '模型名称', dataIndex: 'modelName', key: 'modelName' },
  { title: '测试数据集名称', dataIndex: 'testDatasetName', key: 'testDatasetName' },
  { title: '评估状态', dataIndex: 'status', key: 'status' },
  { title: 'PSNR', dataIndex: 'psnr', key: 'psnr' },
  { title: 'SSIM', dataIndex: 'ssim', key: 'ssim' },
  { title: '操作', key: 'action', width: 260 },
];
const evaluationHistory = ref([]);

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

// 加载模型详情（使用已加载列表）
const loadModelDetails = () => {
  if (!selectedModel.value) {
    message.warning('请先选择一个模型');
    return;
  }
  loading.value = true;
  const model = availableModels.value.find(m => m.id === selectedModel.value);
  if (!model) {
    loading.value = false;
    message.error('未找到所选模型');
    return;
  }
  modelDetails.value = {
    name: model.name,
    publisher: model.publisher,
    publishedAt: model.publishedAt,
    applicableScenarios: model.applicableScenarios,
    description: model.description,
  };
  loading.value = false;
  message.success('模型加载成功');
  loadEvaluationHistory();
};

// 从后端加载可用模型（仅使用已发布/激活的）
const loadAvailableModels = async () => {
  try {
    loading.value = true;
    const res = await getModelList({ page: 1, pageSize: 1000, status: 'active' });
    const list = (res && res.data && res.data.list) ? res.data.list : [];
    availableModels.value = list.map(m => ({
      id: m.id,
      name: m.name || m.code,
      publisher: m.publisher,
      publishedAt: m.publishedAt,
      applicableScenarios: m.applicableScenarios,
      description: m.description,
    }));
  } catch (e) {
    message.error('加载模型列表失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAvailableModels();
  nextTick(() => {
    gsapCtx = gsap.context(() => {
      gsap.from('.model-select-form', { y: 12, opacity: 0, duration: 0.5, ease: 'power2.out' });
      gsap.from('.model-details', {
        y: 16,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.model-details', start: 'top 85%' }
      });
      gsap.from('.evaluation-tabs .ant-tabs-tab', {
        y: 8,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.evaluation-tabs', start: 'top 85%' }
      });
      gsap.from('.comparison-result .video-container', {
        y: 18,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.comparison-result', start: 'top 85%' }
      });
      gsap.from('.control-bar', { y: 10, opacity: 0, duration: 0.45, ease: 'power2.out' });
    }, rootEl);
  });
});

onBeforeUnmount(() => { if (gsapCtx) gsapCtx.revert(); });

// 视频上传前检查
const beforeVideoUpload = (file) => {
  const isVideo = file.type.startsWith('video/');
  if (!isVideo) {
    message.error('只能上传视频文件!');
  }
  
  const isLt50M = file.size / 1024 / 1024 < 500;
  if (!isLt50M) {
    message.error('视频大小不能超过500MB!');
  }
  
  return isVideo && isLt50M;
};

// 上传视频
const uploadVideo = ({ file, onSuccess }) => {
  message.loading('正在处理视频...', 0);
  
  // 模拟视频处理
  setTimeout(() => {
    message.destroy();
    // 这里模拟：同一文件作为原视频，同时生成“处理后”视频链接（真实场景应调用后端处理生成 URL）
    const url = URL.createObjectURL(file);
    originalVideoUrl.value = url;
    processedVideoUrl.value = url; // 占位：可替换为后端返回的视频地址
    videoProcessed.value = true;
    onSuccess();
    
    message.success(`视频 ${file.name} 处理成功`);
  }, 2000);
};

// 统一外部控制实现（单处控制，避免回环）
const ensureReady = () => originalVideoRef.value && processedVideoRef.value;
const syncPositionFromPrimary = () => {
  if (!ensureReady()) return;
  const t = originalVideoRef.value.currentTime;
  processedVideoRef.value.currentTime = t;
  position.value = t;
};
const updateDuration = () => {
  if (!ensureReady()) return;
  duration.value = Math.max(originalVideoRef.value.duration || 0, processedVideoRef.value.duration || 0) || 0;
};
const onLoadedMetadata = () => {
  updateDuration();
  position.value = 0;
};

const playBoth = async () => {
  if (!ensureReady()) return;
  syncPositionFromPrimary();
  originalVideoRef.value.playbackRate = rate.value;
  processedVideoRef.value.playbackRate = rate.value;
  await Promise.allSettled([originalVideoRef.value.play(), processedVideoRef.value.play()]);
  isPlaying.value = true;
  startTicker();
};
const pauseBoth = () => {
  if (!ensureReady()) return;
  originalVideoRef.value.pause();
  processedVideoRef.value.pause();
  isPlaying.value = false;
  if (rafId) cancelAnimationFrame(rafId);
};
const rewindBoth = () => {
  if (!ensureReady()) return;
  originalVideoRef.value.currentTime = 0;
  processedVideoRef.value.currentTime = 0;
  position.value = 0;
};
const onSeekSlider = (val) => {
  if (!ensureReady()) return;
  originalVideoRef.value.currentTime = Number(val || 0);
  processedVideoRef.value.currentTime = Number(val || 0);
};
const onRateChange = (val) => {
  if (!ensureReady()) return;
  originalVideoRef.value.playbackRate = Number(val);
  processedVideoRef.value.playbackRate = Number(val);
};
const formatTime = (s) => {
  const pad = (n) => String(Math.floor(n)).padStart(2, '0');
  const ss = Math.floor(s || 0);
  return `${pad(ss / 60)}:${pad(ss % 60)}`;
};

// 播放中实时更新进度条
const onTimeUpdate = () => {
  if (!ensureReady()) return;
  // 取左侧为主的当前时间
  position.value = originalVideoRef.value.currentTime;
};

// 更小间隔的进度同步（requestAnimationFrame）
const startTicker = () => {
  if (!ensureReady()) return;
  if (rafId) cancelAnimationFrame(rafId);
  const tick = () => {
    if (!isPlaying.value) return;
    position.value = originalVideoRef.value.currentTime;
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
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

// 状态与操作
const statusText = (s) => ({ evaluating: '评估中', failed: '评估失败', evaluated: '已评估', published: '已发布' }[s] || s);
const statusColor = (s) => ({ evaluating: 'processing', failed: 'error', evaluated: 'blue', published: 'success' }[s] || 'default');

const loadEvaluationHistory = async () => {
  try {
    const res = await getEvaluationHistory({ modelId: selectedModel.value });
    evaluationHistory.value = res?.data?.list || [];
  } catch {}
};

const openFrameCompare = (record) => {
  message.info('打开视频帧对比弹窗（占位）');
};

const publishModelFromEval = async (record) => {
  await publishEvaluation(record.id, '评估合格，发布模型');
  message.success('模型已发布');
  loadEvaluationHistory();
};

const deleteEvaluation = async (record) => {
  await deleteEvaluationRecord(record.id);
  message.success('已删除评估记录');
  loadEvaluationHistory();
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

/* 新增：统一控制条与进度条样式 */
.control-bar {
  padding: 12px 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.control-bar .label {
  color: #666;
}

.progress-wrap {
  width: 420px;
  max-width: 60vw;
}

.time-text {
  min-width: 100px;
  text-align: right;
  color: #333;
}

.video-title {
  margin-bottom: 8px;
  font-weight: 600;
}

@media (max-width: 992px) {
  .progress-wrap {
    width: 260px;
    max-width: 80vw;
  }
  .time-text {
    min-width: 72px;
  }
}
</style> 