<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useTokenStore } from '@/stores/token.js';

const props = defineProps({
  surveyId: {
    type: [String, Number],
    required: true
  },
  departmentId: {
    type: [String, Number],
    required: false
  }
})

const analysisReport = ref('')
const loading = ref(false)
const isTyping = ref(false)
const typingInterval = ref(null)
const reportContainer = ref(null)

// 获取分析报告
const getAnalysisReport = async () => {
  try {
    loading.value = true
    isTyping.value = false
    analysisReport.value = ''
    
    let tokenStore = useTokenStore()
    const response = await fetch(`/api/response/analysis?surveyId=${props.surveyId}&departmentId=${props.departmentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Authorization': tokenStore.token
      }
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    if (!response.body) throw new Error('ReadableStream not supported')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullReport = ''
    let buffer = ''
    let index = 0
    const typingSpeed = 30 // 打字速度(毫秒)

    // 清除已有定时器
    if (typingInterval.value) {
      clearInterval(typingInterval.value)
      typingInterval.value = null
    }

    const processChunk = (chunk) => {
      buffer += chunk
      let lineEnd
      while ((lineEnd = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, lineEnd).trim()
        buffer = buffer.slice(lineEnd + 1)
        
        if (!line) continue
        
        try {
          if (line.startsWith('data:[')) {
            const dataArray = JSON.parse(line.slice(5))
            dataArray.forEach(item => {
              if (item.data) {
                // 处理event:message格式
                if (item.data.startsWith('event:message\ndata:')) {
                  const text = item.data.slice('event:message\ndata:'.length).trim()
                  if (text) {
                    fullReport += text.replace(/\n+/g, ' ').trim()
                  }
                } else if (item.data !== '\n\n') {  // 过滤掉空行
                  fullReport += item.data.replace(/\n+/g, ' ').trim()
                }
              }
            })
          } else if (line.startsWith('data:')) {
            const text = line.slice(5).trim()
            if (text) {
              fullReport += text.replace(/\n+/g, ' ').trim()
            }
          }
        } catch (e) {
          console.error('数据处理失败:', e)
        }
      }
    }

    // 启动打字机效果
    const startTyping = () => {
      isTyping.value = true
      typingInterval.value = setInterval(() => {
        if (index < fullReport.length) {
          analysisReport.value = fullReport.substring(0, index + 1)
          index++
          nextTick().then(scrollToBottom)
        } else {
          clearInterval(typingInterval.value)
          typingInterval.value = null
          isTyping.value = false
          loading.value = false
        }
      }, typingSpeed)
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      processChunk(decoder.decode(value, { stream: true }))
      
      // 首次收到数据时启动打字机
      if (!isTyping.value && fullReport.length > 0) {
        startTyping()
      }
    }

    // 处理剩余缓冲区数据
    if (buffer.trim()) {
      processChunk('')
    }

    // 确保最终内容完整显示
    if (fullReport.length > 0 && !isTyping.value) {
      analysisReport.value = fullReport
      loading.value = false
      scrollToBottom()
    }
  } catch (e) {
    console.error('读取流式数据失败:', e)
    ElMessage.error('获取AI分析报告失败')
    loading.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (reportContainer.value) {
    requestAnimationFrame(() => {
      reportContainer.value.scrollTop = reportContainer.value.scrollHeight
    })
  }
}

// 格式化报告内容
const formatReport = (content) => {
  if (!content) return ''
  return content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n/g, '<br>')
}

// 组件挂载时获取分析报告
onMounted(() => {
  getAnalysisReport()
})

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (typingInterval.value) {
    clearInterval(typingInterval.value)
  }
})
</script>

<template>
  <div class="ai-analysis-container">
    <div class="analysis-header">
      <h2>AI答卷分析报告</h2>
      <div class="analysis-loading" v-if="loading && !isTyping">
        <el-icon :size="20"><Loading /></el-icon>
        <span>正在生成分析报告...</span>
      </div>
      <div class="analysis-loading" v-if="isTyping">
        <el-icon :size="20"><Loading /></el-icon>
        <span>AI正在打字中...</span>
      </div>
    </div>
    
    <div class="analysis-content" ref="reportContainer">
      <div v-if="!analysisReport && !loading" class="empty-report">
        <p>暂无分析报告，请稍候再试。</p>
      </div>
      <div v-else class="report-text" v-html="formatReport(analysisReport)"></div>
    </div>
    
    <div class="analysis-footer">
      <el-button 
        type="primary" 
        :loading="loading"
        @click="getAnalysisReport"
        class="regenerate-button">
        重新生成报告
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import 'element-plus/dist/index.css';

.ai-analysis-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f0f2f5;
  
  .analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      font-size: 20px;
      color: #303133;
      margin: 0;
    }
    
    .analysis-loading {
      display: flex;
      align-items: center;
      color: #606266;
      font-size: 14px;
      
      span {
        margin-left: 8px;
      }
    }
  }
  
  .analysis-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: #ffffff;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    
    .empty-report {
      text-align: center;
      padding: 40px 20px;
      color: #909399;
    }
    
    .report-text {
      word-break: break-word;
      white-space: pre-wrap;
      line-height: 1.8;
      font-size: 15px;
      color: #303133;
      
      :deep(br) {
        content: "";
        display: block;
        margin: 8px 0;
      }
      
      :deep(p) {
        margin: 16px 0;
        text-indent: 2em;
      }
      
      :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
        margin: 24px 0 16px 0;
        color: #303133;
      }
      
      :deep(strong) {
        font-weight: 600;
        color: #303133;
      }
      
      :deep(ul), :deep(ol) {
        padding-left: 2em;
        margin: 16px 0;
      }
      
      :deep(li) {
        margin: 8px 0;
      }
      
      :deep(pre) {
        background: #f5f7fa;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        padding: 12px;
        margin: 16px 0;
        overflow-x: auto;
        font-size: 14px;
        line-height: 1.5;
      }
      
      :deep(code) {
        background: #f5f7fa;
        padding: 2px 4px;
        border-radius: 4px;
        font-family: 'Courier New', Courier, monospace;
        font-size: 14px;
      }
    }
  }
  
  .analysis-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  .regenerate-button {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 8px;
  }
}

// 自定义滚动条样式
.analysis-content {
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f4f6f8;
  }
}
</style>