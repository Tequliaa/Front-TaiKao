<template>
  <div class="file-upload-question">
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

    <el-form-item label="文件类型">
      <el-checkbox-group v-model="questionData.fileTypes">
        <el-checkbox label="image">图片</el-checkbox>
        <el-checkbox label="document">文档</el-checkbox>
        <el-checkbox label="video">视频</el-checkbox>
        <el-checkbox label="audio">音频</el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <el-form-item label="文件大小">
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
    </el-form-item>

    <el-form-item label="上传预览">
      <div class="upload-preview">
        <el-upload
          class="upload-demo"
          action="#"
          :auto-upload="false"
          :limit="questionData.maxFiles"
          :on-exceed="handleExceed"
          :file-list="fileList"
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
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const questionData = ref({
  ...props.modelValue,
  type: 'file_upload',
  required: false,
  fileTypes: ['image', 'document'],
  maxSize: 10,
  maxFiles: 1,
  description: props.modelValue.description || ''
})

const fileList = ref([])

const getFileTypeName = (type) => {
  const names = {
    image: '图片',
    document: '文档',
    video: '视频',
    audio: '音频'
  }
  return names[type]
}

const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${questionData.value.maxFiles} 个文件`)
}

watch(questionData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })
</script>

<style lang="scss" scoped>
.file-upload-question {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

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