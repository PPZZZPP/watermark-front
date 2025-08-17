import { http, HttpResponse } from 'msw';

// 简易模型库：仅用于“系统模型-已发布/启用模型”供前端下拉框使用
// 真实项目中应与系统模型管理页面打通，这里先提供最小可用字段
const systemModels = [
  { id: 1, code: 'wm-base', name: '基础模型', version: '1.0.0', status: 'active' },
  { id: 2, code: 'wm-pro', name: '专业模型', version: '1.2.0', status: 'active' },
  { id: 3, code: 'wm-auto', name: '自动匹配', version: '1.1.0', status: 'inactive' },
];

export const systemModelHandlers = [
  // 系统模型列表（分页+过滤）
  http.get('/system/model/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const keyword = url.searchParams.get('keyword') || '';
    let status = url.searchParams.get('status') || '';

    let filtered = systemModels.filter(m => (!keyword || m.name.includes(keyword) || m.code.includes(keyword)));
    // 支持 status=published 语义（非 draft）
    if (status === 'published') {
      filtered = filtered.filter(m => m.status !== 'draft');
      status = '';
    }
    if (status) {
      filtered = filtered.filter(m => m.status === status);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const list = filtered.slice(start, end);

    return HttpResponse.json({
      code: 200,
      message: '获取系统模型列表成功',
      data: { list, page, pageSize, total }
    });
  })
];

export default systemModelHandlers;


