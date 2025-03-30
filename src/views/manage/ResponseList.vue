<script setup>
import {
    Edit,
    Delete,
    Pointer,
    View,
    Connection
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { nextTick } from 'vue';
import { ref,reactive } from 'vue'
//问卷列表查询
import { getResponseListService } from '@/api/response.js'
//导入接口函数
import { userInfoGetService } from '@/api/user.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'

//富文本编辑器
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

import { ElMessage, ElMessageBox } from 'element-plus'
// import { name } from 'element-plus/dist/locale/zh-cn'
import { useRouter } from 'vue-router'

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
const responses = ref([
    {
        "responseId":1,
        "surveyId":1,
        "questionId":1,
        "optionId":1,
        "rowId":1,
        "columnId":1,
        "userId": 1,
        "userName": "用户名",
        "ipAddress": "ip地址",
        "responseData": "填空内容",
        "createdAt": "创建时间",
        "totalQuestions":1,
        "isValid": 1,
        "status": "张三",
        "filePath": "文件路径",
    }
])

const props =defineProps({
    surveyId:{
        type:Number
    },
    surveyName:{
        type:String
    }
})

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(8)//每页条数
const getResponseList = async () => {
    let params = {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        surveyId: props.surveyId
    }
    let result = await getResponseListService(params);
    //渲染总条数
    total.value = result.data.totalCount
    //渲染列表数据
    responses.value = result.data.responses
}
getResponseList()
console.log("123")
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getResponseListService();
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getResponseListService()
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

const openQuestions = (row) => {
    router.push({
        name: 'Question',
        params: {
            surveyId: row.surveyId,
            surveyName: row.name
        }
    })
}


</script>
<template>
    <el-card class="page-container">
        <template #header>
            <div class="header">
                <span>{{ props.surveyName }}-答题情况</span>
            </div>
        </template>

        <!-- 问卷列表 -->
        <el-table :data="responses" style="width: 100%">
            <!-- <el-table-column label="序号" prop="surveyId"></el-table-column> -->
            <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
            <el-table-column label="用户名称" style="text-align: center;" align="center" prop="userName"></el-table-column>
            <el-table-column label="答题总数" style="text-align: center;" align="center" prop="totalQuestions"></el-table-column>
            <el-table-column label="最后答题时间" style="text-align: center;" align="center" prop="createdAt"
            :formatter="(row, col, val) => dayjs(val).format('YYYY-MM-DD HH:mm')"> </el-table-column>
            <el-table-column label="答题状态" style="text-align: center;" align="center" prop="status"></el-table-column>
            <el-table-column label="答题IP地址" style="text-align: center;" align="center" prop="ipAddress"></el-table-column>
            <el-table-column label="操作" style="text-align: center;" align="center" width="250">
                <template #default="{ row }">
                    <el-tooltip content="预览" placement="top">
                        <el-button :icon="View" circle plain type="primary" @click="openPreview(row)"></el-button>
                    </el-tooltip>
                    <el-tooltip content="查看" placement="top">
                        <el-button :icon="Connection" circle plain type="primary" @click="openQuestions(row)"></el-button>
                    </el-tooltip>
                    <el-tooltip content="发布" placement="top">
                        <el-button :icon="Pointer" circle plain type="primary" @click="assignSurveyEcho(row)"></el-button>
                    </el-tooltip>
                    <el-tooltip content="编辑" placement="top">
                        <el-button :icon="Edit" circle plain type="primary" @click="editSurveyEcho(row)"></el-button>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                        <el-button :icon="Delete" circle plain type="danger" @click="delsurvey(row)"></el-button>
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