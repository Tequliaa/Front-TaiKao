<script setup>
import {
    Pointer,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {  onMounted } from 'vue';
import { ref } from 'vue'
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

// 添加加载状态
const loading = ref(true)

// 修改获取答题列表的方法
const getResponseList = async () => {
    try {
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
    } catch (error) {
        ElMessage.error('获取答题列表失败')
    }
}

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        await Promise.all([
            getUserInf(),
            getResponseList()
        ])
    } finally {
        loading.value = false
    }
}

// 在组件挂载时初始化数据
onMounted(() => {
    initData()
})

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


// 添加查看答题情况的方法
const viewResponse = (row) => {
    router.push({
        name: 'SurveyView',
        params: {
            surveyId: props.surveyId,
            userId:row.userId,
            userName:row.userName
        }
    })
}

// 添加查看统计数据的方法
const OverallResponse = (departmentId,departmentName) => {
    router.push({
        name: 'SurveyStatistics',
        params: {
            surveyId: props.surveyId,
            departmentId: departmentId,
            departmentName: departmentName
        }
    })
}
import { getStatisticsService } from '@/api/response'
const unfinishedTotalRecords = ref(0)
const userSurveys = ref([])
// 获取统计数据
const getStatistics = async () => {
    loading.value = true
    try {
        const response = await getStatisticsService(props.surveyId,0)
        if (response.code === 0) {
            unfinishedTotalRecords.value = response.data.unfinishedTotalRecords
            userSurveys.value = response.data.userSurveys
        } else {
            ElMessage.error('获取统计数据失败')
        }
    } catch (error) {
        console.error('获取统计数据失败:', error)
        ElMessage.error('获取统计数据失败：' + error.message)
    } finally {
        loading.value = false
    }
}

getStatistics()

// 跳转到未完成列表
const goToUnfinishedList = () => {
    router.push({
        name: 'UnfinishedList',
        params: {
            surveyId: props.surveyId,
            departmentId: 0,
            surveyName: props.surveyName
        }
    })
}
</script>
<template>
    <LoadingWrapper :loading="loading">
        <el-card class="page-container">
            <template #header>
                <div class="header-container">
                    <h2 class="survey-title">{{ props.surveyName }}-答题情况（未完成人数：<span class="unfinished-count" @click="goToUnfinishedList">{{ unfinishedTotalRecords }}</span>）</h2>
                    <div class="header">
                        <el-button type="primary" size="large" @click="OverallResponse(0)">总体答题情况</el-button>
                        <template v-for="(userSurvey, index) in userSurveys" :key="index">
                            <h4 class="unfinished-count" @click="OverallResponse(userSurvey.departmentId,userSurvey.departmentName)">{{ userSurvey.departmentName }}</h4>
                        </template>
                    </div>
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
                        <el-tooltip content="查看答题情况" placement="top">
                            <el-button :icon="Pointer" circle plain type="primary" @click="viewResponse(row)"></el-button>
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
    </LoadingWrapper>
</template>
<style lang="scss" scoped>
.page-container {
    min-height: 100%;
    box-sizing: border-box;

    .header-container {
        text-align: center;
        margin-bottom: 16px;
        padding: 0 20px;

        .survey-title {
            font-size: 22px;
            color: #2c3e50;
            margin-bottom: 16px;
            font-weight: 600;

            .unfinished-count {
                color: #409EFF;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 500;
                position: relative;
                padding: 0 4px;

                &:hover {
                    color: #66b1ff;
                    text-decoration: underline;
                }
            }
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 8px;

            .unfinished-count {
                color: #409EFF;
                cursor: pointer;
                margin: 0;
                padding: 6px 12px;
                background-color: #ecf5ff;
                border-radius: 4px;
                transition: all 0.3s ease;
                font-size: 14px;
                font-weight: 500;
                position: relative;
                overflow: hidden;

                &:hover {
                    background-color: #409EFF;
                    color: #fff;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
                }

                &:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 3px rgba(64, 158, 255, 0.2);
                }
            }

            :deep(.el-button) {
                font-size: 14px;
                padding: 6px 12px;
                height: auto;
            }
        }
    }

    :deep(.el-card__header) {
        padding: 16px 0;
    }

    :deep(.el-table) {
        margin-top: 8px;
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