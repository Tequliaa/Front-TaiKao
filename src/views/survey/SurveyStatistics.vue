<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { getStatisticsService } from '@/api/response'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
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

// 添加图表实例存储
const chartInstances = ref({})

// 添加矩阵单元格数据
const matrixCellData = ref({})

// 初始化图表
const initChart = (questionId, type, options) => {
    console.log('初始化图表:', questionId, type, options)
    
    // 如果已经有图表实例，先销毁
    if (chartInstances.value[questionId]) {
        chartInstances.value[questionId].dispose()
    }
    
    // 创建新的图表实例
    const chartDom = document.getElementById(`chart_${questionId}`)
    if (!chartDom) {
        console.error('找不到图表容器:', `chart_${questionId}`)
        return
    }
    
    const chart = echarts.init(chartDom)
    chartInstances.value[questionId] = chart
    
    // 根据问题类型设置不同的图表配置
    let option = {}
    
    if (type === '单选' || type === '多选') {
        // 计算总人数
        const total = options.reduce((sum, opt) => sum + (parseInt(opt.checkCount) || 0), 0)
        console.log('总人数:', total)
        
        // 准备数据
        const data = options.map(opt => ({
            name: opt.description,
            value: parseInt(opt.checkCount) || 0,
            percentage: total > 0 ? ((parseInt(opt.checkCount) || 0) / total * 100).toFixed(1) : 0
        }))
        console.log('饼图数据:', data)
        
        // 设置图表配置
        option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                right: 10,
                top: 'center',
                data: data.map(item => item.name)
            },
            series: [
                {
                    name: '答题情况',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: '14',
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: data
                }
            ]
        }
    } else if (type === '评分题') {
        // 准备数据
        const data = options.map(opt => ({
            name: opt.description,
            value: parseFloat(opt.checkCount) || 0
        }))
        console.log('柱状图数据:', data)
        
        // 设置图表配置
        option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map(item => item.name),
                axisLabel: {
                    interval: 0,
                    rotate: 30
                }
            },
            yAxis: {
                type: 'value',
                name: '平均分'
            },
            series: [
                {
                    name: '平均分',
                    type: 'bar',
                    data: data.map(item => item.value),
                    itemStyle: {
                        color: function(params) {
                            // 根据分数设置不同颜色
                            const value = params.value
                            if (value >= 8) return '#67C23A'
                            if (value >= 6) return '#409EFF'
                            if (value >= 4) return '#E6A23C'
                            return '#F56C6C'
                        }
                    }
                }
            ]
        }
    } else if (type === '矩阵单选' || type === '矩阵多选') {
        // 获取行和列选项
        const rowOptions = options.filter(opt => opt.type === '行选项')
        const colOptions = options.filter(opt => opt.type === '列选项')
        
        console.log('矩阵题行选项:', rowOptions)
        console.log('矩阵题列选项:', colOptions)
        
        // 准备热力图数据
        const data = []
        let maxValue = 0 // 用于计算颜色渐变的最大值
        
        // 获取该问题的单元格数据
        const cellData = matrixCellData.value[questionId] || []
        console.log('矩阵单元格数据:', cellData)
        
        // 创建单元格数据映射
        const cellDataMap = {}
        cellData.forEach(cell => {
            const key = `${cell.rowOptionId}-${cell.colOptionId}`
            cellDataMap[key] = parseInt(cell.checkCount) || 0
            maxValue = Math.max(maxValue, cellDataMap[key])
        })
        console.log('单元格数据映射:', cellDataMap)
        
        // 遍历每个单元格，获取选择人数
        rowOptions.forEach((row, rowIndex) => {
            colOptions.forEach((col, colIndex) => {
                // 获取该单元格的选择人数
                const key = `${row.optionId}-${col.optionId}`
                const checkCount = cellDataMap[key] || 0
                data.push([colIndex, rowIndex, checkCount])
            })
        })
        
        console.log('矩阵热力图数据:', data)
        console.log('最大选择人数:', maxValue)
        
        // 设置图表配置
        option = {
            tooltip: {
                position: 'top',
                formatter: function(params) {
                    const rowName = rowOptions[params.value[1]].description
                    const colName = colOptions[params.value[0]].description
                    return `${rowName} - ${colName}: ${params.value[2]}人`
                }
            },
            animation: false, // 禁用动画以提高性能
            grid: {
                top: '15%',
                bottom: '20%',
                left: '15%',
                right: '5%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: colOptions.map(opt => opt.description),
                splitArea: {
                    show: true
                },
                axisLabel: {
                    interval: 0,
                    rotate: 30,
                    fontSize: 12,
                    width: 100,
                    overflow: 'break'
                }
            },
            yAxis: {
                type: 'category',
                data: rowOptions.map(opt => opt.description),
                splitArea: {
                    show: true
                },
                axisLabel: {
                    fontSize: 12,
                    width: 100,
                    overflow: 'break'
                }
            },
            visualMap: {
                min: 0,
                max: maxValue || 1,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '0%',
                inRange: {
                    color: ['#f5f7fa', '#409EFF']
                },
                textStyle: {
                    fontSize: 12
                }
            },
            series: [{
                name: '选择人数',
                type: 'heatmap',
                data: data,
                label: {
                    show: true,
                    formatter: function(params) {
                        return params.value[2] > 0 ? params.value[2] : ''
                    },
                    fontSize: 12
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        }
    } else if (type === '排序') {
        // 准备数据，将排序位置转换为权重值（数值越小权重越大）
        const data = options.map(opt => {
            const avgPos = parseFloat(opt.checkCount) || 0;
            // 将排序位置转换为权重值，排名越靠前权重越大
            const weight = options.length - avgPos + 1;
            return {
                name: opt.description,
                value: weight,
                originalValue: avgPos, // 保存原始排序位置用于显示
                color: function() {
                    if (avgPos <= 2) return '#67C23A'; // 前两名，绿色
                    if (avgPos <= 3) return '#409EFF'; // 第三名，蓝色
                    if (avgPos <= 4) return '#E6A23C'; // 第四名，黄色
                    return '#F56C6C'; // 其他，红色
                }
            };
        });

        // 设置图表配置
        option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                formatter: function(params) {
                    const data = params[0];
                    return `${data.name}<br/>平均排序位置: ${data.data.originalValue.toFixed(2)}`;
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map(item => item.name),
                axisLabel: {
                    interval: 0,
                    rotate: 30
                }
            },
            yAxis: {
                type: 'value',
                name: '受欢迎程度',
                min: 1,
                max: options.length
            },
            series: [{
                name: '受欢迎程度',
                type: 'bar',
                data: data.map(item => ({
                    value: item.value,
                    originalValue: item.originalValue,
                    itemStyle: {
                        color: item.color()
                    }
                })),
                label: {
                    show: true,
                    position: 'top',
                    formatter: function(params) {
                        return `第${params.data.originalValue.toFixed(0)}名`;
                    }
                },
                barWidth: '60%',
                barGap: '0%'
            }]
        };
    }
    
    // 设置图表配置
    console.log('图表配置:', option)
    chart.setOption(option)
    
    // 添加自适应大小
    window.addEventListener('resize', () => {
        chart.resize()
    })
}

// 获取统计数据
const getStatistics = async () => {
    loading.value = true
    try {
        const response = await getStatisticsService(props.surveyId,props.departmentId)
        if (response.code === 0) {
            // 直接使用返回的 questions 数组
            questions.value = response.data.questions
            unfinishedTotalRecords.value = response.data.unfinishedTotalRecords
            surveyInfo.value = response.data.survey
            // 设置矩阵单元格数据
            matrixCellData.value = response.data.matrixCellData || {}
            console.log('获取到的矩阵单元格数据:', matrixCellData.value)
            
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
                // 初始化所有问题的显示状态
                questions.value.forEach(question => {
                    visibleQuestions.value.add(question.questionId)
                })
                
                // 初始化图表
                nextTick(() => {
                    initCharts()
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
    
    // 监听窗口大小变化，调整图表大小
    window.addEventListener('resize', () => {
        Object.values(chartInstances.value).forEach(chart => {
            chart && chart.resize()
        })
    })
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

// 在数据加载完成后初始化图表
const initCharts = () => {
    console.log('开始初始化所有图表')
    questions.value.forEach(question => {
        if (question.type === '单选' || question.type === '多选' || question.type === '评分题' || 
            question.type === '矩阵单选' || question.type === '矩阵多选' || question.type === '排序') {
            console.log('处理问题:', question.questionId, question.type)
            // 使用 nextTick 确保 DOM 已经渲染
            nextTick(() => {
                initChart(question.questionId, question.type, question.options)
            })
        }
    })
}

// 添加 groupedQuestions 计算属性
const groupedQuestions = computed(() => {
    if (!questions.value || questions.value.length === 0) {
        return []
    }

    // 按分类ID分组问题
    const groups = {}
    questions.value.forEach(question => {
        if (question.categoryId) {
            if (!groups[question.categoryId]) {
                groups[question.categoryId] = {
                    categoryId: question.categoryId,
                    categoryName: question.categoryName || '未命名分类',
                    questions: []
                }
            }
            groups[question.categoryId].questions.push(question)
        }
    })

    // 转换为数组并排序
    return Object.values(groups).sort((a, b) => {
        // 首先按分类ID排序
        const idCompare = a.categoryId - b.categoryId
        if (idCompare !== 0) return idCompare
        
        // 如果分类ID相同，按问题顺序排序
        return a.questions[0].order - b.questions[0].order
    })
})



// 添加调试函数
// const debugMatrixData = () => {
//     console.log('矩阵单元格数据:', matrixCellData.value)
    
//     // 遍历所有矩阵题
//     questions.value.forEach(question => {
//         if (question.type === '矩阵单选' || question.type === '矩阵多选') {
//             console.log(`问题 ${question.questionId} (${question.type}) 的矩阵数据:`, matrixCellData.value[question.questionId])
            
//             // 获取行和列选项
//             const rowOptions = question.options.filter(opt => opt.type === '行选项')
//             const colOptions = question.options.filter(opt => opt.type === '列选项')
            
//             console.log('行选项:', rowOptions)
//             console.log('列选项:', colOptions)
            
//             // 检查每个单元格的数据
//             const cellData = matrixCellData.value[question.questionId] || []
//             console.log('单元格数据:', cellData)
            
//             // 创建单元格数据映射
//             const cellDataMap = {}
//             cellData.forEach(cell => {
//                 const key = `${cell.rowOptionId}-${cell.colOptionId}`
//                 cellDataMap[key] = parseInt(cell.checkCount) || 0
//             })
//             console.log('单元格数据映射:', cellDataMap)
            
//             // 检查每个单元格是否有数据
//             rowOptions.forEach(row => {
//                 colOptions.forEach(col => {
//                     const key = `${row.optionId}-${col.optionId}`
//                     console.log(`单元格 (${row.description}, ${col.description}): ${cellDataMap[key] || 0}`)
//                 })
//             })
//         }
//     })
// }
const getQuestionIndex = (questionId) => {
    // 如果是分类模式，需要按照分类内顺序重新编号
    if (surveyInfo.value.isCategory === 1) {
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

const getGroupQuestionIndex = (groupIndex, questionIndex) => {
    // 计算当前分组之前的所有问题数量
    let previousQuestionsCount = 0;
    for (let i = 0; i < groupIndex; i++) {
        previousQuestionsCount += groupedQuestions.value[i].questions.length;
    }
    // 返回当前问题的序号（之前的问题数量 + 当前问题在分组中的索引 + 1）
    return previousQuestionsCount + questionIndex + 1;
}
</script>

<template>
    <div class="survey-statistics">
        <div class="survey-container">
            <!-- 添加调试按钮 -->
            <!-- <el-button type="primary" @click="debugMatrixData" style="margin-bottom: 20px;">调试矩阵数据</el-button> -->
            
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
                        <template v-if="surveyInfo.isCategory === 1">
                            <div v-for="(group, groupIndex) in groupedQuestions" :key="group.categoryId" class="category-group">
                                <div class="category-header">
                                    <div class="category-title">{{ group.categoryName }}</div>
                                </div>
                                <div class="questions-container">
                                    <div v-for="(question, index) in group.questions" 
                                        :key="question.questionId" 
                                        :id="'question_' + question.questionId"
                                        class="question-item"
                                        :data-index="getGroupQuestionIndex(groupIndex, index)"
                                        :data-has-skip="question.isSkip"
                                        v-show="visibleQuestions.has(question.questionId)">
                                        <!-- 问题标题 -->
                                        <div class="question-title">
                                            <span class="question-number">{{ getGroupQuestionIndex(groupIndex, index) }}.</span>
                                            <span class="question-text">{{ question.description }}</span>
                                            <span class="question-type">({{ question.type }}, {{ question.isRequired ? '必答' : '选填' }})</span>
                                            <span v-if="question.isRequired" class="required">*</span>
                                        </div>

                                        <!-- 问题内容和图表容器 -->
                                        <div class="question-content">
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
                                                    <div class="form-check more-choice" :data-required="question.isRequired">
                                                        <!-- 修改选择数量提示的显示逻辑 -->
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
                                                                <!-- （已选择 {{ question.selectedOptions ? question.selectedOptions.length : 0 }} 项） -->
                                                            </span>
                                                        </div>
                                                        <div v-for="(option, optIndex) in question.options" 
                                                            :key="option.optionId" 
                                                            class="form-check-option more-option">
                                                            <el-checkbox 
                                                                v-model="question.selectedOptions" 
                                                                :label="option.optionId"
                                                                :disabled="!(question.selectedOptions && question.selectedOptions.includes(option.optionId)) && 
                                                                          question.maxSelections && 
                                                                          question.maxSelections < question.options.length &&
                                                                          question.selectedOptions && question.selectedOptions.length >= question.maxSelections"
                                                                :required="question.isRequired">
                                                                <span class="option-label">
                                                                    {{ String.fromCharCode(65 + optIndex) }}.
                                                                    
                                                                    <template v-if="option.isOpenOption">
                                                                        <el-input 
                                                                            v-if="question.selectedOptions && question.selectedOptions.includes(option.optionId)"
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
                                                                    <span class="check-count">(选择人数: {{ option.checkCount }})</span>
                                                                </span>
                                                            </el-checkbox>
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
                                                        <!-- 添加评分说明 -->
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
                                                        <!-- 添加排序说明 -->
                                                        <div v-if="question.instructions" class="sort-instructions">
                                                            {{ question.instructions }}
                                                        </div>
                                                        
                                                        <!-- 拖拽排序 -->
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
                                                        
                                                        <!-- 选择排序 -->
                                                        <template v-else-if="question.sortType === '选择排序'">
                                                            <div class="sortable-tip">请点击选项进行排序（从上到下）</div>
                                                            <div class="select-sort-container">
                                                                <!-- 已排序的选项列表 -->
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
                                                                <!-- 待选择的选项列表 -->
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
                                            
                                            <!-- 图表容器 -->
                                            <div v-if="question.type === '单选' || question.type === '多选' || question.type === '评分题' || 
                                                question.type === '矩阵单选' || question.type === '矩阵多选' || question.type === '排序'" 
                                                class="chart-container" 
                                                :id="'chart_' + question.questionId">
                                            </div>
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
                            :data-has-skip="question.isSkip"
                            v-show="visibleQuestions.has(question.questionId)">
                            <!-- 问题标题 -->
                            <div class="question-title">
                                <span class="question-number">{{ index + 1 }}.</span>
                                <span class="question-text">{{ question.description }}</span>
                                <span class="question-type">({{ question.type }}, {{ question.isRequired ? '必答' : '选填' }})</span>
                                <span v-if="question.isRequired" class="required">*</span>
                            </div>

                            <!-- 问题内容和图表容器 -->
                            <div class="question-content">
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
                                        <div class="form-check more-choice" :data-required="question.isRequired">
                                            <!-- 修改选择数量提示的显示逻辑 -->
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
                                                    <!-- （已选择 {{ question.selectedOptions ? question.selectedOptions.length : 0 }} 项） -->
                                                </span>
                                            </div>
                                            <div v-for="(option, optIndex) in question.options" 
                                                :key="option.optionId" 
                                                class="form-check-option more-option">
                                                <el-checkbox 
                                                    v-model="question.selectedOptions" 
                                                    :label="option.optionId"
                                                    :disabled="!(question.selectedOptions && question.selectedOptions.includes(option.optionId)) && 
                                                                question.maxSelections && 
                                                                question.maxSelections < question.options.length &&
                                                                question.selectedOptions && question.selectedOptions.length >= question.maxSelections"
                                                    :required="question.isRequired">
                                                    <span class="option-label">
                                                        {{ String.fromCharCode(65 + optIndex) }}.
                                                        <template v-if="option.isOpenOption">
                                                            <el-input 
                                                                v-if="question.selectedOptions && question.selectedOptions.includes(option.optionId)"
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
                                        <div class="text-answer">
                                            <span class="check-count">(回答人数: {{ question.options[0]?.checkCount || 0 }})</span>
                                        </div>
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
                                            <!-- 添加评分说明 -->
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
                                            <!-- 添加排序说明 -->
                                            <div v-if="question.instructions" class="sort-instructions">
                                                {{ question.instructions }}
                                            </div>
                                            
                                            <!-- 拖拽排序 -->
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
                                            
                                            <!-- 选择排序 -->
                                            <template v-else-if="question.sortType === '选择排序'">
                                                <div class="sortable-tip">请点击选项进行排序（从上到下）</div>
                                                <div class="select-sort-container">
                                                    <!-- 已排序的选项列表 -->
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
                                                    <!-- 待选择的选项列表 -->
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
                                
                                <!-- 图表容器 -->
                                <div v-if="question.type === '单选' || question.type === '多选' || question.type === '评分题' || 
                                    question.type === '矩阵单选' || question.type === '矩阵多选' || question.type === '排序'" 
                                    class="chart-container" 
                                    :id="'chart_' + question.questionId">
                                </div>
                            </div>
                        </div>
                        </template>
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

        .question-content {
            display: flex;
            flex-wrap: wrap;
            
            .question-options {
                flex: 1;
                min-width: 300px;
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

                        .check-count {
                            color: #409EFF;
                            margin-left: 8px;
                            font-size: 13px;
                        }

                                            .skip-info {
                        color: #409EFF;
                        font-size: 13px;
                        margin-left: 4px;
                    }
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
                        
                        .check-count {
                            display: block;
                            font-size: 12px;
                            color: #409EFF;
                            margin-top: 4px;
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
            
            .chart-container {
                width: 300px;
                height: 250px;
                margin-left: 20px;
                margin-bottom: 20px;
                border: 1px solid #ebeef5;
                border-radius: 4px;
                background-color: #fff;
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
    .survey-statistics {
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
                        
                        .check-count {
                            font-size: 11px;
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
}

.rating-question {
    .rating-instructions {
        color: #606266;
        font-size: 14px;
        margin-bottom: 10px;
        padding: 8px 12px;
        background-color: #f5f7fa;
        border-radius: 4px;
        border-left: 3px solid #409EFF;
    }
    
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

.category-group {
    margin-bottom: 30px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    overflow: hidden;

    .category-header {
        padding: 16px 20px;
        background: #f5f7fa;
        border-bottom: 1px solid #e4e7ed;

        .category-title {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            position: relative;
            padding-left: 12px;

            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 16px;
                background: #409EFF;
                border-radius: 2px;
            }
        }
    }

    .questions-container {
        padding: 0 20px;
    }
}
</style> 