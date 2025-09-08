//导入request.js请求工具
import request from '@/utils/request.js'

// 权限管理相关接口
// 获取权限列表
export const permissionListService = (params) => {
  return request.get('/permission/list', { params })
}

// 获取所有权限
export const getAllPermissionsService = () => {
  return request.get('/permission/getAll')
}

// 添加权限
export const permissionAddService = (permission) => {
  return request.post('/permission/add', permission)
}

// 更新权限
export const permissionUpdateService = (permission) => {
  return request.put('/permission/update', permission)
}

// 删除权限
export const permissionDeleteService = (id) => {
  return request.delete('/permission/delete', { params: { id } })
}

// 根据角色ID获取权限
export const getPermissionsByRoleIdService = (roleId) => {
  return request.get('/permission/getPermissionsByRoleId', { params: { roleId } })
}

// 根据角色ID获取权限码
export const getPermissionCodesByRoleIdService = (roleId) => {
  return request.get('/permission/getPermissionCodesByRoleId', { params: { roleId } })
}

// 角色权限管理相关接口
// 分配角色权限
export const assignRolePermissionsService = (roleId, permissionIds) => {
  return request.post('/rolePermission/assign', { roleId, permissionIds })
}

// 获取用户权限
export const getUserPermissionsService = (userId) => {
  return request.get('/user/permissions', { params: { userId } })
}

// 检查用户是否有特定权限
export const checkUserPermissionService = (userId, permissionCode) => {
  return request.get('/user/checkPermission', { params: { userId, permissionCode } })
}