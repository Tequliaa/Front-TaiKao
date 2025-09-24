<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

// 接收考试数据
const props = defineProps({
    exam: {
        type: Object,
        required: true,
        default: () => ({
            name: '',
            description: '',
            isCategory: 0
        })
    },
    questions: {
        type: Array,
        required: true,
        default: () => []
    },
    categories: {
        type: Array,
        default: () => []
    }
})

// 初始化问题的答案状态
const initializeQuestionAnswers = (questions) => {
    questions.forEach(question => {
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

// 监听问题数据变化
watch(() => props.questions, (newQuestions) => {
    if (newQuestions && newQuestions.length > 0) {
        initializeQuestionAnswers(newQuestions)
    }
}, { immediate: true })

// 按分类分组的问题
const groupedQuestions = computed(() => {
    if (props.exam.isCategory !== 1) {
        return [{ categoryId: null, categoryName: '所有问题', questions: props.questions }]
    }
    
    // 先对分类按照sortKey排序
    const sortedCategories = [...props.categories].sort((a, b) => {
        const sortKeyA = a.sortKey || '999999'
        const sortKeyB = b.sortKey || '999999'
        return parseInt(sortKeyA) - parseInt(sortKeyB)
    })
    
    // 创建分组对象
    const groups = {}
    
    // 初始化所有分类
    sortedCategories.forEach(category => {
        groups[`cat_${category.categoryId}`] = {
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            questions: []
        }
    })
    
    // 将问题分配到对应分类
    props.questions.forEach(question => {
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
    
    // 对每个分类下的问题按照sortKey排序
    Object.values(groups).forEach(group => {
        group.questions.sort((a, b) => {
            const sortKeyA = a.sortKey || '999999'
            const sortKeyB = b.sortKey || '999999'
            return parseInt(sortKeyA) - parseInt(sortKeyB)
        })
    })
    
    // 过滤掉没有问题的分类，并保持分类的排序
    return sortedCategories
        .map(category => groups[`cat_${category.categoryId}`])
        .filter(group => group && group.questions.length > 0)
})

// 处理选项选择
const handleOptionSelect = (question, optionId) => {
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
            question.matrixAnswers[optionId.rowId] = optionId.colId
            break
        case '矩阵多选':
            if (!question.matrixAnswers[optionId.rowId]) {
                question.matrixAnswers[optionId.rowId] = []
            }
            const matrixIndex = question.matrixAnswers[optionId.rowId].indexOf(optionId.colId)
            if (matrixIndex === -1) {
                question.matrixAnswers[optionId.rowId].push(optionId.colId)
            } else {
                question.matrixAnswers[optionId.rowId].splice(matrixIndex, 1)
            }
            break
    }
}

const getQuestionIndex = (questionId) => {
    // 如果是分类模式，需要按照分类内顺序重新编号
    if (props.exam.isCategory === 1) {
        // 找到问题所属的分类
        let categoryId = null;
        let questionInCategory = null;
        
        // 查找问题所属的分类
        for (const group of groupedQuestions.value) {
            const foundQuestion = group.questions.find(q => q.questionId === questionId);
            if (foundQuestion) {
                categoryId = group.categoryId;
                questionInCategory = foundQuestion;
                break;
            }
        }
        
        if (categoryId && questionInCategory) {
            // 计算该分类之前的所有问题数量
            let previousQuestionsCount = 0;
            for (const group of groupedQuestions.value) {
                if (group.categoryId === categoryId) {
                    break;
                }
                previousQuestionsCount += group.questions.length;
            }
            
            // 找到问题在当前分类中的索引
            const categoryGroup = groupedQuestions.value.find(g => g.categoryId === categoryId);
            const questionIndex = categoryGroup.questions.findIndex(q => q.questionId === questionId);
            
            // 返回分类内编号 + 之前分类的问题数量
            return previousQuestionsCount + questionIndex + 1;
        }
    }
    
    // 非分类模式，使用原来的逻辑
    const index = props.questions.findIndex(q => q.questionId === questionId);
    return index + 1;
}

const getOptionIndex = (question, optionId) => {
    if (question.sortedOrder && question.sortedOrder.length > 0) {
        const index = question.sortedOrder.indexOf(optionId)
        return index !== -1 ? index + 1 : question.options.length
    }
    return question.options.findIndex(opt => opt.optionId === optionId) + 1
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
    <div class="exam-preview">
        <div class="exam-container">
            <!-- 考试标题和描述 -->
            <div class="exam-header">
                <h1 class="exam-title">{{ exam.name }}</h1>
                <h6 class="exam-description">{{ exam.description }}</h6>
            </div>

            <!-- 问题列表 -->
            <div class="questions-list">
                <template v-if="exam.isCategory === 1">
                    <div v-for="group in groupedQuestions" :key="group.categoryId" class="question-group">
                        <div class="group-header">
                            <h4>{{ group.categoryName }}</h4>
                        </div>
                        <div class="group-questions">
                            <div v-for="(question, index) in group.questions" 
                                :key="question.questionId" 
                                :id="'question_' + question.questionId"
                                class="question-item"
                                :data-index="index + 1"
                                :data-has-skip="question.isSkip">
                                <!-- 问题标题 -->
                                <div class="question-title">
                                    <span class="question-number">{{ getQuestionIndex(question.questionId) }}.</span>
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
                                            <div class="selection-limit-tip" v-if="(question.maxSelections && question.maxSelections < question.options.length) || 
                                                                                (question.isRequired && question.minSelections && question.minSelections > 1)">
                                                <span v-if="question.isRequired && question.minSelections && question.minSelections > 1">
                                                    至少选择 {{ question.minSelections }} 项
                                                </span>
                                                <span v-if="question.maxSelections && question.maxSelections < question.options.length">
                                                    {{ question.isRequired && question.minSelections && question.minSelections > 1 ? '，' : '' }}
                                                    最多选择 {{ question.maxSelections }} 项
                                                </span>
                                                <span class="current-selection">
                                                    （已选择 {{ question.selectedOptions.length }} 项）
                                                </span>
                                            </div>
                                            <div v-for="(option, optIndex) in question.options" 
                                                :key="option.optionId" 
                                                class="form-check-option more-option">
                                                <el-checkbox 
                                                    v-model="question.selectedOptions" 
                                                    :label="option.optionId"
                                                    :disabled="!question.selectedOptions.includes(option.optionId) && 
                                                              question.maxSelections && 
                                                              question.maxSelections < question.options.length &&
                                                              question.selectedOptions.length >= question.maxSelections"
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
                                                        <td class="text-center">{{ row.description }}</td>
                                                        <td v-for="col in question.options.filter(opt => opt.type === '列选项')" 
                                                            :key="col.optionId" 
                                                            class="text-center">
                                                            <el-radio 
                                                                v-model="question.matrixAnswers[row.optionId]" 
                                                                :label="col.optionId"
                                                                @change="handleOptionSelect(question, {rowId: row.optionId, colId: col.optionId})" />
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
                                                        <td class="text-center">{{ row.description }}</td>
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
                                            <div v-if="question.instructions" class="rating-instructions">
                                                {{ question.instructions }}
                                            </div>
                                            <div class="rating-rule">评分规则：1-5分</div>
                                            <div v-for="option in question.options" :key="option.optionId" class="rating-item">
                                                <label class="rating-label">{{ option.description }}:</label>
                                                <div class="rating-display">
                                                    <!-- 五角星显示 -->
                                                    <template v-if="question.displayType === '五角星'">
                                                        <div class="star-rating">
                                                            <el-rate
                                                                v-model="option.rating"
                                                                :max="5"
                                                                :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                                                                :texts="['1分', '2分', '3分', '4分', '5分']"
                                                                show-text
                                                                :required="question.isRequired"
                                                            />
                                                        </div>
                                                    </template>
                                                    <!-- 滑动条显示 -->
                                                    <template v-else-if="question.displayType === '滑动条'">
                                                        <div class="slider-rating">
                                                            <el-slider
                                                                v-model="option.rating"
                                                                :min="1"
                                                                :max="5"
                                                                :step="1"
                                                                :marks="{
                                                                    1: '1分',
                                                                    2: '2分',
                                                                    3: '3分',
                                                                    4: '4分',
                                                                    5: '5分'
                                                                }"
                                                                :required="question.isRequired"
                                                                show-stops
                                                                :show-tooltip="false"
                                                                :show-input="false"
                                                            />
                                                            <div class="slider-value">{{ option.rating }}分</div>
                                                        </div>
                                                    </template>
                                                    <!-- 默认显示 -->
                                                    <template v-else>
                                                        <el-input-number 
                                                            v-model="option.rating" 
                                                            :min="1" 
                                                            :max="5"
                                                            :required="question.isRequired"
                                                            class="rating-input" />
                                                    </template>
                                                </div>
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

                                    <!-- 排序题 -->
                                    <template v-if="question.type === '排序'">
                                        <div class="sortable-container">
                                            <div v-if="question.instructions" class="sort-instructions">
                                                {{ question.instructions }}
                                            </div>
                                            
                                            <template v-if="question.sortType === '拖拽排序'">
                                                <div class="sortable-tip">请拖动选项进行排序（从上到下）</div>
                                                <div :id="'sortable-' + question.questionId" class="sortable-list">
                                                    <div v-for="option in question.options" 
                                                        :key="option.optionId" 
                                                        class="sortable-item"
                                                        :data-id="option.optionId">
                                                        <div class="sortable-handle">
                                                            <el-icon><Rank /></el-icon>
                                                        </div>
                                                        <div class="sortable-content">
                                                            <span class="sortable-index">{{ getOptionIndex(question, option.optionId) }}</span>
                                                            <span class="sortable-text">{{ option.description }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                            
                                            <template v-else-if="question.sortType === '选择排序'">
                                                <div class="sortable-tip">请点击选项进行排序（从上到下）</div>
                                                <div class="select-sort-container">
                                                    <div class="select-sort-list">
                                                        <template v-if="question.sortedOrder && question.sortedOrder.length > 0">
                                                            <div v-for="(optionId, index) in question.sortedOrder" 
                                                                :key="optionId" 
                                                                class="select-sort-item">
                                                                <span class="select-sort-index">{{ index + 1 }}</span>
                                                                <span class="select-sort-text">
                                                                    {{ question.options.find(opt => opt.optionId === optionId)?.description }}
                                                                </span>
                                                            </div>
                                                        </template>
                                                        <div v-else class="select-sort-empty">
                                                            请点击下方选项进行排序
                                                        </div>
                                                    </div>
                                                    <div class="select-sort-options">
                                                        <div v-for="option in question.options" 
                                                            :key="option.optionId" 
                                                            class="select-sort-option"
                                                            :class="{ 'selected': question.sortedOrder && question.sortedOrder.includes(option.optionId) }"
                                                            @click="selectSortOption(question, option.optionId)">
                                                            {{ option.description }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <template v-else>
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
                                    <div class="selection-limit-tip" v-if="(question.maxSelections && question.maxSelections < question.options.length) || 
                                                                        (question.isRequired && question.minSelections && question.minSelections > 1)">
                                        <span v-if="question.isRequired && question.minSelections && question.minSelections > 1">
                                            至少选择 {{ question.minSelections }} 项
                                        </span>
                                        <span v-if="question.maxSelections && question.maxSelections < question.options.length">
                                            {{ question.isRequired && question.minSelections && question.minSelections > 1 ? '，' : '' }}
                                            最多选择 {{ question.maxSelections }} 项
                                        </span>
                                        <span class="current-selection">
                                            （已选择 {{ question.selectedOptions.length }} 项）
                                        </span>
                                    </div>
                                    <div v-for="(option, optIndex) in question.options" 
                                        :key="option.optionId" 
                                        class="form-check-option more-option">
                                        <el-checkbox 
                                            v-model="question.selectedOptions" 
                                            :label="option.optionId"
                                            :disabled="!question.selectedOptions.includes(option.optionId) && 
                                                      question.maxSelections && 
                                                      question.maxSelections < question.options.length &&
                                                      question.selectedOptions.length >= question.maxSelections"
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
                                                <td class="text-center">{{ row.description }}</td>
                                                <td v-for="col in question.options.filter(opt => opt.type === '列选项')" 
                                                    :key="col.optionId" 
                                                    class="text-center">
                                                    <el-radio 
                                                        v-model="question.matrixAnswers[row.optionId]" 
                                                        :label="col.optionId"
                                                        @change="handleOptionSelect(question, {rowId: row.optionId, colId: col.optionId})" />
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
                                                <td class="text-center">{{ row.description }}</td>
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
                                    <div v-if="question.instructions" class="rating-instructions">
                                        {{ question.instructions }}
                                    </div>
                                    <div class="rating-rule">评分规则：1-5分</div>
                                    <div v-for="option in question.options" :key="option.optionId" class="rating-item">
                                        <label class="rating-label">{{ option.description }}:</label>
                                        <div class="rating-display">
                                            <!-- 五角星显示 -->
                                            <template v-if="question.displayType === '五角星'">
                                                <div class="star-rating">
                                                    <el-rate
                                                        v-model="option.rating"
                                                        :max="5"
                                                        :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                                                        :texts="['1分', '2分', '3分', '4分', '5分']"
                                                        show-text
                                                        :required="question.isRequired"
                                                    />
                                                </div>
                                            </template>
                                                    <!-- 滑动条显示 -->
                                                    <template v-else-if="question.displayType === '滑动条'">
                                                        <div class="slider-rating">
                                                            <el-slider
                                                                v-model="option.rating"
                                                                :min="1"
                                                                :max="5"
                                                                :step="1"
                                                                :marks="{
                                                                    1: '1分',
                                                                    2: '2分',
                                                                    3: '3分',
                                                                    4: '4分',
                                                                    5: '5分'
                                                                }"
                                                                :required="question.isRequired"
                                                                show-stops
                                                                :show-tooltip="false"
                                                                :show-input="false"
                                                            />
                                                            <div class="slider-value">{{ option.rating }}分</div>
                                                        </div>
                                                    </template>
                                                    <!-- 默认显示 -->
                                                    <template v-else>
                                                        <el-input-number 
                                                            v-model="option.rating" 
                                                            :min="1" 
                                                            :max="5"
                                                            :required="question.isRequired"
                                                            class="rating-input" />
                                                    </template>
                                        </div>
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

                                    <!-- 排序题 -->
                                    <template v-if="question.type === '排序'">
                                        <div class="sortable-container">
                                            <div v-if="question.instructions" class="sort-instructions">
                                                {{ question.instructions }}
                                            </div>
                                            
                                            <template v-if="question.sortType === '拖拽排序'">
                                                <div class="sortable-tip">请拖动选项进行排序（从上到下）</div>
                                                <div :id="'sortable-' + question.questionId" class="sortable-list">
                                                    <div v-for="option in question.options" 
                                                        :key="option.optionId" 
                                                        class="sortable-item"
                                                        :data-id="option.optionId">
                                                        <div class="sortable-handle">
                                                            <el-icon><Rank /></el-icon>
                                                        </div>
                                                        <div class="sortable-content">
                                                            <span class="sortable-index">{{ getOptionIndex(question, option.optionId) }}</span>
                                                            <span class="sortable-text">{{ option.description }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                            
                                            <template v-else-if="question.sortType === '选择排序'">
                                                <div class="sortable-tip">请点击选项进行排序（从上到下）</div>
                                                <div class="select-sort-container">
                                                    <div class="select-sort-list">
                                                        <template v-if="question.sortedOrder && question.sortedOrder.length > 0">
                                                            <div v-for="(optionId, index) in question.sortedOrder" 
                                                                :key="optionId" 
                                                                class="select-sort-item">
                                                                <span class="select-sort-index">{{ index + 1 }}</span>
                                                                <span class="select-sort-text">
                                                                    {{ question.options.find(opt => opt.optionId === optionId)?.description }}
                                                                </span>
                                                            </div>
                                                        </template>
                                                        <div v-else class="select-sort-empty">
                                                            请点击下方选项进行排序
                                                        </div>
                                                    </div>
                                                    <div class="select-sort-options">
                                                        <div v-for="option in question.options" 
                                                            :key="option.optionId" 
                                                            class="select-sort-option"
                                                            :class="{ 'selected': question.sortedOrder && question.sortedOrder.includes(option.optionId) }"
                                                            @click="selectSortOption(question, option.optionId)">
                                                            {{ option.description }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                        </div>
                                    </template>
                        </div>
                        </div>
                    </template>
                        </div>
                    </div>
                </div>
</template>

<style lang="scss" scoped>
.exam-preview {
    background-color: #f8f9fa;
    min-height: 100vh;
    padding: 20px 0;

    .exam-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 20px;
    }

    .exam-header {
        margin-bottom: 30px;
        text-align: center;

        .exam-title {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 10px;
        }

        .exam-description {
            font-size: 16px;
            color: #606266;
            line-height: 1.6;
        }
    }

    .question-group {
        margin-bottom: 24px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

        .group-header {
            padding: 16px;
            border-bottom: 1px solid #dcdfe6;
            
            h4 {
                margin: 0;
                color: #606266;
                font-size: 16px;
                font-weight: 500;
            }
        }

        .group-questions {
            padding: 16px;
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
                .rating-rule {
                    color: #909399;
                    font-size: 13px;
                    margin-bottom: 12px;
                    font-style: italic;
                }
                
                .rating-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;

                    .rating-label {
                        width: 120px;
                        font-size: 14px;
                        color: #606266;
                    }

                    .rating-display {
                        flex: 1;
                        display: flex;
                        align-items: center;

                        .star-rating {
                            flex: 1;
                            display: flex;
                            align-items: center;
                        }

                        .slider-rating {
                            flex: 1;
                            display: flex;
                            align-items: center;
                            gap: 16px;
                            padding: 0 20px;

                            :deep(.el-slider) {
                                flex: 1;
                                max-width: 300px;

                                .el-slider__runway {
                                    background-color: #EBEEF5;
                                    height: 6px;
                                    border-radius: 3px;
                                }

                                .el-slider__bar {
                                    background-color: #409EFF;
                                    height: 6px;
                                    border-radius: 3px;
                                }

                                .el-slider__button {
                                    width: 20px;
                                    height: 20px;
                                    border: 2px solid #409EFF;
                                    background-color: #fff;
                                    transition: all 0.3s;
                                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                                    &:hover {
                                        transform: scale(1.1);
                                    }
                                }

                                .el-slider__stop {
                                    width: 8px;
                                    height: 8px;
                                    background-color: #C0C4CC;
                                    border-radius: 50%;
                                    transform: translateY(-1px);
                                }

                                .el-slider__marks {
                                    .el-slider__marks-text {
                                        color: #909399;
                                        font-size: 12px;
                                        margin-top: 8px;
                                    }
                                }
                            }

                            .slider-value {
                                min-width: 40px;
                                text-align: center;
                                color: #409EFF;
                                font-weight: 500;
                            }
                        }

                        .rating-input {
                            width: 120px;
                        }
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

            // 排序题容器
            .sortable-container {
                margin: 10px 0;
                
                .sort-instructions {
                    color: #606266;
                    font-size: 14px;
                    margin-bottom: 10px;
                    padding: 8px 12px;
                    background-color: #f5f7fa;
                    border-radius: 4px;
                    border-left: 3px solid #409EFF;
                }
                
                .sortable-tip {
                    color: #909399;
                    font-size: 14px;
                    margin-bottom: 10px;
                }
                
                .sortable-list {
                    border: 1px solid #dcdfe6;
                    border-radius: 4px;
                    background: #fff;
                    min-height: 50px;
                    
                    .sortable-item {
                        display: flex;
                        align-items: center;
                        padding: 12px;
                        background: #fff;
                        border-bottom: 1px solid #dcdfe6;
                        cursor: move;
                        user-select: none;
                        touch-action: none;
                        transition: background-color 0.3s;
                        
                        &:last-child {
                            border-bottom: none;
                        }
                        
                        &:hover {
                            background: #f5f7fa;
                        }
                        
                        .sortable-handle {
                            margin-right: 10px;
                            color: #909399;
                            display: flex;
                            align-items: center;
                            
                            .el-icon {
                                font-size: 20px;
                            }
                        }
                        
                        .sortable-content {
                            flex: 1;
                            display: flex;
                            align-items: center;
                            
                            .sortable-index {
                                width: 24px;
                                height: 24px;
                                line-height: 24px;
                                text-align: center;
                                background: #409eff;
                                color: #fff;
                                border-radius: 50%;
                                margin-right: 10px;
                                font-size: 12px;
                            }
                            
                            .sortable-text {
                                flex: 1;
                                font-size: 14px;
                            }
                        }
                    }
                }
            }

            .select-sort-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
                
                .select-sort-list {
                    border: 1px solid #dcdfe6;
                    border-radius: 4px;
                    background: #fff;
                    min-height: 50px;
                    
                    .select-sort-item {
                        display: flex;
                        align-items: center;
                        padding: 12px;
                        background: #fff;
                        border-bottom: 1px solid #dcdfe6;
                        
                        &:last-child {
                            border-bottom: none;
                        }
                        
                        .select-sort-index {
                            width: 24px;
                            height: 24px;
                            line-height: 24px;
                            text-align: center;
                            background: #409eff;
                            color: #fff;
                            border-radius: 50%;
                            margin-right: 10px;
                            font-size: 12px;
                        }
                        
                        .select-sort-text {
                            flex: 1;
                            font-size: 14px;
                        }
                    }

                    .select-sort-empty {
                        padding: 20px;
                        text-align: center;
                        color: #909399;
                        font-size: 14px;
                        background: #f5f7fa;
                    }
                }
                
                .select-sort-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    
                    .select-sort-option {
                        padding: 8px 12px;
                        background: #f5f7fa;
                        border: 1px solid #dcdfe6;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: all 0.3s;
                        
                        &:hover {
                            background: #ecf5ff;
                            border-color: #409eff;
                        }
                        
                        &.selected {
                            background: #ecf5ff;
                            border-color: #409eff;
                            color: #409eff;
                        }
                    }
                }
            }

            .sortable-ghost {
                opacity: 0.5;
                background: #c8ebfb !important;
            }

            .sortable-drag {
                background: #fff;
                box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
            }
        }
    }
}

// 添加响应式样式
@media (max-width: 768px) {
    .exam-preview {
        .exam-container {
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

.selection-limit-tip {
    margin-bottom: 10px;
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-size: 13px;
    color: #606266;
    
    .current-selection {
        color: #409EFF;
        margin-left: 8px;
    }
}

.form-check-option {
    .el-checkbox.is-disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}

.rating-instructions {
    color: #606266;
    font-size: 14px;
    margin-bottom: 10px;
    padding: 8px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border-left: 3px solid #409EFF;
}
</style> 