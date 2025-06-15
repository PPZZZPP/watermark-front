import { http, HttpResponse } from 'msw';
import { videos, projects } from './data';

// 视频管理处理程序
export const videoHandlers = [
  // 视频管理 - 获取视频列表
  http.get('/api/video/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');
    const filename = url.searchParams.get('filename');
    
    let filteredVideos = [...videos];
    
    // 按项目ID筛选
    if (projectId) {
      filteredVideos = filteredVideos.filter(video => video.projectId === projectId);
    }
    
    // 按状态筛选
    if (status) {
      filteredVideos = filteredVideos.filter(video => video.status === status);
    }
    
    // 按文件名筛选
    if (filename) {
      filteredVideos = filteredVideos.filter(video => 
        video.filename.toLowerCase().includes(filename.toLowerCase())
      );
    }
    
    // 计算分页
    const total = filteredVideos.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedVideos = filteredVideos.slice(start, end);
    
    return HttpResponse.json({
      code: 200,
      message: '获取视频列表成功',
      data: {
        list: pagedVideos,
        page,
        pageSize,
        total
      }
    });
  }),
  
  // 视频管理 - 获取视频详情
  http.get('/api/video/:id', ({ params }) => {
    const { id } = params;
    
    const video = videos.find(v => v.id === id);
    
    if (video) {
      return HttpResponse.json({
        code: 200,
        message: '获取视频详情成功',
        data: video
      });
    } else {
      return HttpResponse.json({
        code: 404,
        message: '视频不存在',
        data: null
      }, { status: 404 });
    }
  }),
  
  // 视频管理 - 上传视频
  http.post('/api/video/upload', async ({ request }) => {
    // 模拟文件上传
    // 在实际项目中，这里应该处理文件上传逻辑
    
    const data = await request.json();
    const { projectId, filename } = data;
    
    // 创建新视频记录
    const newVideo = {
      id: `video-${videos.length + 1}`,
      filename: filename || `新上传视频${videos.length + 1}.mp4`,
      size: Math.floor(Math.random() * 100000000),
      uploadTime: new Date().toISOString(),
      status: 'pending',
      progress: 0,
      coverUrl: `/placeholder-video-${Math.floor(Math.random() * 5) + 1}.png`,
      projectId: projectId || `project-${Math.floor(Math.random() * 4) + 1}`
    };
    
    videos.push(newVideo);
    
    // 更新项目视频数量
    const project = projects.find(p => p.id === newVideo.projectId);
    if (project) {
      project.videoCount += 1;
    }
    
    return HttpResponse.json({
      code: 200,
      message: '上传视频成功',
      data: newVideo
    });
  }),
  
  // 视频管理 - 处理视频
  http.post('/api/video/:id/process', ({ params }) => {
    const { id } = params;
    
    const video = videos.find(v => v.id === id);
    
    if (!video) {
      return HttpResponse.json({
        code: 404,
        message: '视频不存在',
        data: null
      }, { status: 404 });
    }
    
    // 更新视频状态
    video.status = 'processing';
    video.progress = 0;
    
    return HttpResponse.json({
      code: 200,
      message: '视频处理任务已提交',
      data: video
    });
  }),
  
  // 视频管理 - 获取视频处理进度
  http.get('/api/video/:id/progress', ({ params }) => {
    const { id } = params;
    
    const video = videos.find(v => v.id === id);
    
    if (!video) {
      return HttpResponse.json({
        code: 404,
        message: '视频不存在',
        data: null
      }, { status: 404 });
    }
    
    // 如果视频状态是处理中，则随机更新进度
    if (video.status === 'processing') {
      video.progress = Math.min(100, video.progress + Math.floor(Math.random() * 10));
      
      // 如果进度达到100%，则更新状态为已完成
      if (video.progress === 100) {
        video.status = 'completed';
      }
    }
    
    return HttpResponse.json({
      code: 200,
      message: '获取视频处理进度成功',
      data: {
        id: video.id,
        progress: video.progress,
        status: video.status
      }
    });
  }),
  
  // 视频管理 - 删除视频
  http.delete('/api/video/:id', ({ params }) => {
    const { id } = params;
    
    const videoIndex = videos.findIndex(v => v.id === id);
    
    if (videoIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '视频不存在',
        data: null
      }, { status: 404 });
    }
    
    // 获取视频所属项目
    const projectId = videos[videoIndex].projectId;
    
    // 删除视频
    videos.splice(videoIndex, 1);
    
    // 更新项目视频数量
    const project = projects.find(p => p.id === projectId);
    if (project) {
      project.videoCount = Math.max(0, project.videoCount - 1);
    }
    
    return HttpResponse.json({
      code: 200,
      message: '删除视频成功',
      data: null
    });
  }),
  
  // 视频管理 - 批量删除视频
  http.post('/api/video/batch-delete', async ({ request }) => {
    const data = await request.json();
    const { ids } = data;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return HttpResponse.json({
        code: 400,
        message: '参数错误',
        data: null
      }, { status: 400 });
    }
    
    // 删除前获取视频所属项目
    const projectIds = new Set();
    ids.forEach(id => {
      const video = videos.find(v => v.id === id);
      if (video) {
        projectIds.add(video.projectId);
      }
    });
    
    // 删除视频
    videos = videos.filter(v => !ids.includes(v.id));
    
    // 更新项目视频数量
    projectIds.forEach(projectId => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        project.videoCount = videos.filter(v => v.projectId === projectId).length;
      }
    });
    
    return HttpResponse.json({
      code: 200,
      message: '批量删除视频成功',
      data: null
    });
  }),
  
  // 视频管理 - 修改视频信息
  http.put('/api/video/:id', async ({ request, params }) => {
    const { id } = params;
    const data = await request.json();
    
    const videoIndex = videos.findIndex(v => v.id === id);
    
    if (videoIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '视频不存在',
        data: null
      }, { status: 404 });
    }
    
    // 更新视频信息
    videos[videoIndex] = {
      ...videos[videoIndex],
      ...data,
      id // 保持ID不变
    };
    
    return HttpResponse.json({
      code: 200,
      message: '更新视频信息成功',
      data: videos[videoIndex]
    });
  }),
  
  // 视频管理 - 获取视频状态统计
  http.get('/api/video/stats', () => {
    const stats = {
      total: videos.length,
      pending: videos.filter(v => v.status === 'pending').length,
      processing: videos.filter(v => v.status === 'processing').length,
      completed: videos.filter(v => v.status === 'completed').length,
      failed: videos.filter(v => v.status === 'failed').length
    };
    
    return HttpResponse.json({
      code: 200,
      message: '获取视频状态统计成功',
      data: stats
    });
  }),
  
  // 视频管理 - 获取视频格式支持列表
  http.get('/api/video/formats', () => {
    const formats = [
      { code: 'mp4', name: 'MP4', description: '最常用的视频格式，兼容性最好' },
      { code: 'avi', name: 'AVI', description: '质量较高，文件较大' },
      { code: 'mov', name: 'MOV', description: 'Apple QuickTime格式' },
      { code: 'wmv', name: 'WMV', description: 'Windows Media Video格式' },
      { code: 'flv', name: 'FLV', description: 'Flash Video格式' },
      { code: 'mkv', name: 'MKV', description: 'Matroska Video格式，支持多种编码' }
    ];
    
    return HttpResponse.json({
      code: 200,
      message: '获取视频格式列表成功',
      data: formats
    });
  })
];

export default videoHandlers; 