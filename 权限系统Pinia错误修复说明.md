# 权限系统Pinia错误修复说明

## 问题描述

在实现RBAC权限系统时，遇到了以下错误：

```
pinia.js?v=2d416f66:1370 Uncaught Error: [🍍]: "getActivePinia()" was called but there was no active Pinia. Are you trying to use a store before calling "app.use(pinia)"?
```

## 问题原因

这个错误发生是因为在模块顶层创建 `PermissionChecker` 实例时，Pinia 还没有被初始化。具体来说：

1. `src/utils/permission.js` 在模块加载时就创建了 `PermissionChecker` 实例
2. 在 `PermissionChecker` 构造函数中调用了 `useUserInfoStore()`
3. 但此时 `app.use(pinia)` 还没有执行，所以 Pinia 还没有激活

## 解决方案

### 1. 懒加载Store

将Store的获取改为懒加载方式：

```javascript
export class PermissionChecker {
  constructor() {
    this.userInfoStore = null  // 不再在构造函数中直接获取
    this.permissionCache = new Map()
    this.cacheExpiry = 5 * 60 * 1000
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
}
```

### 2. 延迟实例化

使用懒加载模式创建权限检查器实例：

```javascript
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
    // ... 其他方法
  }
}
```

### 3. 安全的状态检查

在所有使用Store的地方添加安全检查：

```javascript
async hasPermission(permissionCode, useCache = true) {
  const userInfoStore = this.getUserInfoStore()
  if (!userInfoStore || !userInfoStore.info?.id) {
    return false
  }
  // ... 权限检查逻辑
}
```

## 修复后的特性

1. **延迟初始化**: Store只在需要时才初始化
2. **错误容错**: 如果Store未初始化，返回安全的默认值
3. **性能优化**: 避免重复创建实例
4. **开发友好**: 提供清晰的警告信息

## 测试验证

系统包含了自动测试功能，在开发环境下会：

1. 延迟2秒后运行权限系统测试
2. 检查权限系统是否正常初始化
3. 验证用户角色和权限检查功能
4. 在控制台输出测试结果

## 使用建议

1. **在组件中使用**: 推荐使用 `usePermission()` Hook
2. **在指令中使用**: 使用导出的 `permissionChecker` 对象
3. **在工具函数中使用**: 直接使用 `usePermission()` 或创建新的实例

## 注意事项

1. 确保在Vue组件外部使用权限检查时，Pinia已经初始化
2. 如果需要在应用启动时检查权限，建议在 `onMounted` 生命周期中进行
3. 权限检查是异步的，需要使用 `await` 或 `.then()` 处理结果

## 相关文件

- `src/utils/permission.js` - 权限工具类（已修复）
- `src/directives/permission.js` - 权限指令（无需修改）
- `src/main.js` - 应用入口（包含测试代码）
- `src/utils/testPermission.js` - 测试文件（新增）

修复完成后，权限系统应该能够正常工作，不再出现Pinia初始化错误。
