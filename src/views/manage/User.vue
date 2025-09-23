<script setup>
import {
    Edit,
    Delete,
    Pointer,
    Download,
    Upload
} from '@element-plus/icons-vue'
import { ref, nextTick,onMounted, watch,computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userListService, userUpdateService, userDeleteService, userExportService, userImportService } from '@/api/user.js'
import { getAllSurveysService } from '@/api/department.js'
//导入接口函数
import { userInfoGetService } from '@/api/user.js'
import { getAllRolesService } from '@/api/role.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'
import LoadingWrapper from '@/components/LoadingWrapper.vue'
import { useRouter, useRoute } from 'vue-router'
const userInfoStore = useUserInfoStore();

const users = ref([
])

//用于动态显示弹窗标题内容
const title = ref('')

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(8)//每页条数
const keyword = ref('')

// 添加部门数据模型
const departments = ref([])

// 添加加载状态
const loading = ref(true)

const router = useRouter()
const props =defineProps({
    departmentId:{
        type:Number
    },
    departmentName:{
        type:String
    },
})
// 修改获取用户数据的方法
const getUsers = async () => {
    try {
        let params = {
            userId:userInfoStore.info.id,
            keyword: keyword.value,
            pageNum: pageNum.value,
            pageSize: pageSize.value,
            departmentId: props.departmentId
        }
        let result = await userListService(params);
        //渲染总条数
        total.value = result.data.totalCount
        //渲染列表数据
        users.value = result.data.users
        // 添加调试日志，查看用户数据结构
        // console.log('用户列表数据结构:', result.data.users)
        // if(users.value.length > 0) {
            // console.log('第一个用户的完整结构:', users.value[0])
            // 打印所有包含'role'的字段名（不区分大小写）
            // console.log('用户数据中的角色字段:', Object.keys(users.value[0]).filter(key => key.toLowerCase().includes('role')))
            // 打印角色相关字段的具体值
            // console.log('角色相关字段详细值:')
            // Object.keys(users.value[0]).forEach(key => {
            //     if (key.toLowerCase().includes('role')) {
            //         console.log(`${key}:`, users.value[0][key])
            //     }
            // })
        // }
    } catch (error) {
        ElMessage.error('获取用户列表失败')
    }
}

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getUsers();
}

//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getUsers()
}

//获取个人信息
const getUserInf = async () => {
    let result = await userInfoGetService();
    //存储pinia
    userInfoStore.info = result.data;
}

// 修改获取部门数据的方法
const getAllDepartments = async () => {
    try {
        let result = await getAllSurveysService(userInfoStore.info.id);
        departments.value = result.data;
    } catch (error) {
        ElMessage.error('获取部门列表失败')
    }
}

// 获取所有角色数据的方法
const getAllRoles = async () => {
    try {
        let result = await getAllRolesService();
        // 根据后端Role实体类结构，将数据转换为select组件需要的格式
        roles.value = result.data.map(role => ({
            value: role.id,
            label: role.name
        }));
    } catch (error) {
        ElMessage.error('获取角色列表失败')
    }
}

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        await Promise.all([
            // getUserInf(),
            getUsers(),
            getAllDepartments(),
            getAllRoles()
        ])
    } finally {
        loading.value = false
    }
}
// 检测是否为移动设备
const isMobile = computed(() => {
    return window.innerWidth <= 768;
})
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

// 用户角色
const roles = ref([])


//控制添加用户弹窗
const dialogVisible = ref(false)

//添加用户数据模型
const userModel = ref({
    name: '',
    role:'',
    departmentId:'',
    departmentName:''
})
//添加用户表单校验
const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 16, message: '长度在2到16个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 5, max: 16, message: '长度在3到16个字符', trigger: 'blur' }
    ]
}
//定义函数，清空数据模型的数据
const clearUserModel = () => {
    title.value = '添加用户',
    userModel.value = {
        username: '',
        password: '',
        email: ''
    }
}

