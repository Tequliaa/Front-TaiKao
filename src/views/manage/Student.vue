<script setup>
import {
    Edit,
    Delete
} from '@element-plus/icons-vue'


import { ref } from 'vue'

//学生列表查询
import { studentListService, studentAddService, studentDelService, studentUpdateService } from '@/api/student.js'

//富文本编辑器
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

import { ElMessage } from 'element-plus'
// import { name } from 'element-plus/dist/locale/zh-cn'


//学生数据模型
const students = ref([
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
const pageSize = ref(10)//每页条数

const getStudents = async () => {
    console.log("123")
    let params = {
        pageNum: pageNum.value,
        pageSize: pageSize.value
    }
    console.log("4")
    let result = await studentListService(params);
    console.log("456")
    //渲染列表数据
    // students.value = result.data
    //渲染总条数
    total.value = result.data.totalCount
    students.value = result.data.surveys
    // //渲染总条数
    // total.value = result.data.total
    console.log("789")
}
getStudents()
console.log("123")
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getStudents();
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getStudents()
}

//在Student.vue中标识是添加学生还是编辑学生
const addStudentFlag = ref(true);

//控制抽屉是否显示
const visibleDrawer = ref(false)
//添加表单数据模型
const studentModel = ref({
    surveyId: '',
    name: '',
    description:'',
    createdByName: '',
    status: '',
    allowview: '',
})
//打开添加学生窗口
const openAddDialog = () => {
    visibleDrawer.value = true;
    addStudentFlag.value = true;
    studentModel.value = {};
}

//添加学生
const addStudent = async () => {

    let result = await studentAddService(studentModel.value);
    ElMessage.success(result.message ? result.message : '添加成功')
    //再次调用getStudents,获取学生
    getStudents()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    studentModel.value = {};
}

//删除学生
const delStudent = async (id) => {
    let result = await studentDelService(id);
    ElMessage.success(result.message ? result.message : '删除成功')
    //再次调用getStudents,获取学生
    getStudents()
}

//修改学生回显
const editStudentEcho = (row) => {
    //操作改为编辑
    addStudentFlag.value = false;
    //显示抽屉
    visibleDrawer.value = true
    studentModel.value = row;

}

//修改学生
const editStudent = async () => {

    let result = await studentUpdateService(studentModel.value);
    ElMessage.success(result.message ? result.message : '修改成功')
    //再次调用getStudents,获取学生
    getStudents()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    studentModel.value = {};
}

</script>
<template>
    <el-card class="page-container">
        <template #header>
            <div class="header">
                <span>学生管理</span>
                <div class="extra">
                    <el-button type="primary" @click="openAddDialog()">添加学生</el-button>
                </div>
            </div>
        </template>

        <!-- 学生列表 -->
        <el-table :data="students" style="width: 100%">
            <!-- <el-table-column label="序号" prop="surveyId"></el-table-column> -->
            <el-table-column label="序号" style="text-align: center;" width="100" type="index"></el-table-column>
            <el-table-column label="问卷名称" style="text-align: center;" prop="name"></el-table-column>
            <el-table-column label="创建人" style="text-align: center;" prop="createdByName"> </el-table-column>
            <el-table-column label="状态" style="text-align: center;" prop="status"></el-table-column>
            <el-table-column label="答后查看" style="text-align: center;" prop="allowView"></el-table-column>
            <el-table-column label="操作" style="text-align: center;" width="100">
                <template #default="{ row }">
                    <el-button :icon="Edit" circle plain type="primary" @click="editStudentEcho(row)"></el-button>
                    <el-button :icon="Delete" circle plain type="danger" @click="delStudent(row.id)"></el-button>
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


    <!-- 抽屉 -->
    <el-drawer v-model="visibleDrawer" :title="addStudentFlag ? '添加学生' : '编辑学生'" direction="rtl" size="50%">
        <!-- 添加学生表单 -->
        <el-form :model="studentModel" label-width="100px">
            <el-form-item label="学号">
                <el-input v-model="studentModel.sno" placeholder="请输入学号"></el-input>
            </el-form-item>
            <el-form-item label="姓名">
                <el-input v-model="studentModel.sname" placeholder="请输入姓名"></el-input>
            </el-form-item>
            <el-form-item label="性别">
                <el-input v-model="studentModel.ssex" placeholder="请输入性别"></el-input>
            </el-form-item>
            <el-form-item label="出生日期">
                <el-date-picker v-model="studentModel.sbirthday" type="date" placeholder="请输入出生日期"
                    style="width: 100%" />
                <!-- <el-input v-model="studentModel.sbirthday" placeholder="请输入出生日期"></el-input> -->
            </el-form-item>
            <el-form-item label="电话">
                <el-input v-model="studentModel.stel" placeholder="请输入电话"></el-input>
            </el-form-item>
            <el-form-item label="E-mail">
                <el-input v-model="studentModel.semail" placeholder="请输入E-mail"></el-input>
            </el-form-item>
            <el-form-item label="专业">
                <el-input v-model="studentModel.smajor" placeholder="请输入专业"></el-input>
            </el-form-item>
            <el-form-item label="学校">
                <el-input v-model="studentModel.sschool" placeholder="请输入学校"></el-input>
            </el-form-item>
            <el-form-item label="籍贯">
                <el-input v-model="studentModel.sorigo" placeholder="请输入籍贯"></el-input>
            </el-form-item>
            <el-form-item label="简介">
                <div class="editor">
                    <quill-editor theme="snow" v-model:content="studentModel.summary" contentType="html">
                    </quill-editor>
                </div>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="addStudentFlag ? addStudent() : editStudent()">{{ addStudentFlag ?
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