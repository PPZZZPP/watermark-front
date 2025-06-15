import { defineStore } from 'pinia';
import { 
  getProjects, 
  getProjectDetail, 
  createProject, 
  updateProject, 
  deleteProject, 
  batchDeleteProjects, 
  exportProjects,
  getProjectProgress
} from '@/api/project';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    currentProject: null,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0
    },
    loading: false,
    projectProgress: {},
  }),
  
  getters: {
    getProjectList: (state) => state.projects,
    getCurrentProject: (state) => state.currentProject,
    getPagination: (state) => state.pagination,
    getLoading: (state) => state.loading,
    getProjectProgress: (state) => state.projectProgress,
  },
  
  actions: {
    // 获取项目列表
    async fetchProjects(params = {}) {
      this.loading = true;
      try {
        const response = await getProjects({
          page: this.pagination.current,
          pageSize: this.pagination.pageSize,
          ...params
        });
        
        if (response.code === 200) {
          this.projects = response.data.list;
          this.pagination = {
            current: response.data.page,
            pageSize: response.data.pageSize,
            total: response.data.total
          };
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },
    
    // 获取项目详情
    async fetchProjectDetail(id) {
      this.loading = true;
      try {
        const response = await getProjectDetail(id);
        if (response.code === 200) {
          this.currentProject = response.data;
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },
    
    // 创建项目
    async createProject(projectData) {
      this.loading = true;
      try {
        const response = await createProject(projectData);
        if (response.code === 200) {
          // 刷新项目列表
          await this.fetchProjects();
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },
    
    // 更新项目
    async updateProject(id, projectData) {
      this.loading = true;
      try {
        const response = await updateProject(id, projectData);
        if (response.code === 200) {
          // 如果当前查看的是该项目，则更新当前项目
          if (this.currentProject && this.currentProject.id === id) {
            this.currentProject = { ...this.currentProject, ...projectData };
          }
          // 刷新项目列表
          await this.fetchProjects();
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },
    
    // 删除项目
    async deleteProject(id) {
      this.loading = true;
      try {
        const response = await deleteProject(id);
        if (response.code === 200) {
          // 刷新项目列表
          await this.fetchProjects();
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },
    
    // 批量删除项目
    async batchDeleteProjects(ids) {
      this.loading = true;
      try {
        const response = await batchDeleteProjects(ids);
        if (response.code === 200) {
          // 刷新项目列表
          await this.fetchProjects();
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },
    
    // 导出项目
    async exportProjects(ids) {
      this.loading = true;
      try {
        const response = await exportProjects(ids);
        return Promise.resolve(response);
      } catch (error) {
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },
    
    // 获取项目进度
    async fetchProjectProgress(id) {
      try {
        const response = await getProjectProgress(id);
        if (response.code === 200) {
          this.projectProgress = {
            ...this.projectProgress,
            [id]: response.data
          };
          return Promise.resolve(response);
        } else {
          return Promise.reject(response);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 重置状态
    resetState() {
      this.projects = [];
      this.currentProject = null;
      this.pagination = {
        current: 1,
        pageSize: 10,
        total: 0
      };
      this.loading = false;
      this.projectProgress = {};
    }
  }
});