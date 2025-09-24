<script setup>
import {
    Edit,
    Delete,
    Pointer,
    Connection
} from '@element-plus/icons-vue'

import { nextTick, onMounted,computed, watch } from 'vue';
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
//问题列表查询
import { questionListService, questionAddService, questionDelService, questionUpdateService } from '@/api/question.js'
import { getAllCategoriesService } from '@/api/category.js'
import { getAllExamsService } from '@/api/exam.js'
//导入接口函数
import { userInfoGetService } from '@/api/user.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'

//富文本编辑器
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

import { ElMessage, ElMessageBox } from 'element-plus'
// import { name } from 'element-plus/dist/locale/zh-cn'

import LoadingWrapper from '@/components/LoadingWrapper.vue'

const userInfoStore = useUserInfoStore();
const router = useRouter()
const route = useRoute()

//获取个人信息
const getUserInf = async () => {
    let result = await userInfoGetService();
    //存储pinia
    userInfoStore.info = result.data;
}

//获取用户基本信息
getUserInf()
//问题数据模型

const questions = ref([
    {
        "questionId": 1,
        "description": "123",
        "categoryId": "早餐调查问题",
        "categoryName": "张三",
        "examId": "草稿",
        "examName": 1,
        "type":"单选",
        "isRequired": 1,
        "isOpen": 1,
        "isSkip": 1,
        "options":""
    }
])

const props =defineProps({
    examId:{
        type:Number
    },
    examName:{
        type:String
    }
})

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(8)//每页条数
const keyword = ref('')

// 添加加载状态
const loading = ref(true)

// 修改获取问题数据的方法
const getQuestions = async () => {
    try {
        let params = {
            examId:props.examId,
            userId: userInfoStore.info.id,
            keyword: keyword.value,
            pageNum: pageNum.value,
            pageSize: pageSize.value
        }
        let result = await questionListService(params);
        //渲染总条数
        total.value = result.data.totalCount
        //渲染列表数据
        questions.value = result.data.questions
    } catch (error) {
        ElMessage.error('获取问题列表失败')
    }
}

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        await Promise.all([
            getUserInf(),
            getQuestions()
        ])
    } finally {
        loading.value = false
    }
}

// 在组件挂载时初始化数据
onMounted(() => {
    initData()
    window.addEventListener('resize', () => {
        // 强制更新组件
        nextTick(() => {
            // 这里不需要做任何事情，computed 属性会自动重新计算
        });
    });
})

// 监听路由参数变化
watch(() => route.query.examId, (newVal) => {
    if (newVal) {
        getQuestions()
    }
})

console.log("123")
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getQuestions();
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getQuestions()
}

//在question.vue中标识是添加问题还是编辑问题
const addQuestionFlag = ref(true);

//控制抽屉是否显示
const visibleDrawer = ref(false)

//添加表单数据模型
const questionModel = ref({
    questionId: '',
    description: '',
    categoryId:'',
    categoryName: '',
    examId: '',
    examName: '',
    type: '',
    isRequired: '',
    isOpen: '',
    options: '',
    displayType: '',
    sortType: '',
    isSkip: ''
})

//打开添加问题窗口
const openAddDialog = () => {
    // 设置默认值
    questionModel.value = {
        type: '单选',
        isRequired: 1,
        isOpen: 0,
        isSkip: 0,
        displayType: '五角星',
        sortType: '拖拽排序',
        sortKey:'1',
        categoryId: '',
        examId: props.examId || ''
    };
    
    // 如果有examId，设置对应的examName
    if (props.examId) {
        // 优先使用props.examName
        if (props.examName) {
            questionModel.value.examName = props.examName;
        } else {
            // 如果没有props.examName，则从allExams中查找
            const exam = allExams.value.find(s => s.examId === props.examId);
            if (exam) {
                questionModel.value.examName = exam.name;
            }
        }
    }
    
    visibleDrawer.value = true;
    addQuestionFlag.value = true;
    // 使用 Vue 的 nextTick 确保 DOM 更新完成后再清空编辑器内容
    nextTick(() => {
        const editor = document.querySelector('.ql-editor');
        if (editor) editor.innerHTML = ''; // 清空编辑器内容
    });
    console.log('questionModel: '+questionModel.value.description)
}

