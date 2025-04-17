<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowUp, 
  ArrowDown, 
  Delete,
  Edit,
  Connection,
  DataLine
} from '@element-plus/icons-vue'
import SurveyPreview from './SurveyPreview.vue'
import { validateQuestion } from '@/utils/questionValidator'
import { 
  saveSurvey as saveSurveyApi,
  submitSurvey as submitSurveyApi,
  getSurveyDetail,
  updateSurvey as updateSurveyApi
} from '@/api/survey'
import { useRoute } from 'vue-router'

const props = defineProps({
    surveyId: {
        type: [String, Number],
        required: true
    }
})
import { getSurveyAndQuestionsById } from '@/api/survey'

// 导入问题组件
import QuestionBase from '@/components/questions/QuestionBase.vue'
import SingleChoiceQuestion from '@/components/questions/SingleChoiceQuestion.vue'
import MultipleChoiceQuestion from '@/components/questions/MultipleChoiceQuestion.vue'
import RatingQuestion from '@/components/questions/RatingQuestion.vue'
import SortQuestion from '@/components/questions/SortQuestion.vue'
import MatrixQuestion from '@/components/questions/MatrixQuestion.vue'
import TextQuestion from '@/components/questions/TextQuestion.vue'
import FileUploadQuestion from '@/components/questions/FileUploadQuestion.vue'

// 获取路由参数
const route = useRoute()

// 问卷数据
const survey = ref({
    surveyId: null,
    name: '',
    description: '',
    status: '',
    allowView: ''
})
const questions = ref([])
const activeQuestionIndex = ref(-1)
const previewVisible = ref(false)
const validationErrors = ref({})

// 问题模板
const questionTemplates = [
  { type: 'single_choice', name: '单选题', icon: 'Edit' },
  { type: 'multiple_choice', name: '多选题', icon: 'Edit' },
  { type: 'text', name: '填空题', icon: 'Edit' },
  { type: 'matrix', name: '矩阵题', icon: 'Connection' },
  { type: 'sort', name: '排序题', icon: 'DataLine' },
  { type: 'rating', name: '评分题', icon: 'DataLine' },
  { type: 'file_upload', name: '文件上传题', icon: 'Edit' }
]

// 当前选中的问题
const activeQuestion = computed(() => {
  return activeQuestionIndex.value !== -1 ? questions.value[activeQuestionIndex.value] : null
})

// 拖拽相关方法
const onDragStart = (event, template) => {
  event.dataTransfer.setData('template', JSON.stringify(template))
}

const onDrop = (event) => {
  const template = JSON.parse(event.dataTransfer.getData('template'))
  addQuestion(template)
}

// 问题操作相关方法
const addQuestion = (template) => {
  const getInitialData = (type) => {
    const initialData = {
      type,
      description: '',
      required: false,
      isOpen: false,
      isSkip: false
    }

    switch (type) {
      case 'single_choice':
        return {
          ...initialData,
          layout: 'vertical',
          options: [{ description: '' }]
        }
      case 'multiple_choice':
        return {
          ...initialData,
          layout: 'vertical',
          minSelect: 0,
          maxSelect: 1,
          options: [{ description: '' }]
        }
      case 'text':
        return {
          ...initialData,
          inputType: 'text',
          minValue: 0,
          maxValue: 100,
          maxLength: 200,
          placeholder: ''
        }
      case 'matrix':
        return {
          ...initialData,
          matrixType: 'single',
          rows: [{ title: '' }],
          columns: [{ title: '' }]
        }
      case 'sort':
        return {
          ...initialData,
          sortType: 'drag',
          sortDescription: '',
          options: [{ description: '' }]
        }
      case 'rating':
        return {
          ...initialData,
          displayType: '五角星',
          minScore: 1,
          maxScore: 5,
          scoreDescription: ''
        }
      case 'file_upload':
        return {
          ...initialData,
          fileTypes: ['image', 'document'],
          maxSize: 10,
          maxFiles: 1
        }
      default:
        return initialData
    }
  }

  const newQuestion = getInitialData(template.type)
  questions.value.push(newQuestion)
  activeQuestionIndex.value = questions.value.length - 1
}

const deleteQuestion = (index) => {
  questions.value.splice(index, 1)
  if (activeQuestionIndex.value === index) {
    activeQuestionIndex.value = -1
  } else if (activeQuestionIndex.value > index) {
    activeQuestionIndex.value--
  }
}

