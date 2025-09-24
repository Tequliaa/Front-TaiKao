<script setup>
import {
    Edit,
    Delete,
    Pointer
} from '@element-plus/icons-vue'
import { nextTick, onMounted,computed, watch ,reactive} from 'vue';
import { ref } from 'vue'
//选项列表查询
import { optionListService, optionAddService, optionDelService, optionUpdateService } from '@/api/option.js'
//导入接口函数
import { userInfoGetService } from '@/api/user.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'
import { debounce } from 'lodash';
import { getAllExamsService } from '@/api/exam';
import { getAllQuestionsService,getAllQuestionsByExamIdService } from '@/api/question';
import '@vueup/vue-quill/dist/vue-quill.snow.css'

import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
// import { name } from 'element-plus/dist/locale/zh-cn'
import LoadingWrapper from '@/components/LoadingWrapper.vue'

const userInfoStore = useUserInfoStore();
const router = useRouter()
//获取个人信息
const getUserInf = async () => {
    let result = await userInfoGetService();
    //存储pinia
    userInfoStore.info = result.data;
}

//获取用户基本信息
getUserInf()
const props =defineProps({
    questionId:{
        type:Number
    },
    questionName:{
        type:String
    },
    examId: {
        type: Number
    }
})
//选项数据模型
const options = ref([
    {
        "optionId": 1,
        "questionId":1,
        "isOpenOption":0,
        "type":"单选",
        "description":"这是选项的描述",
        "isSkip":0,
        "questionName": "这是所属问题的名称",
        "skipTo":1,
    }
])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(8)//每页条数
const keyword = ref('')

// 添加加载状态
const loading = ref(true)

