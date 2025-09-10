import { useUserInfoStore } from '@/stores/user.js'
import { checkUserPermissionService } from '@/api/permission.js'

/**
 * 权限验证工具类
 */
export class PermissionChecker {
  constructor() {
    this.userInfoStore = null
    this.permissionCache = new Map() // 权限缓存
    this.cacheExpiry = 5 * 60 * 1000 // 5分钟缓存过期时间
  }

  // 懒加载获取store
  getUserInfoStore() {
    if (!this.userInfoStore) {
      try {
        this.userInfoStore = useUserInfoStore()
      } catch (error) {
        console.warn('Pinia store 尚未初始化，权限检查将返回 false')
        return null
      }
    }
    return this.userInfoStore
  }

  /**
   * 检查用户是否有指定权限
   * @param {string} permissionCode - 权限代码
   * @param {boolean} useCache - 是否使用缓存，默认true
   * @returns {Promise<boolean>}
   */
  async hasPermission(permissionCode, useCache = true) {
    const userInfoStore = this.getUserInfoStore()
    if (!userInfoStore || !userInfoStore.info?.id) {
      return false
    }

    // 超级管理员拥有所有权限
    if (userInfoStore.info.roleName === '超级管理员') {
      return true
    }

    // 优先从userInfo中的permissionCodes直接检查权限
    if (userInfoStore.info?.permissionCodes && Array.isArray(userInfoStore.info.permissionCodes)) {
      return userInfoStore.info.permissionCodes.includes(permissionCode)
    }

    // 检查缓存
    if (useCache && this.permissionCache.has(permissionCode)) {
      const cached = this.permissionCache.get(permissionCode)
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.hasPermission
      }
    }

    try {
      const result = await checkUserPermissionService(
        userInfoStore.info.id, 
        permissionCode
      )
      const hasPermission = result.code === 200 && result.data === true
      
      // 缓存结果
      if (useCache) {
        this.permissionCache.set(permissionCode, {
          hasPermission,
          timestamp: Date.now()
        })
      }
      
      return hasPermission
    } catch (error) {
      console.error('权限检查失败:', error)
      return false
    }
  }

  /**
   * 检查用户是否有任一权限
   * @param {string[]} permissionCodes - 权限代码数组
   * @returns {Promise<boolean>}
   */
  async hasAnyPermission(permissionCodes) {
    if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
      return false
    }

    const userInfoStore = this.getUserInfoStore()
    // 如果用户是超级管理员，直接返回true
    if (userInfoStore && userInfoStore.info?.roleName === '超级管理员') {
      return true
    }

    // 优先从userInfo中的permissionCodes直接检查
    if (userInfoStore && userInfoStore.info?.permissionCodes && Array.isArray(userInfoStore.info.permissionCodes)) {
      return permissionCodes.some(code => userInfoStore.info.permissionCodes.includes(code))
    }

    // 回退到逐个检查
    for (const code of permissionCodes) {
      if (await this.hasPermission(code)) {
        return true
      }
    }
    return false
  }

  /**
   * 检查用户是否有所有权限
   * @param {string[]} permissionCodes - 权限代码数组
   * @returns {Promise<boolean>}
   */
  async hasAllPermissions(permissionCodes) {
    if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
      return true
    }

    const userInfoStore = this.getUserInfoStore()
    // 如果用户是超级管理员，直接返回true
    if (userInfoStore && userInfoStore.info?.roleName === '超级管理员') {
      return true
    }

    // 优先从userInfo中的permissionCodes直接检查
    if (userInfoStore && userInfoStore.info?.permissionCodes && Array.isArray(userInfoStore.info.permissionCodes)) {
      return permissionCodes.every(code => userInfoStore.info.permissionCodes.includes(code))
    }

    // 回退到逐个检查
    for (const code of permissionCodes) {
      if (!(await this.hasPermission(code))) {
        return false
      }
    }
    return true
  }

  /**
   * 清除权限缓存
   */
  clearCache() {
    this.permissionCache.clear()
  }

  /**
   * 获取用户角色
   * @returns {string}
   */
  getUserRole() {
    const userInfoStore = this.getUserInfoStore()
    return userInfoStore?.info?.role || ''
  }

  /**
   * 检查是否为超级管理员
   * @returns {boolean}
   */
  isSuperAdmin() {
    return this.getUserRole() === '超级管理员'
  }

  /**
   * 检查是否为管理员（超级管理员或普通管理员）
   * @returns {boolean}
   */
  isAdmin() {
    const role = this.getUserRole()
    return role === '超级管理员' || role === '普通管理员'
  }
}

