<template>
  <div class="model-publish-container">
    <a-card title="模型发布" :bordered="false">
      <a-row :gutter="24">
        <a-col :span="24">
          <a-alert
            message="模型发布管理"
            description="在这里您可以将训练好的水印模型上传至系统模型库，供用户选择使用。发布前请确保模型已经过充分测试。"
            type="info"
            show-icon
            style="margin-bottom: 24px"
          />
        </a-col>
      </a-row>
      
      <!-- 模型选择与上传 -->
      <a-row :gutter="24">
        <a-col :span="12">
          <a-card title="选择训练好的模型" size="small" :bordered="false" class="inner-card">
            <a-form layout="vertical">
              <a-form-item label="模型来源">
                <a-radio-group v-model:value="modelSource" button-style="solid">
                  <a-radio-button value="trained">已训练模型</a-radio-button>
                  <a-radio-button value="external">外部模型</a-radio-button>
                </a-radio-group>
              </a-form-item>
              
              <template v-if="modelSource === 'trained'">
                <a-form-item label="选择模型">
                  <a-select
                    v-model:value="selectedTrainedModel"
                    style="width: 100%"
                    placeholder="请选择训练好的模型"
                    @change="handleTrainedModelChange"
                  >
                    <a-select-option v-for="model in trainedModels" :key="model.id" :value="model.id">
                      {{ model.name }} ({{ model.type }}, {{ model.status }})
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </template>
              
              <template v-else>
                <a-form-item label="上传模型文件">
                  <a-upload-dragger
                    name="model"
                    :multiple="false"
                    :before-upload="beforeModelUpload"
                    :customRequest="uploadModel"
                    :file-list="modelFileList"
                    @change="handleModelChange"
                  >
                    <p class="ant-upload-drag-icon">
                      <cloud-upload-outlined />
                    </p>
                    <p class="ant-upload-text">点击或拖拽模型文件到此区域上传</p>
                    <p class="ant-upload-hint">
                      支持上传ZIP或H5格式的模型文件，大小不超过500MB
                    </p>
                  </a-upload-dragger>
                </a-form-item>
              </template>
            </a-form>
          </a-card>
        </a-col>
        
        <a-col :span="12">
          <a-card title="模型发布信息" size="small" :bordered="false" class="inner-card">
            <a-form :model="publishForm" layout="vertical">
              <a-form-item label="模型名称" name="name" :rules="[{ required: true, message: '请输入模型名称' }]">
                <a-input v-model:value="publishForm.name" placeholder="请输入模型名称" />
              </a-form-item>
              
              <a-form-item label="模型版本" name="version" :rules="[{ required: true, message: '请输入模型版本' }]">
                <a-input v-model:value="publishForm.version" placeholder="请输入模型版本，如1.0.0" />
              </a-form-item>
              
              <a-form-item label="模型描述" name="description">
                <a-textarea v-model:value="publishForm.description" placeholder="请输入模型描述" :rows="4" />
              </a-form-item>
              
              <a-form-item label="适用场景" name="scenarios">
                <a-select
                  v-model:value="publishForm.scenarios"
                  mode="multiple"
                  placeholder="请选择适用场景"
                  style="width: 100%"
                >
                  <a-select-option value="movie">电影</a-select-option>
                  <a-select-option value="tv">电视节目</a-select-option>
                  <a-select-option value="live">直播</a-select-option>
                  <a-select-option value="game">游戏</a-select-option>
                  <a-select-option value="education">教育视频</a-select-option>
                </a-select>
              </a-form-item>
              
              <a-form-item label="是否默认模型">
                <a-switch v-model:checked="publishForm.isDefault" />
              </a-form-item>
              
              <a-form-item>
                <a-button type="primary" @click="publishModel" :loading="publishLoading" :disabled="!canPublish">
                  <template #icon><cloud-upload-outlined /></template>
                  发布模型
                </a-button>
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>
      </a-row>
      
      <!-- 已发布模型列表 -->
      <a-card title="已发布模型" size="small" :bordered="false" class="inner-card">
        <a-table
          :columns="publishedColumns"
          :data-source="publishedModels"
          :pagination="{ pageSize: 5 }"
          size="small"
          :loading="loadingPublished"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
            </template>
            
            <template v-if="column.key === 'isDefault'">
              <a-tag color="green" v-if="record.isDefault">默认</a-tag>
              <span v-else>-</span>
            </template>
            
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="viewModelDetail(record)">
                  查看详情
                </a-button>
                <a-button 
                  type="link" 
                  size="small" 
                  @click="setDefaultModel(record)"
                  v-if="!record.isDefault && record.status === 'active'"
                >
                  设为默认
                </a-button>
                <a-button 
                  type="link" 
                  size="small" 
                  @click="toggleModelStatus(record)"
                >
                  {{ record.status === 'active' ? '停用' : '启用' }}
                </a-button>
                <a-popconfirm
                  title="确定要删除此模型吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="deleteModel(record)"
                >
                  <a-button type="link" danger size="small">
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  CloudUploadOutlined
} from '@ant-design/icons-vue';
import { useSystemStore } from '@/store/system';

// 系统存储
const systemStore = useSystemStore();

// 模型来源
const modelSource = ref('trained');
// 选中的已训练模型
const selectedTrainedModel = ref(null);
// 模型文件列表
const modelFileList = ref([]);
// 发布加载状态
const publishLoading = ref(false);

// 已训练模型列表
const trainedModels = ref([
  { id: 1, name: 'WatermarkModel_v1', type: 'CNN', status: '已完成' },
  { id: 2, name: 'WatermarkModel_v2', type: 'Transformer', status: '已完成' },
  { id: 3, name: 'WatermarkModel_v3', type: 'Hybrid', status: '已完成' },
]);

