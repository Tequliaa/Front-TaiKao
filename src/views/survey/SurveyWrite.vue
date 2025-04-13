<script setup>
import { ref, onMounted } from 'vue'
import { submitResponseService, getResponseDetailsService } from '@/api/response'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/user'
import request from '@/utils/request.js'
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
                        case '文件上传题':
                            // 获取文件上传题答案
                            question.uploadedFiles = questionResponses
                                .filter(response => response.filePath && response.isValid === 1)
                                .map(response => ({
                                    name: response.filePath.split('/').pop(),
                                    url: "http://localhost:8082" + response.filePath,
                                    isExisting: true,  // 标记为已有文件
                                    fileId: response.id || response.fileId,  // 保留文件ID
                                    responseId: response.id,  // 保留响应记录ID
                                    raw: null  // 明确设置raw为null
                                }));
                            // 初始化新上传文件数组
                            question.newUploadedFiles = [];
                            break;


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
            case '文件上传题':
                // 检查必答题的文件上传情况
                console.log('验证文件上传题:', {
                    questionId: question.questionId,
                    isRequired: question.isRequired,
                    uploadedFiles: question.uploadedFiles,
                    newUploadedFiles: question.newUploadedFiles
                });
                const hasFiles = question.uploadedFiles && question.uploadedFiles.length > 0;
                if (!hasFiles) {
                    isValid = false;
                    console.log('文件上传题验证失败：没有文件');
                }
                break;
        }
        
        if (!isValid) {
            invalidQuestions.push(question)
        }
    })
    
    return invalidQuestions
}

