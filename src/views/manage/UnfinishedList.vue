<script setup>
import { ref, onMounted } from 'vue'
import { unfinishedListService, exportUnfinishedListService } from '@/api/userSurvey'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import axios from 'axios'

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
    },
    departmentName: {
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

// 导出未完成列表
const exportUnfinishedList = async () => {
    try {
        const response = await exportUnfinishedListService(props.surveyId, props.departmentId)

        // 获取文件名
        const contentDisposition = response.headers['content-disposition']
        let fileName = `${props.surveyName}-未完成名单-${new Date().toLocaleDateString()}.xlsx`
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
                        <h2>{{ props.surveyName }}问卷</h2>
                        <div class="info-row">
                            <div class="total-count">未完成人数：{{ totalCount }}</div>
                            <el-button 
                                type="primary" 
                                :icon="Download" 
                                @click="exportUnfinishedList"
                                class="export-btn">
                                导出
                            </el-button>
                        </div>
                    </div>

                    <!-- 用户列表 -->
                    <el-table 
                        :data="userSurveys" 
                        style="width: 100%"
                        border>
                        <el-table-column 
                            prop="username" 
                            label="用户名称" 
                            min-width="100"
                            align="center"
                            header-align="center">
                        </el-table-column>
                        <el-table-column 
                            prop="departmentName" 
                            label="所属部门"
                            min-width="100"
                            align="center"
                            header-align="center">
                        </el-table-column>
                        <el-table-column 
                            prop="status" 
                            label="答题状态"
                            min-width="80"
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
    padding: 12px;
    background-color: #f5f7fa;
    min-height: 100vh;

    .list-container {
        max-width: 1200px;
        margin: 0 auto;
        background-color: #fff;
        padding: 12px;
        border-radius: 6px;
        box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.3s ease;

        &:hover {
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .list-header {
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ebeef5;
            display: flex;
            flex-direction: column;
            align-items: center;

            h2 {
                margin: 0 0 8px 0;
                color: #2c3e50;
                font-size: 18px;
                font-weight: 600;
                letter-spacing: 0.5px;
                text-align: center;
                word-break: break-word;
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                width: 100%;
                position: relative;

                .total-count {
                    font-size: 16px;
                    color: #606266;
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .export-btn {
                    font-size: 13px;
                    padding: 3px 10px;
                    margin-left: auto;
                }
            }
        }

        :deep(.el-table) {
            border-radius: 6px;
            overflow: hidden;
            width: 100%;
            
            th {
                background-color: #f5f7fa !important;
                color: #2c3e50;
                font-weight: 600;
                padding: 6px 0;
                font-size: 13px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            td {
                padding: 6px 0;
                font-size: 13px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .el-table__row {
                transition: all 0.3s ease;

                &:hover {
                    background-color: #f5f7fa;
                }
            }
        }
    }
    
    /* 移动端响应式样式 */
    @media (max-width: 768px) {
        padding: 8px;
        
        .list-container {
            padding: 8px;
            
            .list-header {
                margin-bottom: 8px;
                padding-bottom: 6px;
                
                h2 {
                    font-size: 16px;
                    margin-bottom: 6px;
                }
                
                .info-row {
                    .total-count {
                        font-size: 14px;
                        margin-right: 8px;
                    }
                    
                    .export-btn {
                        padding: 2px 8px;
                        font-size: 12px;
                    }
                }
            }
            
            :deep(.el-table) {
                th, td {
                    padding: 4px 0;
                    font-size: 12px;
                }
                
                .el-table__column-resize-proxy {
                    display: none;
                }
                
                .el-table__header-wrapper,
                .el-table__body-wrapper {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
            }
        }
    }
}
</style>