//修改用户回显
const updateUserEcho = (row) => {
    title.value = '修改用户'
    dialogVisible.value = true
    //将row中的数据赋值给userModel
    userModel.value.name = row.name
    
    // 打印用户数据的完整结构进行调试
    console.log('用户数据结构:', row)
    console.log('用户角色名称:', row.roleName)
    
    // 首先尝试直接获取角色ID字段
    let roleId = row.roleId || row.role || row.roleIdValue || null
    
    // 如果没有直接的角色ID字段，但有角色名称，则根据角色名称查找对应的ID
    if (!roleId && row.roleName && roles.value.length > 0) {
        const role = roles.value.find(r => r.label === row.roleName)
        if (role) {
            roleId = role.value
            console.log('通过角色名称找到的角色ID:', roleId)
        }
    }
    
    userModel.value.role = roleId
    console.log('最终设置的角色ID:', userModel.value.role)
    
    userModel.value.departmentId = row.departmentId
    //修改的时候必须传递用户的id，所以扩展一个id属性
    userModel.value.id = row.id
    console.log('id: '+userModel.value.id)
}
//修改用户
const updateUser = async () => {
    let result = await userUpdateService(userModel.value)
    ElMessage.success(result.message ? result.message : '修改成功')
    //隐藏弹窗
    dialogVisible.value = false
    //再次访问后台接口，查询所有分类
    getUsers()

    // 清空数据模型的数据
    clearUserModel();
}

//删除用户  给删除按钮绑定事件
const deleteUser = (row) => {
    ElMessageBox.confirm(
        '你确认删除该用户信息吗？',
        '温馨提示',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(async () => {
            //用户点击了确认
            let result = await userDeleteService(row.id)
            ElMessage({
                type: 'success',
                message: '删除成功',
            })
            //再次调用getAllUser，获取所有用户
            getUsers()
        })
        .catch(() => {
            //用户点击了取消
            ElMessage({
                type: 'info',
                message: '取消删除',
            })
        })
}
import { debounce } from 'lodash';

const handleInputChange = debounce(() => {
    console.log("触发函数了")
    getUsers()
}, 500);  // 延时 500ms

const getPlainText = (htmlContent)=> {
    // 使用正则去掉 HTML 标签，获取纯文本
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    return div.textContent || div.innerText || '';
}
const goToUserSurveyPage = (row) => {
    console.log(row.name)
    router.push({
      name: 'UserSurvey',  // 使用路由名称
      params: { userId: row.id ,
                username: row.name }  // 传递参数
    })}

// 导出用户列表
const exportUsers = async () => {
    try {
        const response = await userExportService({
            keyword: keyword.value,
            departmentId: props.departmentId,
            userId:userInfoStore.info.id
            
        })

        // 获取文件名
        const contentDisposition = response.headers['content-disposition']
        let fileName = `用户列表-${new Date().toLocaleDateString()}.xlsx`
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
            if (fileNameMatch && fileNameMatch[1]) {
                fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''))
            }
        }

        // 下载文件
        const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        ElMessage.success('导出成功')
    } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败：' + (error.response?.data?.message || error.message))
    }
}

const fileInputRef = ref()
const showImportDialog = async () => {
    try {
        await ElMessageBox.confirm(
            `<div class="import-guide">
                <div class="guide-title">Excel导入格式说明</div>
                <div class="guide-content">
                    <div class="guide-item">
                        <span class="item-label">第1列：</span>
                        <span class="item-value">用户名</span>
                    </div>
                    <div class="guide-item">
                        <span class="item-label">第2列：</span>
                        <span class="item-value">昵称</span>
                    </div>
                    <div class="guide-item">
                        <span class="item-label">第3列：</span>
                        <span class="item-value">默认密码</span>
                    </div>
                    ${!props.departmentName ? `
                    <div class="guide-item">
                        <span class="item-label">第4列：</span>
                        <span class="item-value">部门名称</span>
                    </div>
                    ` : ''}
                    <div class="guide-note">注：数据从第2行开始读取</div>
                    <div class="guide-example">
                        <div class="example-title">示例：</div>
                        <div class="example-content">
                            <div>用户名</div>
                            <div>昵称</div>
                            <div>默认密码</div>
                            ${!props.departmentName ? '<div>部门名称</div>' : ''}
                        </div>
                        <div class="example-content">
                            <div>123</div>
                            <div>321</div>
                            <div>123</div>
                            ${!props.departmentName ? '<div>312</div>' : ''}
                        </div>
                    </div>
                </div>
            </div>`,
            '导入确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info',
                dangerouslyUseHTMLString: true,
                customClass: 'import-guide-dialog'
            }
        )
        // 用户点击确定后，触发文件选择
    fileInputRef.value.value = null // 清除旧文件记录，支持重复上传相同文件
    fileInputRef.value.click() // 手动打开文件选择框
    } catch (error) {
        // 用户点击取消，不做任何操作
    }
}

