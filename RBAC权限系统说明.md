# RBAC权限系统说明

## 系统概述

本系统已成功从硬编码角色判断升级为完整的RBAC（基于角色的访问控制）权限系统。系统采用用户-角色-权限的三层模型，实现了细粒度的权限控制。

## 系统架构

### 1. 数据模型
- **用户（User）**: 系统中的用户实体
- **角色（Role）**: 用户角色的抽象，如超级管理员、普通管理员、普通用户
- **权限（Permission）**: 具体的操作权限，如survey:view、user:create等
- **用户角色关系（UserRole）**: 用户与角色的多对多关系
- **角色权限关系（RolePermission）**: 角色与权限的多对多关系

### 2. 权限代码规范
权限代码采用 `模块:操作` 的命名规范：
- `survey:view` - 查看问卷
- `survey:create` - 创建问卷
- `user:edit` - 编辑用户
- `role:assign` - 分配角色

## 核心功能

### 1. 权限验证工具 (`src/utils/permission.js`)
```javascript
import { usePermission, PERMISSIONS } from '@/utils/permission.js'

const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()

// 检查单个权限
const canViewSurvey = await hasPermission(PERMISSIONS.SURVEY_VIEW)

// 检查多个权限（任一）
const canManageSurvey = await hasAnyPermission([
    PERMISSIONS.SURVEY_VIEW,
    PERMISSIONS.SURVEY_CREATE,
    PERMISSIONS.SURVEY_EDIT
])

// 检查多个权限（全部）
const canFullManage = await hasAllPermissions([
    PERMISSIONS.SURVEY_VIEW,
    PERMISSIONS.SURVEY_CREATE
])
```

### 2. 权限指令
```vue
<!-- 单个权限 -->
<el-button v-permission="'survey:create'">创建问卷</el-button>

<!-- 多个权限（任一） -->
<el-button v-permission:any="['survey:create', 'survey:edit']">管理问卷</el-button>

<!-- 多个权限（全部） -->
<el-button v-permission:all="['survey:view', 'survey:create']">完整管理</el-button>

<!-- 角色指令 -->
<el-button v-role="'超级管理员'">管理员功能</el-button>
```

### 3. 权限管理界面
- **权限管理** (`/manage/permission`): 管理所有权限的增删改查
- **角色管理** (`/manage/role`): 管理角色，支持权限分配
- **用户管理** (`/manage/user`): 管理用户，支持角色分配

## 已实现的权限

### 问卷管理权限
- `survey:view` - 查看问卷
- `survey:create` - 创建问卷
- `survey:edit` - 编辑问卷
- `survey:delete` - 删除问卷
- `survey:publish` - 发布问卷
- `survey:statistics` - 查看问卷统计

### 用户管理权限
- `user:view` - 查看用户
- `user:create` - 创建用户
- `user:edit` - 编辑用户
- `user:delete` - 删除用户
- `user:import` - 导入用户
- `user:export` - 导出用户

### 部门管理权限
- `department:view` - 查看部门
- `department:create` - 创建部门
- `department:edit` - 编辑部门
- `department:delete` - 删除部门

### 角色管理权限
- `role:view` - 查看角色
- `role:create` - 创建角色
- `role:edit` - 编辑角色
- `role:delete` - 删除角色
- `role:assign` - 分配角色

### 权限管理权限
- `permission:view` - 查看权限
- `permission:manage` - 管理权限

### 其他管理权限
- 分类管理：`category:view/create/edit/delete`
- 问题管理：`question:view/create/edit/delete`
- 选项管理：`option:view/create/edit/delete`
- 响应管理：`response:view/export/delete`

### 个人中心权限
- `profile:view` - 查看个人资料
- `profile:edit` - 编辑个人资料
- `password:change` - 修改密码

## 默认角色权限分配

### 超级管理员
- 拥有所有权限

### 普通管理员
- 问卷管理：查看、创建、编辑、删除、发布、统计
- 用户管理：查看、创建、编辑、删除、导入、导出
- 部门管理：查看、创建、编辑、删除
- 角色管理：查看、创建、编辑、分配
- 权限管理：查看
- 其他管理：分类、问题、选项、响应的完整管理
- 个人中心：查看、编辑个人资料，修改密码

### 普通用户
- 问卷管理：仅查看
- 个人中心：查看、编辑个人资料，修改密码

## 使用指南

### 1. 在组件中使用权限检查
```vue
<script setup>
import { usePermission, PERMISSIONS } from '@/utils/permission.js'

const { hasPermission, isAdmin } = usePermission()

// 在方法中使用
const handleCreate = async () => {
    if (await hasPermission(PERMISSIONS.SURVEY_CREATE)) {
        // 执行创建操作
    } else {
        ElMessage.error('没有权限执行此操作')
    }
}
</script>

<template>
    <!-- 使用指令控制显示 -->
    <el-button v-permission="'survey:create'" @click="handleCreate">
        创建问卷
    </el-button>
</template>
```

### 2. 在路由守卫中使用权限
```javascript
// 在路由配置中添加权限检查
{
    path: '/manage/survey',
    component: SurveyManage,
    meta: { 
        requiresPermission: 'survey:view' 
    }
}
```

### 3. 后端API权限验证
后端需要在相应的Controller方法中添加权限验证：
```java
@PreAuthorize("hasPermission('survey:create')")
@PostMapping("/create")
public Result createSurvey(@RequestBody Survey survey) {
    // 创建问卷逻辑
}
```

## 数据初始化

系统提供了权限数据初始化脚本 (`src/utils/initPermissions.js`)，包含：
- 完整的权限定义
- 默认角色权限分配
- 权限代码常量

## 注意事项

1. **权限缓存**: 权限检查结果会缓存5分钟，提高性能
2. **超级管理员**: 超级管理员自动拥有所有权限，无需检查
3. **权限更新**: 用户权限更新后需要清除缓存或重新登录
4. **安全性**: 前端权限控制仅用于UI展示，后端必须进行权限验证

## 后续扩展

1. **动态权限**: 支持运行时动态添加权限
2. **权限继承**: 支持角色权限继承
3. **数据权限**: 支持基于数据的权限控制
4. **审计日志**: 记录权限使用和变更日志

## 导入权限数据

系统提供了完整的权限数据，可以通过以下方式导入：

1. 使用权限管理界面手动添加
2. 通过数据库脚本批量导入
3. 使用系统提供的初始化接口

建议在生产环境中先导入基础权限数据，然后根据实际需求进行调整。
