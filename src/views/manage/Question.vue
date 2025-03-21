<script setup>
import {
    Edit,
    Delete,
    Pointer
} from '@element-plus/icons-vue'

import { nextTick } from 'vue';
import { ref } from 'vue'
//问题列表查询
import { questionListService, questionAddService, questionDelService, questionUpdateService } from '@/api/question.js'
import { getAllCategoriesService } from '@/api/category.js'
import { getAllSurveysService } from '@/api/survey.js'
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
        "surveyId": "草稿",
        "surveyName": 1,
        "type":"单选",
        "isRequired": 1,
        "isOpen": 1,
        "isSkip": 1,
        "options":""
    }
])


//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(8)//每页条数
const keyword = ref('')
const getQuestions = async () => {
    let params = {
        surveyId:"",
        categoryId:"",
        keyword: keyword.value,
        pageNum: pageNum.value,
        pageSize: pageSize.value
    }
    let result = await questionListService(params);
    //渲染总条数
    total.value = result.data.totalCount
    //渲染列表数据
    questions.value = result.data.questions
}
getQuestions()
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
    surveyId: '',
    surveyName: '',
    type: '',
    isRequired: '',
    isOpen: '',
    options: ''
})

//打开添加问题窗口
const openAddDialog = () => {
    questionModel.value = {};
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
        value: '文件上传',
        label:'文件上传题'
    },
]

const allCategories = ref({
})

const getCategories = async () => {
    let result = await getAllCategoriesService();
    allCategories.value = result.data;
}
getCategories()

const allSurveys = ref({
})

const getAllSurveys = async () => {
    let result = await getAllSurveysService();
    allSurveys.value = result.data;
}
getAllSurveys()


import { debounce } from 'lodash';

const handleInputChange = debounce(() => {
    console.log("触发函数了")
    getQuestions()
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
                <span>问题管理</span>
                <div class="extra">
                    <el-input v-model="keyword"  @input="handleInputChange" placeholder="请输入问题名称或描述" />
                    <el-button type="primary" @click="openAddDialog()">添加问题</el-button>
                </div>
            </div>
        </template>

        <!-- 问题列表 -->
        <el-table :data="questions" style="width: 100%">
            <!-- <el-table-column label="序号" prop="questionId"></el-table-column> -->
            <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
            <el-table-column label="问题描述" style="text-align: center;" align="center" prop="description"></el-table-column>
            <el-table-column label="问题类型" style="text-align: center;" align="center" prop="type"> </el-table-column>
            <el-table-column label="所属分类" style="text-align: center;" align="center" prop="categoryName"></el-table-column>
            <el-table-column label="所属问题" style="text-align: center;" align="center" prop="surveyName"></el-table-column>

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
                        <el-button :icon="Pointer" circle plain type="primary"></el-button>
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
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[3, 5, 10, 15]"
            layout="jumper, total, sizes, prev, pager, next" background :total="total" @size-change="onSizeChange"
            @current-change="onCurrentChange" style="margin-top: 20px; justify-content: flex-end" />
    </el-card>


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

            <el-form-item label="所属问卷">
                <el-select v-model="questionModel.surveyId" clearable placeholder="所属问卷">
                    <el-option v-for="item in allSurveys" :key="item.surveyId" :label="item.name" :value="item.surveyId"/>
                </el-select>
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
    }
    .extra {
        display: flex;
        align-items: center;  /* 确保垂直居中对齐 */
        gap: 10px;  /* 在所有子元素之间添加 10px 的间隔 */
    }

    .el-input {
        width: 240px;  /* 输入框的宽度 */
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