const moveQuestion = (index, direction) => {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  const question = questions.value[index]
  questions.value.splice(index, 1)
  questions.value.splice(newIndex, 0, question)
  activeQuestionIndex.value = newIndex
}

const selectQuestion = (index) => {
  activeQuestionIndex.value = index
}

const updateQuestion = (index, updatedQuestion) => {
  questions.value[index] = { ...questions.value[index], ...updatedQuestion }
}

// 获取问题组件
const getQuestionComponent = (type) => {
  const componentMap = {
    single_choice: SingleChoiceQuestion,
    multiple_choice: MultipleChoiceQuestion,
    text: TextQuestion,
    matrix: MatrixQuestion,
    sort: SortQuestion,
    rating: RatingQuestion,
    file_upload: FileUploadQuestion
  }
  return componentMap[type] || null
}

// 验证问题
const validateQuestions = () => {
  validationErrors.value = {}
  let hasError = false

  questions.value.forEach((question, index) => {
    const { isValid, errors } = validateQuestion(question)
    if (!isValid) {
      validationErrors.value[index] = errors
      hasError = true
    }
  })

  return !hasError
}
// 获取问卷详情
const fetchSurveyDetail = async () => {
    try {
        const result = await getSurveyAndQuestionsById(props.surveyId)
        if (result.code === 0) {
            const data = result.data
            survey.value = {
                ...data.survey,
                description: getPlainText(data.survey.description)
            }
            questions.value = data.questions || []
        }
    } catch (error) {
        ElMessage.error('获取问卷详情失败')
    }
}

// 组件挂载时获取数据
onMounted(() => {
    if (props.surveyId) {
        fetchSurveyDetail()
    }
})

// 保存问卷
const saveSurvey = async () => {
    if (!survey.value.name) {
        ElMessage.warning('请输入问卷标题')
        return
    }

    if (!validateQuestions()) {
        ElMessage.warning('请检查问题设置是否正确')
        return
    }

    try {
        const res = survey.value.surveyId 
            ? await updateSurveyApi(survey,questions)
            : await saveSurveyApi(survey,questions)
        
        if (res.code === 0) {
            ElMessage.success('问卷保存成功')
            if (!survey.value.surveyId) {
                survey.value.surveyId = res.data.id
            }
        } else {
            ElMessage.error(res.message || '问卷保存失败')
        }
    } catch (error) {
        ElMessage.error('问卷保存失败')
    }
}

