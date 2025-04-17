<template>
  <div class="text-question">
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

    <el-form-item label="输入类型">
      <el-radio-group v-model="questionData.inputType">
        <el-radio label="text">单行文本</el-radio>
        <el-radio label="textarea">多行文本</el-radio>
        <el-radio label="number">数字</el-radio>
        <el-radio label="email">邮箱</el-radio>
        <el-radio label="phone">手机号</el-radio>
      </el-radio-group>
    </el-form-item>

    <template v-if="questionData.inputType === 'number'">
      <el-form-item label="数字范围">
        <el-input-number 
          v-model="questionData.minValue" 
          :min="Number.MIN_SAFE_INTEGER"
          :max="questionData.maxValue - 1"
        />
        <span class="range-separator">至</span>
        <el-input-number 
          v-model="questionData.maxValue" 
          :min="questionData.minValue + 1"
          :max="Number.MAX_SAFE_INTEGER"
        />
      </el-form-item>
    </template>

    <template v-if="questionData.inputType === 'textarea'">
      <el-form-item label="最大字数">
        <el-input-number 
          v-model="questionData.maxLength" 
          :min="1"
          :max="10000"
        />
      </el-form-item>
    </template>

    <el-form-item label="输入提示">
      <el-input
        v-model="questionData.placeholder"
        :placeholder="getPlaceholderHint"
      />
    </el-form-item>

    <el-form-item label="输入预览">
      <div class="input-preview">
        <el-input
          v-if="questionData.inputType === 'text'"
          :placeholder="questionData.placeholder"
          :maxlength="questionData.maxLength"
        />
        <el-input
          v-else-if="questionData.inputType === 'textarea'"
          type="textarea"
          :rows="3"
          :placeholder="questionData.placeholder"
          :maxlength="questionData.maxLength"
        />
        <el-input-number
          v-else-if="questionData.inputType === 'number'"
          :min="questionData.minValue"
          :max="questionData.maxValue"
          :placeholder="questionData.placeholder"
        />
        <el-input
          v-else-if="questionData.inputType === 'email'"
          type="email"
          :placeholder="questionData.placeholder"
        />
        <el-input
          v-else-if="questionData.inputType === 'phone'"
          type="tel"
          :placeholder="questionData.placeholder"
        />
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const questionData = ref({
  ...props.modelValue,
  type: 'text',
  required: false,
  inputType: 'text',
  minValue: 0,
  maxValue: 100,
  maxLength: 200,
  placeholder: '',
  description: props.modelValue.description || ''
})

const getPlaceholderHint = computed(() => {
  const hints = {
    text: '请输入文本',
    textarea: '请输入多行文本',
    number: '请输入数字',
    email: '请输入邮箱地址',
    phone: '请输入手机号码'
  }
  return hints[questionData.value.inputType]
})

watch(questionData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })
</script>

<style lang="scss" scoped>
.text-question {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

  .range-separator {
    margin: 0 10px;
  }

  .input-preview {
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;
  }
}
</style> 