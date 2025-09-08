//导入request.js请求工具
import request from '@/utils/request.js'


//角色查询
export const roleListService = (params) => {
  console.log("到调用接口部分了")
  return request.get('/role/list',{params})
}

export const getAllRolesService = () => {
  console.log("到调用接口部分了")
  return request.get('/role/getAll')
}

//添加角色
export const roleAddService = (roleModel)=>{
  return request.post('/role/add', roleModel)
}

//删除角色
export const roleDelService = (id)=>{
  return request.delete('/role/delete?roleId='+id)
}

//更新角色
export const roleUpdateService = (roleModel)=>{
   return request.put('/role/update',roleModel)
 }

 // 向部门成员分配角色
export const assignRoleToDepartment = (departmentId,roleId) => {
  return request.post('/role/assignRoleToDepartment?departmentId='+departmentId+'&roleId='+roleId)
}