// 提交问卷
const submitSurvey = async () => {
  if (!survey.value.name) {
    ElMessage.warning('请输入问卷标题')
    return
  }

  if (!validateQuestions()) {
    ElMessage.warning('请检查问题设置是否正确')
    return
  }

  try {
    await ElMessageBox.confirm(
      '提交后问卷将无法修改，是否确认提交？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const surveyData = {
      id: survey.value.surveyId,
      name: survey.value.name,
      description: survey.value.description,
      questions: questions.value
    }

    const res = await submitSurveyApi(surveyData)
    if (res.code === 0) {
      ElMessage.success('问卷提交成功')
      // 可以跳转到问卷列表页面
    } else {
      ElMessage.error(res.message || '问卷提交失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('问卷提交失败')
    }
  }
}

// 获取问题错误信息
const getQuestionErrors = (index) => {
  return validationErrors.value[index] || []
}

// 预览问卷
const previewSurvey = () => {
  
  if (questions.value.length === 0) {
    ElMessage.warning('请先添加问题')
    return
  }
  previewVisible.value = true
}
import { useRouter } from 'vue-router'
const router = useRouter()
// 预览问卷方法
const goToPreview = () => {
    router.push({
        name: 'SurveyPreview',
        params: {
          surveyId: props.surveyId
        }
    })
}

const getPlainText = (htmlContent)=> {
    // 使用正则去掉 HTML 标签，获取纯文本
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    return div.textContent || div.innerText || '';
}
</script>

<template>
  <div class="survey-builder">
    <div class="builder-container">
      <!-- 左侧问题模板库 -->
      <div class="template-library">
        <h3>问题模板</h3>
        <div class="template-list">
          <div v-for="(template, index) in questionTemplates" 
               :key="index"
               class="template-item"
               draggable="true"
               @dragstart="onDragStart($event, template)">
            <el-icon><component :is="template.icon" /></el-icon>
            <span>{{ template.name }}</span>
          </div>
        </div>
      </div>

      <!-- 中间编辑区域 -->
      <div class="edit-area" 
           @dragover.prevent 
           @drop="onDrop">
        <div class="survey-header">
          <el-input v-model="survey.name" placeholder="请输入问卷标题" />
          <el-input
            v-model="survey.description"
            type="textarea"
            :rows="3"
            placeholder="请输入问卷描述"
          />
        </div>

        <div class="questions-container">
          <div v-for="(question, index) in questions" 
               :key="index"
               class="question-item"
               :class="{ 
                 'active': activeQuestionIndex === index,
                 'has-error': getQuestionErrors(index).length > 0
               }"
               @click="selectQuestion(index)">
            <div class="question-header">
              <span class="question-type">{{ question.type }}</span>
              <div class="question-actions">
                <el-button type="text" @click="moveQuestion(index, 'up')" :disabled="index === 0">
                  <el-icon><ArrowUp /></el-icon>
                </el-button>
                <el-button type="text" @click="moveQuestion(index, 'down')" :disabled="index === questions.length - 1">
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <el-button type="text" @click="deleteQuestion(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="question-content">
              <component 
                :is="getQuestionComponent(question.type)"
                :model-value="question"
                @update:model-value="updateQuestion(index, $event)"
              />
            </div>
            <div v-if="getQuestionErrors(index).length > 0" class="question-errors">
              <el-alert
                v-for="(error, errorIndex) in getQuestionErrors(index)"
                :key="errorIndex"
                :title="error"
                type="error"
                :closable="false"
                show-icon
              />
            </div>
          </div>
        </div>

        <div class="empty-placeholder" v-if="questions.length === 0">
          <el-empty description="拖拽问题模板到此处开始创建问卷" />
        </div>
      </div>

      <!-- 右侧属性设置 -->
      <div class="property-panel" v-if="activeQuestionIndex !== -1">
        <h3>问题设置</h3>
        <el-form :model="activeQuestion" label-width="100px">
          <el-form-item label="是否必答">
            <el-switch v-model="activeQuestion.required" />
          </el-form-item>
          <el-form-item label="是否开放">
            <el-switch v-model="activeQuestion.isOpen" />
          </el-form-item>
          <el-form-item label="是否跳转">
            <el-switch v-model="activeQuestion.isSkip" />
          </el-form-item>

          <!-- 单选题设置 -->
          <template v-if="activeQuestion.type === 'single_choice'">
            <el-form-item label="选项布局">
              <el-radio-group v-model="activeQuestion.layout">
                <el-radio label="vertical">垂直排列</el-radio>
                <el-radio label="horizontal">水平排列</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <!-- 多选题设置 -->
          <template v-if="activeQuestion.type === 'multiple_choice'">
            <el-form-item label="选项布局">
              <el-radio-group v-model="activeQuestion.layout">
                <el-radio label="vertical">垂直排列</el-radio>
                <el-radio label="horizontal">水平排列</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="最少选择">
              <el-input-number 
                v-model="activeQuestion.minSelect" 
                :min="0" 
                :max="activeQuestion.options.length"
                :disabled="!activeQuestion.required"
              />
            </el-form-item>
            <el-form-item label="最多选择">
              <el-input-number 
                v-model="activeQuestion.maxSelect" 
                :min="1" 
                :max="activeQuestion.options.length"
              />
            </el-form-item>
          </template>

          <!-- 填空题设置 -->
          <template v-if="activeQuestion.type === 'text'">
            <el-form-item label="输入类型">
              <el-radio-group v-model="activeQuestion.inputType">
                <el-radio label="text">单行文本</el-radio>
                <el-radio label="textarea">多行文本</el-radio>
                <el-radio label="number">数字</el-radio>
                <el-radio label="email">邮箱</el-radio>
                <el-radio label="phone">手机号</el-radio>
              </el-radio-group>
            </el-form-item>
            <template v-if="activeQuestion.inputType === 'number'">
              <el-form-item label="数字范围">
                <el-input-number 
                  v-model="activeQuestion.minValue" 
                  :min="Number.MIN_SAFE_INTEGER"
                  :max="activeQuestion.maxValue - 1"
                />
                <span class="range-separator">至</span>
                <el-input-number 
                  v-model="activeQuestion.maxValue" 
                  :min="activeQuestion.minValue + 1"
                  :max="Number.MAX_SAFE_INTEGER"
                />
              </el-form-item>
            </template>
            <template v-if="activeQuestion.inputType === 'textarea'">
              <el-form-item label="最大字数">
                <el-input-number 
                  v-model="activeQuestion.maxLength" 
                  :min="1"
                  :max="10000"
                />
              </el-form-item>
            </template>
          </template>

          <!-- 矩阵题设置 -->
          <template v-if="activeQuestion.type === 'matrix'">
            <el-form-item label="矩阵类型">
              <el-radio-group v-model="activeQuestion.matrixType">
                <el-radio label="single">单选矩阵</el-radio>
                <el-radio label="multiple">多选矩阵</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <!-- 排序题设置 -->
          <template v-if="activeQuestion.type === 'sort'">
            <el-form-item label="排序方式">
              <el-radio-group v-model="activeQuestion.sortType">
                <el-radio label="drag">拖拽排序</el-radio>
                <el-radio label="select">选择排序</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <!-- 评分题设置 -->
          <template v-if="activeQuestion.type === 'rating'">
            <el-form-item label="显示方式">
              <el-radio-group v-model="activeQuestion.displayType">
                <el-radio label="五角星">五角星</el-radio>
                <el-radio label="滑动条">滑动条</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="评分范围">
              <el-input-number 
                v-model="activeQuestion.minScore" 
                :min="1" 
                :max="activeQuestion.maxScore - 1"
              />
              <span class="range-separator">至</span>
              <el-input-number 
                v-model="activeQuestion.maxScore" 
                :min="activeQuestion.minScore + 1" 
                :max="10"
              />
            </el-form-item>
          </template>

          <!-- 文件上传题设置 -->
          <template v-if="activeQuestion.type === 'file_upload'">
            <el-form-item label="文件类型">
              <el-checkbox-group v-model="activeQuestion.fileTypes">
                <el-checkbox label="image">图片</el-checkbox>
                <el-checkbox label="document">文档</el-checkbox>
                <el-checkbox label="video">视频</el-checkbox>
                <el-checkbox label="audio">音频</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="文件大小">
              <el-input-number 
                v-model="activeQuestion.maxSize" 
                :min="1"
                :max="100"
              />
              <span class="size-unit">MB</span>
            </el-form-item>
            <el-form-item label="最大文件数">
              <el-input-number 
                v-model="activeQuestion.maxFiles" 
                :min="1"
                :max="10"
              />
            </el-form-item>
          </template>
        </el-form>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="saveSurvey">保存问卷</el-button>
      <el-button type="success" @click="submitSurvey">提交问卷</el-button>
      <el-button @click="goToPreview()">预览问卷</el-button>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="问卷预览"
      width="80%"
      :close-on-click-modal="false">
      <SurveyPreview :questions="questions" />
    </el-dialog>
  </div>
