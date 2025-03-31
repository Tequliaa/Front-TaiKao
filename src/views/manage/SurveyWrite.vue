<script setup>
import { ref, onMounted } from 'vue'
import { submitResponseService, getResponseDetailsService } from '@/api/response'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/user'

// 问卷ID
const props = defineProps({
    surveyId: {
        type: [String, Number],
        required: true
    }
})

// 问题列表
const questions = ref([])
// 问卷信息
const surveyInfo = ref({
    name: '',
    description: ''
})

const router = useRouter()
const userInfoStore = useUserInfoStore()

const loading = ref(true)

// 添加问题显示状态控制
const visibleQuestions = ref(new Set())

// 初始化问题显示状态
const initQuestionVisibility = () => {
    visibleQuestions.value.clear()
    questions.value.forEach(question => {
        visibleQuestions.value.add(question.questionId)
    })
}

// 处理选项选择变化
const handleOptionChange = (question, optionId, checked) => {
    // 先显示所有问题
    questions.value.forEach(q => {
        visibleQuestions.value.add(q.questionId)
    })

    if (checked) {
        // 找到选中的选项
        const selectedOption = question.options.find(opt => opt.optionId === optionId)
        if (selectedOption?.isSkip) {
            // 获取当前问题索引
            const currentIndex = questions.value.findIndex(q => q.questionId === question.questionId)
            // 获取目标问题索引
            const targetIndex = questions.value.findIndex(q => q.questionId === selectedOption.skipTo)
            
            if (currentIndex !== -1 && targetIndex !== -1) {
                // 隐藏中间的问题
                for (let i = currentIndex + 1; i < targetIndex; i++) {
                    visibleQuestions.value.delete(questions.value[i].questionId)
                }
            }
        }
    }
}

// 修改获取问卷数据的方法
const getSurveyData = async () => {
    loading.value = true
    try {
        // 获取用户答题记录
        const responseResult = await getResponseDetailsService(props.surveyId, userInfoStore.info.id)
        console.log('接口返回数据：', responseResult)
        
        if (responseResult.code === 0) {
            const { userResponses, questions: questionsData } = responseResult.data
            
            // 先初始化所有问题为显示状态
            visibleQuestions.value.clear()
            questionsData.forEach(question => {
                visibleQuestions.value.add(question.questionId)
            })
            
            // 处理每个问题，添加必要的响应式数据
            questions.value = questionsData.map(question => {
                // 根据问题类型初始化不同的数据
                if (question.type === '多选') {
                    question.selectedOptions = []
                } else if (question.type === '单选') {
                    question.selectedOption = ''
                } else if (question.type === '矩阵单选' || question.type === '矩阵多选') {
                    question.matrixAnswers = {}
                    // 初始化每个行选项的答案
                    question.options
                        .filter(opt => opt.type === '行选项')
                        .forEach(row => {
                            if (question.type === '矩阵单选') {
                                question.matrixAnswers[row.optionId] = ''  // 初始化为空字符串
                            } else {
                                question.matrixAnswers[row.optionId] = []  // 初始化为空数组
                            }
                        })
                }

                // 设置用户之前的答案
                const questionResponses = userResponses.filter(r => r.questionId === question.questionId)
                
                if (questionResponses.length > 0) {
                    switch (question.type) {
                        case '单选':
                            // 找到选中的选项（isValid为1的选项）
                            const selectedResponse = questionResponses.find(r => r.isValid === 1)
                            if (selectedResponse) {
                                question.selectedOption = selectedResponse.optionId
                                // 处理跳转逻辑
                                const selectedOption = question.options.find(opt => opt.optionId === selectedResponse.optionId)
                                if (selectedOption?.isSkip) {
                                    // 获取当前问题索引
                                    const currentIndex = questionsData.findIndex(q => q.questionId === question.questionId)
                                    // 获取目标问题索引
                                    const targetIndex = questionsData.findIndex(q => q.questionId === selectedOption.skipTo)
                                    
                                    if (currentIndex !== -1 && targetIndex !== -1) {
                                        // 隐藏中间的问题
                                        for (let i = currentIndex + 1; i < targetIndex; i++) {
                                            visibleQuestions.value.delete(questionsData[i].questionId)
                                        }
                                    }
                                }
                                // 处理开放题答案
                                const option = question.options.find(opt => opt.optionId === selectedResponse.optionId)
                                if (option && option.isOpenOption && selectedResponse.responseData) {
                                    option.openAnswer = selectedResponse.responseData
                                }
                            }
                            break
                        case '多选':
                            // 找到所有选中的选项（isValid为1的选项）
                            question.selectedOptions = questionResponses
                                .filter(r => r.isValid === 1)
                                .map(r => r.optionId)
                            // 处理开放题答案
                            questionResponses
                                .filter(r => r.isValid === 1)
                                .forEach(response => {
                                    const option = question.options.find(opt => opt.optionId === response.optionId)
                                    if (option && option.isOpenOption && response.responseData) {
                                        option.openAnswer = response.responseData
                                    }
                                })
                            break
                        case '矩阵单选':
                            // 处理矩阵单选题答案
                            questionResponses.forEach(response => {
                                if (response.rowId && response.columnId && response.isValid === 1) {
                                    question.matrixAnswers[response.rowId] = response.columnId
                                }
                            })
                            break
                        case '矩阵多选':
                            // 处理矩阵多选题答案
                            questionResponses.forEach(response => {
                                if (response.rowId && response.columnId && response.isValid === 1) {
                                    if (!question.matrixAnswers[response.rowId]) {
                                        question.matrixAnswers[response.rowId] = []
                                    }
                                    question.matrixAnswers[response.rowId].push(response.columnId)
                                }
                            })
                            break
                        case '评分题':
                            // 处理评分题答案
                            questionResponses.forEach(response => {
                                if (response.optionId && response.responseData && response.isValid === 1) {
                                    const option = question.options.find(opt => opt.optionId === response.optionId)
                                    if (option) {
                                        option.rating = Number(response.responseData)
                                    }
                                }
                            })
                            break
                        case '填空':
                            // 处理填空题答案
                            const textResponse = questionResponses.find(r => r.responseData && r.isValid === 1)
                            if (textResponse) {
                                question.answer = textResponse.responseData
                            }
                            break
                    }
                }

                return question
            })

            // 设置问卷信息
            if (questionsData.length > 0) {
                surveyInfo.value = {
                    name: questionsData[0].surveyName,
                    description: questionsData[0].surveyDescription
                }
            }
        } else {
            ElMessage.error('获取问卷数据失败')
        }
    } catch (error) {
        console.error('获取问卷数据异常：', error)
        ElMessage.error('获取问卷数据失败：' + error.message)
    } finally {
        loading.value = false
    }
}

