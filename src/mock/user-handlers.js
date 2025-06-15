import { http, HttpResponse } from 'msw';
import { users, generateToken } from './data';

// 用户管理处理程序
export const userHandlers = [
  // 用户登录
  http.post('/api/user/login', async ({ request }) => {
    console.log('MSW: 接收到登录请求');
    
    try {
      const data = await request.json();
      console.log('MSW: 登录请求数据', data);
      
      const { username, password } = data;
      
      // 增加对username和password的检查
      if (!username || !password) {
        console.log('MSW: 用户名或密码为空');
        return HttpResponse.json({
          code: 400,
          message: '用户名和密码不能为空',
          data: null
        }, { status: 400 });
      }
      
      const user = users.find(u => u.username === username);
      console.log('MSW: 查找用户', user ? '找到用户' : '未找到用户');
      
      if (!user || user.password !== password) {
        console.log('MSW: 用户名或密码错误');
        return HttpResponse.json({
          code: 400,
          message: '用户名或密码错误',
          data: null
        }, { status: 400 });
      }
      
      try {
        // 生成token
        const token = generateToken(username);
        console.log('MSW: 生成token', token ? '成功' : '失败');
        
        if (!token) {
          throw new Error('Token生成失败');
        }
        
        // 返回用户信息和token
        const { password: _, ...userWithoutPassword } = user;
        
        const response = {
          code: 200,
          message: '登录成功',
          data: {
            token,
            user: userWithoutPassword
          }
        };
        
        console.log('MSW: 返回登录响应', response);
        return HttpResponse.json(response);
      } catch (tokenError) {
        console.error('MSW: Token生成错误:', tokenError);
        return HttpResponse.json({
          code: 500,
          message: 'Token生成失败，请重试',
          data: null
        }, { status: 500 });
      }
    } catch (error) {
      console.error('MSW: 处理登录请求出错', error);
      return HttpResponse.json({
        code: 500,
        message: '服务器内部错误',
        data: null
      }, { status: 500 });
    }
  }),
  
  // 用户注册
  http.post('/api/user/register', async ({ request }) => {
    const data = await request.json();
    const { username, email, phone, password } = data;
    
    // 检查用户名是否已存在
    if (users.some(u => u.username === username)) {
      return HttpResponse.json({
        code: 400,
        message: '用户名已存在',
        data: null
      }, { status: 400 });
    }
    
    // 检查邮箱是否已存在
    if (users.some(u => u.email === email)) {
      return HttpResponse.json({
        code: 400,
        message: '邮箱已存在',
        data: null
      }, { status: 400 });
    }
    
    // 检查手机号是否已存在
    if (users.some(u => u.phone === phone)) {
      return HttpResponse.json({
        code: 400,
        message: '手机号已存在',
        data: null
      }, { status: 400 });
    }
    
    // 创建新用户
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      password,
      email,
      phone,
      nickname: '',
      gender: '',
      department: '',
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`,
      role: 'user',
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      lastLoginTime: new Date().toISOString()
    };
    
    users.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    // 生成token
    const token = generateToken(username);
    
    return HttpResponse.json({
      code: 200,
      message: '注册成功',
      data: {
        token,
        user: userWithoutPassword
      }
    });
  }),
  
  // 获取用户信息
  http.get('/api/user/info', ({ request }) => {
    console.log('MSW: 接收到获取用户信息请求');
    
    const authHeader = request.headers.get('Authorization');
    console.log('MSW: Authorization 头:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('MSW: 无效的Authorization头');
      return HttpResponse.json({
        code: 401,
        message: '未授权，请先登录',
        data: null
      }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    console.log('MSW: 提取的Token:', token.substring(0, 20) + '...');
    
    try {
      // 尝试解析token
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('无效的JWT格式');
      }
      
      // 解析payload
      const payload = JSON.parse(atob(parts[1]));
      console.log('MSW: Token Payload:', payload);
      
      // 获取用户名
      const username = payload.sub || payload.name;
      
      // 查找用户
      const user = users.find(u => u.username === username);
      console.log('MSW: 查找用户结果:', user ? '找到用户' : '未找到用户');
      
      if (!user) {
        return HttpResponse.json({
          code: 401,
          message: '无效的token',
          data: null
        }, { status: 401 });
      }
      
      // 返回用户信息（不包含密码）
      const { password: _, ...userWithoutPassword } = user;
      
      // 确保返回的用户信息中包含角色信息
      if (!userWithoutPassword.role) {
        userWithoutPassword.role = payload.role || 'user';
      }
      
      console.log('MSW: 返回用户信息:', userWithoutPassword);
      return HttpResponse.json({
        code: 200,
        message: '获取用户信息成功',
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('MSW: Token解析错误:', error);
      
      // 回退到原始解析方式
      console.log('MSW: 尝试使用备用方案解析token');
      // 尝试从token中提取用户名
      const tokenParts = token.split('-');
      if (tokenParts.length > 1) {
        const username = tokenParts[1];
        const user = users.find(u => u.username === username);
        
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return HttpResponse.json({
            code: 200,
            message: '获取用户信息成功',
            data: userWithoutPassword
          });
        }
      }
      
      return HttpResponse.json({
        code: 401,
        message: '无效的token',
        data: null
      }, { status: 401 });
    }
  }),
  
  // 更新用户信息
  http.put('/api/user/update', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({
        code: 401,
        message: '未授权，请先登录',
        data: null
      }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    
    // 模拟解析token获取用户名
    let username = '';
    
    try {
      // 尝试解析token
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        username = payload.sub || payload.name;
      }
    } catch (error) {
      // 回退到原始解析方式
      const tokenParts = token.split('-');
      if (tokenParts.length > 1) {
        username = tokenParts[1];
      }
    }
    
    if (!username) {
      return HttpResponse.json({
        code: 401,
        message: '无效的token',
        data: null
      }, { status: 401 });
    }
    
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      return HttpResponse.json({
        code: 401,
        message: '无效的token',
        data: null
      }, { status: 401 });
    }
    
    const data = await request.json();
    
    // 更新用户信息（不允许更新用户名和密码）
    users[userIndex] = {
      ...users[userIndex],
      ...data,
      username: users[userIndex].username, // 保持用户名不变
      password: users[userIndex].password, // 保持密码不变
      role: users[userIndex].role, // 保持角色不变
      id: users[userIndex].id // 保持ID不变
    };
    
    // 返回更新后的用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = users[userIndex];
    
    return HttpResponse.json({
      code: 200,
      message: '更新用户信息成功',
      data: userWithoutPassword
    });
  }),
  
  // 修改密码
  http.put('/api/user/password', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({
        code: 401,
        message: '未授权，请先登录',
        data: null
      }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    
    // 模拟解析token获取用户名
    let username = '';
    
    try {
      // 尝试解析token
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        username = payload.sub || payload.name;
      }
    } catch (error) {
      // 回退到原始解析方式
      const tokenParts = token.split('-');
      if (tokenParts.length > 1) {
        username = tokenParts[1];
      }
    }
    
    if (!username) {
      return HttpResponse.json({
        code: 401,
        message: '无效的token',
        data: null
      }, { status: 401 });
    }
    
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex === -1) {
      return HttpResponse.json({
        code: 401,
        message: '无效的token',
        data: null
      }, { status: 401 });
    }
    
    const data = await request.json();
    const { oldPassword, newPassword } = data;
    
    // 验证旧密码
    if (users[userIndex].password !== oldPassword) {
      return HttpResponse.json({
        code: 400,
        message: '旧密码错误',
        data: null
      }, { status: 400 });
    }
    
    // 更新密码
    users[userIndex].password = newPassword;
    
    return HttpResponse.json({
      code: 200,
      message: '密码修改成功',
      data: null
    });
  }),
  
  // 退出登录
  http.post('/api/user/logout', () => {
    return HttpResponse.json({
      code: 200,
      message: '退出登录成功',
      data: null
    });
  }),
  
  // 系统管理 - 获取用户列表
  http.get('/api/system/users', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const keyword = url.searchParams.get('keyword');
    
    let filteredUsers = [...users];
    
    // 根据关键字过滤
    if (keyword) {
      filteredUsers = filteredUsers.filter(user => 
        user.username.includes(keyword) || 
        user.nickname.includes(keyword) || 
        user.email.includes(keyword) || 
        user.phone.includes(keyword)
      );
    }
    
    // 计算分页
    const total = filteredUsers.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedUsers = filteredUsers.slice(start, end);
    
    // 移除密码字段
    const usersWithoutPassword = pagedUsers.map(({ password, ...rest }) => rest);
    
    return HttpResponse.json({
      code: 200,
      message: '获取用户列表成功',
      data: {
        list: usersWithoutPassword,
        page,
        pageSize,
        total
      }
    });
  }),
  
  // 系统管理 - 获取用户详情
  http.get('/api/system/users/:id', ({ params }) => {
    const id = parseInt(params.id);
    const user = users.find(u => u.id === id);
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return HttpResponse.json({
        code: 200,
        message: '获取用户详情成功',
        data: userWithoutPassword
      });
    } else {
      return HttpResponse.json({
        code: 404,
        message: '用户不存在',
        data: null
      }, { status: 404 });
    }
  }),
  
  // 系统管理 - 添加用户
  http.post('/api/system/users', async ({ request }) => {
    const data = await request.json();
    const { username, password, email, phone, nickname, gender, department, role } = data;
    
    // 检查用户名是否已存在
    if (users.some(u => u.username === username)) {
      return HttpResponse.json({
        code: 400,
        message: '用户名已存在',
        data: null
      }, { status: 400 });
    }
    
    // 检查邮箱是否已存在
    if (users.some(u => u.email === email)) {
      return HttpResponse.json({
        code: 400,
        message: '邮箱已存在',
        data: null
      }, { status: 400 });
    }
    
    // 检查手机号是否已存在
    if (users.some(u => u.phone === phone)) {
      return HttpResponse.json({
        code: 400,
        message: '手机号已存在',
        data: null
      }, { status: 400 });
    }
    
    // 创建新用户
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      password,
      email,
      phone,
      nickname: nickname || username,
      gender: gender || 'male',
      department: department || '',
      avatar: `https://randomuser.me/api/portraits/${gender === 'female' ? 'women' : 'men'}/${Math.floor(Math.random() * 100)}.jpg`,
      role: role || 'user',
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      lastLoginTime: null
    };
    
    users.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    return HttpResponse.json({
      code: 200,
      message: '添加用户成功',
      data: userWithoutPassword
    });
  }),
  
  // 系统管理 - 更新用户
  http.put('/api/system/users/:id', async ({ request, params }) => {
    const id = parseInt(params.id);
    const data = await request.json();
    
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '用户不存在',
        data: null
      }, { status: 404 });
    }
    
    // 检查用户名是否已存在
    if (data.username && data.username !== users[userIndex].username && users.some(u => u.username === data.username)) {
      return HttpResponse.json({
        code: 400,
        message: '用户名已存在',
        data: null
      }, { status: 400 });
    }
    
    // 检查邮箱是否已存在
    if (data.email && data.email !== users[userIndex].email && users.some(u => u.email === data.email)) {
      return HttpResponse.json({
        code: 400,
        message: '邮箱已存在',
        data: null
      }, { status: 400 });
    }
    
    // 检查手机号是否已存在
    if (data.phone && data.phone !== users[userIndex].phone && users.some(u => u.phone === data.phone)) {
      return HttpResponse.json({
        code: 400,
        message: '手机号已存在',
        data: null
      }, { status: 400 });
    }
    
    // 更新用户信息
    users[userIndex] = {
      ...users[userIndex],
      ...data,
      id // 保持ID不变
    };
    
    const { password, ...userWithoutPassword } = users[userIndex];
    
    return HttpResponse.json({
      code: 200,
      message: '更新用户成功',
      data: userWithoutPassword
    });
  }),
  
  // 系统管理 - 删除用户
  http.delete('/api/system/users/:id', ({ params }) => {
    const id = parseInt(params.id);
    
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '用户不存在',
        data: null
      }, { status: 404 });
    }
    
    // 不能删除管理员账号
    if (users[userIndex].role === 'admin' && users[userIndex].username === 'admin') {
      return HttpResponse.json({
        code: 403,
        message: '不能删除管理员账号',
        data: null
      }, { status: 403 });
    }
    
    users.splice(userIndex, 1);
    
    return HttpResponse.json({
      code: 200,
      message: '删除用户成功',
      data: null
    });
  }),
  
  // 系统管理 - 重置用户密码
  http.post('/api/system/users/:id/reset-password', ({ params }) => {
    const id = parseInt(params.id);
    
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return HttpResponse.json({
        code: 404,
        message: '用户不存在',
        data: null
      }, { status: 404 });
    }
    
    // 重置密码为默认密码
    users[userIndex].password = '123456';
    
    return HttpResponse.json({
      code: 200,
      message: '重置密码成功，新密码为：123456',
      data: null
    });
  }),
  
  // 系统管理 - 批量删除用户
  http.post('/api/system/users/batch-delete', async ({ request }) => {
    const data = await request.json();
    const { ids } = data;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return HttpResponse.json({
        code: 400,
        message: '参数错误',
        data: null
      }, { status: 400 });
    }
    
    // 检查是否包含管理员账号
    const hasAdmin = ids.some(id => {
      const user = users.find(u => u.id === id);
      return user && user.role === 'admin' && user.username === 'admin';
    });
    
    if (hasAdmin) {
      return HttpResponse.json({
        code: 403,
        message: '不能删除管理员账号',
        data: null
      }, { status: 403 });
    }
    
    // 删除用户
    users = users.filter(u => !ids.includes(u.id));
    
    return HttpResponse.json({
      code: 200,
      message: '批量删除用户成功',
      data: null
    });
  })
];

export default userHandlers; 