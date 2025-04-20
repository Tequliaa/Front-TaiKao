<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
import SurveyBuildPreview from './SurveyBuildPreview.vue'
import { validateQuestion } from '@/utils/questionValidator'
import { 
  saveBuildSurvey,
  submitBuildSurvey,
  updateBuildSurvey
} from '@/api/survey'
import { useRoute, useRouter } from 'vue-router'
import { getAllQuestionsBySurveyIdService, questionDelService } from '@/api/question'
import { getAllCategoriesService, getAllCategoriesByIdService, categoryAddService } from '@/api/category'
import { useUserInfoStore } from '@/stores/user'

const props = defineProps({
    surveyId: {
        type: [String, Number],
        required: false
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
import FileUploadQuestion from '@/components/questions/FileUploadQuestion.vue'

// 获取路由和路由实例
const route = useRoute()
const router = useRouter()

// 标记是否是刷新页面
const isPageRefresh = ref(false)

// 问卷数据
const survey = ref({
    surveyId: null,
    name: '',
    description: '',
    status: '',
    allowView: '',
    minSelections: 0,
    maxSelections: 1,
    isCategory: 0
})
const questions = ref([])
const categories = ref([])
const activeQuestionIndex = ref(-1)
const previewVisible = ref(false)
const validationErrors = ref({})
const isPreviewMode = ref(false)

// 添加选中的分类
const selectedCategories = ref(new Set())

// 添加分类相关
const showAddCategoryDialog = ref(false)
const newCategory = ref({
    categoryName: '',
    description: '',
    categoryLevel: 1, // 默认层级为1
    userId: ''
})

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
  { type: '矩阵', name: '矩阵题', icon: 'Grid' },
  { type: '文件上传题', name: '文件上传题', icon: 'Upload' }
]

// 当前选中的问题
const activeQuestion = computed(() => {
  return activeQuestionIndex.value !== -1 ? questions.value[activeQuestionIndex.value] : null
})

// 按分类分组的问题
const groupedQuestions = computed(() => {
  if (survey.value.isCategory !== 1) {
    return [{ categoryId: null, categoryName: '所有问题', questions: questions.value }]
  }
  
  const groups = {}
  
  // 初始化所有分类
  categories.value.forEach(category => {
    groups[`cat_${category.categoryId}`] = {
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      questions: []
    }
  })
  
  // 将问题分配到对应分类
  questions.value.forEach(question => {
    const categoryId = question.categoryId
    if (categoryId && groups[`cat_${categoryId}`]) {
      groups[`cat_${categoryId}`].questions.push(question)
    } else {
      // 如果问题没有分类或分类不存在，放入"未分类"组
      if (!groups['uncategorized']) {
        groups['uncategorized'] = {
          categoryId: 'uncategorized',
          categoryName: '未分类',
          questions: []
        }
      }
      groups['uncategorized'].questions.push(question)
    }
  })
  
  // 返回所有分类，包括没有问题的分类
  return Object.values(groups)
})

// 分类展开状态
const expandedCategories = ref(new Set())

// 切换分类展开状态
const toggleCategory = (categoryId) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

// 检查分类是否展开
const isCategoryExpanded = (categoryId) => {
  return expandedCategories.value.has(categoryId)
}

// 处理分类变化
const handleCategoryChange = (question, newCategoryId) => {
  console.log('handleCategoryChange - 开始处理分类变化')
  console.log('当前问题:', question)
  console.log('新分类ID:', newCategoryId)
  
  // 找到问题在数组中的索引
  const questionIndex = questions.value.findIndex(q => q.questionId === question.questionId)
  console.log('问题索引:', questionIndex)
  
  if (questionIndex !== -1) {
    console.log('原始问题对象:', questions.value[questionIndex])
    // 创建新的问题对象，只更新 categoryId
    const updatedQuestion = JSON.parse(JSON.stringify(questions.value[questionIndex]))
    updatedQuestion.categoryId = newCategoryId
    console.log('更新后的问题对象:', updatedQuestion)
    
    // 更新问题数组
    questions.value[questionIndex] = updatedQuestion
    // 强制更新视图
    questions.value = [...questions.value]
    console.log('更新后的问题数组:', questions.value)
    
    // 分类变化后更新sortKey
    updateSortKeys()
    
    // 如果当前选中的问题就是被修改的问题，保持选中状态
    if (activeQuestionIndex.value === questionIndex) {
      // 使用nextTick确保DOM更新后再设置选中状态
      nextTick(() => {
        // 找到更新后问题在数组中的新索引
        const newIndex = questions.value.findIndex(q => q.questionId === question.questionId)
        if (newIndex !== -1) {
          activeQuestionIndex.value = newIndex
        }
      })
    }
  }
}

// 处理分类选择
const handleCategorySelect = (categoryId) => {
  if (selectedCategories.value.has(categoryId)) {
    selectedCategories.value.delete(categoryId)
  } else {
    selectedCategories.value.add(categoryId)
  }
}

// 检查分类是否被选中
const isCategorySelected = (categoryId) => {
  return selectedCategories.value.has(categoryId)
}

// 修改拖拽相关方法
const onDragStart = (event, template) => {
  event.dataTransfer.setData('template', JSON.stringify(template))
}

const onDrop = (event, categoryId) => {
  const template = JSON.parse(event.dataTransfer.getData('template'))
  addQuestion(template, categoryId)
}

// 修改添加问题方法
const addQuestion = (template, categoryId) => {
  // 生成临时唯一ID
  const generateTempId = () => {
    // 使用当前时间戳的后6位加上随机数，确保在int范围内
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000);
    return -(parseInt(timestamp) + random);
  }

  const getInitialData = (type) => {
    const initialData = {
      questionId: generateTempId(),
      type,
      description: '',
      isRequired: 1,
      isOpen: 0,
      isSkip: 0,
      sortKey:'1',
      categoryId: categoryId || null // 使用传入的分类ID
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
          instructions: '',
          options: [{ description: '', type: '行选项' }]
        }
      case '排序':
        return {
          ...initialData,
          sortType: '拖拽排序',
          instructions: '',
          options: [{ description: '', type: '行选项' }]
        }
      case '矩阵':
        return {
          ...initialData,
          matrixType: 'single',
          rowOptions: [{ description: '', type: '行选项' }],
          columnOptions: [{ description: '', type: '列选项' }]
        }
      case '文件上传题':
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
  // 添加问题后更新sortKey
  updateSortKeys()
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
        // 删除问题后更新sortKey
        updateSortKeys()
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
    // 删除问题后更新sortKey
    updateSortKeys()
  }
}

const moveQuestion = (index, direction) => {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  const question = questions.value[index]
  questions.value.splice(index, 1)
  questions.value.splice(newIndex, 0, question)
  activeQuestionIndex.value = newIndex
  // 移动问题后更新sortKey
  updateSortKeys()
}

const selectQuestion = (index) => {
  if (!isEditingOption.value) {
    // 确保索引有效
    if (index >= 0 && index < questions.value.length) {
      activeQuestionIndex.value = index
    }
  }
}

const updateQuestion = (index, updatedQuestion) => {
  console.log('updateQuestion - 开始更新问题')
  console.log('问题索引:', index)
  console.log('更新前的问题:', questions.value[index])
  console.log('新的问题数据:', updatedQuestion)
  
  if (index >= 0 && index < questions.value.length) {
    // 保持原有的 categoryId
    const currentCategoryId = questions.value[index].categoryId
    const finalQuestion = {
      ...updatedQuestion,
      categoryId: currentCategoryId
    }
    console.log('最终的问题对象:', finalQuestion)
    
    questions.value[index] = finalQuestion
    // 强制更新视图
    questions.value = [...questions.value]
    console.log('更新后的问题数组:', questions.value)
  }
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
  // console.log('SurveyBuilder - 设置后的状态:', {
  //   editingOption: editingOption.value,
  //   editingOptionIndex: editingOptionIndex.value,
  //   isEditingOption: isEditingOption.value,
  //   activeQuestionIndex: activeQuestionIndex.value
  // })
  
  // 获取可跳转的问题列表
  fetchSkipQuestions()
}

// 获取可跳转的问题列表
const fetchSkipQuestions = async () => {
  if (!props.surveyId) {
    // console.log('SurveyBuilder - 没有surveyId，跳过获取问题列表')
    return
  }
  
  try {
    // console.log('SurveyBuilder - 开始获取问题列表')
    const result = await getAllQuestionsBySurveyIdService(props.surveyId)
    const {survey,questions:questionsData} = result.data
    // console.log('SurveyBuilder - 获取问题列表结果:', result)
    if (result.code === 0) {
      const currentQuestionId = questionsData.value[activeQuestionIndex.value]?.questionId
      skipQuestions.value = result.data.filter(q => q.questionId !== currentQuestionId)
      // console.log('SurveyBuilder - 过滤后的跳转问题列表:', skipQuestions.value)
    }
  } catch (error) {
    // console.error('SurveyBuilder - 获取问题列表失败:', error)
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
    '矩阵': MatrixQuestion,
    '矩阵单选': MatrixQuestion,
    '矩阵多选': MatrixQuestion,
    '文件上传题': FileUploadQuestion
  }
  return componentMap[type] || null
}

// 验证问题
const validateQuestions = () => {
    validationErrors.value = {}
    let hasError = false

    questions.value.forEach((question, index) => {
        const errors = validateQuestion(question)
        if (errors && Object.keys(errors).length > 0) {
            validationErrors.value[index] = errors
            hasError = true
        }
    })

    return !hasError
}

// 获取问题错误信息
const getQuestionErrors = (index) => {
    const errors = validationErrors.value[index] || {}
    return Object.values(errors)
}

// 获取问卷详情
const fetchSurveyDetail = async () => {
    // 确定要使用的surveyId
    let currentSurveyId = null
    
    if (isPageRefresh.value) {
        // 如果是刷新页面，优先使用会话存储中的surveyId
        currentSurveyId = sessionStorage.getItem('currentSurveyId')
    } else {
        // 如果是新进入页面，优先使用props或路由参数中的surveyId
        currentSurveyId = props.surveyId || route.query.surveyId
    }
    
    if (!currentSurveyId) {
        console.log('没有surveyId，无法获取问卷详情')
        return
    }
    
    try {
        const result = await getSurveyAndQuestionsById(currentSurveyId)
        if (result.code === 0) {
            const data = result.data
            survey.value = {
                ...data.survey,
                description: getPlainText(data.survey.description)
            }
            questions.value = data.questions || []
            
            // 保存surveyId到会话存储
            sessionStorage.setItem('currentSurveyId', currentSurveyId)

            // 如果是分类模式，自动选中有问题的分类
            if (survey.value.isCategory === 1) {
                // 清空已选分类
                selectedCategories.value.clear()
                // 获取所有有问题的分类ID
                const categoriesWithQuestions = new Set(questions.value.map(q => q.categoryId).filter(id => id))
                // 将分类ID添加到选中集合中
                categoriesWithQuestions.forEach(id => selectedCategories.value.add(id))
            }
        }
    } catch (error) {
        // ElMessage.error('获取问卷详情失败')
    }
}

// 获取所有分类
const fetchCategories = async () => {
  try {
    const result = await getAllCategoriesByIdService(userInfoStore.info.id)
    if (result.code === 0) {
      categories.value = result.data
      // 如果问题没有分类，则默认选择第一个分类
      if (questions.value.length > 0) {
        questions.value.forEach(question => {
          if (!question.categoryId && categories.value.length > 0) {
            question.categoryId = categories.value[0].categoryId
            // 将默认分类添加到选中集合中
            selectedCategories.value.add(categories.value[0].categoryId)
          }
        })
      }
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 更新问题的sortKey
const updateSortKeys = () => {
  // console.log('updateSortKeys - 开始更新排序键')
  
  // 创建一个新的问题数组，而不是直接修改原数组
  const updatedQuestions = [...questions.value]
  
    // 不按分类排序，所有问题按页面顺序从1开始编号
  updatedQuestions.forEach((question, index) => {
    question.sortKey = (index + 1).toString()
  })
  // console.log('不按分类排序，更新后的sortKey:', updatedQuestions.map(q => ({ id: q.questionId, sortKey: q.sortKey })))

  // 一次性更新整个数组，避免多次触发响应式更新
  questions.value = updatedQuestions
}

// 监听isCategory变化
watch(() => survey.value.isCategory, (newValue, oldValue) => {
  if (newValue === 1) {
    fetchCategories()
    // 当切换到分类模式时，自动选中有问题的分类
    const categoriesWithQuestions = new Set(questions.value.map(q => q.categoryId).filter(id => id))
    categoriesWithQuestions.forEach(id => selectedCategories.value.add(id))
  } else {
    // 当关闭分类模式时，清空选中的分类
    selectedCategories.value.clear()
  }
  // 当分类状态变化时，更新sortKey
  if (newValue !== oldValue) {
    updateSortKeys()
  }
})

// 组件挂载时获取数据
onMounted(() => {
    // 检查是否是刷新页面
    const pageLoadTime = sessionStorage.getItem('pageLoadTime')
    const currentTime = new Date().getTime()
    
    if (pageLoadTime && currentTime - parseInt(pageLoadTime) < 1000) {
        // 如果页面加载时间间隔小于1秒，认为是刷新
        isPageRefresh.value = true
    } else {
        // 否则认为是新进入页面
        isPageRefresh.value = false
        // 清除之前的surveyId
        sessionStorage.removeItem('currentSurveyId')
    }
    
    // 更新页面加载时间
    sessionStorage.setItem('pageLoadTime', currentTime.toString())
    
    // 获取问卷详情
    fetchSurveyDetail()
    
    // 如果 isCategory 为 1，获取分类数据
    if (survey.value.isCategory === 1) {
        fetchCategories()
    }
    
    // 初始化sortKey
    updateSortKeys()
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
        // console.log('准备发送请求，surveyId:', survey.value.surveyId)
        // console.log('问卷数据:', survey.value)
        // console.log('问题数据:', questions.value)

        const res = survey.value.surveyId 
            ? await updateBuildSurvey(survey.value, questions.value)
            : await saveBuildSurvey(survey.value, questions.value)
            
        // console.log('请求响应:', res)
        
        if (res.code === 0) {
            ElMessage.success('问卷保存成功')
            if (!survey.value.surveyId) {
                survey.value.surveyId = res.data
                // 更新会话存储
                sessionStorage.setItem('currentSurveyId', res.data)
                // console.log('survey.value.surveyId'+survey.value.surveyId)
                // console.log('res.data.surveyId'+res.data)
            }
            
            // 保存成功后重新获取问卷详情，确保数据同步
            await fetchSurveyDetail()
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

    survey.value.status = '已发布'
    const res = await updateBuildSurvey(survey.value, questions.value)
    
    if (res.code === 0) {
      ElMessage.success('问卷提交成功')
      // 提交成功后重新获取问卷详情，确保数据同步
      await fetchSurveyDetail()
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

// 切换预览状态
const togglePreview = () => {
    // 验证问卷基本信息
    if (!survey.value.name) {
        ElMessage.warning('请填写问卷标题')
        return
    }

    // 验证是否有问题
    if (questions.value.length === 0) {
        ElMessage.warning('请至少添加一个问题')
        return
    }

    // 清空之前的验证错误
    validationErrors.value = {}

    // 验证所有问题
    let hasError = false
    questions.value.forEach((question, index) => {
        const errors = validateQuestion(question)
        if (errors && Object.keys(errors).length > 0) {
            hasError = true
            validationErrors.value[index] = errors
        }
    })

    if (hasError) {
        // 只显示一个总的错误提示，而不是每个问题都提示
        ElMessage.error('问卷中存在未完善的问题，请检查')
        return
    }

    // 切换预览状态
    isPreviewMode.value = !isPreviewMode.value
    if (!isPreviewMode.value) {
        activeQuestionIndex.value = -1
    }
}

// 监听预览模式变化
watch(isPreviewMode, (newValue) => {
    if (newValue) {
        // 进入预览模式时，确保所有问题都有正确的初始状态
        questions.value.forEach(question => {
            if (!question.selectedOption) question.selectedOption = null
            if (!question.selectedOptions) question.selectedOptions = []
            if (!question.matrixAnswers) question.matrixAnswers = {}
            if (!question.openAnswer) question.openAnswer = ''
            if (question.options) {
                question.options.forEach(option => {
                    if (option.isOpenOption && !option.openAnswer) {
                        option.openAnswer = ''
                    }
                })
            }
        })
    }
})

const getPlainText = (htmlContent)=> {
    // 使用正则去掉 HTML 标签，获取纯文本
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    return div.textContent || div.innerText || '';
}

// 添加用户信息存储
const userInfoStore = useUserInfoStore()

// 关闭添加分类对话框
const closeAddCategoryDialog = () => {
  showAddCategoryDialog.value = false
  // 重置表单
  newCategory.value = {
    categoryName: '',
    description: '',
    categoryLevel: 1,
    userId: ''
  }
}

// 添加分类方法
const addCategory = async () => {
    if (!newCategory.value.categoryName) {
        ElMessage.warning('请输入分类名称')
        return
    }
    
    try {
        // 设置用户ID
        newCategory.value.createdBy = userInfoStore.info.id
        
        // 调用添加分类API
        const result = await categoryAddService(newCategory.value)
        
        if (result.code === 0) {
            ElMessage.success('分类添加成功')
            // 重新获取分类列表
            await fetchCategories()
            // 关闭对话框
            showAddCategoryDialog.value = false
            // 重置表单
            newCategory.value = {
                categoryName: '',
                description: '',
                categoryLevel: 1,
                userId: ''
            }
        } else {
            ElMessage.error(result.message || '分类添加失败')
        }
    } catch (error) {
        console.error('添加分类失败:', error)
        ElMessage.error('添加分类失败: ' + error.message)
    }
}


// 打开添加分类对话框
const openAddCategoryDialog = () => {
    showAddCategoryDialog.value = true
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
           :class="{ 'preview-mode': isPreviewMode }">
        <div class="survey-header">
          <el-input v-model="survey.name" placeholder="请输入问卷标题" />
          <div class="survey-category-switch">
            <el-switch
              v-model="survey.isCategory"
              :active-value="1"
              :inactive-value="0"
              active-text="按分类排序"
              inactive-text="不按分类排序"
            />
          </div>
          <el-input
            v-model="survey.description"
            type="textarea"
            :rows="3"
            placeholder="请输入问卷描述"
          />
        </div>

        <!-- 分类选择区域 -->
        <div v-if="survey.isCategory === 1" class="category-selection">
          <div class="category-selection-header">
            <h4>选择要显示的分类：</h4>
            <el-button type="primary" size="small" @click="openAddCategoryDialog">添加分类</el-button>
          </div>
          <div class="category-tags">
            <el-tag
              v-for="category in categories"
              :key="category.categoryId"
              :type="isCategorySelected(category.categoryId) ? 'primary' : 'info'"
              class="category-tag"
              @click="handleCategorySelect(category.categoryId)"
            >
              {{ category.categoryName }}
            </el-tag>
          </div>
        </div>

        <div class="questions-container">
          <template v-if="survey.isCategory === 1">
            <div v-for="group in groupedQuestions" 
                 :key="group.categoryId" 
                 class="question-group"
                 v-show="isCategorySelected(group.categoryId)">
              <div class="group-header" @click="toggleCategory(group.categoryId)">
                <h4>{{ group.categoryName }}</h4>
                <el-icon :class="{ 'expanded': isCategoryExpanded(group.categoryId) }">
                  <ArrowDown />
                </el-icon>
              </div>
              <div class="group-questions" 
                   v-show="isCategoryExpanded(group.categoryId)"
                   @dragover.prevent 
                   @drop="onDrop($event, group.categoryId)">
                <transition-group name="question-fade" tag="div">
                  <div v-for="(question, index) in group.questions" 
                       :key="question.questionId || index"
                       class="question-item"
                       :class="{ 
                         'active': activeQuestionIndex === questions.findIndex(q => q.questionId === question.questionId),
                         'has-error': getQuestionErrors(questions.findIndex(q => q.questionId === question.questionId)).length > 0
                       }"
                       @click="selectQuestion(questions.findIndex(q => q.questionId === question.questionId || q === question))">
                    <div class="question-header">
                      <span class="question-type">{{ question.type }}</span>
                      <div class="question-actions">
                        <el-button type="text" @click.stop="moveQuestion(questions.findIndex(q => q.questionId === question.questionId), 'up')" :disabled="questions.findIndex(q => q.questionId === question.questionId) === 0">
                          <el-icon><ArrowUp /></el-icon>
                        </el-button>
                        <el-button type="text" @click.stop="moveQuestion(questions.findIndex(q => q.questionId === question.questionId), 'down')" :disabled="questions.findIndex(q => q.questionId === question.questionId) === questions.length - 1">
                          <el-icon><ArrowDown /></el-icon>
                        </el-button>
                        <el-button type="text" @click.stop="deleteQuestion(questions.findIndex(q => q.questionId === question.questionId))">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                    <div class="question-content">
                      <component 
                        :is="getQuestionComponent(question.type)"
                        :model-value="question"
                        @update:model-value="updateQuestion(questions.findIndex(q => q.questionId === question.questionId), $event)"
                        @edit-option="handleEditOption"
                      />
                    </div>
                    <div v-if="getQuestionErrors(questions.findIndex(q => q.questionId === question.questionId)).length > 0" class="question-errors">
                      <el-alert
                        v-for="(error, errorIndex) in getQuestionErrors(questions.findIndex(q => q.questionId === question.questionId))"
                        :key="errorIndex"
                        :title="error"
                        type="error"
                        :closable="false"
                        show-icon
                      />
                    </div>
                  </div>
                </transition-group>
                <!-- 添加空分类提示 -->
                <div v-if="group.questions.length === 0" class="empty-category">
                  <el-empty description="拖拽问题到此处" />
                </div>
              </div>
            </div>
          </template>
          <!-- 非分类模式保持不变 -->
          <template v-else>
            <div v-for="(question, index) in questions" 
                 :key="index"
                 class="question-item"
                 :class="{ 
                   'active': activeQuestionIndex === index,
                   'has-error': getQuestionErrors(index).length > 0
                 }"
                 @click="selectQuestion(index)">
              <!-- 非分类模式的问题内容保持不变 -->
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
          </template>
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
        
        <div class="panel-content">
          <template v-if="!isPreviewMode">
            <!-- 选项编辑面板 -->
            <div v-if="isEditingOption && editingOption">
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
            <!-- 问题属性面板 -->
            <div v-else-if="activeQuestionIndex !== -1">
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
            <el-empty v-else description="请选择问题或点击预览按钮" />
          </template>
          <template v-else>
            <SurveyBuildPreview 
              :survey="survey"
              :questions="questions"
              :categories="categories"
            />
          </template>
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

    <!-- 添加分类对话框 -->
    <el-dialog
      v-model="showAddCategoryDialog"
      title="添加分类"
      width="30%"
      :before-close="closeAddCategoryDialog"
    >
      <el-form :model="newCategory" label-width="100px">
        <el-form-item label="分类名称">
          <el-input v-model="newCategory.categoryName" placeholder="请输入分类名称"></el-input>
        </el-form-item>
        <el-form-item label="分类描述">
          <el-input v-model="newCategory.description" placeholder="请输入分类描述"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeAddCategoryDialog">取消</el-button>
        <el-button type="primary" @click="addCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.survey-builder {
  width: 100%;
  height: 100%;
  position: relative;
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

    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #303133;
    }

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
      background-color: #fff;
      transition: all 0.3s ease;

      &:hover {
        background-color: #f5f7fa;
        border-color: #409EFF;
      }

      .el-icon {
        font-size: 16px;
        color: #409EFF;
      }

      span {
        font-size: 14px;
        color: #606266;
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

      .question-group {
        background-color: #fff;
        border-radius: 4px;
        padding: 15px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

        .group-header {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #dcdfe6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          
          h4 {
            margin: 0;
            color: #606266;
          }
          
          .el-icon {
            transition: transform 0.3s;
            
            &.expanded {
              transform: rotate(180deg);
            }
          }
        }

        .group-questions {
          display: flex;
          flex-direction: column;
          gap: 15px;
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

  .category-selection {
    margin: 20px 0;
    padding: 15px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    .category-selection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      h4 {
        margin: 0;
        color: #606266;
      }
    }

    .category-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      .category-tag {
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
}

.question-fade-enter-active,
.question-fade-leave-active {
  transition: all 0.3s ease;
}

.question-fade-enter-from,
.question-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.question-fade-move {
  transition: transform 0.3s ease;
}

.empty-category {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  margin: 10px 0;
  transition: all 0.3s ease;

  &:hover {
    border-color: #409EFF;
    background-color: #f5f7fa;
  }
}
</style> 