<script setup>
import { ref, onMounted } from 'vue'
import { getAllQuestionsService,getAllQuestionsBySurveyIdService } from '@/api/question'
import { ElMessage } from 'element-plus'

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

// 获取问卷的所有问题
const getSurveyData = async () => {
    try {
        // 获取问题列表（包含选项）
        const questionsResult = await getAllQuestionsBySurveyIdService(props.surveyId)
        // 处理每个问题，添加必要的响应式数据
        questions.value = questionsResult.data.map(question => {
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
            return question
        })
        // 设置问卷信息
        if (questionsResult.data.length > 0) {
            surveyInfo.value = {
                name: questionsResult.data[0].surveyName,
                description: questionsResult.data[0].surveyDescription
            }
        }
    } catch (error) {
        ElMessage.error('获取问卷数据失败')
    }
}

// 处理选项选择
const handleOptionSelect = (questionId, optionId) => {
    // 根据问题类型处理选择逻辑
    const question = questions.value.find(q => q.questionId === questionId)
    if (!question) return

    switch (question.type) {
        case '单选':
            question.selectedOption = optionId
            break
        case '多选':
            const index = question.selectedOptions.indexOf(optionId)
            if (index === -1) {
                question.selectedOptions.push(optionId)
            } else {
                question.selectedOptions.splice(index, 1)
            }
            break
        case '矩阵单选':
            // 更新单选答案 {行ID: 列ID}
            question.matrixAnswers[optionId.rowId] = optionId.colId
            break
        case '矩阵多选':
            // 确保该行选项的答案数组存在
            if (!question.matrixAnswers[optionId.rowId]) {
                question.matrixAnswers[optionId.rowId] = []
            }
            // 切换选中状态
            const matrixIndex = question.matrixAnswers[optionId.rowId].indexOf(optionId.colId)
            if (matrixIndex === -1) {
                question.matrixAnswers[optionId.rowId].push(optionId.colId)
            } else {
                question.matrixAnswers[optionId.rowId].splice(matrixIndex, 1)
            }
            break
        case '排序':
            // 排序需要处理拖拽排序
            break
        case '评分题':
            // 评分题需要处理评分选择
            break
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

onMounted(() => {
    getSurveyData()
})
</script>

<template>
        <div class="survey-preview">
            <div class="survey-container">
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
                        :data-has-skip="question.isSkip">
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
                                            :required="question.isRequired">
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
                                                @change="handleOptionSelect(question.questionId, {rowId: row.optionId, colId: col.optionId})" />
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
            </div>
        </div>
</template>

<style lang="scss" scoped>
.survey-preview {
    background-color: #f8f9fa;
    min-height: 100vh;
    padding: 20px 0;

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
        }
    }
}
</style> 