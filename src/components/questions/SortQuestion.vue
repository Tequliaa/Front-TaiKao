<template>
  <div class="sort-question">
    <QuestionBase v-model="questionData" />
    
    <el-form-item label="是否必填">
      <el-switch v-model="questionData.required" />
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

    <el-form-item label="选项预览">
      <div class="sort-preview">
        <div v-for="(option, index) in questionData.options" 
             :key="index"
             class="sort-item"
             :class="{ 'dragging': isDragging === index }"
             draggable="true"
             @dragstart="onDragStart($event, index)"
             @dragend="onDragEnd"
             @dragover.prevent
             @drop="onDrop($event, index)">
          <span class="sort-number">{{ index + 1 }}</span>
          <span class="sort-content">{{ option.description }}</span>
        </div>
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
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
  type: 'sort',
  required: false,
  sortType: 'drag',
  sortDescription: '',
  options: props.modelValue.options || []
})

const isDragging = ref(-1)

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
  questionData.value.options = options
}

watch(questionData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })
</script>

<style lang="scss" scoped>
.sort-question {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

  .sort-preview {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;

    .sort-item {
      display: flex;
      align-items: center;
      padding: 10px;
      background: #fff;
      border-radius: 4px;
      cursor: move;
      transition: all 0.3s;

      &.dragging {
        opacity: 0.5;
      }

      .sort-number {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #409eff;
        color: #fff;
        border-radius: 50%;
        margin-right: 10px;
      }

      .sort-content {
        flex: 1;
      }
    }
  }
}
</style> 