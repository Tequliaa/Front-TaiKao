// 导入request.js请求工具
import request from '@/utils/request.js'

// 获取图形验证码
export const getCaptchaService = (token) => {
  const params = token ? { token } : {}
  return request.post('/captcha/generate', params)
}

// 验证图形验证码
export const verifyCaptchaService = (data) => {
  return request.post('/captcha/verify', data)
}
