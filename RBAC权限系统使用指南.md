# RBAC权限系统使用指南

## 1. 系统概述

本系统采用基于角色的访问控制（RBAC）模型，通过角色分配权限，用户通过拥有角色来获取相应的权限。系统实现了细粒度的权限控制，可以精确控制菜单显示、按钮操作和数据访问等。

## 2. 权限设计

### 2.1 权限类型

系统中的权限分为以下几类：

- **问卷管理权限**：控制问卷的查看、创建、编辑、删除、发布和统计等操作
- **用户管理权限**：控制用户的查看、创建、编辑、删除、导入和导出等操作
- **部门管理权限**：控制部门的查看、创建、编辑和删除等操作
- **角色管理权限**：控制角色的查看、创建、编辑、删除和分配等操作
- **权限管理权限**：控制权限的查看和管理等操作
- **分类管理权限**：控制分类的查看、创建、编辑和删除等操作
- **问题管理权限**：控制问题的查看、创建、编辑和删除等操作
- **选项管理权限**：控制选项的查看、创建、编辑和删除等操作
- **响应管理权限**：控制响应的查看、导出和删除等操作
- **个人中心权限**：控制个人资料的查看、编辑和密码修改等操作

### 2.2 权限代码规范

权限代码采用 `模块:操作` 的格式，例如：
- `survey:view`：查看问卷权限
- `user:create`：创建用户权限

完整的权限列表请参考 `src/utils/permission.js` 文件中的 `PERMISSIONS` 常量定义。

## 3. 角色设计

系统预设了以下角色：

### 3.1 超级管理员
- **描述**：系统最高权限角色
- **权限范围**：拥有所有权限，可以执行系统内的任何操作
- **适用场景**：系统管理员、开发人员

### 3.2 普通管理员
- **描述**：具有大部分管理权限的角色
- **权限范围**：拥有除权限管理外的大部分权限，可以管理问卷、用户、部门、角色等
- **适用场景**：业务管理员、部门主管

### 3.3 普通用户
- **描述**：基础操作权限的角色
- **权限范围**：拥有基础的问卷操作权限，可以查看、创建和编辑问卷
- **适用场景**：一般工作人员、问卷填写者

### 3.4 只读用户
- **描述**：只能查看数据的角色
- **权限范围**：只能查看数据，不能进行修改操作
- **适用场景**：数据分析师、审计人员

## 4. 权限配置与使用

### 4.1 菜单权限控制

系统通过 `src/views/Layout.vue` 文件中的 `permissionState` 对象和 `checkPermissions` 方法实现菜单的显示控制。具体实现如下：

1. 在组件初始化时，调用 `checkPermissions` 方法检查用户的所有权限
2. 根据权限检查结果，设置 `permissionState` 对象中的各个权限状态
3. 在模板中使用 `v-if` 指令根据 `permissionState` 中的权限状态控制菜单的显示与隐藏

例如，控制用户管理菜单的显示：
```html
<el-menu-item v-if="permissionState.canManageUser" index="/manage/user" class="menu-item">
  <el-icon><Management /></el-icon>
  <template #title>用户管理</template>
</el-menu-item>
```

### 4.2 按钮权限控制

系统提供了 `v-permission` 指令来控制按钮的显示与隐藏。使用方法如下：

```html
<!-- 检查单个权限 -->
<el-button v-permission="'survey:create'" type="primary">创建问卷</el-button>

<!-- 检查多个权限（需要所有权限） -->
<el-button v-permission="['survey:edit', 'survey:delete']" type="danger">批量删除</el-button>

<!-- 检查多个权限（任一权限即可） -->
<el-button v-permission:any="['survey:edit', 'survey:delete']" type="warning">编辑/删除</el-button>
```

### 4.3 角色指令

系统还提供了 `v-role` 指令来根据用户角色控制元素的显示与隐藏：

```html
<!-- 检查单个角色 -->
<el-button v-role="'超级管理员'" type="primary">系统设置</el-button>

<!-- 检查多个角色 -->
<el-button v-role="['超级管理员', '普通管理员']" type="warning">管理操作</el-button>
```

## 5. 数据库初始化

### 5.1 导入权限数据

系统提供了 `rbac_permissions_data.sql` 脚本，包含了所有权限、角色以及角色权限关联的数据。您可以直接将此脚本导入数据库，快速初始化权限系统。

使用方法：
1. 根据实际数据库表结构调整脚本中的表名和字段名
2. 执行SQL脚本导入数据
3. 如需创建初始用户，请参考脚本中的示例

### 5.2 数据库表结构（参考）

权限系统主要涉及以下表：

- **permission**：存储权限信息
- **role**：存储角色信息
- **role_permission**：存储角色与权限的关联关系
- **user**：存储用户信息（包含角色字段）
- **user_role**：存储用户与角色的关联关系（多对多情况下）

## 6. 权限系统集成

### 6.1 前端集成

1. 确保 `main.js` 中正确注册了权限指令：
```javascript
import { permission, role } from './directives/permission.js'
app.directive('permission', permission)
app.directive('role', role)
```

2. 在需要权限控制的组件中使用 `usePermission` hook：
```javascript
import { usePermission, PERMISSIONS } from '@/utils/permission.js'

// 在组件中使用
const { hasPermission } = usePermission()
const canCreateSurvey = await hasPermission(PERMISSIONS.SURVEY_CREATE)
```

### 6.2 后端集成

后端提供了以下核心API接口：

- `/permission/list`：获取权限列表
- `/permission/getAll`：获取所有权限
- `/role/list`：获取角色列表
- `/role/getAll`：获取所有角色
- `/rolePermission/assign`：分配角色权限
- `/user/checkPermission`：检查用户是否有特定权限

## 7. 自定义权限

### 7.1 添加新权限

1. 在 `src/utils/permission.js` 文件的 `PERMISSIONS` 常量中添加新的权限代码
2. 在 `src/utils/initPermissions.js` 文件的 `PERMISSION_DATA` 数组中添加新的权限信息
3. 在数据库中插入新的权限记录
4. 为相应角色分配新权限

### 7.2 创建新角色

1. 通过系统界面或直接在数据库中创建新角色
2. 为新角色分配相应的权限
3. 将角色分配给用户

## 8. 注意事项

1. 权限缓存：系统使用了5分钟的权限缓存，如需立即生效，请清除缓存
2. 超级管理员：超级管理员拥有所有权限，不受权限分配限制
3. 权限继承：目前系统不支持权限继承，权限需要直接分配给角色
4. 安全性：请谨慎分配权限，特别是删除、修改等敏感操作权限
5. 性能优化：在大量使用权限检查的页面，建议批量获取权限信息，减少API调用

## 9. 常见问题

### 9.1 权限不生效
- 检查用户是否拥有正确的角色
- 检查角色是否分配了相应的权限
- 尝试清除浏览器缓存或重新登录

### 9.2 菜单显示异常
- 检查 `Layout.vue` 中的权限控制逻辑
- 确认 `permissionState` 中的相应权限状态是否正确

### 9.3 按钮显示异常
- 检查 `v-permission` 指令的使用是否正确
- 确认权限代码是否存在于系统中

---

通过以上指南，您应该能够理解并正确使用本系统的RBAC权限控制功能。如果有任何问题或需要进一步的帮助，请联系系统管理员或开发人员。