<script setup>
import { ref, onMounted,nextTick,computed} from 'vue'
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
const total = ref(0)
const loading = ref(true)
const pageNum = ref(1)//当前页
const pageSize = ref(8)//每页条数
// 获取未完成列表
const getUnfinishedList = async () => {
    loading.value = true
    try {
        let params = {
            pageNum: pageNum.value,
            pageSize: pageSize.value,
            surveyId: props.surveyId,
            departmentId: props.departmentId
        }
        const response = await unfinishedListService(params)
        if (response.code === 200) {
            userSurveys.value = response.data.userSurveys
            total.value = response.data.total
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
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getUnfinishedList();
}

//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getUnfinishedList()
}

// 检测是否为移动设备
const isMobile = computed(() => {
    return window.innerWidth <= 768;
})
// 在组件挂载时初始化数据
onMounted(() => {
    window.addEventListener('resize', () => {
        // 强制更新组件
        nextTick(() => {
            // 这里不需要做任何事情，computed 属性会自动重新计算
        });
    });
})
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
    window.addEventListener('resize', () => {
        // 强制更新组件
        nextTick(() => {
            // 这里不需要做任何事情，computed 属性会自动重新计算
        });
    });
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
                            <div class="total-count">未完成人数：{{ total }}</div>
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
                </template>
            </el-skeleton>
        </div>
    </div>
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
    
    /* 按钮组样式 */
    .button-group {
        display: flex;
        gap: 10px;
        align-items: center;
        
        .action-button {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 80px;
            
            .el-icon {
                margin-right: 5px;
            }
        }
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
            flex-direction: column;
            
            .el-input {
                width: 100%;
                margin-bottom: 10px;
            }
            
            .button-group {
                width: 100%;
                display: flex;
                justify-content: center;
                gap: 15px;
                
                .action-button {
                    width: 100px;
                    margin: 0;
                }
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
