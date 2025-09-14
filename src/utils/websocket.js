import { ElMessage } from 'element-plus'

class WebSocketService {
  constructor() {
    this.ws = null
    this.url = null
    this.reconnectInterval = 5000 // 重连间隔时间（毫秒）
    this.reconnectAttempts = 0 // 重连尝试次数
    this.maxReconnectAttempts = 5 // 最大重连次数
    this.heartbeatInterval = null
    this.heartbeatTime = 30000 // 心跳间隔时间（毫秒）
    this.listeners = new Map() // 存储不同类型消息的回调函数
    this.isConnecting = false
    this.isClosed = false
  }

  // 初始化WebSocket连接
  connect(url) {
    if (this.isConnecting) return
    
    this.url = url
    this.isConnecting = true
    this.isClosed = false
    
    try {
      this.ws = new WebSocket(url)
      
      this.ws.onopen = () => {
        console.log('WebSocket连接成功')
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.emit('connect')
      }
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const { type, payload } = data
          
          // 处理心跳响应
          if (type === 'pong') {
            return
          }
          
          // 触发对应的消息类型回调
          if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(callback => {
              try {
                callback(payload)
              } catch (error) {
                console.error(`处理${type}类型消息时出错:`, error)
              }
            })
          }
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        this.isConnecting = false
        this.emit('error', error)
      }
      
      this.ws.onclose = (event) => {
        console.log('WebSocket连接关闭:', event.code, event.reason)
        this.isConnecting = false
        this.stopHeartbeat()
        this.emit('close', event)
        
        // 如果不是主动关闭，则尝试重连
        if (!this.isClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect()
        }
      }
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      this.isConnecting = false
      this.reconnect()
    }
  }

  // 发送消息
  send(type, payload = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload })
      this.ws.send(message)
      return true
    } else {
      console.warn('WebSocket未连接，无法发送消息')
      return false
    }
  }

  // 订阅消息
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type).push(callback)
    
    // 返回取消订阅的方法
    return () => {
      this.off(type, callback)
    }
  }

  // 取消订阅
  off(type, callback) {
    if (this.listeners.has(type)) {
      const callbacks = this.listeners.get(type)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
      
      // 如果没有回调了，删除该类型
      if (callbacks.length === 0) {
        this.listeners.delete(type)
      }
    }
  }

  // 触发事件
  emit(type, data) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`触发${type}事件时出错:`, error)
        }
      })
    }
  }

  // 开始心跳
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      this.send('ping')
    }, this.heartbeatTime)
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 重连
  reconnect() {
    this.reconnectAttempts++
    console.log(`尝试第${this.reconnectAttempts}次重连...`)
    
    setTimeout(() => {
      this.connect(this.url)
    }, this.reconnectInterval)
  }

  // 断开连接
  disconnect() {
    this.isClosed = true
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // 获取连接状态
  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// 创建单例实例
const wsService = new WebSocketService()

export default wsService