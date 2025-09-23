<script setup>
import {
    Edit,
    Delete,
    Pointer,
    View,
    Connection,
    DataLine,
    Tools
} from '@element-plus/icons-vue'
import { nextTick, onMounted, computed } from 'vue';
import { ref,reactive } from 'vue'
//试卷列表查询
import { examListService, examAddService, examDelService, examUpdateService } from '@/api/exam.js'

//导入接口函数
import { userInfoGetService } from '@/api/user.js'
import  {assignExamToDepartment} from '@/api/userExam.js'
import { departmentListService } from '@/api/department.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'

//富文本编辑器
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

import { ElMessage, ElMessageBox } from 'element-plus'
// import { name } from 'element-plus/dist/locale/zh-cn'
import ExamPreview from './ExamPreview.vue'
import { useRouter } from 'vue-router'
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

//试卷数据模型
const exams = ref([
    {
        "id": 1,
        "name": "早餐调查试卷",
        "createdByName": "张三",
        "status": "草稿",
        "allowView": "1",
    }
])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(8)//每页条数
const keyword = ref('')

// 添加加载状态
const loading = ref(true)

// 修改获取试卷数据的方法
const getExams = async () => {
    try {
        let params = {
            userId: userInfoStore.info.id,
            role: userInfoStore.info.role,
            keyword: keyword.value,
            pageNum: pageNum.value,
            pageSize: pageSize.value
        }
        let result = await examListService(params);
        //渲染总条数
        total.value = result.data.totalCount
        //渲染列表数据
        exams.value = result.data.exams
    } catch (error) {
        ElMessage.error('获取试卷列表失败')
    }
}

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getExams();
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getExams()
}

//在exam.vue中标识是添加试卷还是编辑试卷
const addExamFlag = ref(true);

//控制抽屉是否显示
const visibleDrawer = ref(false)
// 控制分配试卷抽屉是否显示
const assignVisible = ref(false)

//添加表单数据模型
const examModel = ref({
    id: '',
    name: '',
    description:'',
    createdByName: '',
    status: '',
    allowView: '',
    userId: '',
})

// 分配试卷表单数据模型
const assignForm = ref({
    id: '',
    name: '',
    description:'',
    departmentId: ''
})


//部门数据模型
const departments = ref([
    {
        "id": 1,
        "name": "早餐调查部门",
        "description": "张三",
    }
])

