import { http, HttpResponse } from 'msw';

// 导入角色数据
import { roles, users } from './data';

// 角色和权限管理处理程序
export const roleHandlers = [
  // 角色管理 - 获取角色列表
  http.get('/api/system/roles', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const keyword = url.searchParams.get('keyword');
    
    let filteredRoles = [...roles];
    
    // 根据关键字过滤
    if (keyword) {
      filteredRoles = filteredRoles.filter(role => 
        role.name.includes(keyword) || 
        role.code.includes(keyword) || 
        role.description.includes(keyword)
      );
    }
    
    // 计算分页
    const total = filteredRoles.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedRoles = filteredRoles.slice(start, end);
    
    return HttpResponse.json({
      code: 200,
      message: '获取角色列表成功',
      data: {
        list: pagedRoles,
        page,
        pageSize,
        total
      }
    });
  }),
  
  // 角色管理 - 获取所有角色（不分页）- API路径
  http.get('/api/system/role/all', () => {
    return HttpResponse.json({
      code: 200,
      message: '获取所有角色成功',
      data: roles
    });
  }),
  
  // 角色管理 - 获取所有角色（不分页）- 系统路径
  http.get('/system/role/all', () => {
    return HttpResponse.json({
      code: 200,
      message: '获取所有角色成功',
      data: roles
    });
  }),
  
  // 角色管理 - 获取角色详情
  http.get('/api/system/roles/:id', ({ params }) => {
    const id = parseInt(params.id);
    const role = roles.find(r => r.id === id);
    
    if (role) {
      return HttpResponse.json({
        code: 200,
        message: '获取角色详情成功',
        data: role
      });
    } else {
      return HttpResponse.json({
        code: 404,
        message: '角色不存在',
        data: null
      }, { status: 404 });
    }
  }),
  
  // 角色管理 - 创建角色
  http.post('/api/system/roles', async ({ request }) => {
    const data = await request.json();
    const { name, code, description, permissions } = data;
    
    // 检查必填字段
    if (!name || !code) {
      return HttpResponse.json({
        code: 400,
        message: '角色名称和标识不能为空',
        data: null
      }, { status: 400 });
    }
    
    // 检查角色标识是否已存在
    if (roles.some(r => r.code === code)) {
      return HttpResponse.json({
        code: 400,
        message: '角色标识已存在',
        data: null
      }, { status: 400 });
    }
    
    // 创建新角色
    const newRole = {
      id: roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1,
      name,
      code,
      description: description || '',
      permissions: permissions || [],
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    
    roles.push(newRole);
    
    return HttpResponse.json({
      code: 200,
      message: '创建角色成功',
      data: newRole
    });
  }),
  
  // 角色管理 - 更新角色
  http.put('/api/system/roles/:id', async ({ request, params }) => {
    const id = parseInt(params.id);
    const data = await request.json();
    
    const roleIndex = roles.findIndex(r => r.id === id);
    
    if (roleIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '角色不存在',
        data: null
      }, { status: 404 });
    }
    
    // 禁止修改admin角色的code
    if (roles[roleIndex].code === 'admin' && data.code && data.code !== 'admin') {
      return HttpResponse.json({
        code: 403,
        message: '不能修改管理员角色的标识',
        data: null
      }, { status: 403 });
    }
    
    // 检查角色标识是否已存在（排除自身）
    if (data.code && data.code !== roles[roleIndex].code && roles.some(r => r.code === data.code)) {
      return HttpResponse.json({
        code: 400,
        message: '角色标识已存在',
        data: null
      }, { status: 400 });
    }
    
    // 更新角色信息
    roles[roleIndex] = {
      ...roles[roleIndex],
      ...data,
      id // 保持ID不变
    };
    
    return HttpResponse.json({
      code: 200,
      message: '更新角色成功',
      data: roles[roleIndex]
    });
  }),
  
  // 角色管理 - 删除角色
  http.delete('/api/system/roles/:id', ({ params }) => {
    const id = parseInt(params.id);
    
    const roleIndex = roles.findIndex(r => r.id === id);
    
    if (roleIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '角色不存在',
        data: null
      }, { status: 404 });
    }
    
    // 不能删除管理员角色
    if (roles[roleIndex].code === 'admin') {
      return HttpResponse.json({
        code: 403,
        message: '不能删除管理员角色',
        data: null
      }, { status: 403 });
    }
    
    // 检查是否有用户正在使用该角色
    if (users.some(u => u.role === roles[roleIndex].code)) {
      return HttpResponse.json({
        code: 403,
        message: '该角色正在使用中，无法删除',
        data: null
      }, { status: 403 });
    }
    
    roles.splice(roleIndex, 1);
    
    return HttpResponse.json({
      code: 200,
      message: '删除角色成功',
      data: null
    });
  }),
  
  // 权限管理 - 获取所有权限
  http.get('/api/system/permissions', () => {
    // 模拟权限列表
    const permissions = [
      { id: 1, code: 'system:view', name: '系统管理-查看', description: '查看系统管理模块', module: '系统管理' },
      { id: 2, code: 'system:edit', name: '系统管理-编辑', description: '编辑系统管理模块', module: '系统管理' },
      { id: 3, code: 'user:view', name: '用户管理-查看', description: '查看用户列表', module: '用户管理' },
      { id: 4, code: 'user:edit', name: '用户管理-编辑', description: '编辑用户信息', module: '用户管理' },
      { id: 5, code: 'user:add', name: '用户管理-新增', description: '新增用户', module: '用户管理' },
      { id: 6, code: 'user:delete', name: '用户管理-删除', description: '删除用户', module: '用户管理' },
      { id: 7, code: 'role:view', name: '角色管理-查看', description: '查看角色列表', module: '角色管理' },
      { id: 8, code: 'role:edit', name: '角色管理-编辑', description: '编辑角色信息', module: '角色管理' },
      { id: 9, code: 'role:add', name: '角色管理-新增', description: '新增角色', module: '角色管理' },
      { id: 10, code: 'role:delete', name: '角色管理-删除', description: '删除角色', module: '角色管理' },
      { id: 11, code: 'project:view', name: '项目管理-查看', description: '查看项目列表', module: '项目管理' },
      { id: 12, code: 'project:edit', name: '项目管理-编辑', description: '编辑项目信息', module: '项目管理' },
      { id: 13, code: 'project:add', name: '项目管理-新增', description: '新增项目', module: '项目管理' },
      { id: 14, code: 'project:delete', name: '项目管理-删除', description: '删除项目', module: '项目管理' },
      { id: 15, code: 'video:view', name: '视频管理-查看', description: '查看视频列表', module: '视频管理' },
      { id: 16, code: 'video:edit', name: '视频管理-编辑', description: '编辑视频信息', module: '视频管理' },
      { id: 17, code: 'video:add', name: '视频管理-新增', description: '新增视频', module: '视频管理' },
      { id: 18, code: 'video:delete', name: '视频管理-删除', description: '删除视频', module: '视频管理' },
      { id: 19, code: 'watermark:view', name: '水印模板-查看', description: '查看水印模板列表', module: '水印模板' },
      { id: 20, code: 'watermark:edit', name: '水印模板-编辑', description: '编辑水印模板信息', module: '水印模板' },
      { id: 21, code: 'watermark:add', name: '水印模板-新增', description: '新增水印模板', module: '水印模板' },
      { id: 22, code: 'watermark:delete', name: '水印模板-删除', description: '删除水印模板', module: '水印模板' }
    ];
    
    return HttpResponse.json({
      code: 200,
      message: '获取权限列表成功',
      data: permissions
    });
  }),
  
  // 权限管理 - 获取角色的权限
  http.get('/api/system/roles/:id/permissions', ({ params }) => {
    const id = parseInt(params.id);
    const role = roles.find(r => r.id === id);
    
    if (!role) {
      return HttpResponse.json({
        code: 404,
        message: '角色不存在',
        data: null
      }, { status: 404 });
    }
    
    return HttpResponse.json({
      code: 200,
      message: '获取角色权限成功',
      data: role.permissions
    });
  }),
  
  // 权限管理 - 更新角色的权限
  http.put('/api/system/roles/:id/permissions', async ({ request, params }) => {
    const id = parseInt(params.id);
    const data = await request.json();
    const { permissions } = data;
    
    const roleIndex = roles.findIndex(r => r.id === id);
    
    if (roleIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '角色不存在',
        data: null
      }, { status: 404 });
    }
    
    // 管理员角色始终拥有所有权限
    if (roles[roleIndex].code === 'admin') {
      return HttpResponse.json({
        code: 403,
        message: '管理员角色的权限不能修改',
        data: null
      }, { status: 403 });
    }
    
    // 更新角色权限
    roles[roleIndex].permissions = permissions || [];
    
    return HttpResponse.json({
      code: 200,
      message: '更新角色权限成功',
      data: roles[roleIndex]
    });
  })
];

export default roleHandlers; 