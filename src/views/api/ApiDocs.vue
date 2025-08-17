<template>
  <div class="api-docs-container">
    <PageHeader title="接口模块" subTitle="对外提供标准 REST API，便于第三方集成">
      <template #icon>
        <api-outlined />
      </template>
      <template #tags>
        <a-tag color="blue">开发者</a-tag>
        <a-tag color="purple">API 文档</a-tag>
      </template>
    </PageHeader>

    <div class="api-section">
      <a-typography-title :level="4">鉴权</a-typography-title>
      <a-typography-paragraph>建议使用 JWT 鉴权，所有接口需携带 Authorization: Bearer &lt;token&gt;。</a-typography-paragraph>

      <a-typography-title :level="4">接口清单</a-typography-title>
      <a-collapse>
        <a-collapse-panel key="1" header="POST /api/watermark/embed - 生成嵌入视频">
          <pre class="code">请求体: {
  projectId: string|number, // 必填，项目ID
  model: string,            // 必填，模型编码
  watermarkText?: string    // 可选，嵌入文本
}
响应: {
  code: 200,
  message: string,
  data: {
    id: string,
    filename: string,
    url: string,
    coverUrl: string,
    model: string,
    watermarkText: string
  }
}
错误码: 400 参数错误; 404 项目/视频不存在; 500 服务器错误</pre>
        </a-collapse-panel>
        <a-collapse-panel key="2" header="POST /api/watermark/extract - 执行水印提取">
          <pre class="code">请求体: {
  projectId: string|number, // 必填，项目ID
  videoId: string|number    // 必填，待提取视频ID
}
响应: {
  code: 200,
  message: string,
  data: {
    id: number,
    watermarkInfo: string,
    model: string
  }
}
错误码: 400 参数错误; 404 视频不存在; 500 服务器错误</pre>
        </a-collapse-panel>
        <a-collapse-panel key="3" header="GET /api/compliance/records - 合规审计记录查询">
          <pre class="code">查询参数: {
  page?: number = 1,
  pageSize?: number = 10,
  projectId?: number,
  userId?: number,
  operation?: 'embed'|'extract'|'report'
}
响应: {
  code: 200,
  message: string,
  data: { list: ComplianceRecord[], page, pageSize, total }
}
错误码: 500 服务器错误</pre>
        </a-collapse-panel>
        <a-collapse-panel key="4" header="GET /api/compliance/report/{id}/export - 导出鉴定报告">
          <pre class="code">路径参数: id - 合规记录ID
响应: 文本文件流 (Content-Type: text/plain)
错误码: 404 记录不存在; 500 服务器错误</pre>
        </a-collapse-panel>
      </a-collapse>

      <a-typography-title :level="4" style="margin-top: 16px">错误码说明</a-typography-title>
      <a-table :columns="errColumns" :data-source="errRows" size="small" :pagination="false" row-key="code"/>
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/common/PageHeader.vue';
import { ApiOutlined } from '@ant-design/icons-vue';

const errColumns = [
  { title: '错误码', dataIndex: 'code', key: 'code', width: 120 },
  { title: '含义', dataIndex: 'meaning', key: 'meaning' },
  { title: '处理建议', dataIndex: 'advice', key: 'advice' }
];

const errRows = [
  { code: 200, meaning: '成功', advice: '—' },
  { code: 400, meaning: '参数错误', advice: '检查必填项与参数格式' },
  { code: 401, meaning: '未授权', advice: '携带有效的 Bearer Token' },
  { code: 403, meaning: '无权限', advice: '确认角色/权限是否满足' },
  { code: 404, meaning: '资源不存在', advice: '检查资源ID是否正确' },
  { code: 500, meaning: '服务器错误', advice: '稍后重试或联系管理员' }
];
</script>

<style lang="less" scoped>
.api-docs-container {
  background-color: #f0f2f5;
  min-height: calc(100vh - 184px);
}
.api-section {
  background-color: #fff;
  padding: 24px;
  margin: 16px 0;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
.code {
  background: #fafafa;
  padding: 12px;
  border-radius: 6px;
  white-space: pre-wrap;
}
</style>


