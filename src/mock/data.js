// 模拟用户数据
export let users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    phone: '13900139000',
    nickname: '管理员',
    gender: 'male',
    department: '技术部',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    role: 'admin',
    createTime: '2023-01-01 00:00:00',
    lastLoginTime: '2023-06-01T12:30:45.000Z'
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    email: 'user@example.com',
    phone: '13800138001',
    nickname: '普通用户',
    gender: 'female',
    department: '市场部',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    role: 'user',
    createTime: '2023-02-15T00:00:00.000Z',
    lastLoginTime: '2023-06-02T08:15:30.000Z'
  }
];

// 模拟角色数据
export let roles = [
  {
    id: 1,
    code: 'admin',
    name: '管理员',
    description: '系统管理员，拥有所有权限',
    permissions: ['*'],
    createTime: '2023-01-01 00:00:00',
  },
  {
    id: 2,
    code: 'user',
    name: '普通用户',
    description: '普通用户，只能操作自己的数据',
    permissions: ['user:view', 'user:edit'],
    createTime: '2023-01-01 00:00:00',
  },
  {
    id: 3,
    code: 'operator',
    name: '运营人员',
    description: '运营人员，可以管理内容和用户',
    permissions: ['user:view', 'user:edit', 'content:view', 'content:edit'],
    createTime: '2023-01-01 00:00:00',
  }
];

// 模拟水印模板数据
export let watermarkTemplates = [
  {
    id: 1,
    name: '公司Logo水印',
    type: 'image',
    content: '/logo.png',
    position: 'bottom-right',
    opacity: 0.8,
    size: 100,
    createTime: '2023-01-01T00:00:00.000Z',
    userId: 1,
    isDefault: true
  },
  {
    id: 2,
    name: '版权文字水印',
    type: 'text',
    content: '© 2023 版权所有',
    position: 'bottom-center',
    opacity: 0.6,
    size: 24,
    fontFamily: 'Arial',
    fontColor: '#ffffff',
    createTime: '2023-01-15T00:00:00.000Z',
    userId: 1,
    isDefault: false
  },
  {
    id: 3,
    name: '时间水印',
    type: 'text',
    content: '{{time}}',
    position: 'top-right',
    opacity: 0.7,
    size: 18,
    fontFamily: 'Helvetica',
    fontColor: '#ffcc00',
    createTime: '2023-02-05T00:00:00.000Z',
    userId: 2,
    isDefault: false
  }
];

// 模拟项目数据
export let projects = [
  {
    id: 'project-1',
    name: '企业宣传视频水印',
    description: '为企业宣传视频添加品牌水印',
    status: 'completed',
    progress: 100,
    videoCount: 5,
    createTime: '2023-05-15T08:30:00.000Z',
    coverUrl: '/placeholder-video-1.png',
    userId: 1
  },
  {
    id: 'project-2',
    name: '产品演示视频',
    description: '为产品演示视频添加版权水印',
    status: 'processing',
    progress: 45,
    videoCount: 3,
    createTime: '2023-05-28T14:20:00.000Z',
    coverUrl: '/placeholder-video-2.png',
    userId: 1
  },
  {
    id: 'project-3',
    name: '培训课程视频',
    description: '为培训课程视频添加机构标识水印',
    status: 'pending',
    progress: 0,
    videoCount: 12,
    createTime: '2023-06-01T09:45:00.000Z',
    coverUrl: '/placeholder-video-3.png',
    userId: 2
  },
  {
    id: 'project-4',
    name: '营销活动视频',
    description: '为营销活动视频添加活动Logo水印',
    status: 'failed',
    progress: 80,
    videoCount: 2,
    createTime: '2023-06-05T16:10:00.000Z',
    coverUrl: '/placeholder-video-4.png',
    userId: 2
  }
];

// 模拟视频数据
export let videos = Array(20).fill(0).map((_, index) => ({
  id: `video-${index + 1}`,
  filename: `视频文件${index + 1}.mp4`,
  size: Math.floor(Math.random() * 100000000),
  uploadTime: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  status: ['pending', 'processing', 'completed', 'failed'][Math.floor(Math.random() * 4)],
  progress: Math.floor(Math.random() * 100),
  coverUrl: `/placeholder-video-${(index % 5) + 1}.png`,
  projectId: `project-${Math.floor(Math.random() * 4) + 1}`
}));

// 生成Token的工具函数
export const generateToken = (username) => {
  try {
    if (!username) {
      console.error('generateToken: 用户名为空');
      return '';
    }
    
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      sub: username, 
      role: username === 'admin' ? 'admin' : 'user', 
      exp: Date.now() + 3600000 
    }));
    const signature = btoa('mock-signature');
    
    const token = `${header}.${payload}.${signature}`;
    console.log('generateToken: 成功生成token:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('generateToken: 生成token出错:', error);
    return '';
  }
}; 