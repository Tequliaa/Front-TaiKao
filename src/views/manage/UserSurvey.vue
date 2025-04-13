<script setup>
import {
    Edit,
    Delete,
    Pointer,
    View
} from '@element-plus/icons-vue'
import {nextTick, ref,reactive, computed,onMounted } from 'vue'
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
import LoadingWrapper from '@/components/LoadingWrapper.vue'
// import { name } from 'element-plus/dist/locale/zh-cn'

const userInfoStore = useUserInfoStore();
const loading = ref(true)

//获取个人信息
const getUserInf = async () => {
    try {
        let result = await userInfoGetService();
        //存储pinia
        userInfoStore.info = result.data;
        return result.data;
    } catch (error) {
        ElMessage.error('获取用户信息失败')
        return null;
    }
}

//初始化数据
const initData = async () => {
    loading.value = true;
    try {
        // 获取用户信息
        const userInfo = await getUserInf();
        if (!userInfo) {
            throw new Error('获取用户信息失败');
        }
        
        // 获取问卷列表
        await getUserSurveys();
    } catch (error) {
        console.error('初始化数据失败:', error);
        ElMessage.error('加载数据失败');
    } finally {
        loading.value = false;
    }
}

//获取用户基本信息
// getUserInf()

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
    try {
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
    } catch (error) {
        ElMessage.error('获取问卷列表失败')
        throw error;
    }
}

//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getUserSurveys();
}

//当前页码发生了变化，调用此函数
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

// 添加查看答题情况的方法
const viewResponse = (row) => {
    router.push({
        name: 'SurveyView',
        params: {
            surveyId: row.surveyId,
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
onMounted(() => {
    initData();
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
                    <span>{{ props.username || userInfoStore.info.name }}的问卷</span>
                    <div class="extra">
                        <el-input v-model="keyword" @input="handleInputChange" placeholder="请输入问卷名称或描述" />
                    </div>
                </div>
            </template>

            <!-- 问卷列表 -->
            <el-table 
                v-loading="loading"
                :data="userSurveys" 
                style="width: 100%">
                <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
                <el-table-column label="问卷名称" style="text-align: center;" align="center" prop="surveyName"></el-table-column>
                <el-table-column label="问卷描述" style="text-align: center;" align="center">
                    <template #default="scope">
                        <el-tooltip 
                            :content="getPlainText(scope.row.surveyDescription)" 
                            placement="top" 
                            :show-after="500"
                            popper-class="description-tooltip">
                            <span class="description-text">{{ getPlainText(scope.row.surveyDescription) }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column label="状态" style="text-align: center;" align="center" prop="status"></el-table-column>
                <el-table-column label="发布于" style="text-align: center;" align="center" prop="assignedAt"
                    :formatter="(row, col, val) => dayjs(val).format('YYYY-MM-DD HH:mm')"></el-table-column>
                <el-table-column label="操作" style="text-align: center;" align="center" width="200">
                    <template #default="{ row }">
                        <!-- 未完成状态显示答题按钮 -->
                        <el-tooltip v-if="row.status !== '已完成'" content="答题" placement="top">
                            <el-button :icon="View" circle plain type="primary" @click="fillOutSurvey(row)"></el-button>
                        </el-tooltip>
                        <!-- 已完成状态显示查看按钮 -->
                        <el-tooltip :content="row.allowView === 1 ? '查看答题情况' : '暂无查看权限'" placement="top">
                            <el-button 
                                v-if="row.status === '已完成'" 
                                :icon="Pointer" 
                                circle 
                                plain 
                                :type="row.allowView === 1 ? 'primary' : 'info'"
                                :disabled="row.allowView !== 1"
                                @click="row.allowView === 1 && viewResponse(row)"
                            ></el-button>
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
                :total="total" 
                :pager-count="5"
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

.description-text {
    display: inline-block;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

@media (max-width: 768px) {
    .description-text {
        max-width: 120px;
    }
}

:deep(.description-tooltip) {
    max-width: 200px !important;
    
    @media (max-width: 768px) {
        max-width: 150px !important;
    }
}

</style>