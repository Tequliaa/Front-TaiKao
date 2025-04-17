<template>
  <div class="rating-question">
    <el-form-item label="问题描述">
      <el-input
        v-model="questionData.description"
        type="textarea"
        :rows="3"
        placeholder="请输入问题描述"
      />
    </el-form-item>

    <el-form-item label="是否必填">
      <el-switch v-model="questionData.required" />
    </el-form-item>

    <el-form-item label="显示方式">
      <el-radio-group v-model="questionData.displayType">
        <el-radio label="五角星">五角星</el-radio>
        <el-radio label="滑动条">滑动条</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="评分范围">
      <el-input-number 
        v-model="questionData.minScore" 
        :min="1" 
        :max="questionData.maxScore - 1"
      />
      <span class="score-separator">至</span>
      <el-input-number 
        v-model="questionData.maxScore" 
        :min="questionData.minScore + 1" 
        :max="10"
      />
    </el-form-item>

    <el-form-item label="评分说明">
      <el-input
        v-model="questionData.scoreDescription"
        type="textarea"
        :rows="2"
        placeholder="请输入评分说明（如：1分表示非常不满意，5分表示非常满意）"
      />
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const questionData = ref({
  ...props.modelValue,
  type: 'rating',
  required: false,
  displayType: '五角星',
  minScore: 1,
  maxScore: 5,
  scoreDescription: '',
  description: props.modelValue.description || ''
})

watch(questionData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })
</script>

<style lang="scss" scoped>
.rating-question {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

  .score-separator {
    margin: 0 10px;
  }
}
</style> 