const getQuestionIndex = (questionId) => {
    const index = questions.value.findIndex(q => q.questionId === questionId)
    return index + 1
}

const handleMatrixCheckboxChange = (question, rowId, colId, checked) => {
    if (!question.matrixAnswers[rowId]) {
        question.matrixAnswers[rowId] = []
    }
    
    if (checked) {
        if (!question.matrixAnswers[rowId].includes(colId)) {
            question.matrixAnswers[rowId].push(colId)
        }
    } else {
        const index = question.matrixAnswers[rowId].indexOf(colId)
        if (index !== -1) {
            question.matrixAnswers[rowId].splice(index, 1)
        }
    }
}

// 修改验证必答题的方法
const validateRequiredQuestions = () => {
    const invalidQuestions = []
    
    questions.value.forEach(question => {
        // 跳过被隐藏的问题
        if (!visibleQuestions.value.has(question.questionId)) return
        if (!question.isRequired) return
        
        let isValid = true
        switch (question.type) {
            case '单选':
                isValid = !!question.selectedOption
                // 检查开放选项
                if (isValid) {
                    const selectedOption = question.options.find(opt => opt.optionId === question.selectedOption)
                    if (selectedOption?.isOpenOption && !selectedOption.openAnswer?.trim()) {
                        isValid = false
                    }
                }
                break
            case '多选':
                isValid = question.selectedOptions.length > 0
                // 检查开放选项
                if (isValid) {
                    const hasEmptyOpenAnswer = question.selectedOptions.some(optionId => {
                        const option = question.options.find(opt => opt.optionId === optionId)
                        return option?.isOpenOption && !option.openAnswer?.trim()
                    })
                    if (hasEmptyOpenAnswer) {
                        isValid = false
                    }
                }
                break
            case '填空':
                isValid = !!question.answer?.trim()
                break
            case '矩阵单选':
                // 检查每一行是否都选择了答案
                const rowOptions = question.options.filter(opt => opt.type === '行选项')
                isValid = rowOptions.every(row => !!question.matrixAnswers[row.optionId])
                break
            case '矩阵多选':
                // 检查每一行是否都至少选择了一个答案
                const matrixRowOptions = question.options.filter(opt => opt.type === '行选项')
                isValid = matrixRowOptions.every(row => 
                    question.matrixAnswers[row.optionId]?.length > 0
                )
                break
            case '评分题':
                isValid = question.options.some(option => option.rating)
                break
        }
        
        if (!isValid) {
            invalidQuestions.push(question)
        }
    })
    
    return invalidQuestions
}

