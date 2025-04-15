<script setup>
import {
    Edit,
    Delete,
    Pointer,
    View,
    Connection,
    DataLine
} from '@element-plus/icons-vue'
import { nextTick, onMounted, computed } from 'vue';
import { ref,reactive } from 'vue'
//问卷列表查询
import { surveyListService, surveyAddService, surveyDelService, surveyUpdateService } from '@/api/survey.js'
//导入接口函数
import { userInfoGetService } from '@/api/user.js'
import  {assignSurveyToDepartment} from '@/api/userSurvey.js'
import { departmentListService } from '@/api/department.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'

//富文本编辑器
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

import { ElMessage, ElMessageBox } from 'element-plus'
// import { name } from 'element-plus/dist/locale/zh-cn'
import SurveyPreview from './SurveyPreview.vue'
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

//问卷数据模型
const surveys = ref([
    {
        "surveyId": 1,
        "name": "早餐调查问卷",
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

// 修改获取问卷数据的方法
const getSurveys = async () => {
    try {
        let params = {
            keyword: keyword.value,
            pageNum: pageNum.value,
            pageSize: pageSize.value
        }
        let result = await surveyListService(params);
        //渲染总条数
        total.value = result.data.totalCount
        //渲染列表数据
        surveys.value = result.data.surveys
    } catch (error) {
        ElMessage.error('获取问卷列表失败')
    }
}

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getSurveys();
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getSurveys()
}

//在survey.vue中标识是添加问卷还是编辑问卷
const addSurveyFlag = ref(true);

//控制抽屉是否显示
const visibleDrawer = ref(false)
// 控制分配问卷抽屉是否显示
const assignVisible = ref(false)

//添加表单数据模型
const surveyModel = ref({
    surveyId: '',
    name: '',
    description:'',
    createdByName: '',
    status: '',
    allowView: '',
    userId: '',
})

// 分配问卷表单数据模型
const assignForm = ref({
    surveyId: '',
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

// 修改获取部门数据的方法
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
            getSurveys(),
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

//打开添加问卷窗口
const openAddDialog = () => {
    surveyModel.value = {};
    visibleDrawer.value = true;
    addSurveyFlag.value = true;
       // 使用 Vue 的 nextTick 确保 DOM 更新完成后再清空编辑器内容
       nextTick(() => {
        const editor = document.querySelector('.ql-editor');
        if (editor) editor.innerHTML = ''; // 清空编辑器内容
    });
    console.log('surveyModel: '+surveyModel.value.description)
}

//添加问卷处理逻辑
const addSurvey = async () => {
    surveyModel.value.userId = userInfoStore.info.id
    let result = await surveyAddService(surveyModel.value);
    ElMessage.success(result.message ? result.message : '添加成功')
    //再次调用getSurveys,获取问卷
    getSurveys()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    surveyModel.value = {};
}

//删除问卷
const delsurvey = (row) => {
    ElMessageBox.confirm(
        '你确认删除该问卷吗？',
        '温馨提示',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(async () => {
            //用户点击了确认
            let result = await surveyDelService(row.surveyId)
            ElMessage({
                type: 'success',
                message: '删除成功',
            })
            //再次调用再次调用getSurveys，获取问卷
            getSurveys()
        })
        .catch(() => {
            //用户点击了取消
            ElMessage({
                type: 'info',
                message: '取消删除',
            })
        })
}
//分配问卷回显
const assignSurveyEcho = (row) => {
    //操作改为编辑
    dialogFormVisible.value = true
    assignForm.value = row;
}

const assignSurvey = async () => {
    
    let result = await assignSurveyToDepartment(assignForm.value.departmentId,assignForm.value.surveyId)

    ElMessage.success(result.message? result.message : '分配成功') 
    dialogFormVisible.value = false
    assignForm.value = {};
}

//修改问卷回显
const editSurveyEcho = (row) => {
    //操作改为编辑
    addSurveyFlag.value = false;
    //显示抽屉
    visibleDrawer.value = true
    surveyModel.value = row;
    // console.log('surveyModel: '+surveyModel.value.description)
}

//修改问卷
const editSurvey = async () => {
    surveyModel.value.userId = userInfoStore.info.id
    let result = await surveyUpdateService(surveyModel.value);
    ElMessage.success(result.message ? result.message : '修改成功')
    //再次调用getSurveys,获取问卷
    getSurveys()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    surveyModel.value = {};
}

const options = [
  {
    value: 1,
    label: '是',
  },
  {
    value: 0,
    label: '否',
  }
]
import { debounce } from 'lodash';

const handleInputChange = debounce(() => {
    console.log("触发函数了")
    getSurveys()
    }, 500);  // 延时 500ms

const getPlainText = (htmlContent)=> {
      // 使用正则去掉 HTML 标签，获取纯文本
      const div = document.createElement('div');
      div.innerHTML = htmlContent;
      return div.textContent || div.innerText || '';
}

// 预览对话框控制
const previewVisible = ref(false)
const currentSurveyId = ref(null)

// 打开预览
const openPreview = (row) => {
    currentSurveyId.value = row.surveyId
    previewVisible.value = true
}

const openQuestions = (row) => {
    router.push({
        name: 'Question',
        params: {
            surveyId: row.surveyId,
            surveyName: row.name
        }
    })
}

const checkResponse = (row) => {
    router.push({
        name: 'Response',
        params: {
            surveyId: row.surveyId,
            surveyName: row.name
        }
    })
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
</script>
<template>
    <LoadingWrapper :loading="loading">
        <el-card class="page-container">
            <template #header>
                <div class="header">
                    <span>问卷管理</span>
                    <div class="extra">
                        <el-input v-model="keyword"  @input="handleInputChange" placeholder="请输入问卷名称或描述" />
                        <el-button type="primary" @click="openAddDialog()" class="hide-on-mobile">添加问卷</el-button>
                    </div>
                </div>
            </template>

            <!-- 桌面端表格视图 -->
            <el-table :data="surveys" style="width: 100%" class="desktop-table">
                <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
                <el-table-column label="问卷名称" style="text-align: center;" align="center" prop="name"></el-table-column>
                <el-table-column label="创建人" style="text-align: center;" align="center" prop="createdByName" class-name="hide-on-mobile"> </el-table-column>
                <el-table-column label="状态" style="text-align: center;" align="center" prop="status" class-name="hide-on-mobile"></el-table-column>
                <el-table-column label="答后允许查看" style="text-align: center;" align="center" prop="allowView" class-name="hide-on-mobile">
                    <template #default="{ row }">{{ row.allowView === 1 ? '是' : '否' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" style="text-align: center;" align="center" width="300">
                    <template #default="{ row }">
                        <div class="action-buttons">
                            <el-tooltip content="预览" placement="top">
                                <el-button :icon="View" circle plain type="primary" @click="openPreview(row)"></el-button>
                            </el-tooltip>
                            <el-tooltip content="查看" placement="top" class-name="hide-on-mobile">
                                <el-button :icon="Connection" circle plain type="primary" @click="openQuestions(row)"></el-button>
                            </el-tooltip>
                            <el-tooltip content="发布" placement="top">
                                <el-button :icon="Pointer" circle plain type="primary" @click="assignSurveyEcho(row)"></el-button>
                            </el-tooltip>
                            <el-tooltip content="查看答题情况" placement="top">
                                <el-button :icon="DataLine" circle plain type="primary" @click="checkResponse(row)"></el-button>
                            </el-tooltip>
                            <el-tooltip content="编辑" placement="top">
                                <el-button :icon="Edit" circle plain type="primary" @click="editSurveyEcho(row)"></el-button>
                            </el-tooltip>
                            <el-tooltip content="删除" placement="top" class-name="hide-on-mobile">
                                <el-button :icon="Delete" circle plain type="danger" @click="delsurvey(row)"></el-button>
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
                <el-card v-for="(row, index) in surveys" :key="row.surveyId" class="survey-card">
                    <div class="card-header">
                        <span class="survey-name">{{ row.name }}</span>
                        <el-tag size="small" :type="row.status === '草稿' ? 'info' : 'success'">{{ row.status }}</el-tag>
                    </div>
                    <div class="card-actions">
                        <el-button :icon="View" circle plain type="primary" @click="openPreview(row)"></el-button>
                        <el-button :icon="Pointer" circle plain type="primary" @click="assignSurveyEcho(row)"></el-button>
                        <el-button :icon="DataLine" circle plain type="primary" @click="checkResponse(row)"></el-button>
                        <el-button :icon="Edit" circle plain type="primary" @click="editSurveyEcho(row)"></el-button>
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
    <!-- 分配问卷对话框 -->
    <el-dialog 
        class="custom-dialog" 
        v-model="dialogFormVisible" 
        title="分发问卷" 
        :width="isMobile ? '300px' : '500px'"
        :style="{ '--el-dialog-width': isMobile ? '300px' : '500px' }">
        <el-form :model="assignForm">
            <el-form-item label="问卷名称" :label-width="formLabelWidth">
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
                <el-button type="primary" @click="assignSurvey()">确认发布</el-button>
            </div>
        </template>
    </el-dialog>
    

    <!-- 抽屉 -->
    <el-drawer v-model="visibleDrawer" :title="addSurveyFlag ? '添加问卷' : '编辑问卷'" direction="rtl" size="50%">
        <!-- 添加问卷表单 -->
        <el-form :model="surveyModel" label-width="100px">
            <el-form-item label="问卷名称">
                <el-input v-model="surveyModel.name" placeholder="请输入问卷名称"></el-input>
            </el-form-item>
            <el-form-item label="问卷描述">
                <div class="editor">
                    <quill-editor theme="snow" v-model:content="surveyModel.description" contentType="html">
                    </quill-editor>
                </div>
            </el-form-item>
            <el-form-item label="答完再次查看">
                <el-select v-model="surveyModel.allowView" clearable placeholder="答完是否可再次查看">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>

            
            <el-form-item>
                <el-button type="primary" @click="addSurveyFlag ? addSurvey() : editSurvey()">{{ addSurveyFlag ?
                        "添加" :
                        "修改" }}</el-button>
                <el-button type="info" @click="visibleDrawer = false">取消</el-button>
            </el-form-item>
        </el-form>
    </el-drawer>

    <!-- 预览对话框 -->
    <el-dialog
        v-model="previewVisible"
        title="问卷预览"
        width="80%"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="true">
        <SurveyPreview v-if="currentSurveyId" :surveyId="currentSurveyId" />
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
        
        .survey-card {
            margin-bottom: 15px;
            
            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                
                .survey-name {
                    font-size: 16px;
                    font-weight: 500;
                }
            }
            
            .card-actions {
                display: flex;
                justify-content: space-around;
                gap: 10px;
                
                .el-button {
                    flex: 1;
                    padding: 8px;
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