//添加问题处理逻辑
const addQuestion = async () => {
    // questionModel.value.userId = userInfoStore.info.id
    let result = await questionAddService(questionModel.value);
    ElMessage.success(result.message ? result.message : '添加成功')
    //再次调用getQuestions,获取问题
    getQuestions()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    questionModel.value = {};
}

//删除问题
const delquestion = (row) => {
    ElMessageBox.confirm(
        '你确认删除该问题吗？',
        '温馨提示',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(async () => {
            //用户点击了确认
            let result = await questionDelService(row.questionId)
            ElMessage({
                type: 'success',
                message: '删除成功',
            })
            //再次调用再次调用getQuestions，获取问题
            getQuestions()
        })
        .catch(() => {
            //用户点击了取消
            ElMessage({
                type: 'info',
                message: '取消删除',
            })
        })
}

//修改问题回显
const editQuestionEcho = (row) => {
    //操作改为编辑
    addQuestionFlag.value = false;
    //显示抽屉
    visibleDrawer.value = true
    questionModel.value = row;
    // console.log('questionModel: '+questionModel.value.description)
}

//修改问题
const editQuestion = async () => {
    questionModel.value.userId = userInfoStore.info.id
    let result = await questionUpdateService(questionModel.value);
    ElMessage.success(result.message ? result.message : '修改成功')
    //再次调用getQuestions,获取问题
    getQuestions()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    questionModel.value = {};
}

const isOpenOptions = [
    {
        value: 0,
        label:'无'
    },
    {
        value: 1,
        label:'有'
    },
]

const isSkipOptions = [
    {
        value: 0,
        label:'无'
    },
    {
        value:1,
        label:'有'
    }
]

const isRequiredOptions = [
    {
        value: 1,
        label:'是'
    },
    {
        value:0,
        label:'否'
    }
]


const typeOptions = [
    {
        value: '单选',
        label:'单选'
    },
    {
        value: '多选',
        label:'多选'
    },
    {
        value: '填空',
        label:'填空'
    },
    {
        value: '矩阵单选',
        label:'矩阵单选'
    },
    {
        value: '矩阵多选',
        label:'矩阵多选'
    },
    {
        value: '排序',
        label:'排序'
    },
    {
        value: '评分题',
        label:'评分题'
    },
    {
        value: '文件上传题',
        label:'文件上传题'
    },
]

// 添加显示样式选项
const displayTypeOptions = [
    {
        value: '五角星',
        label: '五角星'
    },
    {
        value: '滑动条',
        label: '滑动条'
    }
]

const sortTypeOptions = [
    {
        value: '拖拽排序',
        label: '拖拽排序'
    },
    {
        value: '选择排序',
        label: '选择排序'
    }
]

const allCategories = ref({
})

const getCategories = async () => {
    let result = await getAllCategoriesService(userInfoStore.info.id);
    allCategories.value = result.data;
}
getCategories()

const allExams = ref({
})

const getAllExams = async () => {
    let result = await getAllExamsService(userInfoStore.info.id);
    allExams.value = result.data;
}
getAllExams()


import { debounce } from 'lodash';

const handleInputChange = debounce(() => {
    console.log("触发函数了")
    getQuestions()
    }, 500);  // 延时 500ms

const openOptions = (row) => {
    router.push({
        name: 'Option',
        params: {
            questionId: row.questionId,
            questionName:row.description
        }
    })
}
// 检测是否为移动设备
const isMobile = computed(() => {
    return window.innerWidth <= 768;
})

onMounted(() => {
window.addEventListener('resize', () => {
        // 强制更新组件
        nextTick(() => {
            // 这里不需要做任何事情，computed 属性会自动重新计算
        });
    });
})

const handleExamChange = (value) => {
    const exam = allExams.value.find(s => s.examId === value);
    if (exam) {
        questionModel.value.examName = exam.name;
    }
}
</script>
<template>
    <LoadingWrapper :loading="loading">
        <el-card class="page-container">
            <template #header>
                <div class="header">
                    <span>问题管理 - {{ props.examName || '所有考试' }}</span>
                    <div class="extra">
                        <el-input v-model="keyword" @input="handleInputChange" placeholder="请输入问题描述" />
                        <el-button type="primary" @click="openAddDialog()" class="hide-on-mobile">添加问题</el-button>
                    </div>
                </div>
            </template>

            <!-- 问题列表 -->
            <el-table :data="questions" style="width: 100%">
                <!-- <el-table-column label="序号" prop="questionId"></el-table-column> -->
                <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
                <el-table-column label="问题描述" style="text-align: center;" align="center" prop="description"></el-table-column>
                <el-table-column label="问题类型" style="text-align: center;" align="center" prop="type" > </el-table-column>
                <!-- <el-table-column label="所属分类" style="text-align: center;" align="center" prop="categoryName" width="100"></el-table-column> -->
                <el-table-column label="所属考试" style="text-align: center;" align="center" prop="examName"></el-table-column>
                <el-table-column label="是否必答" style="text-align: center;" align="center" prop="isRequired">
                    <template #default="{ row }">{{ row.isRequired === 1 ? '是' : '否' }}
                    </template>
                </el-table-column>
                <el-table-column label="有无开放答案" style="text-align: center;" align="center" prop="isOpen">
                    <template #default="{ row }">{{ row.isOpen === 1 ? '有' : '无' }}
                    </template>
                </el-table-column>
                <el-table-column label="有无跳转" style="text-align: center;" align="center" prop="isSkip">
                    <template #default="{ row }">{{ row.isSkip === 1 ? '有' : '无' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" style="text-align: center;" align="center" width="150">
                    <template #default="{ row }">
                        <el-tooltip content="查看" placement="top">
                            <el-button :icon="Connection" circle plain type="primary" @click="openOptions(row)"></el-button>
                        </el-tooltip>
                        <el-tooltip content="编辑" placement="top">
                            <el-button :icon="Edit" circle plain type="primary" @click="editQuestionEcho(row)"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button :icon="Delete" circle plain type="danger" @click="delquestion(row)"></el-button>
                        </el-tooltip>          
                    </template>
                </el-table-column>

                <template #empty>
                    <el-empty description="没有数据" />
                </template>
            </el-table>

            <!-- 分页条 -->
            <el-pagination 
                v-model:current-page="pageNum" 
                v-model:page-size="pageSize" 
                :page-sizes="[3, 5, 10, 15]"
                :layout="isMobile ? 'prev, pager, next' : 'jumper, total, sizes, prev, pager, next'" 
                background 
                :pager-count="5"
                :total="total" 
                @size-change="onSizeChange"
                @current-change="onCurrentChange" 
                class="pagination-container" />
        </el-card>
    </LoadingWrapper>


    <!-- 抽屉 -->
    <el-drawer v-model="visibleDrawer" :title="addQuestionFlag ? '添加问题' : '编辑问题'" direction="rtl" size="50%">
        <!-- 添加问题表单 -->
        <el-form :model="questionModel" label-width="100px">
            <el-form-item label="问题内容">
                <el-input v-model="questionModel.description" placeholder="请输入问题内容"></el-input>
            </el-form-item>
            <el-form-item label="类型">
                <el-select v-model="questionModel.type" clearable placeholder="问题类型">
                    <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>

            <!-- 添加显示样式选择框 -->
            <el-form-item v-if="questionModel.type === '评分题'" label="显示样式">
                <el-select v-model="questionModel.displayType" clearable placeholder="请选择显示样式">
                    <el-option v-for="item in displayTypeOptions" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>

            <!-- 添加排序类型选择框 -->
            <el-form-item v-if="questionModel.type === '排序'" label="排序类型">
                <el-select v-model="questionModel.sortType" clearable placeholder="请选择排序类型">
                    <el-option v-for="item in sortTypeOptions" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>
            <el-form-item label="是否必答">
                <el-select v-model="questionModel.isRequired" clearable placeholder="是否必答">
                    <el-option v-for="item in isRequiredOptions" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>

            <el-form-item label="有无开放答案">
                <el-select v-model="questionModel.isOpen" clearable placeholder="有无开放答案">
                    <el-option v-for="item in isOpenOptions" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>

            <el-form-item label="所属分类">
                <el-select v-model="questionModel.categoryId" clearable placeholder="所属分类">
                    <el-option v-for="item in allCategories" :key="item.categoryId" :label="item.categoryName" :value="item.categoryId"/>
                </el-select>
            </el-form-item>

            <el-form-item label="所属考试">
                <el-select v-model="questionModel.examId" clearable placeholder="所属考试" @change="handleExamChange">
                    <el-option v-for="item in allExams" :key="item.examId" :label="item.name" :value="item.examId"/>
                </el-select>
                <div v-if="questionModel.examName" class="exam-name-display">
                    当前选择: {{ questionModel.examName }}
                </div>
            </el-form-item>

            <el-form-item label="有无跳转">
                <el-select v-model="questionModel.isSkip" clearable placeholder="有无跳转">
                    <el-option v-for="item in isSkipOptions" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>

            
            <el-form-item>
                <el-button type="primary" @click="addQuestionFlag ? addQuestion() : editQuestion()">{{ addQuestionFlag ?
                        "添加" :
                        "修改" }}</el-button>
                <el-button type="info" @click="visibleDrawer = false">取消</el-button>
            </el-form-item>
        </el-form>
    </el-drawer>
</template>
<style lang="scss" scoped>
.page-container {
    min-height: 100%;
    box-sizing: border-box;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap; /* 允许在移动端换行 */
        gap: 10px; /* 添加间距 */
        
        span {
            font-size: 16px;
            font-weight: 500;
            white-space: nowrap; /* 防止文字换行 */
        }
    }
    
    .extra {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap; /* 允许在移动端换行 */
    }

    .el-input {
        width: 240px; /* 输入框的宽度 */
    }
    
    /* 移动端响应式样式 */
    @media (max-width: 768px) {
        .header {
            flex-direction: column;
            align-items: flex-start;
            
            span {
                margin-bottom: 10px;
            }
        }
        
        .extra {
            width: 100%;
            justify-content: space-between;
            
            .el-input {
                width: 100%;
                margin-bottom: 10px;
            }
            
            .el-button {
                width: 100%;
            }
        }
    }
}
/* 分页样式 */
:deep(.pagination-container) {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    
    @media (max-width: 768px) {
        justify-content: center;
    }
}

/* 隐藏移动端元素 */
:deep(.hide-on-mobile) {
    @media (max-width: 768px) {
        display: none !important;
    }
}
/* 抽屉样式 */
.avatar-uploader {
    :deep() {
        .avatar {
            width: 178px;
            height: 178px;
            display: block;
        }

        .el-upload {
            border: 1px dashed var(--el-border-color);
            border-radius: 6px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: var(--el-transition-duration-fast);
        }

        .el-upload:hover {
            border-color: var(--el-color-primary);
        }

        .el-icon.avatar-uploader-icon {
            font-size: 28px;
            color: #8c939d;
            width: 178px;
            height: 178px;
            text-align: center;
        }
    }
}

.editor {
    width: 100%;

    :deep(.ql-editor) {
        min-height: 200px;
    }
}

.exam-name-display {
    margin-top: 8px;
    font-size: 14px;
    color: #606266;
    font-style: italic;
}
</style>