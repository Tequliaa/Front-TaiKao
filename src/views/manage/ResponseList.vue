<script setup>
import {
    Pointer,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {  onMounted, computed, nextTick } from 'vue';
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

            <!-- 桌面端表格视图 -->
            <el-table v-if="!isMobile" :data="responses" style="width: 100%">
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

            <!-- 移动端卡片视图 -->
            <div v-else class="mobile-cards">
                <el-card v-for="(row, index) in responses" :key="index" class="response-card">
                    <div class="card-header">
                        <span class="user-name">{{ row.userName }}</span>
                        <el-tag :type="row.status === '已完成' ? 'success' : 'warning'" size="small">
                            {{ row.status }}
                        </el-tag>
                    </div>
                    <div class="card-info">
                        <div class="info-item">
                            <span class="label">答题总数：</span>
                            <span class="value">{{ row.totalQuestions }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">最后答题：</span>
                            <span class="value">{{ dayjs(row.createdAt).format('YYYY-MM-DD HH:mm') }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">IP地址：</span>
                            <span class="value">{{ row.ipAddress }}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <el-button type="primary" size="small" @click="viewResponse(row)">
                            查看答题情况
                        </el-button>
                    </div>
                </el-card>
                <el-empty v-if="responses.length === 0" description="没有数据" />
            </div>

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

/* 移动端卡片样式 */
.mobile-cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 8px 0;

    .response-card {
        margin-bottom: 0;
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ebeef5;

            .user-name {
                font-size: 16px;
                font-weight: 500;
                color: #303133;
            }
        }

        .card-info {
            margin-bottom: 12px;

            .info-item {
                display: flex;
                margin-bottom: 8px;
                font-size: 14px;
                line-height: 1.4;

                &:last-child {
                    margin-bottom: 0;
                }

                .label {
                    color: #909399;
                    width: 70px;
                    flex-shrink: 0;
                }

                .value {
                    color: #303133;
                    flex: 1;
                }
            }
        }

        .card-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding-top: 8px;
            border-top: 1px solid #ebeef5;
        }
    }
}

/* 响应式调整 */
@media (max-width: 768px) {
    .page-container {
        .header-container {
            padding: 0 12px;

            .survey-title {
                font-size: 18px;
                margin-bottom: 12px;
            }

            .header {
                gap: 8px;
                margin-bottom: 4px;

                .unfinished-count {
                    padding: 4px 8px;
                    font-size: 13px;
                }
            }
        }
    }

    :deep(.el-card__body) {
        padding: 12px;
    }

    .mobile-cards {
        .response-card {
            .card-info {
                .info-item {
                    font-size: 13px;
                    
                    .label {
                        width: 65px;
                    }
                }
            }
        }
    }
}
</style>