// 修改获取选项数据的方法
const getOptions = async () => {
    try {
        let params = {
            userId:userInfoStore.info.id,
            questionId:props.questionId || "",
            keyword: keyword.value,
            pageNum: pageNum.value,
            pageSize: pageSize.value
        }
        let result = await optionListService(params);
        //渲染总条数
        total.value = result.data.totalCount
        //渲染列表数据
        options.value = result.data.options
    } catch (error) {
        ElMessage.error('获取选项列表失败')
    }
}

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        await Promise.all([
            getOptions(),
            getAllExams(),
            getAllQuestions()
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

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getOptions();
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getOptions()
}

//在option.vue中标识是添加选项还是编辑选项
const addOptionFlag = ref(true);

//控制抽屉是否显示
const visibleDrawer = ref(false)

//添加表单数据模型
const optionModel = ref({
    optionId: '',
    examId:'',
    questionId:'',
    isOpenOption:'',
    type:'',
    description:'',
    isSkip:'',
    questionName: '',
    skipTo:'',
    userId: '',
    examName: ''
})

//打开添加选项窗口
const openAddDialog = () => {
    // 设置默认值
    optionModel.value = {
        type: '行选项',
        examId: props.examId || '',
        questionId: props.questionId || ''
    };
    
    // 如果有examId，设置对应的examName
    if (props.examId) {
        // 从allExams中查找对应的考试名称
        const exam = allExams.value.find(s => s.examId === props.examId);
        if (exam) {
            optionModel.value.examName = exam.name;
        }
    }
    
    // 如果有questionId，设置对应的questionName
    if (props.questionId) {
        // 优先使用props.questionName
        if (props.questionName) {
            optionModel.value.questionName = props.questionName;
        } else {
            // 如果没有props.questionName，则从allQuestions中查找
            const question = allQuestions.value.find(q => q.questionId === props.questionId);
            if (question) {
                optionModel.value.questionName = question.description;
            }
        }
    }
    
    visibleDrawer.value = true;
    addOptionFlag.value = true;
    // 使用 Vue 的 nextTick 确保 DOM 更新完成后再清空编辑器内容
    nextTick(() => {
        const editor = document.querySelector('.ql-editor');
        if (editor) editor.innerHTML = ''; // 清空编辑器内容
    });
    console.log('optionModel: '+optionModel.value.description)
}

//添加选项处理逻辑
const addOption = async () => {
    optionModel.value.userId = userInfoStore.info.id
    let result = await optionAddService(optionModel.value);
    ElMessage.success(result.message ? result.message : '添加成功')
    //再次调用getOptions,获取选项
    getOptions()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    optionModel.value = {};
}

//删除选项
const deloption = (row) => {
    ElMessageBox.confirm(
        '你确认删除该选项吗？',
        '温馨提示',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(async () => {
            //用户点击了确认
            let result = await optionDelService(row.optionId)
            ElMessage({
                type: 'success',
                message: '删除成功',
            })
            //再次调用再次调用getOptions，获取选项
            getOptions()
        })
        .catch(() => {
            //用户点击了取消
            ElMessage({
                type: 'info',
                message: '取消删除',
            })
        })
}

//修改选项回显
const editOptionEcho = (row) => {
    //操作改为编辑
    addOptionFlag.value = false;
    //显示抽屉
    visibleDrawer.value = true;
    optionModel.value = row;
    // 获取跳转问题列表
    getSkipQuestions(row.questionId);
}

//修改选项
const editOption = async () => {
    optionModel.value.userId = userInfoStore.info.id
    let result = await optionUpdateService(optionModel.value);
    ElMessage.success(result.message ? result.message : '修改成功')
    //再次调用getOptions,获取选项
    getOptions()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    optionModel.value = {};
}

// const allCategories = ref({
// })

// const getCategories = async () => {
//     let result = await getAllCategoriesService();
//     allCategories.value = result.data;
// }
// getCategories()


const allExams = ref({
})

const getAllExams = async () => {
    let result = await getAllExamsService(userInfoStore.info.id);
    allExams.value = result.data;
}
getAllExams()


const allQuestions = ref({})
const examId = ref(0)
const activeExamId = ref('')

const getAllQuestions = async () => {
    try {
        let result = await getAllQuestionsService(userInfoStore.info.id)
        if (result.code === 200 && result.data) {
            // 从返回的Map中获取questions数组
            allQuestions.value = result.data.questions || []
            // console.log('获取到的所有问题:', allQuestions.value)
        } else {
            console.error('获取问题列表失败:', result)
            ElMessage.error('获取问题列表失败')
        }
    } catch (error) {
        console.error('获取问题列表出错:', error)
        ElMessage.error('获取问题列表失败')
    }
}

const getAllQuestionsByExamId = async () => {
    try {
        let result = await getAllQuestionsByExamIdService(examId.value,userInfoStore.info.id)
        if (result.code === 200 && result.data) {
            // 从返回的Map中获取questions数组
            allQuestions.value = result.data.questions || []
            console.log('获取到的考试问题:', allQuestions.value)
        } else {
            console.error('获取考试问题列表失败:', result)
            ElMessage.error('获取考试问题列表失败')
        }
    } catch (error) {
        console.error('获取考试问题列表出错:', error)
        ElMessage.error('获取考试问题列表失败')
    }
}

// 修改为监听examId，且不为空时调用getAllQuestions
watch(examId, (newVal) => {
    if (newVal) {
        console.log("监视examId变化，且examId不为空，调用getAllQuestions")
        getAllQuestionsByExamId()
    }
}, { immediate: true }) // immediate: true 确保初始值不为空时也会触发

// 监听activeExamId的变化
watch(activeExamId, (newVal) => {
    console.log("监视activeExamId变化，新值为: ", newVal);
    if (newVal) {
        examId.value = newVal;
        getAllQuestionsByExamId();
    }else{
        // 给questions置空
        allQuestions.value = {}
    }
});

const typeOptions = [
    {
        value: '行选项',
        label:'行选项'
    },
    {
        value: '列选项',
        label:'列选项'
    },
    {
        value: '填空',
        label:'填空'
    }
]

const ischecked = [
  {
    value: 1,
    label: '是',
  },
  {
    value: 0,
    label: '否',
  }
]


const handleInputChange = debounce(() => {
    console.log("触发函数了")
    getOptions()
    }, 500);  // 延时 500ms

const getPlainText = (htmlContent)=> {
      // 使用正则去掉 HTML 标签，获取纯文本
      const div = document.createElement('div');
      div.innerHTML = htmlContent;
      return div.textContent || div.innerText || '';
}

// 在 script setup 部分添加新的响应式变量和方法
const skipQuestions = ref([])

// 根据questionId获取examId并获取对应的问题列表
const getSkipQuestions = async (questionId) => {
    if (!questionId) return;
    
    try {
        // 从allQuestions中找到当前问题
        const currentQuestion = allQuestions.value.find(q => q.questionId === questionId);
        if (!currentQuestion) return;
        
        // 获取该问题所属的考试ID
        const currentExamId = currentQuestion.examId;
        
        // 获取该考试下的所有问题
        const result = await getAllQuestionsByExamIdService(currentExamId,userInfoStore.info.id);
        if (result.code === 200 && result.data) {
            // 从返回的Map中获取questions数组，并过滤掉当前问题
            skipQuestions.value = (result.data.questions || []).filter(q => q.questionId !== questionId);
            console.log('获取到的跳转问题列表:', skipQuestions.value);
        }
    } catch (error) {
        console.error('获取跳转问题列表出错:', error);
        ElMessage.error('获取跳转问题列表失败');
    }
}

// 监听questionId的变化
watch(() => optionModel.value.questionId, (newVal) => {
    if (!addOptionFlag.value) {
        getSkipQuestions(newVal);
    }
})

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
    // 根据选择的考试ID获取考试名称
    const exam = allExams.value.find(s => s.examId === value);
    if (exam) {
        optionModel.value.examName = exam.name;
    }
}

const handleQuestionChange = (value) => {
    // 根据选择的questionId获取questionName
    const question = allQuestions.value.find(q => q.questionId === value);
    if (question) {
        optionModel.value.questionName = question.description;
    }
}
</script>
<template>
    <LoadingWrapper :loading="loading">
        <el-card class="page-container">
            <template #header>
                <div class="header">
                    <span>选项管理 - {{ props.questionName || '所有选项' }}</span>
                    <div class="extra">
                        <el-input v-model="keyword"  @input="handleInputChange" placeholder="请输入选项名称或描述" />
                        <el-button type="primary" @click="openAddDialog()" class="hide-on-mobile">添加选项</el-button>
                    </div>
                </div>
            </template>

            <!-- 选项列表 -->
            <el-table :data="options" style="width: 100%">
                <!-- <el-table-column label="序号" prop="optionId"></el-table-column> -->
                <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
                <el-table-column label="所属问题名称" style="text-align: center;" align="center" prop="questionName"></el-table-column>
                <el-table-column label="选项类型" style="text-align: center;" align="center" prop="type"> </el-table-column>
                <el-table-column label="选项描述" style="text-align: center;" align="center" prop="description"></el-table-column>
                <el-table-column label="是否为开放选项" style="text-align: center;" align="center" prop="isOpen">
                    <template #default="{ row }">{{ row.isOpen === 1 ? '是' : '否' }}
                    </template>
                </el-table-column>
                <el-table-column label="是否为跳转选项" style="text-align: center;" align="center" prop="isSkip">
                    <template #default="{ row }">{{ row.isSkip === 1 ? '是' : '否' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" style="text-align: center;" align="center" width="150">
                    <template #default="{ row }">
                        <el-tooltip content="查看" placement="top">
                            <el-button :icon="Pointer" circle plain type="primary"></el-button>
                        </el-tooltip>
                        <el-tooltip content="编辑" placement="top">
                            <el-button :icon="Edit" circle plain type="primary" @click="editOptionEcho(row)"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button :icon="Delete" circle plain type="danger" @click="deloption(row)"></el-button>
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
    <el-drawer v-model="visibleDrawer" :title="addOptionFlag ? '添加选项' : '编辑选项'" direction="rtl" size="50%">
        <!-- 添加选项表单 -->
        <el-form :model="optionModel" label-width="100px">
            <el-form-item label="选项描述">
                <el-input v-model="optionModel.description" placeholder="请输入选项名称"></el-input>
            </el-form-item>
            <el-form-item label="选项类型">
                <el-select v-model="optionModel.type" clearable placeholder="选项类型">
                    <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>
            <el-form-item label="问题所属考试">
                <el-select v-model="activeExamId" clearable placeholder="问题所属考试" @change="handleExamChange">
                    <el-option v-for="item in allExams" :key="item.examId" :label="item.name" :value="item.id"/>
                </el-select>
                <div v-if="optionModel.examName" class="exam-name-display">
                    当前选择: {{ optionModel.examName }}
                </div>
            </el-form-item>
            <el-form-item label="选项所属问题">
                <el-select v-model="optionModel.questionId" clearable placeholder="所属问题" @change="handleQuestionChange">
                    <el-option v-for="item in allQuestions" :key="item.questionId" :label="item.description" :value="item.questionId"/>
                </el-select>
                <div v-if="optionModel.questionName" class="question-name-display">
                    当前选择: {{ optionModel.questionName }}
                </div>
            </el-form-item>
            <template v-if="!addOptionFlag">
                <el-form-item label="开放答案">
                    <el-select v-model="optionModel.isOpenOption" clearable placeholder="是否为开放答案">
                        <el-option v-for="item in ischecked" :key="item.value" :label="item.label" :value="item.value"/>
                    </el-select>
                </el-form-item>
                <el-form-item label="跳转选项">
                    <el-select v-model="optionModel.isSkip" clearable placeholder="是否有跳转选项">
                        <el-option v-for="item in ischecked" :key="item.value" :label="item.label" :value="item.value"/>
                    </el-select>
                </el-form-item>
                <el-form-item label="跳转至" v-if="optionModel.isSkip === 1">
                    <el-select v-model="optionModel.skipTo" clearable placeholder="跳转至">
                        <el-option v-for="item in skipQuestions" :key="item.questionId" :label="item.description" :value="item.questionId"/>
                    </el-select>
                </el-form-item>
            </template>
            <el-form-item>
                <el-button type="primary" @click="addOptionFlag ? addOption() : editOption()">{{ addOptionFlag ?
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

.question-name-display {
    margin-top: 8px;
    font-size: 14px;
    color: #606266;
    font-style: italic;
}
</style>