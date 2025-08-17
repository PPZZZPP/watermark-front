<template>
  <div class="compliance-container">
    <PageHeader title="合规审计记录" subTitle="查看项目相关的水印嵌入/提取等操作记录">
      <template #icon>
        <audit-outlined />
      </template>
      <template #tags>
        <a-tag color="blue">合规模块</a-tag>
        <a-tag color="purple">审计记录</a-tag>
      </template>
    </PageHeader>

    <div class="comp-section">
      <a-form layout="inline" :model="query" style="margin-bottom: 12px">
        <a-form-item label="项目ID">
          <a-input v-model:value="query.projectId" placeholder="项目ID" style="width: 160px" />
        </a-form-item>
        <a-form-item label="用户ID">
          <a-input v-model:value="query.userId" placeholder="用户ID" style="width: 160px" />
        </a-form-item>
        <a-form-item label="操作类型">
          <a-select v-model:value="query.operation" allow-clear style="width: 160px" placeholder="全部">
            <a-select-option value="embed">嵌入</a-select-option>
            <a-select-option value="extract">提取</a-select-option>
            <a-select-option value="report">报告</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="loadRecords">查询</a-button>
            <a-button @click="reset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table :columns="columns" :data-source="records" row-key="id" :loading="loading"
               :pagination="{ current: page, pageSize: pageSize, total, onChange: handlePageChange }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="downloadReport(record.id)">导出报告</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { AuditOutlined } from '@ant-design/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { getComplianceRecords, exportComplianceReport } from '@/api/compliance';

const query = reactive({ projectId: '', userId: '', operation: undefined });
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const records = ref([]);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '操作类型', dataIndex: 'operation', key: 'operation', width: 120 },
  { title: '用户ID', dataIndex: 'userId', key: 'userId', width: 100 },
  { title: '项目ID', dataIndex: 'projectId', key: 'projectId', width: 100 },
  { title: '视频ID', dataIndex: 'videoId', key: 'videoId', width: 100 },
  { title: '模型', dataIndex: 'modelCode', key: 'modelCode', width: 140 },
  { title: '报告编号', dataIndex: 'reportNo', key: 'reportNo', width: 220 },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 200 },
  { title: '操作', key: 'action', width: 120 }
];

const handlePageChange = (p, ps) => {
  page.value = p; pageSize.value = ps; loadRecords();
};

const reset = () => {
  query.projectId = ''; query.userId = ''; query.operation = undefined; page.value = 1; loadRecords();
};

const loadRecords = async () => {
  loading.value = true;
  try {
    const res = await getComplianceRecords({
      page: page.value,
      pageSize: pageSize.value,
      projectId: query.projectId || undefined,
      userId: query.userId || undefined,
      operation: query.operation || undefined
    });
    records.value = res?.data?.list || [];
    total.value = res?.data?.total || 0;
  } catch (e) {
    message.error('加载记录失败');
  } finally {
    loading.value = false;
  }
};

const downloadReport = async (id) => {
  try {
    const res = await exportComplianceReport(id);
    const blob = new Blob([res], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    message.error('导出失败');
  }
};

onMounted(loadRecords);
</script>

<style lang="less" scoped>
.compliance-container {
  background-color: #f0f2f5;
  min-height: calc(100vh - 184px);
}
.comp-section {
  background-color: #fff;
  padding: 24px;
  margin: 16px 0;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
</style>