</template>



<style lang="scss" scoped>
.survey-builder {
  height: 100%;
  display: flex;
  flex-direction: column;

  .builder-container {
    flex: 1;
    display: flex;
    gap: 20px;
    padding: 20px;
    overflow: hidden;
  }

  .template-library {
    width: 200px;
    border-right: 1px solid #dcdfe6;
    padding-right: 20px;

    .template-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .template-item {
      padding: 10px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      cursor: move;
      display: flex;
      align-items: center;
      gap: 8px;

      &:hover {
        background-color: #f5f7fa;
      }
    }
  }

  .edit-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: #f5f7fa;
    border-radius: 4px;

    .survey-header {
      margin-bottom: 20px;
    }

    .questions-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .question-item {
      background-color: white;
      border-radius: 4px;
      padding: 20px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

      &.active {
        border: 2px solid #409eff;
      }

      &.has-error {
        border: 1px solid #f56c6c;
      }

      .question-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;

        .question-type {
          font-weight: bold;
        }

        .question-actions {
          display: flex;
          gap: 8px;
        }
      }

      .question-errors {
        margin-top: 10px;
        padding: 10px;
        background-color: #fef0f0;
        border-radius: 4px;

        .el-alert {
          margin-bottom: 5px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .empty-placeholder {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .property-panel {
    width: 300px;
    border-left: 1px solid #dcdfe6;
    padding-left: 20px;
  }

  .action-bar {
    padding: 20px;
    border-top: 1px solid #dcdfe6;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style> 