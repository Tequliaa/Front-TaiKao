import { permissionChecker } from '@/utils/permission.js'

/**
 * 权限指令
 * 用法：
 * v-permission="'survey:create'"
 * v-permission=["survey:create", "survey:edit"]
 * v-permission:any=["survey:create", "survey:edit"] // 任一权限
 * v-permission:all=["survey:create", "survey:edit"] // 所有权限
 */
export const permission = {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  }
}

/**
 * 检查权限并控制元素显示
 */
async function checkPermission(el, binding) {
  const { value, arg } = binding
  
  if (!value) {
    return
  }

  let hasPermission = false

  if (Array.isArray(value)) {
    // 数组形式：检查多个权限
    if (arg === 'any') {
      hasPermission = await permissionChecker.hasAnyPermission(value)
    } else if (arg === 'all') {
      hasPermission = await permissionChecker.hasAllPermissions(value)
    } else {
      // 默认检查所有权限
      hasPermission = await permissionChecker.hasAllPermissions(value)
    }
  } else {
    // 字符串形式：检查单个权限
    hasPermission = await permissionChecker.hasPermission(value)
  }

  if (!hasPermission) {
    el.style.display = 'none'
    // 或者完全移除元素
    // el.remove()
  } else {
    el.style.display = ''
  }
}

/**
 * 角色指令
 * 用法：
 * v-role="'超级管理员'"
 * v-role=["超级管理员", "普通管理员"]
 */
export const role = {
  mounted(el, binding) {
    checkRole(el, binding)
  },
  updated(el, binding) {
    checkRole(el, binding)
  }
}

/**
 * 检查角色并控制元素显示
 */
function checkRole(el, binding) {
  const { value } = binding
  const userRole = permissionChecker.getUserRole()
  
  if (!value) {
    return
  }

  let hasRole = false

  if (Array.isArray(value)) {
    hasRole = value.includes(userRole)
  } else {
    hasRole = userRole === value
  }

  if (!hasRole) {
    el.style.display = 'none'
  } else {
    el.style.display = ''
  }
}
