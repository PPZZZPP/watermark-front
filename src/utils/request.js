import axios from 'axios';
import { message } from 'ant-design-vue';

// 获取token的统一函数
const getToken = () => {
  // 返回token
  return localStorage.getItem('token');

};

// 清除token的统一函数
const removeToken = () => {
  try {
    localStorage.removeItem('token');
    // sessionStorage.removeItem('token');
    // document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  } catch (e) {
    console.error('清除token出错:', e);
  }
};

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '', // 从环境变量获取API基础URL，如果没有则使用相对路径
  timeout: 15000, // 请求超时时间
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 统一获取token
    const token = getToken();
    console.log('API请求 - 使用token:', token ? `${token.substring(0, 10)}...` : '无');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 添加请求时间戳，防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    // 请求超时时间
    config.timeout = 15000;
    
    return config;
  },
  error => {
    console.error('请求错误：', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 根据自定义状态码判断请求是否成功
    if (res.code !== 200) {
      // 统一处理错误提示
      if (res.message) {
        message.error(res.message);
      } else {
        message.error('请求失败');
      }
      
      // 401: 未授权/token过期
      if (res.code === 401) {
        console.log('响应拦截器 - 检测到401未授权状态，清除token并跳转到登录页');
        removeToken();
        
        // 使用setTimeout避免可能的循环重定向
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      
      // 创建一个包含更多信息的错误对象
      const error = new Error(res.message || '请求失败');
      error.code = res.code;
      error.data = res.data;
      error.response = response;
      
      return Promise.reject(error);
    } else {
      return res;
    }
  },
  error => {
    console.error('响应错误：', error);
    
    // 创建一个标准化的错误对象
    const standardError = {
      message: '未知错误',
      status: null,
      data: null,
      config: error.config,
      stack: error.stack
    };
    
    // 处理HTTP状态码错误
    if (error.response) {
      standardError.status = error.response.status;
      standardError.data = error.response.data;
      
      switch (error.response.status) {
        case 401:
          message.error('登录已过期，请重新登录');
          console.log('响应拦截器 - 检测到401未授权状态，清除token并跳转到登录页');
          removeToken();
          
          // 使用setTimeout避免可能的循环重定向
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
          break;
        case 403:
          message.error('没有权限访问该资源');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误，请稍后再试');
          break;
        default:
          message.error(`请求失败：${error.message}`);
      }
    } else if (error.request) {
      standardError.message = '网络错误，请检查网络连接';
      message.error(standardError.message);
    } else {
      standardError.message = error.message || '请求错误';
      message.error(standardError.message);
    }
    
    // 为了方便调试，将标准化的错误对象打印到控制台
    console.error('标准化错误对象:', standardError);
    
    return Promise.reject(standardError);
  }
);

export default request; 