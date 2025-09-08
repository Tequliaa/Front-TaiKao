//导入request.js请求工具
import request from '@/utils/request.js'


//部门查询
export const departmentListService = (params) => {
  console.log("到调用接口部分了")
  return request.get('/department/list',{params})
}

export const getAllSurveysService = (userId) => {
  console.log("到调用接口部分了")
  return request.get('/department/getAllById?userId='+userId)
}

//添加部门
export const departmentAddService = (departmentModel, userId)=>{
  return request.post('/department/add?userId=' + userId, departmentModel)
}

//删除部门
export const departmentDelService = (id)=>{
  return request.delete('/department/delete?departmentId='+id)
}

//更新部门
export const departmentUpdateService = (departmentModel)=>{
   return request.put('/department/update',departmentModel)
 }