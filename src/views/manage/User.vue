<script setup>
import {
    Edit,
    Delete,
    Pointer
} from '@element-plus/icons-vue'
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userListService, userUpdateService, userDeleteService } from '@/api/user.js'
import { allDepartmentService } from '@/api/department.js'
//导入接口函数
import { userInfoGetService } from '@/api/user.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'
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
const getUsers = async () => {
    let params = {
        keyword: keyword.value,
        pageNum: pageNum.value,
        pageSize: pageSize.value
    }
    let result = await userListService(params);
    //渲染总条数
    total.value = result.data.totalCount
    //渲染列表数据
    users.value = result.data.users
}
getUsers()


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

//获取用户基本信息
getUserInf()

const departments = ref({
})

const getAllDepartments = async () => {
    let result = await allDepartmentService(userInfoStore.info.id);
    departments.value = result.data;
}
getAllDepartments();

// 用户角色
const roles = [
  {
    value: '普通用户',
    label: '普通用户',
  },
  {
    value: '普通管理员',
    label: '普通管理员',
  },
  {
    value: '超级管理员',
    label: '超级管理员',
  }
]


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
    userModel.value.role = row.role
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
</script>
<template>
    <el-card class="page-container">
        <template #header>
            <div class="header">
                <span>用户管理</span>
                <div class="extra">
                    <el-input v-model="keyword" @input="handleInputChange" placeholder="请输入用户名查询" />
                </div>
                
            </div>
        </template>
        <el-table :data="users" style="width: 100%">
            <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"> </el-table-column>
            <el-table-column label="用户名称" style="text-align: center;" align="center" prop="name"> </el-table-column>
            <el-table-column label="角色" style="text-align: center;" align="center" prop="role"></el-table-column>
            <el-table-column label="所属部门" style="text-align: center;" align="center" prop="departmentName"></el-table-column>
            <el-table-column label="操作" style="text-align: center;" align="center" width="150">
                <template #default="{ row }">
                    <el-tooltip content="查看" placement="top">
                        <el-button :icon="Pointer" circle plain type="primary"></el-button>
                    </el-tooltip>
                    <el-tooltip content="编辑" placement="top">
                        <el-button :icon="Edit" circle plain type="primary" @click="updateUserEcho(row)"></el-button>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                        <el-button :icon="Delete" circle plain type="danger" @click="deleteUser(row)"></el-button>
                    </el-tooltip>          
                </template>
            </el-table-column>
            <template #empty>
                <el-empty description="没有数据" />
            </template>
        </el-table>
        <!-- 分页条 -->
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[3, 5, 10, 15]"
        layout="jumper, total, sizes, prev, pager, next" background :total="total" @size-change="onSizeChange"
        @current-change="onCurrentChange" style="margin-top: 20px; justify-content: flex-end" />
    </el-card>

    <!-- 修改用户弹窗 -->
    <el-dialog v-model="dialogVisible" :title="title" width="30%">
        <el-form :model="userModel" :rules="rules" label-width="100px" style="padding-right: 30px">
            <el-form-item label="用户名">
                <el-input placeholder="请输入用户名" v-model="userModel.name" minlength="5" maxlength="16"></el-input>
            </el-form-item>

            <el-form-item label="用户角色">
                <el-select v-model="userModel.role" clearable placeholder="请选择用户角色">
                    <el-option v-for="item in roles" :key="item.value" :label="item.value" :value="item.value"/>
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

</template>

<style lang="scss" scoped>
.page-container {
    min-height: 100%;
    box-sizing: border-box;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .el-input {
        width: 240px;  /* 输入框的宽度 */
    }
}
</style>