// 修改提交方法
const submitSurvey = async (isSaveAction = false) => {
    try {
        // 如果不是保存操作，先验证必答题
        if (!isSaveAction) {
            const invalidQuestions = validateRequiredQuestions()
            if (invalidQuestions.length > 0) {
                const questionNumbers = invalidQuestions.map(q => 
                    questions.value.findIndex(question => question.questionId === q.questionId) + 1
                ).join('、')
                ElMessage.error(`第${questionNumbers}题是必答题，请填写后再提交`)
                return
            }
        }

        // 构建表单数据
        const formData = new FormData()
        formData.append('surveyId', props.surveyId)
        formData.append('isSaveAction', isSaveAction)
        formData.append('userId', userInfoStore.info.id)
        formData.append('userRole', userInfoStore.info.role)
        formData.append('ipAddress', '127.0.0.1')

        // 处理每个问题的答案
        questions.value.forEach(question => {
            // 跳过被隐藏的问题
            if (!visibleQuestions.value.has(question.questionId)) return
            
            switch (question.type) {
                case '单选':
                    formData.append(`question_${question.questionId}`, question.selectedOption || '')
                    break
                case '多选':
                    // 多选题需要为每个选项创建一个记录
                    question.selectedOptions.forEach(optionId => {
                        formData.append(`question_${question.questionId}`, optionId)
                    })
                    break
                case '填空':
                    formData.append(`question_${question.questionId}`, question.answer || '')
                    break
                case '矩阵单选':
                    Object.entries(question.matrixAnswers).forEach(([rowId, colId]) => {
                        if (colId) {  // 只提交有选择的答案
                            formData.append(`question_${question.questionId}_row_${rowId}`, colId)
                        }
                    })
                    break
                case '矩阵多选':
                    Object.entries(question.matrixAnswers).forEach(([rowId, colIds]) => {
                        if (colIds && colIds.length > 0) {  // 只提交有选择的答案
                            colIds.forEach(colId => {
                                formData.append(`question_${question.questionId}_row_${rowId}`, colId)
                            })
                        }
                    })
                    break
                case '评分题':
                    question.options.forEach(option => {
                        if (option.rating) {  // 只提交有评分的答案
                            formData.append(`rating_${question.questionId}_${option.optionId}`, option.rating)
                        }
                    })
                    break
            }

            // 处理开放选项
            if (question.options) {
                question.options.forEach(option => {
                    if (option.isOpenOption && option.openAnswer) {
                        formData.append(`open_answer_${option.optionId}`, option.openAnswer)
                    }
                })
            }
        })

        // 发送请求
        const result = await submitResponseService(formData)
        
        if (result.code === 0) {
            ElMessage.success(isSaveAction ? '保存成功' : '提交成功')
            if (!isSaveAction) {
                router.push('/manage/userSurvey')
            }
        } else {
            ElMessage.error(result.message || '操作失败')
        }
    } catch (error) {
        ElMessage.error('操作失败：' + error.message)
    }
}

