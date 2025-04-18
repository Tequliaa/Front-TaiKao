<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowUp, 
  ArrowDown, 
  Delete,
  Edit,
  Connection,
  DataLine,
  View,
  Close
} from '@element-plus/icons-vue'
import SurveyPreview from './SurveyPreview.vue'
import { validateQuestion } from '@/utils/questionValidator'
import { 
  saveBuildSurvey,
  submitBuildSurvey,
  updateBuildSurvey
} from '@/api/survey'
import { useRoute } from 'vue-router'
import { getAllQuestionsBySurveyIdService, questionDelService } from '@/api/question'

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
import TextQuestion from '@/components/questions/TextQuestion.vue'
import RatingQuestion from '@/components/questions/RatingQuestion.vue'
import SortQuestion from '@/components/questions/SortQuestion.vue'
import MatrixQuestion from '@/components/questions/MatrixQuestion.vue'

// 获取路由参数
const route = useRoute()

// 问卷数据
const survey = ref({
    surveyId: null,
    name: '',
    description: '',
    status: '',
    allowView: '',
    isRequired: 1,
    minSelections: 0,
    maxSelections: 1
})
const questions = ref([])
const activeQuestionIndex = ref(-1)
const previewVisible = ref(false)
const validationErrors = ref({})
const isPreviewMode = ref(false)

// 选项编辑相关
const isEditingOption = ref(false)
const editingOption = ref(null)
const editingOptionIndex = ref(-1)
const skipQuestions = ref([])

// 问题模板
const questionTemplates = [
  { type: '单选', name: '单选题', icon: 'Edit' },
  { type: '多选', name: '多选题', icon: 'Edit' },
  { type: '填空', name: '填空题', icon: 'Edit' },
  { type: '评分题', name: '评分题', icon: 'Star' },
  { type: '排序', name: '排序题', icon: 'Sort' },
  { type: '矩阵', name: '矩阵题', icon: 'Grid' }
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
      questionId: 0,
      type,
      description: '',
      isRequired: 0,
      isOpen: 0,
      isSkip: 0
    }

    switch (type) {
      case '单选':
        return {
          ...initialData,
          layout: 'vertical',
          options: [{ description: '', type: '行选项' }]
        }
      case '多选':
        return {
          ...initialData,
          layout: 'vertical',
          minSelections: 0,
          maxSelections: 1,
          options: [{ description: '', type: '行选项' }]
        }
      case '填空':
        return initialData
      case '评分题':
        return {
          ...initialData,
          displayType: '五角星',
          scoreDescription: '',
          options: [{ description: '', type: '行选项' }]
        }
      case '排序':
        return {
          ...initialData,
          sortType: 'drag',
          sortDescription: '',
          options: [{ description: '', type: '行选项' }]
        }
      case '矩阵':
        return {
          ...initialData,
          matrixType: 'single',
          rowOptions: [{ description: '', type: '行选项' }],
          columnOptions: [{ description: '', type: '列选项' }]
        }
      default:
        return initialData
    }
  }

  const newQuestion = getInitialData(template.type)
  questions.value.push(newQuestion)
  activeQuestionIndex.value = questions.value.length - 1
}

