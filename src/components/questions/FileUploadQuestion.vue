<template>
  <div class="file-upload-question">
    <div class="question-header" @click="isCollapsed = !isCollapsed">
      <div class="header-content">
        <span class="question-type">文件上传题</span>
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

      <!-- <el-form-item label="文件类型">
        <el-checkbox-group v-model="questionData.fileTypes">
          <el-checkbox label="image">图片</el-checkbox>
          <el-checkbox label="document">文档</el-checkbox>
          <el-checkbox label="video">视频</el-checkbox>
          <el-checkbox label="audio">音频</el-checkbox>
        </el-checkbox-group>
      </el-form-item> -->

      <!-- <el-form-item label="文件大小">
        <el-input-number 
          v-model="questionData.maxSize" 
          :min="1"
          :max="100"
        />
        <span class="size-unit">MB</span>
      </el-form-item>

      <el-form-item label="最大文件数">
        <el-input-number 
          v-model="questionData.maxFiles" 
          :min="1"
          :max="10"
        />
      </el-form-item> -->

      <el-form-item label="上传预览">
        <div class="upload-preview">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :limit="questionData.maxFiles"
            :on-exceed="handleExceed"
            :file-list="fileList"
            :accept="getAcceptTypes"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持的文件类型：
                <span v-for="(type, index) in questionData.fileTypes" 
                      :key="index"
                      class="file-type-tag">
                  {{ getFileTypeName(type) }}
                </span>
                <br>
                单个文件大小不超过 {{ questionData.maxSize }}MB
              </div>
            </template>
          </el-upload>
        </div>
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const isCollapsed = ref(false)
const fileList = ref([])

const questionData = ref({
  ...props.modelValue,
  type: '文件上传题',
  isRequired: props.modelValue.isRequired || 0,
  fileTypes: props.modelValue.fileTypes || ['image', 'document', 'video', 'audio'],
  maxSize: props.modelValue.maxSize || 10,
  maxFiles: props.modelValue.maxFiles || 1,
  description: props.modelValue.description || ''
})

const getFileTypeName = (type) => {
  const names = {
    image: '图片',
    document: '文档',
    video: '视频',
    audio: '音频'
  }
  return names[type]
}

const getAcceptTypes = computed(() => {
  const typeMap = {
    image: '.jpg,.jpeg,.png,.gif',
    document: '.doc,.docx,.pdf,.txt,.xls,.xlsx',
    video: '.mp4,.avi,.mov',
    audio: '.mp3,.wav,.ogg'
  }
  return questionData.value.fileTypes.map(type => typeMap[type]).join(',')
})

const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${questionData.value.maxFiles} 个文件`)
}

// 监听内部数据变化，同步到父组件
watch(questionData, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', { ...newVal })
  }
}, { deep: true })

// 监听props变化，同步数据
watch(() => props.modelValue, (newVal) => {
  if (newVal && JSON.stringify(newVal) !== JSON.stringify(questionData.value)) {
    questionData.value = {
      ...newVal,
      type: '文件上传题',
      isRequired: newVal.isRequired || 0,
      fileTypes: newVal.fileTypes || ['image', 'document'],
      maxSize: newVal.maxSize || 10,
      maxFiles: newVal.maxFiles || 1,
      description: newVal.description || ''
    }
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.file-upload-question {
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

  .size-unit {
    margin-left: 10px;
  }

  .upload-preview {
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;

    .file-type-tag {
      display: inline-block;
      padding: 2px 6px;
      margin: 0 4px;
      background: #ecf5ff;
      color: #409eff;
      border-radius: 4px;
      font-size: 12px;
    }
  }
}
</style> 