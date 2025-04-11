<script setup>
import { ref, onMounted } from 'vue'
import { getStatisticsService } from '@/api/response'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
// 问卷ID
const props = defineProps({
    surveyId: {
        type: [String, Number],
        required: true
    },
    departmentId: {
        type: [String, Number],
        required: false
    },
    departmentName: {
        type: String,
        required: false
    }
})

const router = useRouter()

// 问题列表
const questions = ref([])
const unfinishedTotalRecords = ref(0)
// 问卷信息
const surveyInfo = ref({
    name: '',
    description: ''
})

const loading = ref(true)

// 添加问题显示状态控制
const visibleQuestions = ref(new Set())


// 获取统计数据
const getStatistics = async () => {
    loading.value = true
    try {
        const response = await getStatisticsService(props.surveyId,props.departmentId)
        if (response.code === 0) {
            // 直接使用返回的 questions 数组
            questions.value = response.data.questions
            unfinishedTotalRecords.value = response.data.unfinishedTotalRecords
            // 设置问卷信息
                    // 处理每个问题，添加必要的响应式数据
            questions.value = response.data.questions.map(question => {
                if (question.type === '矩阵单选' || question.type === '矩阵多选') {
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
            if (questions.value && questions.value.length > 0) {
                surveyInfo.value = {
                    name: questions.value[0].surveyName,
                    description: questions.value[0].surveyDescription
                }
                // 初始化所有问题的显示状态
                questions.value.forEach(question => {
                    visibleQuestions.value.add(question.questionId)
                })
            }
        } else {
            ElMessage.error('获取统计数据失败')
        }
    } catch (error) {
        console.error('获取统计数据失败:', error)
        ElMessage.error('获取统计数据失败：' + error.message)
    } finally {
        loading.value = false
    }
}

// 组件挂载时获取数据
onMounted(() => {
    console.log('组件挂载，开始获取数据')
    getStatistics()
})

// 跳转到未完成列表
const goToUnfinishedList = () => {
    router.push({
        name: 'UnfinishedList',
        params: {
            surveyId: props.surveyId,
            departmentId: props.departmentId,
            surveyName: surveyInfo.value.name,
            departmentName: props.departmentName
        }
    })
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
</script>

<template>
    <div class="survey-statistics">
        <div class="survey-container">
            <!-- 添加加载状态 -->
            <el-skeleton :loading="loading" animated :rows="10">
                <template #default>
                    <!-- 问卷标题和描述 -->
                    <div class="survey-header">
                        <h1 class="survey-title">{{ surveyInfo.name }}</h1>
                        <div class="unfinished-info">
                            <h4>{{props.departmentName}}——未完成人数：<span class="unfinished-count" @click="goToUnfinishedList">{{ unfinishedTotalRecords }}</span></h4>
                        </div>
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
                                            <span class="option-label">
                                                {{ String.fromCharCode(65 + optIndex) }}. {{ option.description }}
                                                <span class="check-count">(选择人数: {{ option.checkCount }})</span>
                                            </span>
                                        </div>
                                    </div>
                                </template>

                                <!-- 多选题 -->
                                <template v-if="question.type === '多选'">
                                    <div class="form-check">
                                        <div v-for="(option, optIndex) in question.options" 
                                            :key="option.optionId" 
                                            class="form-check-option">
                                            <span class="option-label">
                                                {{ String.fromCharCode(65 + optIndex) }}. {{ option.description }}
                                                <span class="check-count">(选择人数: {{ option.checkCount }})</span>
                                            </span>
                                        </div>
                                    </div>
                                </template>

                                <!-- 填空题 -->
                                <template v-if="question.type === '填空'">
                                    <div class="text-answer">
                                        <span class="check-count">(回答人数: {{ question.options[0]?.checkCount || 0 }})</span>
                                    </div>
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
                                            <span class="check-count">(平均分: {{ option.checkCount }})</span>
                                        </div>
                                    </div>
                                </template>
                                <!-- 文件上传题 -->
                                <template v-if="question.type === '文件上传题'">
                                    <el-upload
                                    class="upload-demo"
                                    action="" 
                                    :auto-upload="false"
                                    :file-list="question.uploadedFiles"
                                    :on-change="(file, fileList) => question.uploadedFiles = fileList"
                                    :on-remove="(file, fileList) => question.uploadedFiles = fileList"
                                    :on-preview="handlePreview"
                                    multiple
                                    :limit="3"
                                    :on-exceed="handleExceed"
                                    :required="question.isRequired">
                                    <el-button type="primary">点击上传</el-button>
                                    <template #tip>
                                        <div class="el-upload__tip">支持 jpg/png/pdf/docx 文件</div>
                                    </template>
                                </el-upload>
                                </template>
                            </div>
                        </div>
                    </div>
                </template>
            </el-skeleton>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.survey-header {
    min-height: 100%;
    box-sizing: border-box;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .extra {
        display: flex;
        align-items: center;  /* 确保垂直居中对齐 */
        gap: 10px;  /* 在所有子元素之间添加 10px 的间隔 */
        justify-content: flex-end;
    }

    .el-input {
        width: 240px;  /* 输入框的宽度 */
    }

    .unfinished-info {
        margin-bottom: 20px;
        text-align: center;

        h4 {
            font-size: 18px;
            color: #2c3e50;
            margin: 0;

            .unfinished-count {
                color: #409EFF;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 500;
                position: relative;
                padding: 0 4px;

                &:hover {
                    color: #66b1ff;
                    text-decoration: underline;
                }
            }
        }
    }
}
.survey-statistics {
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
            margin-bottom: 10px;
        }

        .survey-user {
            font-size: 14px;
            color: #909399;
            margin-top: 8px;
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

                    .check-count {
                        color: #409EFF;
                        margin-left: 8px;
                        font-size: 13px;
                    }
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

                    .check-count {
                        color: #409EFF;
                        margin-left: 8px;
                        font-size: 13px;
                    }
                }
            }

            .text-answer {
                .check-count {
                    color: #409EFF;
                    font-size: 13px;
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