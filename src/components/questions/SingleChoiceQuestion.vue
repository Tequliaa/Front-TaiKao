<template>
  <div class="single-choice-question">
    <QuestionBase v-model="questionData" />
    
    <el-form-item label="是否必填">
      <el-switch v-model="questionData.required" :active-value="1" :inactive-value="0" />
    </el-form-item>

    <el-form-item label="是否开放">
      <el-switch v-model="questionData.isOpen" :active-value="1" :inactive-value="0" />
    </el-form-item>

    <el-form-item label="是否跳转">
      <el-switch v-model="questionData.isSkip" :active-value="1" :inactive-value="0" />
    </el-form-item>
<!-- 
    <el-form-item label="选项布局">
      <el-radio-group v-model="questionData.displayType">
        <el-radio label="行选项">行选项</el-radio>
        <el-radio label="列选项">列选项</el-radio>
      </el-radio-group>
    </el-form-item> -->

    <el-form-item label="选项">
      <div v-for="(option, index) in questionData.options" :key="index" class="option-item">
        <el-input v-model="option.description" placeholder="请输入选项内容" />
        <el-radio-group v-model="option.type" size="small">
          <el-radio label="行选项">行选项</el-radio>
          <el-radio label="列选项">列选项</el-radio>
          <el-radio label="填空">填空</el-radio>
        </el-radio-group>
        <el-button type="danger" link @click="removeOption(index)" v-if="questionData.options.length > 1">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
      <el-button type="primary" link @click="addOption">添加选项</el-button>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import QuestionBase from './QuestionBase.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const questionData = ref({
  ...props.modelValue,
  type: '单选',
  required: 0,
  isOpen: 0,
  isSkip: 0,
  // displayType: '行选项',
  options: props.modelValue.options || [{ description: '', type: '行选项' }]
})

// 添加选项
const addOption = () => {
  questionData.value.options.push({ description: '', type: '行选项' })
}

// 删除选项
const removeOption = (index) => {
  questionData.value.options.splice(index, 1)
}

watch(questionData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })
</script>

<style lang="scss" scoped>
.single-choice-question {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

  .option-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
}
</style> 