// 提交方法
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
            
            console.log('处理问题:', question.questionId, question.type)
            
            switch (question.type) {
                case '单选':
                    if (question.selectedOption) {
                        console.log('单选答案:', question.selectedOption)
                        formData.append(`question_${question.questionId}_optionId_${question.selectedOption}`,'on')
                    }
                    break
                case '多选':
                    console.log('多选答案:', question.selectedOptions)
                    if (question.selectedOptions && question.selectedOptions.length > 0) {
                        // 为每个选中的选项创建一个记录
                        question.selectedOptions.forEach(optionId => {
                            formData.append(`question_${question.questionId}_optionId_${optionId}`, 'on')
                        })
                    }
                    break
                case '填空':
                    if (question.answer) {
                        formData.append(`question_${question.questionId}`, question.answer)
                    }
                    break
                case '矩阵单选':
                    Object.entries(question.matrixAnswers).forEach(([rowId, colId]) => {
                        if (colId) {  // 只提交有选择的答案
                            formData.append(`question_${question.questionId}_row_${rowId}_col_${colId}`, 'on')
                        }
                    })
                    break
                case '矩阵多选':
                    Object.entries(question.matrixAnswers).forEach(([rowId, colIds]) => {
                        if (colIds && colIds.length > 0) {  // 只提交有选择的答案
                            // 为每个选中的列选项创建一个记录
                            colIds.forEach(colId => {
                                formData.append(`question_${question.questionId}_row_${rowId}_col_${colId}`, 'on')
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
                case '文件上传题': 
                    // 只处理新上传的文件
                    if (question.newUploadedFiles && question.newUploadedFiles.length > 0) {
                        question.newUploadedFiles.forEach(file => {
                            if (file.raw) {
                                formData.append(`file_${question.questionId}`, file.raw, `question_${question.questionId}_${file.name}`);
                            }
                        });
                    }

                    // 必须传递已有文件信息
                    const existingFiles = question.uploadedFiles.filter(f => f.isExisting);
                    if (existingFiles.length > 0) {
                        formData.append(`existing_files_${question.questionId}`, 
                                    existingFiles.map(f => f.responseId).join(','));
                    }
                    break;
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

        // 打印所有表单数据
        console.log('提交的表单数据:')
        for (let [key, value] of formData.entries()) {
            console.log(key, value)
        }

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
        console.error('提交失败:', error)
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

// 处理文件的预览
import { showImagePreview } from '@/utils/imagePreviewer';

// 处理文件的预览
const handlePreview = async (file) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const fileUrl = `/uploads/${file.name}`;

  // 存储预览控制器以便后续清理
  let previewController = null;

  try {
    const response = await request.get(fileUrl, {
      responseType: 'blob',
    });
    
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('文件数据无效');
    }

    const blobUrl = URL.createObjectURL(response.data);
    
    // 确保在组件卸载或预览关闭时清理资源
    const cleanup = () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (previewController?.close) previewController.close();
    };

    // 添加全局监听，确保在路由变化时清理
    window.addEventListener('beforeunload', cleanup);
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      previewController = showImagePreview(blobUrl);
      
      // 增强关闭处理
      const originalClose = previewController.close;
      previewController.close = () => {
        cleanup();
        originalClose();
        window.removeEventListener('beforeunload', cleanup);
      };
    } 
    else if (fileExtension === 'pdf') {
      window.open(blobUrl, '_blank');
      // PDF 在新窗口打开，无法控制其关闭时机
      // 设置延迟清理（风险：用户可能还在查看PDF）
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }
    else {
      console.warn('无法预览该文件类型:', fileExtension);
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error('文件预览失败:', error);
    ElMessage.error('文件预览失败: ' + error.message);
  }
};

// 修改文件变化处理方法
const handleFileChange = async(file, fileList, question) => {
    console.log('文件变化:', {
        file,
        fileList,
        questionId: question.questionId
    });
    
    // 分离新文件和已有文件
    const newFiles = fileList.filter(f => !f.isExisting && f.raw);
    
    // 使用响应式更新
    const questionIndex = questions.value.findIndex(q => q.questionId === question.questionId);
    if (questionIndex !== -1) {
        questions.value[questionIndex] = {
            ...questions.value[questionIndex],
            uploadedFiles: fileList,
            newUploadedFiles: newFiles
        };
    }
    
    console.log('更新后的文件列表:', {
        uploadedFiles: questions.value[questionIndex].uploadedFiles,
        newUploadedFiles: questions.value[questionIndex].newUploadedFiles
    });
};

// 修改文件删除处理方法
const handleFileRemove = async(file, fileList, question) => {
    console.log('删除文件:', {
        file,
        fileList,
        questionId: question.questionId
    });
    
    const questionIndex = questions.value.findIndex(q => q.questionId === question.questionId);
    if (questionIndex !== -1) {
        // 如果是新上传的文件，从newUploadedFiles中也移除
        let newUploadedFiles = [...(questions.value[questionIndex].newUploadedFiles || [])];
        if (!file.isExisting) {
            newUploadedFiles = newUploadedFiles.filter(f => f.uid !== file.uid);
        }
        
        // 使用响应式更新
        questions.value[questionIndex] = {
            ...questions.value[questionIndex],
            uploadedFiles: fileList,
            newUploadedFiles: newUploadedFiles
        };
    }
    
    console.log('删除后的文件列表:', {
        uploadedFiles: questions.value[questionIndex].uploadedFiles,
        newUploadedFiles: questions.value[questionIndex].newUploadedFiles
    });
};

const handleExceed = async(files, fileList) => {
    ElMessage.warning(`最多上传3个文件，您选择了${files.length}个文件，共${files.length + fileList.length}个文件`);
}
// 在打开表单的方法中

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
                                                        v-if="question.selectedOption==option.optionId"
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
                                                            @change="(val) => handleMatrixRadioChange(question, row.optionId, col.optionId, val)" />
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
                                                            @update:model-value="(val) => handleMatrixCheckboxChange(question, row.optionId, col.optionId, val)" />
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
                                                :required="question.isRequired"
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
                                        :on-change="(file, fileList) => handleFileChange(file, fileList, question)"
                                        :on-remove="(file, fileList) => handleFileRemove(file, fileList, question)"
                                        :on-preview="handlePreview"
                                        multiple
                                        :limit="3"
                                        :on-exceed="handleExceed"
                                        :required="question.isRequired">
                                        <el-button type="primary">点击上传</el-button>
                                        <template #tip>
                                            <div class="el-upload__tip">
                                                支持 jpg/png/pdf/docx 文件
                                                <span v-if="question.isRequired" class="required">*</span>
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