// 导入用户
const handleImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const isExcel =
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件！')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await userImportService(formData, props.departmentName)
    if (response.code === 200) {
      const result = response.data
      let message = `
        <div class="import-result">
          <div class="import-result-title">导入完成！</div>
          <div class="import-result-stats">
              <div class="stat-item"><div class="stat-value">${result.total}</div><div class="stat-label">总计</div></div>
              <div class="stat-item"><div class="stat-value">${result.success}</div><div class="stat-label">成功</div></div>
              <div class="stat-item"><div class="stat-value">${result.skip}</div><div class="stat-label">跳过</div></div>
          </div>`

      if (result.skip > 0) {
        message += `
          <div class="import-result-reasons">
            <div class="reasons-title">跳过原因</div>
            <ul class="reasons-list">`

        const displayReasons = result.skipReasons.slice(0, 3)
        displayReasons.forEach(reason => {
          message += `<li class="reason-item">${reason}</li>`
        })

        if (result.skipReasons.length > 3) {
          message += `<li class="reason-more">... 还有 ${result.skipReasons.length - 3} 条原因未显示</li>`
        }

        message += `</ul></div>`
      }

      message += `</div>`

      ElMessageBox.alert(message, '导入结果', {
        confirmButtonText: '确定',
        dangerouslyUseHTMLString: true,
        customClass: 'import-result-dialog',
        callback: () => {
          getUsers() // 刷新用户数据
        }
      })
    } else {
      ElMessage.error(response.message || '导入失败')
    }
  } catch (err) {
    ElMessage.error('导入失败：' + (err.response?.data?.message || err.message))
  }
}


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
                    <span>用户管理 - {{props.departmentName || '所有用户'}}</span>
                    <div class="extra">
                        <el-input v-model="keyword" @input="handleInputChange" placeholder="请输入用户名查询" />
                        <div class="button-group">
                        <!-- 隐藏的文件输入框 -->
                        <input
                            ref="fileInputRef"
                            type="file"
                            accept=".xlsx,.xls"
                            class="hidden"
                            @change="handleImport"
                            style="display: none;"
                        />

                        <!-- 显示的导入按钮 -->
                        <el-button v-permission="'user:import'" type="primary" class="action-button" @click="showImportDialog">
                            <el-icon><Upload /></el-icon>
                            {{ props.departmentName }}导入
                        </el-button>

                            <el-button v-permission="'user:export'" type="primary" @click="exportUsers" class="action-button">
                                <el-icon><Download /></el-icon>
                                导出
                            </el-button>
                        </div>
                    </div>
                    
                </div>
            </template>
            <el-table :data="users" style="width: 100%">
                <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"> </el-table-column>
                <el-table-column label="用户名称" style="text-align: center;" align="center" prop="name"> </el-table-column>
                <el-table-column label="角色" style="text-align: center;" align="center" prop="roleName"></el-table-column>
                <el-table-column label="所属部门" style="text-align: center;" align="center" prop="departmentName"></el-table-column>
                <el-table-column label="操作" style="text-align: center;" align="center" width="150">
                    <template #default="{ row }">
                        <el-tooltip content="查看" placement="top">
                            <el-button v-permission="'user:view'" :icon="Pointer" circle plain type="primary" @click="goToUserSurveyPage(row)"></el-button>
                        </el-tooltip>
                        <el-tooltip content="编辑" placement="top">
                            <el-button v-permission="'user:edit'" :icon="Edit" circle plain type="primary" @click="updateUserEcho(row)"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button v-permission="'user:delete'" :icon="Delete" circle plain type="danger" @click="deleteUser(row)"></el-button>
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

        <!-- 修改用户弹窗 -->
        <el-dialog v-model="dialogVisible" :title="title" width="30%">
            <el-form :model="userModel" :rules="rules" label-width="100px" style="padding-right: 30px">
                <el-form-item label="用户名">
                    <el-input placeholder="请输入用户名" v-model="userModel.name" minlength="5" maxlength="16"></el-input>
                </el-form-item>

                <el-form-item label="用户角色">
                    <el-select v-model="userModel.role" clearable placeholder="请选择用户角色">
                        <el-option v-for="item in roles" :key="item.value" :label="item.label" :value="item.value"/>
                    </el-select>
                </el-form-item>

                <el-form-item label="所属部门">
                    <el-select v-model="userModel.departmentId" clearable placeholder="请选择所属部门">
                        <el-option v-for="item in departments" :key="item.id" :label="item.name" :value="item.id"/>
                    </el-select>
                </el-form-item>

            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click =updateUser()> 确认 </el-button>
                </span>
            </template>
        </el-dialog>
    </LoadingWrapper>
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
    
    /* 按钮组样式 */
    .button-group {
        display: flex;
        gap: 10px;
        align-items: center;
        
        .action-button {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 80px;
            
            .el-icon {
                margin-right: 5px;
            }
        }
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
            flex-direction: column;
            
            .el-input {
                width: 100%;
                margin-bottom: 10px;
            }
            
            .button-group {
                width: 100%;
                display: flex;
                justify-content: center;
                gap: 15px;
                
                .action-button {
                    width: 100px;
                    margin: 0;
                }
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
</style>

<style>
.import-result-dialog {
    max-width: 350px !important;
}
.import-result-dialog .el-message-box__content {
    padding: 15px 20px !important;
    text-align: center !important;
}
.import-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin: 0 auto;
}
.import-result-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #409EFF;
    text-align: center;
    width: 100%;
}
.import-result-stats {
    display: flex;
    justify-content: space-around;
    width: 100%;
    margin-bottom: 15px;
}
.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 10px;
    flex: 1;
}
.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
    text-align: center;
}
.stat-label {
    font-size: 14px;
    color: #606266;
    margin-top: 5px;
    text-align: center;
}
.import-result-reasons {
    width: 100%;
    margin-top: 10px;
    border-top: 1px solid #EBEEF5;
    padding-top: 10px;
    text-align: center;
}
.reasons-title {
    font-weight: bold;
    margin-bottom: 10px;
    text-align: center;
    width: 100%;
}
.reasons-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
    width: 100%;
    text-align: center;
}
.reason-item {
    padding: 5px 0;
    text-align: center;
    color: #606266;
    width: 100%;
}
.reason-more {
    padding: 5px 0;
    text-align: center;
    color: #909399;
    font-style: italic;
    width: 100%;
}

