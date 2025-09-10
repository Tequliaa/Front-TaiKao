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
          <span class="option-order">{{ index + 1 }}</span>
          <el-input
            v-model="option.description"
            :placeholder="`选项 ${index + 1}`"
          />
          <el-radio-group v-if="showOptionType" v-model="option.type" size="small">
            <el-radio label="行选项">行选项</el-radio>
            <el-radio label="列选项">列选项</el-radio>
            <el-radio label="填空">填空</el-radio>
          </el-radio-group>
          <div class="option-actions">
            <el-button type="primary" link @click="editOption(index)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="text" @click="deleteOption(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <el-button type="primary" @click="addOption">添加选项</el-button>
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Delete, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { optionDelService } from '@/api/option'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  questionType: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'edit-option'])

// 计算是否显示选项类型
const showOptionType = computed(() => {
  return !['单选', '多选'].includes(props.questionType)
})

// 添加选项
const addOption = () => {
  const newOptions = [...props.modelValue.options, { description: '', type: '行选项' }]
  emit('update:modelValue', { ...props.modelValue, options: newOptions })
}

// 编辑选项
const editOption = (index) => {
  const option = props.modelValue.options[index]
  // console.log('QuestionBase - 编辑选项:', { option, index })
  // console.log('QuestionBase - 当前modelValue:', props.modelValue)
  emit('edit-option', { option, index })
}

// 删除选项
const deleteOption = async (index) => {
  const option = props.modelValue.options[index]
  
  // 如果选项有ID，调用后端删除服务
  if (option.optionId) {
    try {
      const result = await optionDelService(option.optionId)
      if (result.code === 200) {
        ElMessage.success('选项删除成功')
        const newOptions = [...props.modelValue.options]
        newOptions.splice(index, 1)
        emit('update:modelValue', { ...props.modelValue, options: newOptions })
      } else {
        ElMessage.error(result.message || '选项删除失败')
      }
    } catch (error) {
      ElMessage.error('选项删除失败：' + error.message)
    }
  } else {
    // 如果选项没有ID，直接从前端删除
    const newOptions = [...props.modelValue.options]
    newOptions.splice(index, 1)
    emit('update:modelValue', { ...props.modelValue, options: newOptions })
  }
}

// 确保所有选项都有type属性
watch(() => props.modelValue.options, (newOptions) => {
  if (newOptions) {
    const updatedOptions = newOptions.map(option => ({
      ...option,
      type: option.type || '行选项'
    }))
    if (JSON.stringify(updatedOptions) !== JSON.stringify(newOptions)) {
      emit('update:modelValue', { ...props.modelValue, options: updatedOptions })
    }
  }
}, { deep: true })
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
      
      .option-order {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f0f2f5;
        border-radius: 4px;
        font-size: 12px;
        color: #606266;
      }
      
      .option-actions {
        display: flex;
        gap: 5px;
      }
    }
  }
}
</style> 