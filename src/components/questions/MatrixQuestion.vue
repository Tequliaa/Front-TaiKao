<template>
  <div class="matrix-question">
    <div class="question-header" @click="isCollapsed = !isCollapsed">
      <div class="header-content">
        <span class="question-type">矩阵题</span>
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

      <el-form-item label="必填">
        <el-switch v-model="questionData.isRequired" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <el-form-item label="矩阵类型">
        <el-radio-group v-model="questionData.matrixType">
          <el-radio label="single">矩阵单选</el-radio>
          <el-radio label="multiple">矩阵多选</el-radio>
        </el-radio-group>
      </el-form-item>

      <div class="options-layout">
        <el-form-item label="行选项" class="row-options">
          <div class="options-container">
            <div v-for="(option, index) in questionData.rowOptions" 
                 :key="index"
                 class="option-item">
              <span class="option-order">{{ index + 1 }}</span>
              <el-input
                v-model="option.description"
                :placeholder="`行选项 ${index + 1}`"
                size="small"
              />
              <div class="option-actions">
                <el-button type="primary" link @click="editRowOption(index)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button type="text" @click="deleteRowOption(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <el-button type="primary" size="small" @click="addRowOption">添加行选项</el-button>
          </div>
        </el-form-item>

        <el-form-item label="列选项" class="column-options">
          <div class="options-container">
            <div v-for="(option, index) in questionData.columnOptions" 
                 :key="index"
                 class="option-item">
              <span class="option-order">{{ index + 1 }}</span>
              <el-input
                v-model="option.description"
                :placeholder="`列选项 ${index + 1}`"
                size="small"
              />
              <div class="option-actions">
                <el-button type="primary" link @click="editColumnOption(index)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button type="text" @click="deleteColumnOption(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <el-button type="primary" size="small" @click="addColumnOption">添加列选项</el-button>
          </div>
        </el-form-item>
      </div>

      <el-form-item label="矩阵预览">
        <div class="matrix-preview">
          <table>
            <thead>
              <tr>
                <th></th>
                <th v-for="(option, index) in questionData.columnOptions" 
                    :key="index">
                  {{ option.description }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rowOption, rowIndex) in questionData.rowOptions" 
                  :key="rowIndex">
                <td>{{ rowOption.description }}</td>
                <td v-for="(colOption, colIndex) in questionData.columnOptions" 
                    :key="colIndex">
                  <el-radio v-if="questionData.matrixType === 'single'" 
                           :name="`row-${rowIndex}`" />
                  <el-checkbox v-else />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ArrowUp, ArrowDown, Edit, Delete } from '@element-plus/icons-vue'
import { optionDelService } from '@/api/option'
import { ElMessage } from 'element-plus'

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
  type: props.modelValue.matrixType === 'single' ? '矩阵单选' : '矩阵多选',
  matrixType: props.modelValue.matrixType || 'single',
  description: props.modelValue.description || '',
  rowOptions: props.modelValue.options?.filter(opt => opt.type === '行选项') || [{ description: '', type: '行选项' }],
  columnOptions: props.modelValue.options?.filter(opt => opt.type === '列选项') || [{ description: '', type: '列选项' }]
})

// 添加行选项
const addRowOption = () => {
  const newOptions = [...questionData.value.rowOptions, { description: '', type: '行选项' }]
  questionData.value = { ...questionData.value, rowOptions: newOptions }
  emit('update:modelValue', { ...questionData.value })
}

// 编辑行选项
const editRowOption = (index) => {
  const option = questionData.value.rowOptions[index]
  emit('edit-option', { option, index, isRow: true })
}

// 删除行选项
const deleteRowOption = async (index) => {
  const option = questionData.value.rowOptions[index]
  
  // 如果选项有ID，调用后端删除服务
  if (option.optionId) {
    try {
      const result = await optionDelService(option.optionId)
      if (result.code === 0) {
        ElMessage.success('选项删除成功')
        const newOptions = [...questionData.value.rowOptions]
        newOptions.splice(index, 1)
        questionData.value = { ...questionData.value, rowOptions: newOptions }
        emit('update:modelValue', { ...questionData.value })
      } else {
        ElMessage.error(result.message || '选项删除失败')
      }
    } catch (error) {
      ElMessage.error('选项删除失败：' + error.message)
    }
  } else {
    // 如果选项没有ID，直接从前端删除
    const newOptions = [...questionData.value.rowOptions]
    newOptions.splice(index, 1)
    questionData.value = { ...questionData.value, rowOptions: newOptions }
    emit('update:modelValue', { ...questionData.value })
  }
}

