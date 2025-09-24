<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage, ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useTokenStore } from '@/stores/token.js';

const props = defineProps({
  examId: {
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
const reportContainer = ref(null)
const processingStatus = ref('')
const hasError = ref(false)
const isTyping = ref(false)
const typingTimer = ref(null)

// 获取分析报告
const getAnalysisReport = async () => {
  try {
    loading.value = true
    analysisReport.value = ''
    processingStatus.value = '连接中...'
    hasError.value = false
    
    let tokenStore = useTokenStore()
    console.log('[调试] 开始请求分析报告，examId:', props.examId, 'departmentId:', props.departmentId)
    const response = await fetch(`/api/response/analysis?examId=${props.examId}&departmentId=${props.departmentId}`, {
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
    
    console.log('[调试] 成功建立SSE连接，状态码:', response.status)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    // 实时显示接收到的数据
    let fullText = ''
    let displayText = ''
    const typingSpeed = 20 // 打字速度(毫秒)

    // 打字机效果函数
    const typeEffect = () => {
      if (displayText.length < fullText.length) {
        displayText = fullText.substring(0, displayText.length + 1)
        analysisReport.value = displayText
        nextTick().then(scrollToBottom)
        
        // 继续下一个字符
        typingTimer.value = setTimeout(typeEffect, typingSpeed)
      } else {
        // 打字完成
        isTyping.value = false
        if (typingTimer.value) {
          clearTimeout(typingTimer.value)
          typingTimer.value = null
        }
      }
    }

    // 处理接收到的数据块
    const processChunk = (chunk) => {
      console.log(`[调试] 收到数据块，长度: ${chunk.length}字符`)
      buffer += chunk
      let lineEnd
      let currentEvent = null
      
      while ((lineEnd = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, lineEnd).trim()
        buffer = buffer.slice(lineEnd + 1)
        
        if (!line) continue
        
        try {
          // 处理SSE消息格式
          if (line.startsWith('event:')) {
            // 记录当前事件类型
            currentEvent = line.slice(6).trim()
            console.log('[调试] 收到事件类型:', currentEvent)
          } else if (line.startsWith('data:')) {
            const text = line.slice(5).trim()
            
            // 根据事件类型处理数据
            if (currentEvent === 'status') {
              // 处理状态信息
              console.log('[调试] 收到状态更新:', text)
              processingStatus.value = text
            } else if (currentEvent === 'error') {
              // 处理错误信息
              console.log('[调试] 收到错误信息:', text)
              hasError.value = true
              loading.value = false
              analysisReport.value = text
              return
            } else if (currentEvent === 'complete' && text === 'analysis_complete') {
              // 处理完成事件
              console.log('[调试] 分析完成事件收到')
              processingStatus.value = '分析完成'
              continue
            } else if (!currentEvent || currentEvent === 'analysis') {
              // 默认处理分析文本数据
              if (text && text !== '[DONE]' && text !== 'analysis_complete') {
                console.log(`[调试] 处理有效数据: "${text}"`)
                // 添加新数据到完整文本
                fullText += text
                console.log(`[调试] 累积文本长度: ${fullText.length}字符`)
                
                // 启动打字机效果
                if (!isTyping.value) {
                  isTyping.value = true
                  typeEffect()
                }
              }
            } else {
              console.log(`[调试] 未识别的事件数据组合，事件:`, currentEvent, '数据:', text)
            }
          } else {
            console.log(`[调试] 其他行: ${line}`)
          }
        } catch (e) {
          console.error('数据处理失败:', e)
        }
      }
    }

    // 实时读取并处理数据流
    while (true) {
      console.log('[调试] 等待下一个数据块...')
      const { done, value } = await reader.read()
      
      if (done) {
        console.log('[调试] 流式响应已完成')
        break
      }
      
      console.log(`[调试] 接收到原始数据，字节数: ${value?.length || 0}`)
      // 立即处理接收到的数据块
      processChunk(decoder.decode(value, { stream: true }))
    }

    // 处理剩余缓冲区数据
    if (buffer.trim()) {
      console.log(`[调试] 处理剩余缓冲区数据: "${buffer.trim()}"`)
      processChunk('')
    }

    // 流式响应完成后的处理
    const finalizeStreaming = () => {
      console.log('[调试] 流式响应完成，最终文本长度:', fullText.length)
      
      // 等待打字机效果完成
      const waitForTyping = () => {
        if (isTyping.value) {
          setTimeout(waitForTyping, 100)
        } else {
          loading.value = false
        }
      }
      
      // 如果打字机没有启动，直接完成
      if (!isTyping.value && fullText.length > 0) {
        analysisReport.value = fullText
        loading.value = false
      } else {
        waitForTyping()
      }
    }
    
    // 立即完成处理，不需要延迟
    finalizeStreaming()
    
  } catch (e) {
    console.error('读取流式数据失败:', e)
    ElMessage.error('获取AI分析报告失败')
    loading.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (reportContainer.value) {
    // 使用更积极的滚动策略
    requestAnimationFrame(() => {
      reportContainer.value.scrollTop = reportContainer.value.scrollHeight
      // 确保滚动到最底部
      setTimeout(() => {
        reportContainer.value.scrollTop = reportContainer.value.scrollHeight
      }, 10)
    })
  }
}

// 格式化报告内容
const formatReport = (content) => {
  if (!content) return ''
  
  // 首先规范化换行符
  let formatted = content.replace(/\r\n/g, '\n')
    
  // 处理标题行（以数字加.开头的行）
  formatted = formatted.replace(/^(\d+\.)\s+(.*)$/gm, '<h3>$1 $2</h3>')
  
  // 处理列表项（以-开头的行）
  formatted = formatted.replace(/^(\s*-)\s+(.*)$/gm, '<li>$2</li>')
  
  // 为段落添加段落标签（将连续的文本行包装在<p>标签中）
  const paragraphs = formatted.split(/\n{2,}/)
  const wrappedParagraphs = paragraphs.map(para => {
    // 检查是否已经是标题或列表项
    if (para.startsWith('<h3>') || para.includes('<li>')) {
      // 如果包含列表项，将其包装在<ul>标签中
      if (para.includes('<li>')) {
        return `<ul>${para}</ul>`
      }
      return para
    }
    return `<p>${para}</p>`
  })
  
  return wrappedParagraphs.join('\n')
}

// 组件挂载时获取分析报告
onMounted(() => {
  getAnalysisReport()
})

// 组件卸载时的清理工作
onBeforeUnmount(() => {
  // 清理打字机定时器
  if (typingTimer.value) {
    clearTimeout(typingTimer.value)
    typingTimer.value = null
  }
})
</script>

<template>
  <div class="ai-analysis-container">
    <div class="analysis-header">
      <h2>AI答卷分析报告</h2>
      <div class="analysis-loading" v-if="loading && !isTyping">
        <ElIcon :size="20"><Loading /></ElIcon>
        <span>{{ processingStatus || '正在生成分析报告...' }}</span>
      </div>
      <div class="analysis-loading" v-if="isTyping">
        <ElIcon :size="20"><Loading /></ElIcon>
        <span>AI正在生成分析内容...</span>
      </div>
    </div>
    
    <div class="analysis-content" ref="reportContainer">
      <div v-if="hasError" class="error-message">
        <ElIcon :size="24"><Error /></ElIcon>
        <p>{{ analysisReport }}</p>
      </div>
      <div v-else-if="!analysisReport && !loading" class="empty-report">
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
      line-height: 1.8;
      font-size: 15px;
      color: #303133;
      
      :deep(h3) {
        margin: 28px 0 16px 0;
        padding-left: 12px;
        border-left: 4px solid #409eff;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
      
      :deep(p) {
        margin: 16px 0;
        text-indent: 2em;
        line-height: 1.8;
        color: #606266;
      }
      
      :deep(ul) {
        padding-left: 2.5em;
        margin: 12px 0 12px 2em;
      }
      
      :deep(li) {
        margin: 10px 0;
        line-height: 1.8;
        position: relative;
        color: #606266;
      }
      
      :deep(li::marker) {
        color: #409eff;
        font-size: 1.2em;
      }
      
      /* 为列表项添加左侧边框装饰 */
      :deep(li)::before {
        content: '';
        position: absolute;
        left: -1.2em;
        top: 0.8em;
        width: 6px;
        height: 6px;
        background-color: #409eff;
        border-radius: 50%;
      }
      
      /* 特殊样式：问题结论部分 */
      :deep(p strong) {
        color: #303133;
        font-weight: 600;
      }
      
      /* 特殊样式：改进建议部分 */
      :deep(h3 + p, h3 + ul) {
        margin-top: 12px;
      }
      
      /* 综合结论和建议部分的特殊样式 */
      :deep(p:first-child) {
        margin-top: 0;
      }
      
      /* 响应式调整 */
      @media (max-width: 768px) {
        font-size: 14px;
        
        :deep(h3) {
          font-size: 16px;
        }
        
        :deep(ul) {
          padding-left: 1.5em;
          margin-left: 1em;
        }
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