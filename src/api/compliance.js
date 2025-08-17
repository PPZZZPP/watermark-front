import request from '@/utils/request';

// 合规模块 API 封装

// 查询合规审计记录（支持 projectId/userId/operation 过滤 与分页）
export function getComplianceRecords(params) {
  return request({
    url: '/api/compliance/records',
    method: 'get',
    params
  });
}

// 导出鉴定报告（返回 blob，由前端触发保存）
export function exportComplianceReport(recordId) {
  return request({
    url: `/api/compliance/report/${recordId}/export`,
    method: 'get',
    responseType: 'blob'
  });
}


