//导入request.js请求工具
import request from '@/utils/request.js'


//部门列表查询
export const allDepartmentService = (userId) => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/student/department?action=getAll&userId='+userId)
}

//部门列表查询
export const departmentListService = (params) => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/student/department?action=list',{params})
}


//添加部门
export const departmentAddService = (departmentModel)=>{
 /*  var params = new URLSearchParams()
  for (let key in studentModel) {
    params.append(key, studentModel[key])
  } */
  return request.put('/student/department',departmentModel)
}

//删除部门
export const departmentDelService = (id)=>{
  return request.post('/student/department?action=delete&departmentId='+id)
}

//更新部门
export const departmentUpdateService = (departmentModel)=>{
   var params = new URLSearchParams()
   for (let key in departmentModel) {
     params.append(key, departmentModel[key])
   }
   return request.post('/student/department?action=update',params)
 }