// 添加确认提交方法
const confirmSubmit = () => {
    ElMessageBox.confirm(
        '确定要提交问卷吗？提交后将无法修改。',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(() => {
        submitSurvey(false)
    }).catch(() => {
        ElMessage.info('已取消提交')
    })
}

// 修改矩阵单选的处理方法
const handleMatrixRadioChange = (question, rowId, colId, checked) => {
    if (checked) {
        question.matrixAnswers[rowId] = colId
    } else {
        question.matrixAnswers[rowId] = ''
    }
}

onMounted(() => {
    getSurveyData()
})
</script>

<template>
    <div class="survey-preview">
        <div class="survey-container">
            <!-- 添加加载状态 -->
            <el-skeleton :loading="loading" animated :rows="10">
                <template #default>
                    <!-- 问卷标题和描述 -->
                    <div class="survey-header">
                        <h1 class="survey-title">{{ surveyInfo.name }}</h1>
                        <h6 class="survey-description">{{ surveyInfo.description }}</h6>
                    </div>

                    <!-- 问题列表 -->
                    <div class="questions-list">
                        <div v-for="(question, index) in questions" 
                            :key="question.questionId" 
                            :id="'question_' + question.questionId"
                            class="question-item"
                            :data-index="index + 1"
                            :data-has-skip="question.isSkip"
                            v-show="visibleQuestions.has(question.questionId)">
                            <!-- 问题标题 -->
                            <div class="question-title">
                                <span class="question-number">{{ index + 1 }}.</span>
                                <span class="question-text">{{ question.description }}</span>
                                <span class="question-type">({{ question.type }}, {{ question.isRequired ? '必答' : '选填' }})</span>
                                <span v-if="question.isRequired" class="required">*</span>
                            </div>

                            <!-- 根据问题类型显示不同的选项 -->
                            <div class="question-options">
                                <!-- 单选题 -->
                                <template v-if="question.type === '单选'">
                                    <div class="form-check">
                                        <div v-for="(option, optIndex) in question.options" 
                                            :key="option.optionId" 
                                            class="form-check-option">
                                            <el-radio 
                                                v-model="question.selectedOption" 
                                                :label="option.optionId"
                                                :required="question.isRequired"
                                                @change="(val) => handleOptionChange(question, option.optionId, val === option.optionId)">
                                                <span class="option-label">
                                                    {{ String.fromCharCode(65 + optIndex) }}.
                                                    <template v-if="option.isOpenOption">
                                                        <el-input 
                                                            v-model="option.openAnswer" 
                                                            :placeholder="option.description"
                                                            class="open-answer-input" />
                                                    </template>
                                                    <template v-else>
                                                        {{ option.description }}
                                                        <span v-if="option.isSkip" class="skip-info">
                                                            (跳转至第{{ getQuestionIndex(option.skipTo) }}题)
                                                        </span>
                                                    </template>
                                                </span>
                                            </el-radio>
                                        </div>
                                    </div>
                                </template>

                                <!-- 多选题 -->
                                <template v-if="question.type === '多选'">
                                    <div class="form-check more-choice" :data-required="question.isRequired">
                                        <div v-for="(option, optIndex) in question.options" 
                                            :key="option.optionId" 
                                            class="form-check-option more-option">
                                            <el-checkbox 
                                                v-model="question.selectedOptions" 
                                                :label="option.optionId"
                                                :required="question.isRequired">
                                                <span class="option-label">
                                                    {{ String.fromCharCode(65 + optIndex) }}.
                                                    <template v-if="option.isOpenOption">
                                                        <el-input 
                                                            v-if="question.selectedOptions.includes(option.optionId)"
                                                            v-model="option.openAnswer" 
                                                            :placeholder="option.description"
                                                            class="open-answer-input" />
                                                        <span v-else>{{ option.description }}</span>
                                                    </template>
                                                    <template v-else>
                                                        {{ option.description }}
                                                        <span v-if="option.isSkip" class="skip-info">
                                                            (跳转至第{{ getQuestionIndex(option.skipTo) }}题)
                                                        </span>
                                                    </template>
                                                </span>
                                            </el-checkbox>
                                        </div>
                                    </div>
                                </template>

                                <!-- 填空题 -->
                                <template v-if="question.type === '填空'">
                                    <el-input 
                                        v-model="question.answer" 
                                        type="textarea" 
                                        :rows="3" 
                                        :placeholder="'请输入答案'"
                                        :required="question.isRequired" />
                                </template>

                                <!-- 矩阵单选题 -->
                                <template v-if="question.type === '矩阵单选'">
                                    <el-table 
                                        :data="question.options.filter(opt => opt.type === '行选项')" 
                                        border
                                        style="width: 100%">
                                        <el-table-column 
                                            prop="description" 
                                            label="行选项"
                                            width="180" />
                                        <el-table-column 
                                            v-for="col in question.options.filter(opt => opt.type === '列选项')"
                                            :key="col.optionId"
                                            :label="col.description"
                                            align="center"
                                            width="120">
                                            <template #default="{ row }">
                                                <el-radio 
                                                    v-model="question.matrixAnswers[row.optionId]" 
                                                    :label="col.optionId"
                                                    @change="(val) => handleMatrixRadioChange(question, row.optionId, col.optionId, val)" />
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </template>

                                <!-- 矩阵多选题 -->
                                <template v-if="question.type === '矩阵多选'">
                                    <el-table 
                                        :data="question.options.filter(opt => opt.type === '行选项')" 
                                        border
                                        style="width: 100%">
                                        <el-table-column 
                                            prop="description" 
                                            label="行选项"
                                            width="180" />
                                        <el-table-column 
                                            v-for="col in question.options.filter(opt => opt.type === '列选项')"
                                            :key="col.optionId"
                                            :label="col.description"
                                            align="center"
                                            width="120">
                                            <template #default="{ row }">
                                                <el-checkbox 
                                                    :model-value="question.matrixAnswers[row.optionId]?.includes(col.optionId)"
                                                    @update:model-value="(val) => handleMatrixCheckboxChange(question, row.optionId, col.optionId, val)" />
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </template>

                                <!-- 评分题 -->
                                <template v-if="question.type === '评分题'">
                                    <div class="rating-question">
                                        <div v-for="option in question.options" :key="option.optionId" class="rating-item">
                                            <label class="rating-label">{{ option.description }}:</label>
                                            <el-input-number 
                                                v-model="option.rating" 
                                                :min="1" 
                                                :max="10"
                                                :required="question.isRequired"
                                                class="rating-input" />
                                        </div>
                                    </div>
                                </template>

                                <!-- 文件上传题 -->
                                <template v-if="question.type === '文件上传'">
                                    <el-upload
                                        class="upload-demo"
                                        action="/api/upload"
                                        :on-preview="handlePreview"
                                        :on-remove="handleRemove"
                                        :before-remove="beforeRemove"
                                        multiple
                                        :limit="3"
                                        :on-exceed="handleExceed"
                                        :required="question.isRequired">
                                        <el-button type="primary">点击上传</el-button>
                                        <template #tip>
                                            <div class="el-upload__tip">
                                                支持 jpg/png/pdf/docx 文件
                                            </div>
                                        </template>
                                    </el-upload>
                                </template>
                            </div>
                        </div>
                    </div>

                    <!-- 添加按钮组 -->
                    <div class="button-group">
                        <el-button type="primary" @click="submitSurvey(true)">保存</el-button>
                        <el-button type="success" @click="confirmSubmit">提交</el-button>
                    </div>
                </template>
            </el-skeleton>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.survey-preview {
    background-color: #f8f9fa;
    min-height: 100vh;
    padding: 20px 0;
    // 添加硬件加速和滚动优化
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;

    .survey-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 20px;
    }

    .survey-header {
        margin-bottom: 30px;
        text-align: center;

        .survey-title {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 10px;
        }

        .survey-description {
            font-size: 16px;
            color: #606266;
            line-height: 1.6;
        }
    }

    .question-item {
        margin-bottom: 24px;
        padding: 16px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        // 添加内容溢出控制
        overflow: hidden;
        // 添加硬件加速
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;

        .question-title {
            margin-bottom: 16px;
            font-size: 15px;
            font-weight: 500;
            color: #303133;
            line-height: 1.5;

            .question-number {
                margin-right: 6px;
                color: #409EFF;
                font-weight: 500;
            }

            .question-type {
                color: #909399;
                font-size: 13px;
                margin-left: 8px;
            }

            .required {
                color: #f56c6c;
                margin-left: 4px;
            }
        }

        .question-options {
            margin-left: 20px;
            // 添加内容溢出控制
            overflow: hidden;

            .form-check {
                .form-check-option {
                    margin-bottom: 8px;

                    .option-label {
                        font-size: 14px;
                        color: #606266;
                    }

                    .open-answer-input {
                        width: 200px;
                        margin-left: 8px;
                    }

                    .skip-info {
                        color: #409EFF;
                        font-size: 13px;
                        margin-left: 4px;
                    }
                }
            }

            .more-choice {
                .more-option {
                    margin-bottom: 8px;
                }
            }

            .rating-question {
                .rating-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;

                    .rating-label {
                        width: 120px;
                        font-size: 14px;
                        color: #606266;
                    }

                    .rating-input {
                        width: 120px;
                    }
                }
            }

            .upload-demo {
                .el-upload__tip {
                    color: #909399;
                    font-size: 12px;
                    margin-top: 8px;
                }
            }

            // 修改矩阵单选题的样式
            :deep(.el-table) {
                // 添加表格滚动优化
                transform: translateZ(0);
                -webkit-transform: translateZ(0);
                will-change: transform;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;

                .el-radio {
                    .el-radio__label {
                        display: none;
                    }
                    .el-radio__inner {
                        margin-right: 0;
                    }
                }
            }
        }
    }

    .button-group {
        margin-top: 30px;
        text-align: center;
        
        .el-button {
            margin: 0 10px;
            min-width: 100px;
        }
    }
}
</style> 