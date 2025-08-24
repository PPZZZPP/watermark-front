import request from '@/utils/request';

// 用户管理相关API

// 获取用户列表
export function getUserList(params) {
  return request({
    url: '/api/system/users',
    method: 'get',
    params
  });
}

// 创建用户
export function createUser(data) {
  return request({
    url: '/system/user/create',
    method: 'post',
    data
  });
}

// 更新用户
export function updateUser(data) {
  return request({
    url: `/system/user/update/${data.id}`,
    method: 'put',
    data
  });
}

// 删除用户
export function deleteUser(userId) {
  return request({
    url: `/system/user/delete/${userId}`,
    method: 'delete'
  });
}

// 重置用户密码
export function resetUserPassword(data) {
  return request({
    url: `/system/user/reset-password/${data.id}`,
    method: 'put',
    data
  });
}

// 角色管理相关API

// 获取角色列表（分页）
export function getRoleList(params) {
  return request({
    url: '/system/role/list',
    method: 'get',
    params
  });
}

// 获取所有角色（不分页）
export function getAllRoles() {
  return request({
    url: '/system/role/all',
    method: 'get'
  });
}

// 获取角色详情
export function getRoleDetail(roleId) {
  return request({
    url: `/system/role/detail/${roleId}`,
    method: 'get'
  });
}

// 模型管理相关API

// 获取模型列表
export function getModelList(params) {
  return request({
    url: '/system/model/list',
    method: 'get',
    params
  });
}

// 获取模型详情
export function getModelDetail(modelId) {
  return request({
    url: `/system/model/detail/${modelId}`,
    method: 'get'
  });
}

// 发布模型
export function publishModel(data) {
  return request({
    url: '/system/model/publish',
    method: 'post',
    data
  });
}

// 更新模型状态
export function updateModelStatus(data) {
  return request({
    url: `/system/model/status/${data.id}`,
    method: 'put',
    data
  });
}

// 删除模型
export function deleteModel(modelId) {
  return request({
    url: `/system/model/delete/${modelId}`,
    method: 'delete'
  });
}

// 上传训练数据集
export function uploadDataset(data) {
  return request({
    url: '/system/model/upload-dataset',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  });
}

// 开始模型训练
export function startModelTraining(data) {
  return request({
    url: '/system/model/start-training',
    method: 'post',
    data
  });
}

// 停止模型训练
export function stopModelTraining(trainingId) {
  return request({
    url: `/system/model/stop-training/${trainingId}`,
    method: 'put'
  });
}

// 获取训练历史记录
export function getTrainingHistory(params) {
  return request({
    url: '/system/training/history',
    method: 'get',
    params
  });
}

// 上传测试视频
export function uploadTestVideo(data) {
  return request({
    url: '/system/model/upload-test-video',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  });
}

// 上传测试集
export function uploadTestset(data) {
  return request({
    url: '/system/model/upload-testset',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  });
}

// 开始鲁棒性测试
export function startRobustnessTest(data) {
  return request({
    url: '/system/model/start-test',
    method: 'post',
    data
  });
}

// 获取测试报告
export function getTestReport(testId) {
  return request({
    url: `/system/model/test-report/${testId}`,
    method: 'get'
  });
} 

// 新训练接口
export function startTrainingTask(data) {
  return request({
    url: '/system/training/start',
    method: 'post',
    data
  });
}

// 评估接口
export function startEvaluation(data) {
  return request({
    url: '/system/evaluation/start',
    method: 'post',
    data
  });
}

export function publishEvaluation(id, description) {
  return request({
    url: `/system/evaluation/publish/${id}`,
    method: 'post',
    params: { description }
  });
}

export function deleteEvaluationRecord(id) {
  return request({
    url: `/system/evaluation/record/${id}`,
    method: 'delete'
  });
}

export function getEvaluationHistory(params) {
  return request({
    url: '/system/evaluation/history',
    method: 'get',
    params
  });
}