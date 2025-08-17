import request from '@/utils/request';

// 获取项目列表
export function getProjects(params) {
  return request({
    url: '/api/project/list',
    method: 'get',
    params
  });
}

// 获取项目详情
export function getProjectDetail(id) {
  return request({
    url: `/api/project/${id}`,
    method: 'get'
  });
}

// 创建项目
export function createProject(data) {
  return request({
    url: '/api/project/create',
    method: 'post',
    data
  });
}

// 更新项目
export function updateProject(id, data) {
  return request({
    url: `/api/project/${id}`,
    method: 'put',
    data
  });
}

// 删除项目
export function deleteProject(id) {
  return request({
    url: `/api/project/${id}`,
    method: 'delete'
  });
}

// 批量删除项目
export function batchDeleteProjects(ids) {
  return request({
    url: '/api/project/batch-delete',
    method: 'post',
    data: { ids }
  });
}

// 导出项目
export function exportProjects(ids) {
  return request({
    url: '/api/project/export',
    method: 'post',
    data: { ids },
    responseType: 'blob'
  });
}

// 获取项目处理进度
export function getProjectProgress(id) {
  return request({
    url: `/api/project/${id}/progress`,
    method: 'get'
  });
}

// 下载项目文件
export function downloadProjectFile(id, fileId) {
  return request({
    url: `/api/project/${id}/file/${fileId}`,
    method: 'get',
    responseType: 'blob'
  });
} 

// 上传待检验视频
export function uploadToExtract(id, data) {
  return request({
    url: `/api/project/${id}/to-extract`,
    method: 'post',
    data
  });
}

// 删除待检验视频
export function deleteToExtract(id, vid) {
  return request({
    url: `/api/project/${id}/to-extract/${vid}`,
    method: 'delete'
  });
}