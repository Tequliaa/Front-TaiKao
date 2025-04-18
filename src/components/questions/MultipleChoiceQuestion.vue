<template>
  <div class="multiple-choice-question">
    <div class="question-header" @click="isCollapsed = !isCollapsed">
      <div class="header-content">
        <span class="question-type">多选题</span>
        <span class="question-desc" v-if="questionData.description">{{ questionData.description }}</span>
      </div>
      <el-button type="primary" link class="collapse-btn">
        <el-icon><component :is="isCollapsed ? 'ArrowDown' : 'ArrowUp'" /></el-icon>
        {{ isCollapsed ? '展开' : '收起' }}
      </el-button>
    </div>

    <div v-show="!isCollapsed" class="question-content">
      <QuestionBase
        v-model="questionData"
        :question-type="questionData.type"
        @edit-option="handleEditOption"
      />
      
      <el-form-item label="是否必填">
        <el-switch v-model="questionData.isRequired" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <el-form-item label="是否开放">
        <el-switch v-model="questionData.isOpen" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <el-form-item label="是否跳转">
        <el-switch v-model="questionData.isSkip" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <!-- <el-form-item label="选项布局">
        <el-radio-group v-model="questionData.layout">
          <el-radio label="vertical">垂直排列</el-radio>
          <el-radio label="horizontal">水平排列</el-radio>
        </el-radio-group>
      </el-form-item> -->

      <el-form-item label="最少选择">
        <el-input-number 
          v-model="questionData.minSelections" 
          :min="0" 
          :max="questionData.options.length"
          :disabled="!questionData.isRequired"
        />
      </el-form-item>

      <el-form-item label="最多选择">
        <el-input-number 
          v-model="questionData.maxSelections" 
          :min="1" 
          :max="questionData.options.length"
        />
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import QuestionBase from './QuestionBase.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'edit-option'])
const isCollapsed = ref(false)

const questionData = ref({
  ...props.modelValue,
  type: '多选',
  options: props.modelValue.options || [{ description: '', type: '行选项' }]
})

// 监听props变化，同步数据
watch(() => props.modelValue, (newVal) => {
  if (newVal && JSON.stringify(newVal) !== JSON.stringify(questionData.value)) {
    questionData.value = {
      ...newVal,
      type: '多选',
      options: newVal.options || [{ description: '', type: '行选项' }]
    }
  }
}, { deep: true })

// 处理编辑选项
const handleEditOption = (data) => {
  emit('edit-option', {
    ...data,
    questionId: questionData.value.questionId
  })
}

// 监听内部数据变化，同步到父组件
watch(questionData, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', { ...newVal })
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.multiple-choice-question {
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