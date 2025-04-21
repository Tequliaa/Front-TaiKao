//导入request.js请求工具
import request from '@/utils/request.js'

//导入@/stores/token.js
import { useTokenStore } from '@/stores/token'


//注册
export const registerService = (registerData) => {
  return request.post('/user/register', registerData)
}

//登录
export const loginService = (loginData) => {
  var params = new URLSearchParams()
  for (let key in loginData) {
    params.append(key, loginData[key])
  }
  return request.post('/user/login', params)
}

//用户列表查询
export const userListService = (params)=>{
  return request.get('/user/list',{params})
}


//修改用户
export const userUpdateService = (userModel)=>{
  return request.put('/user/update', userModel)
}

//删除用户
export const userDeleteService = (id) => {
  return request.delete('/user/delete?id='+id)
}

//获取个人信息
export const userInfoGetService = ()=>{
  return request.get('/user/info');
}

//修改个人密码
export const userPasswordUpdateService = (userInfo)=>{
  var params = new URLSearchParams()
  for (let key in userInfo) {
    params.append(key, userInfo[key])
  }
  return request.post('/user/updatePassword', params)
}

//导出用户列表
export const userExportService = (params) => {
  return request.get('/user/export', {
    params,
    responseType: 'blob'
  })
}

//导入用户列表
export const userImportService = (formData,departmentName) => {
  formData.append('departmentName',departmentName)
  return request.post('/user/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    transformRequest: [(data) => data] // 防止axios对FormData进行处理
  })
}