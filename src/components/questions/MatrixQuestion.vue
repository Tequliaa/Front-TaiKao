<template>
  <div class="matrix-question">
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

    <el-form-item label="矩阵类型">
      <el-radio-group v-model="questionData.matrixType">
        <el-radio label="single">单选矩阵</el-radio>
        <el-radio label="multiple">多选矩阵</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="行标题">
      <div class="matrix-rows">
        <div v-for="(row, index) in questionData.rows" 
             :key="index"
             class="matrix-row">
          <el-input
            v-model="row.title"
            :placeholder="`行标题 ${index + 1}`"
          />
          <el-button type="text" @click="deleteRow(index)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <el-button type="primary" @click="addRow">添加行</el-button>
      </div>
    </el-form-item>

    <el-form-item label="列选项">
      <div class="matrix-columns">
        <div v-for="(column, index) in questionData.columns" 
             :key="index"
             class="matrix-column">
          <el-input
            v-model="column.title"
            :placeholder="`列选项 ${index + 1}`"
          />
          <el-button type="text" @click="deleteColumn(index)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <el-button type="primary" @click="addColumn">添加列</el-button>
      </div>
    </el-form-item>

    <el-form-item label="矩阵预览">
      <div class="matrix-preview">
        <table>
          <thead>
            <tr>
              <th></th>
              <th v-for="(column, index) in questionData.columns" 
                  :key="index">
                {{ column.title }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in questionData.rows" 
                :key="rowIndex">
              <td>{{ row.title }}</td>
              <td v-for="(column, colIndex) in questionData.columns" 
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

const questionData = ref({
  ...props.modelValue,
  type: 'matrix',
  required: false,
  matrixType: 'single',
  rows: props.modelValue.rows || [{ title: '' }],
  columns: props.modelValue.columns || [{ title: '' }],
  description: props.modelValue.description || ''
})

// 添加行
const addRow = () => {
  questionData.value.rows.push({ title: '' })
}

// 删除行
const deleteRow = (index) => {
  questionData.value.rows.splice(index, 1)
}

// 添加列
const addColumn = () => {
  questionData.value.columns.push({ title: '' })
}

// 删除列
const deleteColumn = (index) => {
  questionData.value.columns.splice(index, 1)
}

watch(questionData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })
</script>

<style lang="scss" scoped>
.matrix-question {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);

  .matrix-rows,
  .matrix-columns {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .matrix-row,
    .matrix-column {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }

  .matrix-preview {
    margin-top: 10px;
    overflow-x: auto;

    table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 10px;
        border: 1px solid #dcdfe6;
        text-align: center;
      }

      th {
        background-color: #f5f7fa;
      }

      td:first-child {
        background-color: #f5f7fa;
        text-align: left;
      }
    }
  }
}
</style> 