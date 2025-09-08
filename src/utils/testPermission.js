// 权限系统测试文件
import { usePermission, PERMISSIONS } from './permission.js'

// 测试权限系统是否正常工作
export function testPermissionSystem() {
  console.log('🔐 开始测试权限系统...')
  
  try {
    const { hasPermission, getUserRole, isSuperAdmin, isAdmin } = usePermission()
    
    console.log('✅ 权限系统初始化成功')
    console.log('👤 用户角色:', getUserRole())
    console.log('🔑 是否超级管理员:', isSuperAdmin())
    console.log('👨‍💼 是否管理员:', isAdmin())
    
    // 测试权限常量
    console.log('📋 权限常量数量:', Object.keys(PERMISSIONS).length)
    console.log('📋 权限常量示例:', {
      SURVEY_VIEW: PERMISSIONS.SURVEY_VIEW,
      USER_CREATE: PERMISSIONS.USER_CREATE,
      ROLE_ASSIGN: PERMISSIONS.ROLE_ASSIGN
    })
    
    return true
  } catch (error) {
    console.error('❌ 权限系统测试失败:', error)
    return false
  }
}

// 在开发环境下自动运行测试
if (import.meta.env.DEV) {
  // 延迟执行，确保Pinia已经初始化
  setTimeout(() => {
    const success = testPermissionSystem()
    if (success) {
      console.log('🎉 权限系统测试完成！')
    }
  }, 2000)
}
