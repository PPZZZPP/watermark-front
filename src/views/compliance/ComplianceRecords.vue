<template>
  <div class="compliance-container" ref="rootEl">
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
        <a-form-item label="项目">
          <a-select v-model:value="query.projectId" allow-clear placeholder="选择项目" style="width: 200px">
            <a-select-option v-for="p in projectOptions" :key="p.id" :value="p.id">{{ p.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="完成状态">
          <a-select v-model:value="query.status" allow-clear placeholder="全部" style="width: 140px">
            <a-select-option value="pending">待处理</a-select-option>
            <a-select-option value="processing">处理中</a-select-option>
            <a-select-option value="completed">已完成</a-select-option>
            <a-select-option value="failed">失败</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="文件名">
          <a-input v-model:value="query.filename" placeholder="屏摄视频文件名" style="width: 220px" allow-clear />
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
          <template v-if="column.key === 'uploadTime'">
            <span>{{ formatDateTime(record.uploadTime) }}</span>
          </template>
          <template v-else-if="column.key === 'compareResult'">
            <a-tag :color="compareColor(record.compareResult)">{{ record.compareResult || '-' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'extractStatus'">
            <a-tag :color="statusColor(record.extractStatus)">{{ statusText(record.extractStatus) }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="generateReport(record.id)">生成报告</a-button>
              <a-button type="link" @click="verifyReport(record.id)">验证报告</a-button>
              <a-button type="link" @click="downloadReport(record.id)">下载报告</a-button>
              <a-popconfirm title="确定删除该记录？" ok-text="确定" cancel-text="取消" @confirm="deleteRecord(record.id)">
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { AuditOutlined } from '@ant-design/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { getComplianceRecords, exportComplianceReport } from '@/api/compliance';
import request from '@/utils/request';
import { gsap, ScrollTrigger } from '@/plugins/gsap';

const query = reactive({ projectId: undefined, status: undefined, filename: '' });
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const records = ref([]);
const projectOptions = ref([]);

const columns = [
  { title: '屏摄视频文件名', dataIndex: 'videoFilename', key: 'videoFilename', ellipsis: true },
  { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 180 },
  { title: '水印文本', dataIndex: 'watermarkText', key: 'watermarkText', ellipsis: true },
  { title: '比对结果', dataIndex: 'compareResult', key: 'compareResult', width: 120 },
  { title: '提取状态', dataIndex: 'extractStatus', key: 'extractStatus', width: 120 },
  { title: '操作', key: 'action', width: 400 }
];

const handlePageChange = (p, ps) => {
  page.value = p; pageSize.value = ps; loadRecords();
};

const reset = () => { query.projectId = undefined; query.status = undefined; query.filename=''; page.value = 1; loadRecords(); };

const loadRecords = async () => {
  loading.value = true;
  try {
    const res = await getComplianceRecords({
      page: page.value,
      pageSize: pageSize.value,
      projectId: query.projectId,
      filename: query.filename,
      status: query.status
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

const generateReport = async (id) => {
  try { await request({ url: `/api/compliance/report/${id}/generate`, method: 'post' }); message.success('报告已生成'); loadRecords(); } catch { message.error('生成失败'); }
};
const verifyReport = async (id) => {
  try { const r = await request({ url: `/api/compliance/report/${id}/verify`, method: 'post' }); message.success(r?.data?.valid ? '报告有效' : '报告无效'); } catch { message.error('验证失败'); }
};
const deleteRecord = async (id) => {
  try { await request({ url: `/api/compliance/record/${id}`, method: 'delete' }); message.success('已删除'); loadRecords(); } catch { message.error('删除失败'); }
};

// GSAP
const rootEl = ref(null);
let gsapCtx;

onMounted(async () => {
  try {
    // 加载项目选项（当前用户有权限的项目）
    const r = await request({ url: '/api/project/list', method: 'get', params: { page: 1, pageSize: 1000 } });
    projectOptions.value = (r?.data?.list || []).map(it => ({ id: it.id, name: it.name }));
  } catch {}
  loadRecords();

  nextTick(() => {
    gsapCtx = gsap.context(() => {
      gsap.from('.comp-section', { y: 14, opacity: 0, duration: 0.5, ease: 'power2.out' });
      gsap.from('.ant-form-item', {
        y: 10,
        opacity: 0,
        duration: 0.45,
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.comp-section', start: 'top 85%' }
      });
      gsap.from('.ant-table-row', {
        y: 10, opacity: 0, duration: 0.45, stagger: 0.03,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.ant-table', start: 'top 85%' }
      });
    }, rootEl);
  });
});

onBeforeUnmount(() => { if (gsapCtx) gsapCtx.revert(); });

// 渲染辅助
const formatDateTime = (v) => v ? new Date(v).toLocaleString() : '-';
const compareColor = (v) => v === 'match' ? 'green' : (v === 'mismatch' ? 'red' : 'default');
const statusColor = (s) => ({ pending: 'default', processing: 'gold', completed: 'green', failed: 'red' }[s] || 'default');
const statusText = (s) => ({ pending: '待处理', processing: '处理中', completed: '已完成', failed: '失败' }[s] || s || '-');
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


