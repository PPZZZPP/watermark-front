<template>
  <div class="page-header">
    <!-- 标题和操作区域 -->
    <div class="page-header-content">
      <!-- 左侧标题区域 -->
      <div class="page-header-heading">
        <span class="title-icon" v-if="$slots.icon">
          <slot name="icon"></slot>
        </span>
        <div class="title-wrapper">
          <span class="page-header-title">{{ title }}</span>
          <span v-if="subTitle" class="page-header-subtitle">{{ subTitle }}</span>
          <div class="page-header-tags" v-if="$slots.tags">
            <slot name="tags"></slot>
          </div>
        </div>
      </div>
      
      <!-- 右侧操作按钮 -->
      <div class="page-header-extra">
        <slot name="extra"></slot>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="page-header-content-area" v-if="$slots.content">
      <slot name="content"></slot>
    </div>

    <!-- 页面描述 -->
    <div class="page-header-footer" v-if="$slots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import Breadcrumb from './Breadcrumb.vue';

defineProps({
  title: {
    type: String,
    default: ''
  },
  subTitle: {
    type: String,
    default: ''
  }
});
</script>

<style lang="less" scoped>
// 页面头部组件样式
.page-header {
  background: #fff;
  padding: 16px 24px;
  border-radius: 2px 2px 0 0;
  transition: all 0.3s;
}

.page-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header-heading {
  display: flex;
  align-items: center;
  flex: 1;
}

.title-icon {
  margin-right: 16px;
  color: #1890ff;
  font-size: 24px;
  display: flex;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
}

.page-header-title {
  color: rgba(0, 0, 0, 0.85);
  font-weight: 600;
  font-size: 20px;
  line-height: 32px;
}

.page-header-subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 22px;
  margin-top: 4px;
}

.page-header-tags {
  margin-top: 8px;
}

.page-header-extra {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.page-header-content-area {
  margin-top: 24px;
}

.page-header-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style> 