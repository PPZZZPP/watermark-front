import { defineStore } from 'pinia';
import { login, register, updateUserInfo, getUserInfo } from '@/api/user';

// Token操作的工具函数
const TokenUtil = {
  // 存储token
  setToken(token) {
    if (!token) {
      console.error('TokenUtil.setToken: token为空');
      return false;
    }
    
    let success = false;
    
    // 尝试使用localStorage存储
    try {
      localStorage.setItem('token', token);
      console.log('TokenUtil: token已保存到localStorage');
      success = true;
    } catch (e) {
      console.error('TokenUtil: localStorage保存token失败:', e);
    }
    
    // 备份到sessionStorage
    try {
      sessionStorage.setItem('token', token);
      console.log('TokenUtil: token已保存到sessionStorage');
      success = true;
    } catch (e) {
      console.error('TokenUtil: sessionStorage保存token失败:', e);
    }
    
    // 备份到cookie (7天过期)
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      document.cookie = `token=${token}; path=/; expires=${expirationDate.toUTCString()}`;
      console.log('TokenUtil: token已保存到cookie');
      success = true;
    } catch (e) {
      console.error('TokenUtil: cookie保存token失败:', e);
    }
    
    return success;
  },
  
  // 获取token
  getToken() {
    let token = '';
    
    // 首先尝试从localStorage获取
    try {
      token = localStorage.getItem('token');
      if (token) {
        console.log('TokenUtil: 从localStorage获取token成功');
        return token;
      }
    } catch (e) {
      console.error('TokenUtil: 从localStorage获取token失败:', e);
    }
    
    // 尝试从sessionStorage获取
    try {
      token = sessionStorage.getItem('token');
      if (token) {
        console.log('TokenUtil: 从sessionStorage获取token成功');
        // 同步到localStorage
        try {
          localStorage.setItem('token', token);
        } catch (e) {
          console.error('TokenUtil: 同步token到localStorage失败:', e);
        }
        return token;
      }
    } catch (e) {
      console.error('TokenUtil: 从sessionStorage获取token失败:', e);
    }
    
    // 尝试从cookie获取
    try {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('token=')) {
          token = cookie.substring('token='.length);
          console.log('TokenUtil: 从cookie获取token成功');
          // 同步到其他存储
          try {
            localStorage.setItem('token', token);
            sessionStorage.setItem('token', token);
          } catch (e) {
            console.error('TokenUtil: 同步token到其他存储失败:', e);
          }
          return token;
        }
      }
    } catch (e) {
      console.error('TokenUtil: 从cookie获取token失败:', e);
    }
    
    console.log('TokenUtil: 未找到token');
    return '';
  },
  
  // 删除token
  removeToken() {
    let success = false;
    
    // 从localStorage删除
    try {
      localStorage.removeItem('token');
      console.log('TokenUtil: 从localStorage删除token成功');
      success = true;
    } catch (e) {
      console.error('TokenUtil: 从localStorage删除token失败:', e);
    }
    
    // 从sessionStorage删除
    try {
      sessionStorage.removeItem('token');
      console.log('TokenUtil: 从sessionStorage删除token成功');
      success = true;
    } catch (e) {
      console.error('TokenUtil: 从sessionStorage删除token失败:', e);
    }
    
    // 从cookie删除
    try {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      console.log('TokenUtil: 从cookie删除token成功');
      success = true;
    } catch (e) {
      console.error('TokenUtil: 从cookie删除token失败:', e);
    }
    
    return success;
  }
};

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {},
    token: TokenUtil.getToken(),
    isLoggedIn: !!TokenUtil.getToken(),
  }),
  
  getters: {
    getUserInfo: (state) => state.userInfo,
    isLogin: (state) => state.isLoggedIn,
  },
  
  actions: {
    // 登录
    async loginAction(loginData) {
      try {
        console.log('Store: 发起登录请求', loginData);
        const response = await login(loginData);
        console.log('Store: 登录响应', response);
        
        if (response.code === 200) {
          this.userInfo = response.data.user;
          this.token = response.data.token;
          this.isLoggedIn = true;
          
          // 保存到存储
          console.log('Store: 保存token', response.data.token);
          const saveResult = TokenUtil.setToken(response.data.token);
          console.log('Store: token保存结果', saveResult);
          
          // 验证保存是否成功
          const savedToken = TokenUtil.getToken();
          console.log('Store: 验证保存的token', savedToken);
          
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        console.error('Store: 登录失败', error);
        return Promise.reject(error);
      }
    },
    
    // 注册
    async registerAction(registerData) {
      try {
        const response = await register(registerData);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 更新用户信息
    async updateUserInfoAction(userData) {
      try {
        const response = await updateUserInfo(userData);
        if (response.code === 200) {
          this.userInfo = { ...this.userInfo, ...userData };
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 获取用户信息
    async getUserInfoAction() {
      try {
        const response = await getUserInfo();
        if (response.code === 200) {
          this.userInfo = response.data;
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 退出登录
    logoutAction() {
      this.userInfo = {};
      this.token = '';
      this.isLoggedIn = false;
      TokenUtil.removeToken();
    },
  },
}); 