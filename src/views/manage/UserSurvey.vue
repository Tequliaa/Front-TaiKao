<script setup>
import {
    Edit,
    Delete,
    Pointer,
    View
} from '@element-plus/icons-vue'
import { ref,reactive } from 'vue'
import dayjs from 'dayjs'
//问卷列表查询
import {userSurveyListService} from '@/api/userSurvey.js'
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

const props =defineProps({
    userId:{
        type:Number
    },
    username:{
        type:String
    }
})
//问卷数据模型
const userSurveys = ref([
    {
        "id": 1,
        "userId": "1",
        "surveyId": "张三",
        "departmentId": "1",
        "username": "张三",
        "departmentName": "部门1",
        "surveyName": "早餐调查问卷",
        "surveyDescription": "这是一份关于早餐的调查问卷。",
        "status": "已完成",
        "allowView": "1",
        "assignedAt": "2024-05-01 10:00:00",
        "completedAt": "2024-05-01 12:00:00"
    }
])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(8)//每页条数
const keyword = ref('')
const getUserSurveys = async () => {
    let params = {
        keyword: keyword.value,
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        userId:props.userId||userInfoStore.info.id,
        keyword: keyword.value
    }
    let result = await userSurveyListService(params);
    //渲染总条数
    total.value = result.data.totalCount
    //渲染列表数据
    userSurveys.value = result.data.userSurveys
}
getUserSurveys()
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getUserSurveys();
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getUserSurveys()
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
    getUserSurveys()
    }, 500);  // 延时 500ms


const getPlainText = (htmlContent)=> {
      // 使用正则去掉 HTML 标签，获取纯文本
      const div = document.createElement('div');
      div.innerHTML = htmlContent;
      return div.textContent || div.innerText || '';
}
import { useRouter } from 'vue-router'
const router = useRouter()
const fillOutSurvey = (row) => {
    router.push({
        name: 'SurveyWrite',
        params: {
            surveyId: row.surveyId
        }
    })
}

</script>
<template>
    <el-card class="page-container">
        <template #header>
            <div class="header">
                <span>{{ props.username || userInfoStore.info.name }}的问卷</span>
                <div class="extra">
                    <el-input v-model="keyword"  @input="handleInputChange" placeholder="请输入问卷名称或描述" />
                </div>
            </div>
        </template>

        <!-- 问卷列表 -->
        <el-table :data="userSurveys" style="width: 100%">
            <!-- <el-table-column label="序号" prop="surveyId"></el-table-column> -->
            <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
            <el-table-column label="问卷名称" style="text-align: center;" align="center" prop="surveyName"></el-table-column>
            <el-table-column label="问卷描述" style="text-align: center;" align="center">
            <template #default="scope">
                <!-- 通过 row.description 获取每行数据的问卷描述，并去掉 HTML 标签 -->
                <span>{{ getPlainText(scope.row.surveyDescription) }}</span>
            </template>
            </el-table-column>
            <el-table-column label="状态" style="text-align: center;" align="center" prop="status"></el-table-column>
            <el-table-column label="发布于" style="text-align: center;" align="center" prop="assignedAt"
            :formatter="(row, col, val) => dayjs(val).format('YYYY-MM-DD HH:mm')"></el-table-column>
            <!-- <el-table-column label="答后允许查看" style="text-align: center;" align="center" prop="allowView">
                <template #default="{ row }">{{ row.allowView === 1 ? '是' : '否' }}
                </template>
            </el-table-column> -->
            <el-table-column label="操作" style="text-align: center;" align="center" width="200">
                <template #default="{ row }">
                    <el-tooltip content="答题" placement="top">
                        <el-button :icon="View" circle plain type="primary" @click="fillOutSurvey(row)"></el-button>
                    </el-tooltip>
                    <el-tooltip content="查看答题情况" placement="top">
                        <el-button :icon="Pointer" circle plain type="primary" @click="assignSurveyEcho(row)"></el-button>
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