/* 修复Element Plus对话框的样式 */
.import-result-dialog .el-message-box__message {
    text-align: center !important;
    width: 100% !important;
}
.import-result-dialog .el-message-box__message p {
    text-align: center !important;
}

/* 导入指南对话框样式 */
.import-guide-dialog {
    min-width: 500px !important;
}

.import-guide-dialog .el-message-box__header {
    text-align: center;
    padding-bottom: 0;
}

.import-guide-dialog .el-message-box__title {
    font-size: 18px;
    font-weight: bold;
    color: #303133;
}

.import-guide-dialog .el-message-box__status {
    position: absolute;
    top: 20px;
    left: 20px;
}

.import-guide-dialog .el-message-box__message {
    padding-left: 40px;
}

.import-guide {

    width: 375px;
    padding: 10px;
}

.guide-title {
    font-size: 16px;
    font-weight: bold;
    color: #409EFF;
    text-align: center;
    margin-bottom: 15px;
}

.guide-content {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 15px;
}

.guide-item {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
}

.item-label {
    color: #606266;
    margin-right: 10px;
    min-width: 60px;
}

.item-value {
    color: #303133;
    font-weight: 500;
}

.guide-note {
    color: #909399;
    font-size: 13px;
    margin: 15px 0;
    text-align: center;
}

.guide-example {

    margin-top: 20px;
    border-top: 1px solid #dcdfe6;
    padding-top: 15px;
}

.example-title {
    color: #606266;
    margin-bottom: 10px;
    text-align: center;
}

.example-content {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 10px;
    text-align: center;
}

.example-content div {
    background-color: #fff;
    padding: 5px;
    border-radius: 4px;
    border: 1px solid #dcdfe6;
}

.import-guide-dialog .el-message-box__btns {
    text-align: center;
    padding-top: 20px;
}

.import-guide-dialog .el-button {
    min-width: 100px;
}
</style>