import { defineStore } from 'pinia';
import { 
  getUserList, 
  createUser, 
  updateUser, 
  deleteUser, 
  resetUserPassword,
  getRoleList,
  getAllRoles,
  getRoleDetail,
  getModelList,
  getModelDetail,
  publishModel,
  updateModelStatus,
  deleteModel
} from '@/api/system';

export const useSystemStore = defineStore('system', {
  state: () => ({
    // 用户管理相关状态
    userList: [],
    userTotal: 0,
    userPagination: {
      current: 1,
      pageSize: 10,
    },
    
    // 角色管理相关状态
    roleList: [],
    roleTotal: 0,
    rolePagination: {
      current: 1,
      pageSize: 10,
    },
    
    // 模型管理相关状态
    modelList: [],
    modelTotal: 0,
    modelPagination: {
      current: 1,
      pageSize: 10,
    },
  }),
  
  getters: {
    getUserList: (state) => state.userList,
    getUserTotal: (state) => state.userTotal,
    getRoleList: (state) => state.roleList,
    getRoleTotal: (state) => state.roleTotal,
    getModelList: (state) => state.modelList,
    getModelTotal: (state) => state.modelTotal,
  },
  
  actions: {
    // 获取用户列表
    async getUserListAction(params) {
      try {
        const response = await getUserList(params);
        if (response.code === 200) {
          this.userList = response.data.list;
          this.userTotal = response.data.total;
          this.userPagination.current = params.page || 1;
          this.userPagination.pageSize = params.pageSize || 10;
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 创建用户
    async createUserAction(userData) {
      try {
        const response = await createUser(userData);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 更新用户
    async updateUserAction(userData) {
      try {
        const response = await updateUser(userData);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 删除用户
    async deleteUserAction(userId) {
      try {
        const response = await deleteUser(userId);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 重置用户密码
    async resetUserPasswordAction(data) {
      try {
        const response = await resetUserPassword(data);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 获取角色列表（分页）
    async getRoleListAction(params) {
      try {
        const response = await getRoleList(params);
        if (response.code === 200) {
          this.roleList = response.data.list;
          this.roleTotal = response.data.total;
          this.rolePagination.current = params.page || 1;
          this.rolePagination.pageSize = params.pageSize || 10;
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 获取所有角色（不分页）
    async getAllRolesAction() {
      try {
        const response = await getAllRoles();
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 获取角色详情
    async getRoleDetailAction(roleId) {
      try {
        const response = await getRoleDetail(roleId);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 获取模型列表
    async getModelListAction(params) {
      try {
        const response = await getModelList(params);
        if (response.code === 200) {
          this.modelList = response.data.list;
          this.modelTotal = response.data.total;
          this.modelPagination.current = params.page || 1;
          this.modelPagination.pageSize = params.pageSize || 10;
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 获取模型详情
    async getModelDetailAction(modelId) {
      try {
        const response = await getModelDetail(modelId);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 发布模型
    async publishModelAction(modelData) {
      try {
        const response = await publishModel(modelData);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 更新模型状态
    async updateModelStatusAction(data) {
      try {
        const response = await updateModelStatus(data);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 删除模型
    async deleteModelAction(modelId) {
      try {
        const response = await deleteModel(modelId);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      }
    },
  },
}); 