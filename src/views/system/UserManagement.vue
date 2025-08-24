<template>
  <div class="user-management-container">
    <!-- 页面头部 -->
    <PageHeader title="用户管理" subTitle="创建、修改和删除系统用户账号">
      <template #icon>
        <team-outlined />
      </template>
      <template #tags>
        <a-tag color="blue">系统管理</a-tag>
        <a-tag color="green">用户管理</a-tag>
      </template>
      <template #extra>
        <a-button type="primary" @click="showAddUserModal">
          <template #icon><user-add-outlined /></template>
          新增用户
        </a-button>
        <a-button @click="handleRefresh">
          <template #icon><reload-outlined /></template>
          刷新
        </a-button>
      </template>
    </PageHeader>

    <!-- 搜索区域 -->
    <div class="search-container">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="用户名">
          <a-input v-model:value="searchForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="searchForm.role" placeholder="请选择角色" allow-clear style="width: 160px">
            <a-select-option v-for="role in roleList" :key="role.code" :value="role.code">{{ role.name }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <template #icon><search-outlined /></template>
            搜索
          </a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">
            <template #icon><clear-outlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 用户列表 -->
    <a-table
      :columns="columns"
      :data-source="userList"
      :loading="loading"
      :pagination="pagination"
      @change="handleTableChange"
      row-key="id"
      bordered
    >
      <!-- 用户名列 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'username'">
          <a @click="showUserDetails(record)">{{ record.username }}</a>
        </template>
        
        <!-- 性别列 -->
        <template v-if="column.key === 'gender'">
          <span v-if="record.gender === 'male'">男</span>
          <span v-else-if="record.gender === 'female'">女</span>
          <span v-else>未设置</span>
        </template>
        
        <!-- 操作列 -->
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="showEditUserModal(record)">
              <template #icon><edit-outlined /></template>
              编辑
            </a-button>
            <a-button type="link" size="small" @click="showResetPasswordModal(record)">
              <template #icon><key-outlined /></template>
              重置密码
            </a-button>
            <a-popconfirm
              title="确定要删除此用户吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="deleteUser(record.id)"
            >
              <a-button type="link" danger size="small">
                <template #icon><delete-outlined /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新增用户模态框 -->
    <a-modal
      v-model:visible="addUserModalVisible"
      title="新增用户"
      :confirm-loading="submitLoading"
      @ok="handleAddUser"
      width="600px"
    >
      <a-form
        :model="userForm"
        :rules="rules"
        ref="userFormRef"
        layout="vertical"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item name="username" label="用户名">
              <a-input v-model:value="userForm.username" placeholder="请输入用户名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="password" label="密码">
              <a-input-password v-model:value="userForm.password" placeholder="请输入密码" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item name="email" label="邮箱">
              <a-input v-model:value="userForm.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="phone" label="手机号">
              <a-input v-model:value="userForm.phone" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="24">

          <a-col :span="12">
            <a-form-item name="gender" label="性别">
              <a-select v-model:value="userForm.gender" placeholder="请选择性别">
                <a-select-option value="male">男</a-select-option>
                <a-select-option value="female">女</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="role" label="角色">
              <a-select v-model:value="userForm.role" placeholder="请选择角色">
                <a-select-option v-for="role in roleList" :key="role.code" :value="role.code">{{ role.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
      </a-form>
    </a-modal>

    <!-- 编辑用户模态框 -->
    <a-modal
      v-model:visible="editUserModalVisible"
      title="编辑用户"
      :confirm-loading="submitLoading"
      @ok="handleEditUser"
      width="600px"
    >
      <a-form
        :model="userForm"
        :rules="editRules"
        ref="editFormRef"
        layout="vertical"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item name="username" label="用户名">
              <a-input v-model:value="userForm.username" disabled />
            </a-form-item>
          </a-col>

        </a-row>
        
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item name="email" label="邮箱">
              <a-input v-model:value="userForm.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="phone" label="手机号">
              <a-input v-model:value="userForm.phone" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item name="gender" label="性别">
              <a-select v-model:value="userForm.gender" placeholder="请选择性别">
                <a-select-option value="male">男</a-select-option>
                <a-select-option value="female">女</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="role" label="角色">
              <a-select v-model:value="userForm.role" placeholder="请选择角色">
                <a-select-option v-for="role in roleList" :key="role.code" :value="role.code">{{ role.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
      </a-form>
    </a-modal>

    <!-- 重置密码模态框 -->
    <a-modal
      v-model:visible="resetPasswordModalVisible"
      title="重置密码"
      :confirm-loading="submitLoading"
      @ok="handleResetPassword"
    >
      <a-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        layout="vertical"
      >
        <a-form-item name="newPassword" label="新密码">
          <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item name="confirmPassword" label="确认密码">
          <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请确认新密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import { 
  TeamOutlined, 
  UserAddOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined,
  EditOutlined,
  KeyOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';
import { useSystemStore } from '@/store/system';
import { validateEmail, validatePhone } from '@/utils/validate';

// 系统管理存储
const systemStore = useSystemStore();

// 表单引用
const userFormRef = ref(null);
const editFormRef = ref(null);
const passwordFormRef = ref(null);

// 加载状态
const loading = ref(false);
const submitLoading = ref(false);

// 模态框状态
const addUserModalVisible = ref(false);
const editUserModalVisible = ref(false);
const resetPasswordModalVisible = ref(false);

// 当前选中的用户ID
const currentUserId = ref(null);

// 用户列表
const userList = ref([]);

// 角色列表
const roleList = ref([]);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`,
});

// 搜索表单
const searchForm = reactive({
  username: '',
  email: '',
  department: '',
  role: ''
});

// 用户表单
const userForm = reactive({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  gender: '',
  department: '',
  role: 'user',
});

// 密码表单
const passwordForm = reactive({
  newPassword: '',
  confirmPassword: '',
});

// 表格列定义
const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    sorter: true,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    key: 'phone',
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    customRender: ({ text }) => {
      const role = roleList.value.find(r => r.code === text);
      return role ? role.name : text;
    }
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    sorter: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 220,
  },
];

// 表单校验规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: (_, value) => {
      if (!value || validateEmail(value)) {
        return Promise.resolve();
      }
      return Promise.reject('邮箱格式不正确');
    }, trigger: 'blur' },
  ],
  phone: [
    { validator: (_, value) => {
      if (!value || validatePhone(value)) {
        return Promise.resolve();
      }
      return Promise.reject('手机号格式不正确');
    }, trigger: 'blur' },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
};

// 编辑表单校验规则（不包含密码）
const editRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: (_, value) => {
      if (!value || validateEmail(value)) {
        return Promise.resolve();
      }
      return Promise.reject('邮箱格式不正确');
    }, trigger: 'blur' },
  ],
  phone: [
    { validator: (_, value) => {
      if (!value || validatePhone(value)) {
        return Promise.resolve();
      }
      return Promise.reject('手机号格式不正确');
    }, trigger: 'blur' },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
};

// 密码校验规则
const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (_, value) => {
      if (!value || value === passwordForm.newPassword) {
        return Promise.resolve();
      }
      return Promise.reject('两次输入的密码不一致');
    }, trigger: ['blur', 'change'] },
  ],
};

// 获取用户列表
const fetchUserList = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...searchForm,
    };
    
    const result = await systemStore.getUserListAction(params);
    userList.value = result.data.list;
    pagination.total = result.data.total;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    message.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 表格变化处理
const handleTableChange = (pag, filters, sorter) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  
  // 处理排序
  if (sorter.field) {
    searchForm.sortField = sorter.field;
    searchForm.sortOrder = sorter.order;
  } else {
    searchForm.sortField = undefined;
    searchForm.sortOrder = undefined;
  }
  
  fetchUserList();
};

// 搜索处理
const handleSearch = () => {
  pagination.current = 1;
  fetchUserList();
};

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = '';
  });
  pagination.current = 1;
  fetchUserList();
};

// 刷新
const handleRefresh = () => {
  fetchUserList();
  message.success('数据已刷新');
};

// 显示新增用户模态框
const showAddUserModal = () => {
  // 重置表单
  Object.keys(userForm).forEach(key => {
    userForm[key] = key === 'role' ? 'user' : '';
  });
  
  // 显示模态框
  addUserModalVisible.value = true;
};

// 处理新增用户
const handleAddUser = async () => {
  try {
    await userFormRef.value.validate();
    
    submitLoading.value = true;
    
    const result = await systemStore.createUserAction(userForm);
    
    if (result.code === 200) {
      message.success('用户创建成功');
      addUserModalVisible.value = false;
      fetchUserList();
    }
  } catch (error) {
    console.error('创建用户失败:', error);
    if (error && error.errorFields) {
      // 表单验证错误
    } else {
      message.error(error.message || '创建用户失败');
    }
  } finally {
    submitLoading.value = false;
  }
};

// 显示编辑用户模态框
const showEditUserModal = (record) => {
  // 填充表单数据
  Object.keys(userForm).forEach(key => {
    userForm[key] = record[key] || '';
  });
  
  currentUserId.value = record.id;
  editUserModalVisible.value = true;
};

// 处理编辑用户
const handleEditUser = async () => {
  try {
    await editFormRef.value.validate();
    
    submitLoading.value = true;
    
    const result = await systemStore.updateUserAction({
      id: currentUserId.value,
      ...userForm,
    });
    
    if (result.code === 200) {
      message.success('用户信息更新成功');
      editUserModalVisible.value = false;
      fetchUserList();
    }
  } catch (error) {
    console.error('更新用户失败:', error);
    if (error && error.errorFields) {
      // 表单验证错误
    } else {
      message.error(error.message || '更新用户失败');
    }
  } finally {
    submitLoading.value = false;
  }
};

// 显示重置密码模态框
const showResetPasswordModal = (record) => {
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  
  currentUserId.value = record.id;
  resetPasswordModalVisible.value = true;
};

// 处理重置密码
const handleResetPassword = async () => {
  try {
    await passwordFormRef.value.validate();
    
    submitLoading.value = true;
    
    const result = await systemStore.resetUserPasswordAction({
      id: currentUserId.value,
      newPassword: passwordForm.newPassword,
    });
    
    if (result.code === 200) {
      message.success('密码重置成功');
      resetPasswordModalVisible.value = false;
    }
  } catch (error) {
    console.error('重置密码失败:', error);
    if (error && error.errorFields) {
      // 表单验证错误
    } else {
      message.error(error.message || '重置密码失败');
    }
  } finally {
    submitLoading.value = false;
  }
};

// 删除用户
const deleteUser = async (id) => {
  try {
    const result = await systemStore.deleteUserAction(id);
    
    if (result.code === 200) {
      message.success('用户删除成功');
      fetchUserList();
    }
  } catch (error) {
    console.error('删除用户失败:', error);
    message.error(error.message || '删除用户失败');
  }
};

// 显示用户详情
const showUserDetails = (record) => {
  message.info(`查看用户 ${record.username} 的详细信息功能即将上线`);
};

// 获取所有角色
const fetchAllRoles = async () => {
  try {
    const result = await systemStore.getAllRolesAction();
    if (result.code === 200) {
      roleList.value = result.data;
    }
  } catch (error) {
    console.error('获取角色列表失败:', error);
    message.error('获取角色列表失败');
  }
};

// 组件挂载时获取用户列表和角色列表
onMounted(() => {
  fetchUserList();
  fetchAllRoles();
});
</script>

<style lang="less" scoped>
.user-management-container {
  min-height: calc(100vh - 184px);
}

.search-container {
  background-color: #fff;
  padding: 24px;
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

:deep(.ant-table) {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

:deep(.ant-table-pagination) {
  margin: 16px 0;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .search-container {
    padding: 16px;
  }
  
  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }
}
</style> 