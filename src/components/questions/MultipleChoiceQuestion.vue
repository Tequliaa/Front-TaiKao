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
      
      <el-form-item label="必填">
        <el-switch v-model="questionData.isRequired" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <el-form-item label="有开放选项">
        <el-switch v-model="questionData.isOpen" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <el-form-item label="有跳转选项">
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
          :placeholder="questionData.isRequired ? '1' : '0'"
        />
      </el-form-item>

      <el-form-item label="最多选择">
        <el-input-number 
          v-model="questionData.maxSelections" 
          :min="1" 
          :max="questionData.options.length"
          :placeholder="questionData.options.length.toString()"
        />
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
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

// 监听isOpen变化
watch(() => questionData.value.isOpen, (newVal) => {
  if (newVal === 1) {
    // 检查是否已经存在开放选项
    const hasOpenOption = questionData.value.options.some(option => option.isOpen === 1)
    if (!hasOpenOption) {
      questionData.value.options.push({
        description: '其他（请填写）',
        type: '行选项',
        isOpen: 1,
        isOpenOption: 1,
        openAnswer: ''
      })
      emit('update:modelValue', { ...questionData.value })
    }
  } else {
    // 移除开放选项
    questionData.value.options = questionData.value.options.filter(option => option.isOpen !== 1)
    emit('update:modelValue', { ...questionData.value })
  }
})

// 监听isSkip变化
watch(() => questionData.value.isSkip, (newVal) => {
  if (newVal === 1) {
    // 检查是否已经存在跳转选项
    const hasSkipOption = questionData.value.options.some(option => option.isSkip === 1)
    if (!hasSkipOption) {
      questionData.value.options.push({
        description: '这个是跳转选项，请设置',
        type: '行选项',
        isSkip: 1
      })
      emit('update:modelValue', { ...questionData.value })
    }
  } else {
    // 移除跳转选项
    questionData.value.options = questionData.value.options.filter(option => option.isSkip !== 1)
    emit('update:modelValue', { ...questionData.value })
  }
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
  // 如果是开放选项，确保保留isOpen和isOpenOption属性
  if (data.option.isOpen === 1) {
    data.option = {
      ...data.option,
      isOpen: 1,
      isOpenOption: 1,
      openAnswer: data.option.openAnswer || ''
    }
  }
  
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

// 在 script 部分添加 watch
watch(() => questionData.value.isRequired, (newValue) => {
  if (newValue) {
    questionData.value.minSelections = 1
  } else {
    questionData.value.minSelections = 0
  }
}, { immediate: true })

// 在初始化时设置默认值
onMounted(() => {
  if (questionData.value.isRequired) {
    questionData.value.minSelections = 1
  } else {
    questionData.value.minSelections = 0
  }
  questionData.value.maxSelections = questionData.value.options.length
})
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