// 权限代码常量
export const PERMISSIONS = {
  // 问卷管理权限
  SURVEY_VIEW: 'survey:view',           // 查看问卷
  SURVEY_CREATE: 'survey:create',       // 创建问卷
  SURVEY_EDIT: 'survey:edit',           // 编辑问卷
  SURVEY_DELETE: 'survey:delete',       // 删除问卷
  SURVEY_PUBLISH: 'survey:publish',     // 发布问卷
  SURVEY_STATISTICS: 'survey:statistics', // 查看问卷统计

  // 用户管理权限
  USER_VIEW: 'user:view',               // 查看用户
  USER_CREATE: 'user:create',           // 创建用户
  USER_EDIT: 'user:edit',               // 编辑用户
  USER_DELETE: 'user:delete',           // 删除用户
  USER_IMPORT: 'user:import',           // 导入用户
  USER_EXPORT: 'user:export',           // 导出用户

  // 部门管理权限
  DEPARTMENT_VIEW: 'department:view',   // 查看部门
  DEPARTMENT_CREATE: 'department:create', // 创建部门
  DEPARTMENT_EDIT: 'department:edit',   // 编辑部门
  DEPARTMENT_DELETE: 'department:delete', // 删除部门

  // 角色管理权限
  ROLE_VIEW: 'role:view',               // 查看角色
  ROLE_CREATE: 'role:create',           // 创建角色
  ROLE_EDIT: 'role:edit',               // 编辑角色
  ROLE_DELETE: 'role:delete',           // 删除角色
  ROLE_ASSIGN: 'role:assign',           // 分配角色

  // 权限管理权限
  PERMISSION_VIEW: 'permission:view',   // 查看权限
  PERMISSION_MANAGE: 'permission:manage', // 管理权限

  // 分类管理权限
  CATEGORY_VIEW: 'category:view',       // 查看分类
  CATEGORY_CREATE: 'category:create',   // 创建分类
  CATEGORY_EDIT: 'category:edit',       // 编辑分类
  CATEGORY_DELETE: 'category:delete',   // 删除分类

  // 问题管理权限
  QUESTION_VIEW: 'question:view',       // 查看问题
  QUESTION_CREATE: 'question:create',   // 创建问题
  QUESTION_EDIT: 'question:edit',       // 编辑问题
  QUESTION_DELETE: 'question:delete',   // 删除问题

  // 选项管理权限
  OPTION_VIEW: 'option:view',           // 查看选项
  OPTION_CREATE: 'option:create',       // 创建选项
  OPTION_EDIT: 'option:edit',           // 编辑选项
  OPTION_DELETE: 'option:delete',       // 删除选项

  // 响应管理权限
  RESPONSE_VIEW: 'response:view',       // 查看响应
  RESPONSE_EXPORT: 'response:export',   // 导出响应
  RESPONSE_DELETE: 'response:delete',   // 删除响应

  // 个人中心权限
  PROFILE_VIEW: 'profile:view',         // 查看个人资料
  PROFILE_EDIT: 'profile:edit',         // 编辑个人资料
  PASSWORD_CHANGE: 'password:change',   // 修改密码
}

// 懒加载创建权限检查器实例
let permissionCheckerInstance = null

function getPermissionChecker() {
  if (!permissionCheckerInstance) {
    permissionCheckerInstance = new PermissionChecker()
  }
  return permissionCheckerInstance
}

// Vue 3 组合式API权限检查Hook
export function usePermission() {
  const checker = getPermissionChecker()
  return {
    hasPermission: checker.hasPermission.bind(checker),
    hasAnyPermission: checker.hasAnyPermission.bind(checker),
    hasAllPermissions: checker.hasAllPermissions.bind(checker),
    getUserRole: checker.getUserRole.bind(checker),
    isSuperAdmin: checker.isSuperAdmin.bind(checker),
    isAdmin: checker.isAdmin.bind(checker),
    clearCache: checker.clearCache.bind(checker),
    PERMISSIONS
  }
}

// 导出权限检查器实例（用于指令等）
export const permissionChecker = {
  get hasPermission() { return getPermissionChecker().hasPermission.bind(getPermissionChecker()) },
  get hasAnyPermission() { return getPermissionChecker().hasAnyPermission.bind(getPermissionChecker()) },
  get hasAllPermissions() { return getPermissionChecker().hasAllPermissions.bind(getPermissionChecker()) },
  get getUserRole() { return getPermissionChecker().getUserRole.bind(getPermissionChecker()) },
  get isSuperAdmin() { return getPermissionChecker().isSuperAdmin.bind(getPermissionChecker()) },
  get isAdmin() { return getPermissionChecker().isAdmin.bind(getPermissionChecker()) },
  get clearCache() { return getPermissionChecker().clearCache.bind(getPermissionChecker()) }
}