// 添加列选项
const addColumnOption = () => {
  const newOptions = [...questionData.value.columnOptions, { description: '', type: '列选项' }]
  questionData.value = { ...questionData.value, columnOptions: newOptions }
  emit('update:modelValue', { ...questionData.value })
}

// 编辑列选项
const editColumnOption = (index) => {
  const option = questionData.value.columnOptions[index]
  emit('edit-option', { option, index, isRow: false })
}

// 删除列选项
const deleteColumnOption = async (index) => {
  const option = questionData.value.columnOptions[index]
  
  // 如果选项有ID，调用后端删除服务
  if (option.optionId) {
    try {
      const result = await optionDelService(option.optionId)
      if (result.code === 0) {
        ElMessage.success('选项删除成功')
        const newOptions = [...questionData.value.columnOptions]
        newOptions.splice(index, 1)
        questionData.value = { ...questionData.value, columnOptions: newOptions }
        emit('update:modelValue', { ...questionData.value })
      } else {
        ElMessage.error(result.message || '选项删除失败')
      }
    } catch (error) {
      ElMessage.error('选项删除失败：' + error.message)
    }
  } else {
    // 如果选项没有ID，直接从前端删除
    const newOptions = [...questionData.value.columnOptions]
    newOptions.splice(index, 1)
    questionData.value = { ...questionData.value, columnOptions: newOptions }
    emit('update:modelValue', { ...questionData.value })
  }
}

// 监听矩阵类型变化
watch(() => questionData.value.matrixType, (newVal) => {
  questionData.value.type = newVal === 'single' ? '矩阵单选' : '矩阵多选'
  emit('update:modelValue', { ...questionData.value })
})

// 监听props变化，同步数据
watch(() => props.modelValue, (newVal) => {
  if (newVal && JSON.stringify(newVal) !== JSON.stringify(questionData.value)) {
    questionData.value = {
      ...newVal,
      type: newVal.matrixType === 'single' ? '矩阵单选' : '矩阵多选',
      matrixType: newVal.matrixType || 'single',
      description: newVal.description || '',
      rowOptions: newVal.options?.filter(opt => opt.type === '行选项') || [{ description: '', type: '行选项' }],
      columnOptions: newVal.options?.filter(opt => opt.type === '列选项') || [{ description: '', type: '列选项' }]
    }
  }
}, { deep: true })

// 监听内部数据变化，同步到父组件
watch(questionData, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(props.modelValue)) {
    // 合并行选项和列选项到 options 数组
    const mergedOptions = [
      ...(newVal.rowOptions || []),
      ...(newVal.columnOptions || [])
    ]
    emit('update:modelValue', { 
      ...newVal,
      options: mergedOptions
    })
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.matrix-question {
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

  .options-layout {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;

    .row-options,
    .column-options {
      flex: 1;
      margin-bottom: 0;
    }
  }

  .options-container {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .option-item {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 8px;
      background: #f5f7fa;
      border-radius: 4px;
      
      .option-order {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #409eff;
        color: #fff;
        border-radius: 50%;
        font-size: 12px;
        flex-shrink: 0;
      }
      
      .el-input {
        flex: 1;
      }
      
      .option-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }
    }
  }

  .matrix-preview {
    margin-top: 20px;
    background: #f5f7fa;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);

    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      table-layout: fixed;

      th, td {
        padding: 8px 12px;
        border: 1px solid #dcdfe6;
        text-align: center;
        font-size: 14px;
        word-break: break-all;
      }

      th {
        background-color: #f5f7fa;
        font-weight: bold;
        color: #606266;
        padding: 12px;
      }

      td:first-child {
        background-color: #f5f7fa;
        text-align: left;
        font-weight: bold;
        color: #606266;
        width: 20%;
      }

      .el-radio,
      .el-checkbox {
        margin: 0;
      }
    }
  }
}
</style> 