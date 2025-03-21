//导入request.js请求工具
import request from '@/utils/request.js'

//导入@/stores/token.js
import { useTokenStore } from '@/stores/token'


//注册
export const registerService = (registerData) => {
  //后台请求参数格式为x-www-form-urlencoded的统一使用URLSearchParams处理
  var params = new URLSearchParams()
  for (let key in registerData) {
    params.append(key, registerData[key])
  }
  return request.post('/student/user?action=addUser', params)
}

//登录
export const loginService = (loginData) => {
  var params = new URLSearchParams()
  for (let key in loginData) {
    params.append(key, loginData[key])
  }
  return request.post('/student/user?action=loginUser', params)
}

//用户列表查询
export const userListService = (params)=>{
  return request.get('/student/user?action=userList',{params})
}

//添加用户
export const userAddService = (userModel) => {
  var params = new URLSearchParams()
  for (let key in userModel) {
    params.append(key, userModel[key])
  }
  return request.post('/student/user?action=addUser', params)
}

//修改用户
export const userUpdateService = (userModel)=>{
  var params = new URLSearchParams()
  for (let key in userModel) {
    params.append(key, userModel[key])
  }
  return request.post('/student/user?action=updateUser', params)
}

//删除用户
export const userDeleteService = (id) => {
  return request.post('/student/user?action=deleteUser&id='+id)
}

//获取个人信息
export const userInfoGetService = ()=>{
  return request.get('/student/user?action=userInfo');
}

//修改个人密码
export const userPasswordUpdateService = (userInfo)=>{
  var params = new URLSearchParams()
  for (let key in userInfo) {
    params.append(key, userInfo[key])
  }
  return request.post('/student/user?action=updatePwd',params)
}