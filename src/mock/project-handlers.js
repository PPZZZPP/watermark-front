import { http, HttpResponse } from 'msw';
import { projects, videos } from './data';

// 项目管理处理程序
export const projectHandlers = [
  // 项目管理 - 获取项目列表
  http.get('/api/project/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const name = url.searchParams.get('name');
    const status = url.searchParams.get('status');
    
    // 在实际应用中，这里应该从token中解析用户ID
    // 这里简化处理，假设已登录用户是ID为1的用户
    let filteredProjects = projects.filter(project => project.userId === 1);
    
    // 按名称筛选
    if (name) {
      filteredProjects = filteredProjects.filter(project => 
        project.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    
    // 按状态筛选
    if (status) {
      filteredProjects = filteredProjects.filter(project => 
        project.status === status
      );
    }
    
    // 分页
    const total = filteredProjects.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedProjects = filteredProjects.slice(start, end);
    
    return HttpResponse.json({
      code: 200,
      message: '获取项目列表成功',
      data: {
        list: pagedProjects,
        total,
        page,
        pageSize
      }
    });
  }),
  
  // 项目管理 - 获取项目详情
  http.get('/api/project/:id', ({ params }) => {
    const { id } = params;
    
    const project = projects.find(p => p.id === id);
    
    if (project) {
      return HttpResponse.json({
        code: 200,
        message: '获取项目详情成功',
        data: project
      });
    } else {
      return HttpResponse.json({
        code: 404,
        message: '项目不存在',
        data: null
      }, { status: 404 });
    }
  }),
  
  // 项目管理 - 创建项目
  http.post('/api/project/create', async ({ request }) => {
    const data = await request.json();
    const { name, description } = data;
    
    // 验证必填字段
    if (!name) {
      return HttpResponse.json({
        code: 400,
        message: '项目名称不能为空',
        data: null
      }, { status: 400 });
    }
    
    // 在实际应用中，这里应该从token中解析用户ID
    // 这里简化处理，假设已登录用户是ID为1的用户
    const newProject = {
      id: `project-${projects.length + 1}`,
      name,
      description: description || '',
      status: 'pending',
      progress: 0,
      videoCount: 0,
      createTime: new Date().toISOString(),
      coverUrl: `/placeholder-video-${Math.floor(Math.random() * 5) + 1}.png`,
      userId: 1
    };
    
    projects.push(newProject);
    
    return HttpResponse.json({
      code: 200,
      message: '创建项目成功',
      data: newProject
    });
  }),
  
  // 项目管理 - 更新项目
  http.put('/api/project/:id', async ({ request, params }) => {
    const { id } = params;
    const data = await request.json();
    
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '项目不存在',
        data: null
      }, { status: 404 });
    }
    
    // 不允许更新某些字段
    const { id: _, userId: __, status: ___, progress: ____, videoCount: _____, createTime: ______, coverUrl: _______, ...allowedUpdateData } = data;
    
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...allowedUpdateData
    };
    
    return HttpResponse.json({
      code: 200,
      message: '更新项目成功',
      data: projects[projectIndex]
    });
  }),
  
  // 项目管理 - 删除项目
  http.delete('/api/project/:id', ({ params }) => {
    const { id } = params;
    
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '项目不存在',
        data: null
      }, { status: 404 });
    }
    
    // 检查项目下是否有视频
    const hasVideos = videos.some(v => v.projectId === id);
    if (hasVideos) {
      return HttpResponse.json({
        code: 403,
        message: '项目下存在视频，无法删除',
        data: null
      }, { status: 403 });
    }
    
    projects.splice(projectIndex, 1);
    
    return HttpResponse.json({
      code: 200,
      message: '删除项目成功',
      data: null
    });
  }),
  
  // 项目管理 - 批量删除项目
  http.post('/api/project/batch-delete', async ({ request }) => {
    const data = await request.json();
    const { ids } = data;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return HttpResponse.json({
        code: 400,
        message: '参数错误',
        data: null
      }, { status: 400 });
    }
    
    // 检查项目下是否有视频
    const projectsWithVideos = ids.filter(id => videos.some(v => v.projectId === id));
    if (projectsWithVideos.length > 0) {
      return HttpResponse.json({
        code: 403,
        message: `有${projectsWithVideos.length}个项目下存在视频，无法删除`,
        data: {
          projectsWithVideos
        }
      }, { status: 403 });
    }
    
    // 删除项目
    projects = projects.filter(p => !ids.includes(p.id));
    
    return HttpResponse.json({
      code: 200,
      message: '批量删除项目成功',
      data: null
    });
  }),
  
  // 项目管理 - 导出项目
  http.post('/api/project/export', async ({ request }) => {
    const data = await request.json();
    const { ids } = data;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return HttpResponse.json({
        code: 400,
        message: '参数错误',
        data: null
      }, { status: 400 });
    }
    
    // 模拟导出成功
    return HttpResponse.json({
      code: 200,
      message: '导出项目成功',
      data: {
        downloadUrl: '/export/projects.zip'
      }
    });
  }),
  
  // 项目管理 - 获取项目进度
  http.get('/api/project/:id/progress', ({ params }) => {
    const { id } = params;
    
    const project = projects.find(p => p.id === id);
    
    if (project) {
      // 如果项目状态是处理中，则随机更新进度
      if (project.status === 'processing') {
        project.progress = Math.min(100, project.progress + Math.floor(Math.random() * 10));
        
        // 如果进度达到100%，则更新状态为已完成
        if (project.progress === 100) {
          project.status = 'completed';
        }
      }
      
      return HttpResponse.json({
        code: 200,
        message: '获取项目进度成功',
        data: {
          id: project.id,
          progress: project.progress,
          status: project.status
        }
      });
    } else {
      return HttpResponse.json({
        code: 404,
        message: '项目不存在',
        data: null
      }, { status: 404 });
    }
  }),
  
  // 项目管理 - 获取项目状态统计
  http.get('/api/project/stats', () => {
    const stats = {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      processing: projects.filter(p => p.status === 'processing').length,
      completed: projects.filter(p => p.status === 'completed').length,
      failed: projects.filter(p => p.status === 'failed').length
    };
    
    return HttpResponse.json({
      code: 200,
      message: '获取项目状态统计成功',
      data: stats
    });
  }),
  
  // 项目管理 - 启动项目处理
  http.post('/api/project/:id/start', ({ params }) => {
    const { id } = params;
    
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return HttpResponse.json({
        code: 404,
        message: '项目不存在',
        data: null
      }, { status: 404 });
    }
    
    // 检查项目下是否有视频
    const projectVideos = videos.filter(v => v.projectId === id);
    if (projectVideos.length === 0) {
      return HttpResponse.json({
        code: 400,
        message: '项目下没有视频，无法启动处理',
        data: null
      }, { status: 400 });
    }
    
    // 更新项目状态
    project.status = 'processing';
    project.progress = 0;
    
    // 更新项目下所有视频状态
    projectVideos.forEach(video => {
      video.status = 'processing';
      video.progress = 0;
    });
    
    return HttpResponse.json({
      code: 200,
      message: '启动项目处理成功',
      data: project
    });
  }),
  
  // 项目管理 - 暂停项目处理
  http.post('/api/project/:id/pause', ({ params }) => {
    const { id } = params;
    
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return HttpResponse.json({
        code: 404,
        message: '项目不存在',
        data: null
      }, { status: 404 });
    }
    
    // 只有处理中的项目可以暂停
    if (project.status !== 'processing') {
      return HttpResponse.json({
        code: 400,
        message: '只有处理中的项目才能暂停',
        data: null
      }, { status: 400 });
    }
    
    // 更新项目状态
    project.status = 'paused';
    
    // 更新项目下所有处理中的视频状态
    videos.filter(v => v.projectId === id && v.status === 'processing').forEach(video => {
      video.status = 'paused';
    });
    
    return HttpResponse.json({
      code: 200,
      message: '暂停项目处理成功',
      data: project
    });
  })
];

export default projectHandlers;