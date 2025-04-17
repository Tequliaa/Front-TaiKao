<template>
  <div class="question-base">
    <el-form-item label="问题描述">
      <el-input
        v-model="modelValue.description"
        type="textarea"
        :rows="3"
        placeholder="请输入问题描述"
      />
    </el-form-item>

    <el-form-item label="选项">
      <div class="options-container">
        <div v-for="(option, index) in modelValue.options" 
             :key="index"
             class="option-item">
          <el-input
            v-model="option.description"
            :placeholder="`选项 ${index + 1}`"
          />
          <el-button type="text" @click="deleteOption(index)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <el-button type="primary" @click="addOption">添加选项</el-button>
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// 添加选项
const addOption = () => {
  const newOptions = [...props.modelValue.options, { description: '' }]
  emit('update:modelValue', { ...props.modelValue, options: newOptions })
}

// 删除选项
const deleteOption = (index) => {
  const newOptions = [...props.modelValue.options]
  newOptions.splice(index, 1)
  emit('update:modelValue', { ...props.modelValue, options: newOptions })
}
</script>

<style lang="scss" scoped>
.question-base {
  .options-container {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .option-item {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }
}
</style> 