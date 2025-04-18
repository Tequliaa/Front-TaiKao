<template>
  <div class="sort-question">
    <div class="question-header" @click="isCollapsed = !isCollapsed">
      <div class="header-content">
        <span class="question-type">排序题</span>
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

      <el-form-item label="排序方式">
        <el-radio-group v-model="questionData.sortType">
          <el-radio label="drag">拖拽排序</el-radio>
          <el-radio label="select">选择排序</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序说明">
        <el-input
          v-model="questionData.sortDescription"
          type="textarea"
          :rows="2"
          placeholder="请输入排序说明（如：请将选项按重要性从高到低排序）"
        />
      </el-form-item>

      <el-form-item label="选项">
        <div class="options-container">
          <div v-for="(option, index) in questionData.options" 
               :key="index"
               class="option-item"
               :class="{ 'dragging': isDragging === index }"
               draggable="true"
               @dragstart="onDragStart($event, index)"
               @dragend="onDragEnd"
               @dragover.prevent
               @drop="onDrop($event, index)">
            <span class="option-order">{{ index + 1 }}</span>
            <el-input
              v-model="option.description"
              :placeholder="`选项 ${index + 1}`"
            />
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
const isDragging = ref(-1)

const questionData = ref({
  ...props.modelValue,
  type: '排序',
  sortType: props.modelValue.sortType || 'drag',
  sortDescription: props.modelValue.sortDescription || '',
  description: props.modelValue.description || '',
  options: props.modelValue.options || [{ description: '', type: '行选项' }]
})

// 添加选项
const addOption = () => {
  const newOptions = [...questionData.value.options, { description: '', type: '行选项' }]
  questionData.value = { ...questionData.value, options: newOptions }
}

// 编辑选项
const editOption = (index) => {
  const option = questionData.value.options[index]
  emit('edit-option', { option, index })
}

// 删除选项
const deleteOption = async (index) => {
  const option = questionData.value.options[index]
  
  // 如果选项有ID，调用后端删除服务
  if (option.optionId) {
    try {
      const result = await optionDelService(option.optionId)
      if (result.code === 0) {
        ElMessage.success('选项删除成功')
        const newOptions = [...questionData.value.options]
        newOptions.splice(index, 1)
        questionData.value = { ...questionData.value, options: newOptions }
      } else {
        ElMessage.error(result.message || '选项删除失败')
      }
    } catch (error) {
      ElMessage.error('选项删除失败：' + error.message)
    }
  } else {
    // 如果选项没有ID，直接从前端删除
    const newOptions = [...questionData.value.options]
    newOptions.splice(index, 1)
    questionData.value = { ...questionData.value, options: newOptions }
  }
}

// 拖拽相关方法
const onDragStart = (event, index) => {
  isDragging.value = index
  event.dataTransfer.setData('text/plain', index)
}

const onDragEnd = () => {
  isDragging.value = -1
}

const onDrop = (event, targetIndex) => {
  const sourceIndex = parseInt(event.dataTransfer.getData('text/plain'))
  const options = [...questionData.value.options]
  const [movedItem] = options.splice(sourceIndex, 1)
  options.splice(targetIndex, 0, movedItem)
  questionData.value = { ...questionData.value, options }
}

// 监听props变化，同步数据
watch(() => props.modelValue, (newVal) => {
  if (newVal && JSON.stringify(newVal) !== JSON.stringify(questionData.value)) {
    questionData.value = {
      ...newVal,
      type: '排序',
      sortType: newVal.sortType || 'drag',
      sortDescription: newVal.sortDescription || '',
      description: newVal.description || '',
      options: newVal.options || [{ description: '', type: '行选项' }]
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
.sort-question {
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

  .options-container {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .option-item {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px;
      background: #f5f7fa;
      border-radius: 4px;
      transition: all 0.3s;
      
      &.dragging {
        opacity: 0.5;
        background: #e6f1fc;
      }
      
      .option-order {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #409eff;
        color: #fff;
        border-radius: 50%;
        font-size: 12px;
      }
      
      .option-actions {
        display: flex;
        gap: 5px;
      }
    }
  }
}
</style> 