// 获取部门数据的方法
const getDepartments = async () => {
    try {
        let params = {
            userId: userInfoStore.info.id,
            keyword: keyword.value,
            pageNum: pageNum.value,
            pageSize: pageSize.value
        }
        let result = await departmentListService(params);
        //渲染总条数
        total.value = result.data.totalCount
        //渲染列表数据
        departments.value = result.data.departments
    } catch (error) {
        ElMessage.error('获取部门列表失败')
    }
}

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        await Promise.all([
            getExams(),
            getDepartments()
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

//打开添加试卷窗口
const openAddDialog = () => {
    examModel.value = {
        isCategory:0,
        allowView:1
    };
    visibleDrawer.value = true;
    addExamFlag.value = true;
       // 使用 Vue 的 nextTick 确保 DOM 更新完成后再清空编辑器内容
       nextTick(() => {
        const editor = document.querySelector('.ql-editor');
        if (editor) editor.innerHTML = ''; // 清空编辑器内容
    });
    console.log('examModel: '+examModel.value.description)
}

//添加试卷处理逻辑
const addExam = async () => {
    examModel.value.userId = userInfoStore.info.id
    let result = await examAddService(examModel.value);
    ElMessage.success(result.message ? result.message : '添加成功')
    //再次调用getExams,获取试卷
    getExams()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    examModel.value = {};
}

//删除试卷
const delexam = (row) => {
    ElMessageBox.confirm(
        '你确认删除该试卷吗？',
        '温馨提示',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(async () => {
            //用户点击了确认
            let result = await examDelService(row.id)
            ElMessage({
                type: 'success',
                message: '删除成功',
            })
            //再次调用再次调用getExams，获取试卷
            getExams()
        })
        .catch(() => {
            //用户点击了取消
            ElMessage({
                type: 'info',
                message: '取消删除',
            })
        })
}
//分配试卷回显
const assignExamEcho = (row) => {
    //操作改为编辑
    dialogFormVisible.value = true
    assignForm.value = row;
}

const assignExam = async () => {
    
    let result = await assignExamToDepartment(assignForm.value.departmentId,assignForm.value.id)

    ElMessage.success(result.message? result.message : '分配成功') 
    dialogFormVisible.value = false
    assignForm.value = {};
}

//修改试卷回显
const editExamEcho = (row) => {
    //操作改为编辑
    addExamFlag.value = false;
    //显示抽屉
    visibleDrawer.value = true
    examModel.value = row;
    // console.log('examModel: '+examModel.value.description)
}

//修改试卷
const editExam = async () => {
    examModel.value.userId = userInfoStore.info.id
    let result = await examUpdateService(examModel.value);
    ElMessage.success(result.message ? result.message : '修改成功')
    //再次调用getExams,获取试卷
    getExams()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    examModel.value = {};
}

const options = [
  {
    value: 0,
    label: '否',
  },
  {
    value: 1,
    label: '是',
  },
]
import { debounce } from 'lodash';

const handleInputChange = debounce(() => {
    console.log("触发函数了")
    getExams()
    }, 500);  // 延时 500ms

const getPlainText = (htmlContent)=> {
      // 使用正则去掉 HTML 标签，获取纯文本
      const div = document.createElement('div');
      div.innerHTML = htmlContent;
      return div.textContent || div.innerText || '';
}

// 预览对话框控制
const previewVisible = ref(false)
const currentExamId = ref(null)

// 打开预览
const openPreview = (row) => {
    currentExamId.value = null // 先清空当前ID
    nextTick(() => {
        currentExamId.value = row.id // 在下一个tick中设置新ID
        previewVisible.value = true
    })
}

const openQuestions = (row) => {
    router.push({
        name: 'Question',
        params: {
            examId: row.id,
            examName: row.name
        }
    })
}

const checkResponse = (row) => {
    router.push({
        name: 'Response',
        params: {
            examId: row.id,
            examName: row.name
        }
    })
    // console.log('examId',row.id)
    // console.log('examName',row.name)
}


const dialogFormVisible = ref(false)
const formLabelWidth = '140px'

// 检测是否为移动设备
const isMobile = computed(() => {
    return window.innerWidth <= 768;
})

// 监听窗口大小变化
onMounted(() => {
    window.addEventListener('resize', () => {
        // 强制更新组件
        nextTick(() => {
            // 这里不需要做任何事情，computed 属性会自动重新计算
        });
    });
});

// 添加构建试卷方法
const buildExam = (row) => {
    router.push({
        name: 'ExamBuilder',
        params: {
            examId: row.id
        }
    })
}
</script>
<template>
    <LoadingWrapper :loading="loading">
        <el-card class="page-container">
            <template #header>
                <div class="header">
                    <span>试卷管理</span>
                    <div class="extra">
                        <el-input v-model="keyword"  @input="handleInputChange" placeholder="请输入试卷名称或描述" />
                        <el-button type="primary" v-permission="'exam:create'" @click="openAddDialog()" class="hide-on-mobile">添加试卷</el-button>
                    </div>
                </div>
            </template>
            <!-- 桌面端表格视图 -->
            <el-table :data="exams" style="width: 100%" class="desktop-table">
                <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
                <el-table-column label="试卷名称" style="text-align: center;" align="center" prop="name"></el-table-column>
                <el-table-column label="创建人" style="text-align: center;" align="center" prop="createdByName" class-name="hide-on-mobile"> </el-table-column>
                <el-table-column label="状态" style="text-align: center;" align="center" prop="status" class-name="hide-on-mobile"></el-table-column>
                <el-table-column label="答后允许查看" style="text-align: center;" align="center" prop="allowView" class-name="hide-on-mobile">
                    <template #default="{ row }">{{ row.allowView === 1 ? '是' : '否' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" style="text-align: center;" align="center" width="350">
                    <template #default="{ row }">
                        <div class="action-buttons">
                            <el-tooltip content="预览" placement="top">
                                <el-button :icon="View" circle plain type="primary" @click="openPreview(row)"></el-button>
                            </el-tooltip>
                            <el-tooltip content="查看" placement="top" class-name="hide-on-mobile">
                                <el-button :icon="Connection" circle plain type="primary" @click="openQuestions(row)"></el-button>
                            </el-tooltip>
                            <el-tooltip content="发布" placement="top">
                                <el-button :icon="Pointer" circle plain type="primary" @click="assignExamEcho(row)"></el-button>
                            </el-tooltip>
                            <el-tooltip content="查看答题情况" placement="top">
                                <el-button :icon="DataLine" v-permission="'exam:view'" circle plain type="primary" @click="checkResponse(row)"></el-button>
                            </el-tooltip>
                            <el-tooltip content="编辑" placement="top">
                                <el-button :icon="Edit" v-permission="'exam:edit'" circle plain type="primary" @click="editExamEcho(row)"></el-button>
                            </el-tooltip>
                            <el-tooltip content="构建" placement="top">
                                <el-button :icon="Tools" circle plain type="primary" @click="buildExam(row)" :disabled="row.status === '已发布'"></el-button>
                            </el-tooltip>
                            <el-tooltip content="删除" placement="top" class-name="hide-on-mobile">
                                <el-button :icon="Delete" circle plain type="danger" @click="delexam(row)"></el-button>
                            </el-tooltip>
                        </div>
                    </template>
                </el-table-column>

                <template #empty>
                    <el-empty description="没有数据" />
                </template>
            </el-table>

            <!-- 移动端卡片视图 -->
            <div class="mobile-cards">
                <el-card v-for="(row, index) in exams" :key="row.id" class="exam-card">
                    <div class="card-header">
                        <span class="exam-name">{{ row.name }}</span>
                        <el-tag size="small" :type="row.status === '草稿' ? 'info' : 'success'">{{ row.status }}</el-tag>
                    </div>
                    <div class="card-description" v-if="row.description">
                        {{ getPlainText(row.description).slice(0, 20) }}{{ getPlainText(row.description).length > 20 ? '...' : '' }}
                    </div>
                    <div class="card-actions">
                        <el-button type="primary" size="small" @click="openPreview(row)">预览</el-button>
                        <el-button type="primary" size="small" @click="assignExamEcho(row)">发布</el-button>
                        <el-button type="primary" size="small" @click="checkResponse(row)">查看答题</el-button>
                        <el-button type="primary" size="small" @click="editExamEcho(row)">编辑</el-button>
                    </div>
                </el-card>
            </div>

            <!-- 分页条 -->
            <el-pagination 
                v-model:current-page="pageNum" 
                v-model:page-size="pageSize" 
                :page-sizes="[3, 5, 10, 15]"
                :layout="isMobile ? 'prev, pager, next' : 'jumper, total, sizes, prev, pager, next'" 
                background 
                :total="total" 
                @size-change="onSizeChange"
                @current-change="onCurrentChange" 
                class="pagination-container" />
        </el-card>
    </LoadingWrapper>
    <!-- 分配试卷对话框 -->
    <el-dialog 
        class="custom-dialog" 
        v-model="dialogFormVisible" 
        title="分发试卷" 
        :width="isMobile ? '300px' : '500px'"
        :style="{ '--el-dialog-width': isMobile ? '300px' : '500px' }">
        <el-form :model="assignForm">
            <el-form-item label="试卷名称" :label-width="formLabelWidth">
                <el-input v-model="assignForm.name" aria-disabled="true" autocomplete="off" />
            </el-form-item>
            <el-form-item label="分发部门" :label-width="formLabelWidth">
                <el-select v-model="assignForm.departmentId" clearable placeholder="所要分发部门">
                    <el-option v-for="item in departments" :key="item.id" :label="item.name" :value="item.id"/>
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogFormVisible = false">取消</el-button>
                <el-button type="primary" @click="assignExam()">确认发布</el-button>
            </div>
        </template>
    </el-dialog>
    

    <!-- 抽屉 -->
    <el-drawer v-model="visibleDrawer" :title="addExamFlag ? '添加试卷' : '编辑试卷'" direction="rtl" size="50%">
        <!-- 添加试卷表单 -->
        <el-form :model="examModel" label-width="100px">
            <el-form-item label="试卷名称">
                <el-input v-model="examModel.name" placeholder="请输入试卷名称"></el-input>
            </el-form-item>
            <el-form-item label="试卷描述">
                <div class="editor">
                    <quill-editor theme="snow" v-model:content="examModel.description" contentType="html">
                    </quill-editor>
                </div>
            </el-form-item>
            <el-form-item label="答完再次查看">
                <el-select v-model="examModel.allowView" clearable placeholder="答完是否可再次查看">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>

            <el-form-item label="按分类展示">
                <el-select v-model="examModel.isCategory" clearable placeholder="试卷内问题是否按分类展示">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>
            
            <el-form-item>
                <el-button type="primary" @click="addExamFlag ? addExam() : editExam()">{{ addExamFlag ?
                        "添加" :
                        "修改" }}</el-button>
                <el-button type="info" @click="visibleDrawer = false">取消</el-button>
            </el-form-item>
        </el-form>
    </el-drawer>

    <!-- 预览对话框 -->
    <el-dialog
        v-model="previewVisible"
        title="试卷预览"
        width="80%"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="true"
        @closed="currentExamId = null">
        <ExamPreview v-if="currentExamId" :examId="currentExamId" />
    </el-dialog>
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
/* 调整移动端表格样式 */
:deep(.el-table) {
    @media (max-width: 768px) {
        .el-table__header-wrapper,
        .el-table__body-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        .el-table__column-resize-proxy {
            display: none;
        }
        
        .action-buttons {
            display: flex;
            flex-wrap: nowrap;
            justify-content: center;
            gap: 5px;
            
            .el-button {
                padding: 4px;
                font-size: 12px;
            }
        }
    }
}

/* 操作按钮样式 */
:deep(.action-buttons) {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    // gap: 8px;
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

/* 对话框样式 */
:deep(.el-dialog) {
    @media (max-width: 768px) {
        --el-dialog-width: 300px !important;
        width: 90% !important;
        margin: 5vh auto !important;
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        
        .el-dialog__body {
            padding: 10px;
        }
        
        .el-form-item {
            margin-bottom: 15px;
        }
        
        .el-form-item__label {
            padding-right: 8px;
        }
        
        .el-input, .el-select {
            width: 100%;
        }
    }
}

/* 抽屉样式 */
:deep(.el-drawer) {
    @media (max-width: 768px) {
        width: 90% !important;
    }
}

/* 移动端卡片样式 */
.mobile-cards {
    display: none;
    
    @media (max-width: 768px) {
        display: block;
        padding: 10px;
        
        .exam-card {
            margin-bottom: 15px;
            
            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #ebeef5;
                
                .exam-name {
                    font-size: 16px;
                    font-weight: 500;
                    color: #303133;
                }
            }

            .card-description {
                font-size: 14px;
                color: #606266;
                margin-bottom: 12px;
                line-height: 1.4;
                padding: 0 4px;
            }
            
            .card-actions {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                padding-top: 8px;
                border-top: 1px solid #ebeef5;
                
                .el-button {
                    width: 100%;
                    margin: 0;
                    padding: 8px 12px;
                    font-size: 14px;
                }
            }
        }
    }
}

/* 桌面端表格在移动端隐藏 */
.desktop-table {
    @media (max-width: 768px) {
        display: none;
    }
}
</style>