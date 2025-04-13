<script setup>
import { ref, onMounted, computed } from 'vue'
import { getResponseDetailsService } from '@/api/response'
import { ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/stores/user'
import {userSurveyUpdateService} from '@/api/userSurvey'
// 问卷ID
const props = defineProps({
    surveyId: {
        type: Number
    },
    userId:{
        type:Number
    },
    userName: {
        type: String
    }
})

// 问题列表
const questions = ref([])
// 问卷信息
const surveyInfo = ref({
    name: '',
    description: ''
})

const userInfoStore = useUserInfoStore()
const loading = ref(true)

// 添加问题显示状态控制
const visibleQuestions = ref(new Set())

// 添加一个计算属性来检查用户角色
const canHitBack = computed(() => {
    return userInfoStore.info && 
           userInfoStore.info.role && 
           userInfoStore.info.role !== '普通用户'
})

// 修改获取问卷数据的方法
const getSurveyData = async () => {
    loading.value = true
    try {
        // 获取用户答题记录
        const responseResult = await getResponseDetailsService(props.surveyId, props.userId || userInfoStore.info.id)
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
                        case '文件上传题':
                        // 处理文件上传题答案
                        question.uploadedFiles = questionResponses
                            .filter(response => response.filePath && response.isValid === 1)
                            .map(response => ({
                                name: response.filePath.split('/').pop(),  // 获取文件名
                                url: "http://localhost:8082" + response.filePath  // 完整的文件URL
                            }))
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

onMounted(() => {
    getSurveyData()
})
//打回问卷
const HitBackSurvey = async () => {
    let result = await userSurveyUpdateService(props.surveyId,props.userId||userInfoStore.info.id,'0');
    ElMessage.success(result.message ? result.message : '打回成功')
}
import request from '@/utils/request.js'
import { showImagePreview } from '@/utils/imagePreviewer';
// 处理文件的预览
const handlePreview = async (file) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const fileUrl = `/uploads/${file.name}`;

  try {
    console.log('开始请求文件:', fileUrl);
    const response = await request.get(fileUrl, {
      responseType: 'blob',
    });

    console.log('响应数据:', response);
    
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('文件数据无效');
    }

    const blobUrl = URL.createObjectURL(response.data);
    console.log('生成的 Blob URL:', blobUrl);

    // 测试图片显示
    const testImg = document.createElement('img');
    testImg.src = blobUrl;
    testImg.style.maxWidth = '100%';
    testImg.onload = () => console.log('测试图片加载成功');
    testImg.onerror = (e) => console.error('测试图片加载失败', e);
    document.body.appendChild(testImg);

    console.log('文件扩展名:', fileExtension);
    
    if (['jpg', 'jpeg', 'png'].includes(fileExtension.toLowerCase())) {
      console.log('准备调用 showImagePreview');
      // 确保这个函数存在
      if (typeof showImagePreview === 'function') {
        showImagePreview(blobUrl);
      } else {
        throw new Error('showImagePreview 不是函数');
      }
    } else if (fileExtension === 'pdf') {
      console.log('准备打开PDF');
      window.open(blobUrl, '_blank');
    } else {
      console.warn('无法预览该文件类型:', fileExtension);
    }
  } catch (error) {
    console.error('文件预览失败:', error);
    ElMessage.error('文件预览失败: ' + error.message);
  }
};
console.log('userInfoStore.info.userRole:'+userInfoStore.info.userRole)
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
                        <div v-if="props.userName" class="survey-user">
                            答题人：{{ props.userName }}
                        </div>
                        
                        <div class="extra">
                            <el-button type="primary" v-if="canHitBack" @click="HitBackSurvey()">打回问卷</el-button>
                        </div>    
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
                                                disabled>
                                                <span class="option-label">
                                                    {{ String.fromCharCode(65 + optIndex) }}.
                                                    <template v-if="option.isOpenOption">
                                                        <el-input 
                                                            v-model="option.openAnswer" 
                                                            :placeholder="option.description"
                                                            disabled />
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
                                    <div class="form-check more-choice">
                                        <div v-for="(option, optIndex) in question.options" 
                                            :key="option.optionId" 
                                            class="form-check-option more-option">
                                            <el-checkbox 
                                                v-model="question.selectedOptions" 
                                                :label="option.optionId"
                                                disabled>
                                                <span class="option-label">
                                                    {{ String.fromCharCode(65 + optIndex) }}.
                                                    <template v-if="option.isOpenOption">
                                                        <el-input 
                                                            v-if="question.selectedOptions.includes(option.optionId)"
                                                            v-model="option.openAnswer" 
                                                            :placeholder="option.description"
                                                            disabled />
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
                                        disabled />
                                </template>

                                <!-- 矩阵单选题 -->
                                <template v-if="question.type === '矩阵单选'">
                                    <div class="matrix-container">
                                        <table class="matrix-table">
                                            <thead>
                                                <tr>
                                                    <th class="text-center">行/列</th>
                                                    <th v-for="col in question.options.filter(opt => opt.type === '列选项')" 
                                                        :key="col.optionId" 
                                                        class="text-center">
                                                        {{ col.description }}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="row in question.options.filter(opt => opt.type === '行选项')" 
                                                    :key="row.optionId">
                                                    <td>{{ row.description }}</td>
                                                    <td v-for="col in question.options.filter(opt => opt.type === '列选项')" 
                                                        :key="col.optionId" 
                                                        class="text-center">
                                                        <el-radio 
                                                            v-model="question.matrixAnswers[row.optionId]" 
                                                            :label="col.optionId"
                                                            disabled />
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </template>

                                <!-- 矩阵多选题 -->
                                <template v-if="question.type === '矩阵多选'">
                                    <div class="matrix-container">
                                        <table class="matrix-table">
                                            <thead>
                                                <tr>
                                                    <th class="text-center">行/列</th>
                                                    <th v-for="col in question.options.filter(opt => opt.type === '列选项')" 
                                                        :key="col.optionId" 
                                                        class="text-center">
                                                        {{ col.description }}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="row in question.options.filter(opt => opt.type === '行选项')" 
                                                    :key="row.optionId">
                                                    <td>{{ row.description }}</td>
                                                    <td v-for="col in question.options.filter(opt => opt.type === '列选项')" 
                                                        :key="col.optionId" 
                                                        class="text-center">
                                                        <el-checkbox 
                                                            :model-value="question.matrixAnswers[row.optionId]?.includes(col.optionId)"
                                                            disabled />
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
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
                                                disabled
                                                class="rating-input" />
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

}
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
            // overflow: hidden;

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

            // 矩阵表格容器
            .matrix-container {
                width: 100%;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding: 1px; // 添加内边距确保边框显示
                margin: 0 -1px; // 抵消内边距对容器宽度的影响
                
                .matrix-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #dcdfe6;
                    margin-bottom: 10px;
                    table-layout: fixed; // 使用固定表格布局
                    
                    th, td {
                        padding: 8px;
                        border: 1px solid #dcdfe6;
                        text-align: left;
                        font-size: 14px;
                        white-space: normal; // 允许文本换行
                        word-break: break-word; // 允许在任意字符间换行
                    }
                    
                    th {
                        background-color: #f5f7fa;
                        font-weight: 500;
                        color: #606266;
                    }
                    
                    td {
                        color: #606266;
                    }
                    
                    .text-center {
                        text-align: center;
                    }
                    
                    :deep(.el-radio), :deep(.el-checkbox) {
                        margin: 0;
                        padding: 0;
                        
                        .el-radio__label, .el-checkbox__label {
                            display: none;
                        }
                        
                        .el-radio__inner, .el-checkbox__inner {
                            margin: 0;
                        }
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

// 添加响应式样式
@media (max-width: 768px) {
    .survey-preview {
        .survey-container {
            padding: 0 10px;
        }
        
        .question-item {
            padding: 12px;
            
            .question-options {
                margin-left: 10px;
                
                .matrix-container {
                    margin: 0 -18px;
                    width: calc(100% + 24px);
                    padding: 1px; // 确保移动端边框也显示
                    
                    .matrix-table {
                        th, td {
                            padding: 6px;
                            font-size: 13px;
                        }
                    }
                }
            }
        }
    }
}
</style> 