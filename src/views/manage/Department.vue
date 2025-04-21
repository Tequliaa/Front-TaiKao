<script setup>
import {
    Edit,
    Delete,
    Pointer
} from '@element-plus/icons-vue'
import { nextTick, onMounted,computed, watch ,reactive} from 'vue';
import { ref } from 'vue'
import LoadingWrapper from '@/components/LoadingWrapper.vue'
import { useRouter } from 'vue-router'

//部门列表查询
import { departmentListService, departmentAddService, departmentDelService, departmentUpdateService } from '@/api/department.js'
//导入接口函数
import { userInfoGetService } from '@/api/user.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'

//富文本编辑器
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

import { ElMessage, ElMessageBox } from 'element-plus'
// import { name } from 'element-plus/dist/locale/zh-cn'

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

//部门数据模型
const departments = ref([
    {
        "id": 1,
        "name": "早餐调查部门",
        "description": "张三",
    }
])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(8)//每页条数
const keyword = ref('')

// 添加加载状态
const loading = ref(true)

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
            getUserInf(),
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

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getDepartments();
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getDepartments()
}

//在department.vue中标识是添加部门还是编辑部门
const addDepartmentFlag = ref(true);

//控制抽屉是否显示
const visibleDrawer = ref(false)

//添加表单数据模型
const departmentModel = ref({
    id: '',
    name: '',
    description:'',
    userId: '',
})

//打开添加部门窗口
const openAddDialog = () => {
    departmentModel.value = {};
    visibleDrawer.value = true;
    addDepartmentFlag.value = true;
       // 使用 Vue 的 nextTick 确保 DOM 更新完成后再清空编辑器内容
       nextTick(() => {
        const editor = document.querySelector('.ql-editor');
        if (editor) editor.innerHTML = ''; // 清空编辑器内容
    });
    console.log('departmentModel: '+departmentModel.value.description)
}

//添加部门处理逻辑
const addDepartment = async () => {
    let result = await departmentAddService(departmentModel.value,userInfoStore.info.id);
    ElMessage.success(result.message ? result.message : '添加成功')
    //再次调用getDepartments,获取部门
    getDepartments()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    departmentModel.value = {};
}

//删除部门
const delDepartment = async (row) => {
    ElMessageBox.confirm(
        '你确认删除该部门吗？',
        '温馨提示',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(async () => {
            //用户点击了确认
            let result = await departmentDelService(row.id);
            ElMessage({
                type: 'success',
                message: '删除成功',
            })
            //再次调用再次调用getDepartments()，获取部门
            getDepartments()
        })
        .catch(() => {
            //用户点击了取消
            ElMessage({
                type: 'info',
                message: '取消删除',
            })
        })
    
}

//修改部门回显
const editDepartmentEcho = (row) => {
    //操作改为编辑
    addDepartmentFlag.value = false;
    //显示抽屉
    visibleDrawer.value = true
    departmentModel.value = row;
    // console.log('departmentModel: '+departmentModel.value.description)
}

//修改部门
const editDepartment = async () => {
    departmentModel.value.userId = userInfoStore.info.id
    let result = await departmentUpdateService(departmentModel.value);
    ElMessage.success(result.message ? result.message : '修改成功')
    //再次调用getDepartments,获取部门
    getDepartments()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    departmentModel.value = {};
}

import { debounce } from 'lodash';

const handleInputChange = debounce(() => {
    console.log("触发函数了")
    getDepartments()
    }, 500);  // 延时 500ms

const getPlainText = (htmlContent)=> {
      // 使用正则去掉 HTML 标签，获取纯文本
      const div = document.createElement('div');
      div.innerHTML = htmlContent;
      return div.textContent || div.innerText || '';
    }

// 查看部门用户
const viewDepartment = (row) => {
    router.push({
        name: 'User',
        params: {
            departmentId: row.id,
            departmentName:row.name
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
</script>
<template>
    <LoadingWrapper :loading="loading">
        <el-card class="page-container">
            <template #header>
                <div class="header">
                    <span>部门管理</span>
                    <div class="extra">
                        <el-input v-model="keyword"  @input="handleInputChange" placeholder="请输入部门名称或描述" />
                        <el-button type="primary" @click="openAddDialog()" class="hide-on-mobile">添加部门</el-button>
                    </div>
                </div>
            </template>

            <!-- 部门列表 -->
            <el-table :data="departments" style="width: 100%">
                <!-- <el-table-column label="序号" prop="departmentId"></el-table-column> -->
                <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
                <el-table-column label="部门名称" style="text-align: center;" align="center" prop="name"></el-table-column>
                <el-table-column label="部门介绍" style="text-align: center;" align="center">
                <template #default="scope">
                    <!-- 通过 row.description 获取每行数据的部门介绍，并去掉 HTML 标签 -->
                    <span>{{ getPlainText(scope.row.description) }}</span>
                </template>
                </el-table-column>
                <el-table-column label="操作" style="text-align: center;" align="center" width="150">
                    <template #default="{ row }">
                        <el-tooltip content="查看" placement="top">
                            <el-button :icon="Pointer" circle plain type="primary" @click="viewDepartment(row)"></el-button>
                        </el-tooltip>
                        <el-tooltip content="编辑" placement="top">
                            <el-button :icon="Edit" circle plain type="primary" @click="editDepartmentEcho(row)"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button :icon="Delete" circle plain type="danger" @click="delDepartment(row)"></el-button>
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
    <el-drawer v-model="visibleDrawer" :title="addDepartmentFlag ? '添加部门' : '编辑部门'" direction="rtl" size="50%">
        <!-- 添加部门表单 -->
        <el-form :model="departmentModel" label-width="100px">
            <el-form-item label="部门名称">
                <el-input v-model="departmentModel.name" placeholder="请输入部门名称"></el-input>
            </el-form-item>
            <el-form-item label="部门描述">
                <div class="editor">
                    <quill-editor theme="snow" v-model:content="departmentModel.description" contentType="html">
                    </quill-editor>
                </div>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="addDepartmentFlag ? addDepartment() : editDepartment()">{{ addDepartmentFlag ?
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
</style>