const deleteQuestion = async (index) => {
  const question = questions.value[index]
  
  // 如果问题有ID，调用后端删除服务
  if (question.questionId) {
    try {
      const result = await questionDelService(question.questionId)
      if (result.code === 0) {
        ElMessage.success('问题删除成功')
        questions.value.splice(index, 1)
        if (activeQuestionIndex.value === index) {
          activeQuestionIndex.value = -1
        } else if (activeQuestionIndex.value > index) {
          activeQuestionIndex.value--
        }
      } else {
        ElMessage.error(result.message || '问题删除失败')
      }
    } catch (error) {
      ElMessage.error('问题删除失败：' + error.message)
    }
  } else {
    // 如果问题没有ID，直接从前端删除
    questions.value.splice(index, 1)
    if (activeQuestionIndex.value === index) {
      activeQuestionIndex.value = -1
    } else if (activeQuestionIndex.value > index) {
      activeQuestionIndex.value--
    }
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
  if (!isEditingOption.value) {
    activeQuestionIndex.value = index
  }
}

const updateQuestion = (index, updatedQuestion) => {
  questions.value[index] = { ...questions.value[index], ...updatedQuestion }
}

// 处理编辑选项
const handleEditOption = (data) => {
  console.log('SurveyBuilder - 处理编辑选项:', data)
  console.log('SurveyBuilder - 当前activeQuestion:', activeQuestion.value)
  
  const questionIndex = questions.value.findIndex(q => q.questionId === data.questionId)
  if (questionIndex !== -1) {
    activeQuestionIndex.value = questionIndex
  }
  
  // 确保选项有type属性，默认为行选项
  editingOption.value = { 
    ...data.option,
    type: data.option.type || '行选项'
  }
  editingOptionIndex.value = data.index
  isEditingOption.value = true
  console.log('SurveyBuilder - 设置后的状态:', {
    editingOption: editingOption.value,
    editingOptionIndex: editingOptionIndex.value,
    isEditingOption: isEditingOption.value,
    activeQuestionIndex: activeQuestionIndex.value
  })
  
  // 获取可跳转的问题列表
  fetchSkipQuestions()
}

// 获取可跳转的问题列表
const fetchSkipQuestions = async () => {
  if (!props.surveyId) {
    console.log('SurveyBuilder - 没有surveyId，跳过获取问题列表')
    return
  }
  
  try {
    console.log('SurveyBuilder - 开始获取问题列表')
    const result = await getAllQuestionsBySurveyIdService(props.surveyId)
    console.log('SurveyBuilder - 获取问题列表结果:', result)
    if (result.code === 0) {
      const currentQuestionId = questions.value[activeQuestionIndex.value]?.questionId
      skipQuestions.value = result.data.filter(q => q.questionId !== currentQuestionId)
      console.log('SurveyBuilder - 过滤后的跳转问题列表:', skipQuestions.value)
    }
  } catch (error) {
    console.error('SurveyBuilder - 获取问题列表失败:', error)
    ElMessage.error('获取问题列表失败')
  }
}

// 保存选项编辑
const saveOptionEdit = () => {
  if (editingOptionIndex.value !== -1 && activeQuestionIndex.value !== -1) {
    const question = questions.value[activeQuestionIndex.value]
    const options = [...question.options]
    options[editingOptionIndex.value] = { ...editingOption.value }
    
    updateQuestion(activeQuestionIndex.value, { ...question, options })
    isEditingOption.value = false
    editingOption.value = null
    editingOptionIndex.value = -1
  }
}

// 取消选项编辑
const cancelOptionEdit = () => {
  isEditingOption.value = false
  editingOption.value = null
  editingOptionIndex.value = -1
}

// 获取问题组件
const getQuestionComponent = (type) => {
  const componentMap = {
    '单选': SingleChoiceQuestion,
    '多选': MultipleChoiceQuestion,
    '填空': TextQuestion,
    '评分题': RatingQuestion,
    '排序': SortQuestion,
    '矩阵': MatrixQuestion
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
        console.log('准备发送请求，surveyId:', survey.value.surveyId)
        console.log('问卷数据:', survey.value)
        console.log('问题数据:', questions.value)

        const res = survey.value.surveyId 
            ? await updateBuildSurvey(survey.value, questions.value)
            : await saveBuildSurvey(survey.value, questions.value)
            
        console.log('请求响应:', res)
        
        if (res.code === 0) {
            ElMessage.success('问卷保存成功')
            if (!survey.value.surveyId) {
                survey.value.surveyId = res.data
                console.log('survey.value.surveyId'+survey.value.surveyId)
                console.log('res.data.surveyId'+res.data)
            }
        } else {
            ElMessage.error(res.message || '问卷保存失败')
        }
    } catch (error) {
        console.error('保存问卷失败:', error)
        ElMessage.error('问卷保存失败: ' + error.message)
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

    const res = await submitBuildSurvey(surveyData)
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

// 切换预览状态
const togglePreview = () => {
  isPreviewMode.value = !isPreviewMode.value
  if (!isPreviewMode.value) {
    activeQuestionIndex.value = -1
  }
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
    <div class="builder-container" :class="{ 'preview-mode': isPreviewMode }">
      <!-- 左侧问题模板库 -->
      <div class="template-library" v-if="!isPreviewMode">
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
           :class="{ 'preview-mode': isPreviewMode }"
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
                @edit-option="handleEditOption"
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

      <!-- 右侧面板 -->
      <div class="property-panel" 
           :class="{ 'preview-mode': isPreviewMode }"
           :style="{ width: isPreviewMode ? '60%' : '300px' }">
        <div class="panel-header">
          <h3>{{ isPreviewMode ? '问卷预览' : (isEditingOption ? '编辑选项' : '属性设置') }}</h3>
          <el-button v-if="isPreviewMode" type="text" @click="togglePreview">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        
        <!-- 选项编辑面板 -->
        <div v-if="!isPreviewMode && isEditingOption && editingOption" class="panel-content">
          <el-form :model="editingOption" label-width="100px">
            <el-form-item label="选项描述">
              <el-input v-model="editingOption.description" placeholder="请输入选项描述"></el-input>
            </el-form-item>
            <el-form-item label="选项类型">
              <el-radio-group v-model="editingOption.type">
                <el-radio label="行选项">行选项</el-radio>
                <el-radio label="列选项">列选项</el-radio>
                <el-radio label="填空">填空</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="开放答案">
              <el-switch v-model="editingOption.isOpenOption" :active-value="1" :inactive-value="0"></el-switch>
            </el-form-item>
            <el-form-item label="跳转选项">
              <el-switch v-model="editingOption.isSkip" :active-value="1" :inactive-value="0"></el-switch>
            </el-form-item>
            <el-form-item label="跳转至" v-if="editingOption.isSkip === 1">
              <el-select v-model="editingOption.skipTo" clearable placeholder="跳转至">
                <el-option v-for="item in skipQuestions" :key="item.questionId" :label="item.description" :value="item.questionId"/>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveOptionEdit">保存</el-button>
              <el-button @click="cancelOptionEdit">取消</el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <div v-else-if="!isPreviewMode && activeQuestionIndex !== -1" class="panel-content">
          <el-form :model="activeQuestion" label-width="100px">
            <!-- 单选题设置 -->
            <template v-if="activeQuestion.type === '单选'">
            </template>

            <!-- 多选题设置 -->
            <template v-if="activeQuestion.type === '多选'">
              <el-form-item label="选项布局">
                <el-radio-group v-model="activeQuestion.layout">
                  <el-radio label="vertical">垂直排列</el-radio>
                  <el-radio label="horizontal">水平排列</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="最少选择">
                <el-input-number 
                  v-model="activeQuestion.minSelections" 
                  :min="0" 
                  :max="activeQuestion.options.length"
                  :disabled="!activeQuestion.isRequired"
                />
              </el-form-item>
              <el-form-item label="最多选择">
                <el-input-number 
                  v-model="activeQuestion.maxSelections" 
                  :min="1" 
                  :max="activeQuestion.options.length"
                />
              </el-form-item>
            </template>
          </el-form>
        </div>

        <div v-else-if="isPreviewMode" class="panel-content">
          <SurveyPreview :surveyId="survey.surveyId" />
        </div>

        <div v-else class="panel-content">
          <el-empty description="请选择问题或点击预览按钮" />
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="saveSurvey">保存问卷</el-button>
      <el-button type="success" @click="submitSurvey">提交问卷</el-button>
      <el-button link @click="togglePreview">
        {{ isPreviewMode ? '取消预览' : '预览问卷' }}
      </el-button>
    </div>
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
    transition: all 0.3s ease;

    &.preview-mode {
      .edit-area {
        width: 40%;
      }
    }
  }

  .template-library {
    width: 200px;
    border-right: 1px solid #dcdfe6;
    padding-right: 20px;
    transition: all 0.3s ease;

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
    transition: all 0.3s ease;

    &.preview-mode {
      width: 40%;
    }

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
    border-left: 1px solid #dcdfe6;
    padding-left: 20px;
    overflow-y: auto;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;

    &.preview-mode {
      width: 60%;
      padding: 20px;
      background-color: #f5f7fa;
      border-radius: 4px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #dcdfe6;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
    }
  }

  .action-bar {
    padding: 18px;
    border-top: 1px solid #dcdfe6;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style> 