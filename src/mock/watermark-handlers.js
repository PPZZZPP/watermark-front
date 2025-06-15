import { http, HttpResponse } from 'msw';
import { watermarkTemplates, users } from './data';

// 水印模板管理处理程序
export const watermarkHandlers = [
  // 水印模板管理 - 获取模板列表
  http.get('/api/watermark/templates', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const name = url.searchParams.get('name');
    const type = url.searchParams.get('type');
    
    // 在实际应用中，应该从token解析用户ID
    // 这里简化处理，假设已登录用户是ID为1的用户
    let filteredTemplates = watermarkTemplates.filter(template => true);
    
    // 按名称筛选
    if (name) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    
    // 按类型筛选
    if (type) {
      filteredTemplates = filteredTemplates.filter(template => template.type === type);
    }
    
    // 计算分页
    const total = filteredTemplates.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedTemplates = filteredTemplates.slice(start, end);
    
    return HttpResponse.json({
      code: 200,
      message: '获取水印模板列表成功',
      data: {
        list: pagedTemplates,
        page,
        pageSize,
        total
      }
    });
  }),
  
  // 水印模板管理 - 获取模板详情
  http.get('/api/watermark/templates/:id', ({ params }) => {
    const id = parseInt(params.id);
    
    const template = watermarkTemplates.find(t => t.id === id);
    
    if (template) {
      return HttpResponse.json({
        code: 200,
        message: '获取水印模板详情成功',
        data: template
      });
    } else {
      return HttpResponse.json({
        code: 404,
        message: '水印模板不存在',
        data: null
      }, { status: 404 });
    }
  }),
  
  // 水印模板管理 - 创建模板
  http.post('/api/watermark/templates', async ({ request }) => {
    const data = await request.json();
    
    // 验证必填字段
    const { name, type, content, position } = data;
    if (!name || !type || !content || !position) {
      return HttpResponse.json({
        code: 400,
        message: '缺少必要参数',
        data: null
      }, { status: 400 });
    }
    
    // 在实际应用中，应该从token解析用户ID
    // 这里简化处理，假设已登录用户是ID为1的用户
    const newTemplate = {
      id: watermarkTemplates.length > 0 ? Math.max(...watermarkTemplates.map(t => t.id)) + 1 : 1,
      name,
      type,
      content,
      position,
      opacity: data.opacity || 0.7,
      size: data.size || (type === 'image' ? 100 : 24),
      fontFamily: type === 'text' ? (data.fontFamily || 'Arial') : undefined,
      fontColor: type === 'text' ? (data.fontColor || '#ffffff') : undefined,
      createTime: new Date().toISOString(),
      userId: 1,
      isDefault: false
    };
    
    watermarkTemplates.push(newTemplate);
    
    return HttpResponse.json({
      code: 200,
      message: '创建水印模板成功',
      data: newTemplate
    });
  }),
  
  // 水印模板管理 - 更新模板
  http.put('/api/watermark/templates/:id', async ({ request, params }) => {
    const id = parseInt(params.id);
    const data = await request.json();
    
    const templateIndex = watermarkTemplates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '水印模板不存在',
        data: null
      }, { status: 404 });
    }
    
    // 更新模板信息
    watermarkTemplates[templateIndex] = {
      ...watermarkTemplates[templateIndex],
      ...data,
      id // 保持ID不变
    };
    
    return HttpResponse.json({
      code: 200,
      message: '更新水印模板成功',
      data: watermarkTemplates[templateIndex]
    });
  }),
  
  // 水印模板管理 - 删除模板
  http.delete('/api/watermark/templates/:id', ({ params }) => {
    const id = parseInt(params.id);
    
    const templateIndex = watermarkTemplates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '水印模板不存在',
        data: null
      }, { status: 404 });
    }
    
    // 不能删除默认模板
    if (watermarkTemplates[templateIndex].isDefault) {
      return HttpResponse.json({
        code: 403,
        message: '不能删除默认模板',
        data: null
      }, { status: 403 });
    }
    
    watermarkTemplates.splice(templateIndex, 1);
    
    return HttpResponse.json({
      code: 200,
      message: '删除水印模板成功',
      data: null
    });
  }),
  
  // 水印模板管理 - 设置默认模板
  http.put('/api/watermark/templates/:id/default', ({ params }) => {
    const id = parseInt(params.id);
    
    const template = watermarkTemplates.find(t => t.id === id);
    
    if (!template) {
      return HttpResponse.json({
        code: 404,
        message: '水印模板不存在',
        data: null
      }, { status: 404 });
    }
    
    // 取消所有模板的默认状态
    watermarkTemplates.forEach(t => {
      t.isDefault = false;
    });
    
    // 设置当前模板为默认
    template.isDefault = true;
    
    return HttpResponse.json({
      code: 200,
      message: '设置默认模板成功',
      data: template
    });
  }),
  
  // 水印模板管理 - 获取所有可用位置
  http.get('/api/watermark/positions', () => {
    const positions = [
      { code: 'top-left', name: '左上角' },
      { code: 'top-center', name: '顶部居中' },
      { code: 'top-right', name: '右上角' },
      { code: 'middle-left', name: '左侧居中' },
      { code: 'middle-center', name: '正中心' },
      { code: 'middle-right', name: '右侧居中' },
      { code: 'bottom-left', name: '左下角' },
      { code: 'bottom-center', name: '底部居中' },
      { code: 'bottom-right', name: '右下角' }
    ];
    
    return HttpResponse.json({
      code: 200,
      message: '获取水印位置列表成功',
      data: positions
    });
  }),
  
  // 水印模板管理 - 获取所有可用字体
  http.get('/api/watermark/fonts', () => {
    const fonts = [
      { code: 'Arial', name: 'Arial' },
      { code: 'Helvetica', name: 'Helvetica' },
      { code: 'Times New Roman', name: 'Times New Roman' },
      { code: 'Courier New', name: 'Courier New' },
      { code: 'Verdana', name: 'Verdana' },
      { code: 'Georgia', name: 'Georgia' },
      { code: 'Palatino', name: 'Palatino' },
      { code: 'Garamond', name: 'Garamond' },
      { code: 'Bookman', name: 'Bookman' },
      { code: 'Comic Sans MS', name: 'Comic Sans MS' },
      { code: 'Trebuchet MS', name: 'Trebuchet MS' },
      { code: 'Arial Black', name: 'Arial Black' },
      { code: 'Impact', name: 'Impact' }
    ];
    
    return HttpResponse.json({
      code: 200,
      message: '获取字体列表成功',
      data: fonts
    });
  }),
  
  // 水印模板管理 - 应用水印到视频
  http.post('/api/watermark/apply', async ({ request }) => {
    const data = await request.json();
    const { templateId, videoIds } = data;
    
    // 检查必填字段
    if (!templateId || !videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return HttpResponse.json({
        code: 400,
        message: '缺少必要参数',
        data: null
      }, { status: 400 });
    }
    
    // 检查模板是否存在
    const template = watermarkTemplates.find(t => t.id === templateId);
    if (!template) {
      return HttpResponse.json({
        code: 404,
        message: '水印模板不存在',
        data: null
      }, { status: 404 });
    }
    
    // 模拟应用水印成功
    return HttpResponse.json({
      code: 200,
      message: '应用水印成功',
      data: {
        templateId,
        videoIds,
        taskId: `task-${Date.now()}`
      }
    });
  })
];

export default watermarkHandlers;