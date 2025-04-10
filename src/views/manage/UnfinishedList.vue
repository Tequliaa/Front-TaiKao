<script setup>
import { ref, onMounted } from 'vue'
import { unfinishedListService } from '@/api/userSurvey'
import { ElMessage } from 'element-plus'

// 定义props
const props = defineProps({
    surveyId: {
        type: [String, Number],
        required: true
    },
    departmentId: {
        type: [String, Number],
        required: true
    },
    surveyName: {
        type: String,
        required: true
    }
})

// 数据列表
const userSurveys = ref([])
const totalCount = ref(0)
const loading = ref(true)

// 获取未完成列表
const getUnfinishedList = async () => {
    loading.value = true
    try {
        const response = await unfinishedListService(props.surveyId,props.departmentId)
        if (response.code === 0) {
            userSurveys.value = response.data.userSurveys
            totalCount.value = response.data.totalCount
        } else {
            ElMessage.error('获取未完成列表失败')
        }
    } catch (error) {
        console.error('获取未完成列表失败:', error)
        ElMessage.error('获取未完成列表失败：' + error.message)
    } finally {
        loading.value = false
    }
}

// 组件挂载时获取数据
onMounted(() => {
    getUnfinishedList()
})
</script>

<template>
    <div class="unfinished-list">
        <div class="list-container">
            <!-- 添加加载状态 -->
            <el-skeleton :loading="loading" animated :rows="10">
                <template #default>
                    <!-- 标题和总数 -->
                    <div class="list-header">
                        <h2>{{ props.surveyName }}问卷——未完成名单</h2>
                        <div class="total-count">总人数：{{ totalCount }}</div>
                    </div>

                    <!-- 用户列表 -->
                    <el-table 
                        :data="userSurveys" 
                        style="width: 100%"
                        border>
                        <el-table-column 
                            prop="username" 
                            label="用户名称" 
                            width="180"
                            align="center"
                            header-align="center">
                        </el-table-column>
                        <el-table-column 
                            prop="departmentName" 
                            label="所属部门"
                            align="center"
                            header-align="center">
                        </el-table-column>
                        <el-table-column 
                            prop="status" 
                            label="答题状态"
                            align="center"
                            header-align="center">
                        </el-table-column>
                    </el-table>
                </template>
            </el-skeleton>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.unfinished-list {
    padding: 24px;
    background-color: #f5f7fa;
    min-height: 100vh;

    .list-container {
        max-width: 1200px;
        margin: 0 auto;
        background-color: #fff;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;

        &:hover {
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        }

        .list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #ebeef5;

            h2 {
                margin: 0;
                color: #2c3e50;
                font-size: 22px;
                font-weight: 600;
                letter-spacing: 0.5px;
                flex: 1;
                text-align: center;
            }

            .total-count {
                color: #409EFF;
                font-size: 16px;
                font-weight: 500;
                padding: 8px 24px;
                background-color: #ecf5ff;
                border-radius: 6px;
                transition: all 0.3s ease;
                white-space: nowrap;

                &:hover {
                    background-color: #409EFF;
                    color: #fff;
                }
            }
        }

        :deep(.el-table) {
            border-radius: 8px;
            overflow: hidden;
            
            th {
                background-color: #f5f7fa !important;
                color: #2c3e50;
                font-weight: 600;
                padding: 12px 0;
            }

            td {
                padding: 12px 0;
            }

            .el-table__row {
                transition: all 0.3s ease;

                &:hover {
                    background-color: #f5f7fa;
                }
            }
        }
    }
}
</style>