// 发布表单
const publishForm = reactive({
  name: '',
  version: '',
  description: '',
  scenarios: [],
  isDefault: false,
});

// 已发布模型列
const publishedColumns = [
  {
    title: '模型名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
  },
  {
    title: '发布时间',
    dataIndex: 'publishTime',
    key: 'publishTime',
  },
  {
    title: '适用场景',
    dataIndex: 'scenarios',
    key: 'scenarios',
    customRender: ({ text }) => {
      if (!text || text.length === 0) return '-';
      return text.join(', ');
    }
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '默认模型',
    dataIndex: 'isDefault',
    key: 'isDefault',
  },
  {
    title: '操作',
    key: 'action',
    width: 280,
  },
];

// 已发布模型列表（接口获取）
const publishedModels = ref([]);
const loadingPublished = ref(false);

const loadPublishedModels = async () => {
  loadingPublished.value = true;
  try {
    const res = await systemStore.getModelListAction({ page: 1, pageSize: 100, status: 'published' });
    publishedModels.value = res?.data?.list || systemStore.modelList || [];
  } catch (e) {
    try {
      const resp = await fetch('/system/model/list?_t=' + Date.now() + '&page=1&pageSize=100&status=published');
      const json = await resp.json();
      if (json && json.code === 200) {
        publishedModels.value = json.data?.list || [];
      }
    } catch {}
  } finally {
    loadingPublished.value = false;
  }
};

// 计算是否可以发布
const canPublish = computed(() => {
  if (modelSource.value === 'trained') {
    return !!selectedTrainedModel.value && !!publishForm.name && !!publishForm.version;
  } else {
    return modelFileList.value.length > 0 && !!publishForm.name && !!publishForm.version;
  }
});

// 处理已训练模型选择变化
const handleTrainedModelChange = (value) => {
  const model = trainedModels.value.find(m => m.id === value);
  if (model) {
    publishForm.name = model.name;
    publishForm.version = '1.0.0';
  }
};

// 模型上传前检查
const beforeModelUpload = (file) => {
  const isZipOrH5 = file.type === 'application/zip' || 
                   file.type === 'application/x-zip-compressed' || 
                   file.name.endsWith('.zip') ||
                   file.name.endsWith('.h5');
  
  if (!isZipOrH5) {
    message.error('只能上传ZIP或H5格式的模型文件!');
  }
  
  const isLt500M = file.size / 1024 / 1024 < 500;
  if (!isLt500M) {
    message.error('模型文件大小不能超过500MB!');
  }
  
  return isZipOrH5 && isLt500M;
};

// 上传模型
const uploadModel = ({ file, onSuccess, onError, onProgress }) => {
  // 模拟上传进度
  const timer = setInterval(() => {
    const percent = parseInt(Math.random() * 10 + 90);
    onProgress({ percent });
  }, 200);
  
  // 模拟上传完成
  setTimeout(() => {
    clearInterval(timer);
    onSuccess();
    message.success(`${file.name} 上传成功`);
  }, 2000);
};

// 处理模型文件上传变化
const handleModelChange = (info) => {
  modelFileList.value = [...info.fileList].slice(-1); // 只保留最后一个文件
};

// 发布模型
const publishModel = () => {
  if (!canPublish.value) {
    message.warning('请填写完整的模型信息');
    return;
  }
  
  publishLoading.value = true;
  
  // 模拟发布过程
  setTimeout(() => {
    const newModel = {
      id: Date.now(),
      name: publishForm.name,
      version: publishForm.version,
      publishTime: new Date().toLocaleString(),
      scenarios: publishForm.scenarios.map(s => {
        switch (s) {
          case 'movie': return '电影';
          case 'tv': return '电视节目';
          case 'live': return '直播';
          case 'game': return '游戏';
          case 'education': return '教育视频';
          default: return s;
        }
      }),
      status: 'active',
      isDefault: publishForm.isDefault,
    };
    
    // 如果设置为默认，需要将其他模型设置为非默认
    if (publishForm.isDefault) {
      publishedModels.value.forEach(model => {
        model.isDefault = false;
      });
    }
    
    publishedModels.value.unshift(newModel);
    
    // 重置表单
    publishForm.name = '';
    publishForm.version = '';
    publishForm.description = '';
    publishForm.scenarios = [];
    publishForm.isDefault = false;
    selectedTrainedModel.value = null;
    modelFileList.value = [];
    
    publishLoading.value = false;
    message.success('模型发布成功');
  }, 2000);
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

// 设置为默认模型
const setDefaultModel = (record) => {
  publishedModels.value.forEach(model => {
    model.isDefault = model.id === record.id;
  });
  
  message.success(`已将 ${record.name} 设置为默认模型`);
};

// 切换模型状态
const toggleModelStatus = (record) => {
  record.status = record.status === 'active' ? 'inactive' : 'active';
  
  // 如果停用了默认模型，需要移除默认标记
  if (record.status === 'inactive' && record.isDefault) {
    record.isDefault = false;
    message.warning('默认模型已被停用，请设置新的默认模型');
  }
  
  message.success(`模型 ${record.name} 已${record.status === 'active' ? '启用' : '停用'}`);
};

// 删除模型
const deleteModel = (record) => {
  publishedModels.value = publishedModels.value.filter(model => model.id !== record.id);
  
  // 如果删除了默认模型，提示用户设置新的默认模型
  if (record.isDefault) {
    message.warning('默认模型已被删除，请设置新的默认模型');
  }
  
  message.success(`已删除模型: ${record.name}`);
};

onMounted(() => {
  loadPublishedModels();
});
</script>

<style lang="less" scoped>
.inner-card {
  margin-bottom: 24px;
}
</style> 