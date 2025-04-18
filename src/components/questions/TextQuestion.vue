<template>
  <div class="text-question">
    <div class="question-header" @click="isCollapsed = !isCollapsed">
      <div class="header-content">
        <span class="question-type">填空题</span>
        <span class="question-desc" v-if="questionData.description">{{ questionData.description }}</span>
      </div>
      <el-button type="primary" link class="collapse-btn">
        <el-icon><component :is="isCollapsed ? 'ArrowDown' : 'ArrowUp'" /></el-icon>
        {{ isCollapsed ? '展开' : '收起' }}
      </el-button>
    </div>

    <div v-show="!isCollapsed" class="question-content">
      <el-form-item label="问题描述">
        <el-input
          v-model="questionData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入问题描述"
        />
      </el-form-item>

      <el-form-item label="是否必填">
        <el-switch v-model="questionData.isRequired" :active-value="1" :inactive-value="0" />
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
const isCollapsed = ref(false)

const questionData = ref({
  ...props.modelValue,
  type: '填空',
  description: props.modelValue.description || ''
})

// 监听props变化，同步数据
watch(() => props.modelValue, (newVal) => {
  if (newVal && JSON.stringify(newVal) !== JSON.stringify(questionData.value)) {
    questionData.value = {
      ...newVal,
      type: '填空',
      description: newVal.description || ''
    }
  }
}, { deep: true })

// 监听内部数据变化，同步到父组件
watch(questionData, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', { ...newVal })
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.text-question {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid #ebeef5;

    &:hover {
      background-color: #f5f7fa;
      border-radius: 4px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 10px;

      .question-type {
        font-weight: bold;
        color: #409eff;
      }

      .question-desc {
        color: #606266;
        font-size: 14px;
      }
    }

    .collapse-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;

      &:hover {
        background-color: #ecf5ff;
      }
    }
  }

  .question-content {
    transition: all 0.3s ease;
  }
}
</style> 