// 权限数据初始化脚本
export const PERMISSION_DATA = [
    // 问卷管理权限
    {
        name: '查看问卷',
        code: 'survey:view',
        description: '查看问卷列表和详情'
    },
    {
        name: '创建问卷',
        code: 'survey:create',
        description: '创建新问卷'
    },
    {
        name: '编辑问卷',
        code: 'survey:edit',
        description: '编辑问卷内容'
    },
    {
        name: '删除问卷',
        code: 'survey:delete',
        description: '删除问卷'
    },
    {
        name: '发布问卷',
        code: 'survey:publish',
        description: '发布问卷到部门'
    },
    {
        name: '查看问卷统计',
        code: 'survey:statistics',
        description: '查看问卷统计数据'
    },

    // 用户管理权限
    {
        name: '查看用户',
        code: 'user:view',
        description: '查看用户列表和详情'
    },
    {
        name: '创建用户',
        code: 'user:create',
        description: '创建新用户'
    },
    {
        name: '编辑用户',
        code: 'user:edit',
        description: '编辑用户信息'
    },
    {
        name: '删除用户',
        code: 'user:delete',
        description: '删除用户'
    },
    {
        name: '导入用户',
        code: 'user:import',
        description: '批量导入用户'
    },
    {
        name: '导出用户',
        code: 'user:export',
        description: '导出用户列表'
    },

    // 部门管理权限
    {
        name: '查看部门',
        code: 'department:view',
        description: '查看部门列表和详情'
    },
    {
        name: '创建部门',
        code: 'department:create',
        description: '创建新部门'
    },
    {
        name: '编辑部门',
        code: 'department:edit',
        description: '编辑部门信息'
    },
    {
        name: '删除部门',
        code: 'department:delete',
        description: '删除部门'
    },

    // 角色管理权限
    {
        name: '查看角色',
        code: 'role:view',
        description: '查看角色列表和详情'
    },
    {
        name: '创建角色',
        code: 'role:create',
        description: '创建新角色'
    },
    {
        name: '编辑角色',
        code: 'role:edit',
        description: '编辑角色信息'
    },
    {
        name: '删除角色',
        code: 'role:delete',
        description: '删除角色'
    },
    {
        name: '分配角色',
        code: 'role:assign',
        description: '将角色分配给用户或部门'
    },

    // 权限管理权限
    {
        name: '查看权限',
        code: 'permission:view',
        description: '查看权限列表和详情'
    },
    {
        name: '管理权限',
        code: 'permission:manage',
        description: '管理权限分配'
    },

    // 分类管理权限
    {
        name: '查看分类',
        code: 'category:view',
        description: '查看分类列表和详情'
    },
    {
        name: '创建分类',
        code: 'category:create',
        description: '创建新分类'
    },
    {
        name: '编辑分类',
        code: 'category:edit',
        description: '编辑分类信息'
    },
    {
        name: '删除分类',
        code: 'category:delete',
        description: '删除分类'
    },

    // 问题管理权限
    {
        name: '查看问题',
        code: 'question:view',
        description: '查看问题列表和详情'
    },
    {
        name: '创建问题',
        code: 'question:create',
        description: '创建新问题'
    },
    {
        name: '编辑问题',
        code: 'question:edit',
        description: '编辑问题内容'
    },
    {
        name: '删除问题',
        code: 'question:delete',
        description: '删除问题'
    },

    // 选项管理权限
    {
        name: '查看选项',
        code: 'option:view',
        description: '查看选项列表和详情'
    },
    {
        name: '创建选项',
        code: 'option:create',
        description: '创建新选项'
    },
    {
        name: '编辑选项',
        code: 'option:edit',
        description: '编辑选项内容'
    },
    {
        name: '删除选项',
        code: 'option:delete',
        description: '删除选项'
    },

    // 响应管理权限
    {
        name: '查看响应',
        code: 'response:view',
        description: '查看问卷响应数据'
    },
    {
        name: '导出响应',
        code: 'response:export',
        description: '导出响应数据'
    },
    {
        name: '删除响应',
        code: 'response:delete',
        description: '删除响应数据'
    },

    // 个人中心权限
    {
        name: '查看个人资料',
        code: 'profile:view',
        description: '查看个人资料信息'
    },
    {
        name: '编辑个人资料',
        code: 'profile:edit',
        description: '编辑个人资料信息'
    },
    {
        name: '修改密码',
        code: 'password:change',
        description: '修改登录密码'
    }
]

// 角色权限映射（默认角色权限分配）
export const ROLE_PERMISSIONS = {
    '超级管理员': PERMISSION_DATA.map(p => p.code), // 拥有所有权限
    '普通管理员': [
        'survey:view', 'survey:create', 'survey:edit', 'survey:delete', 'survey:publish', 'survey:statistics',
        'user:view', 'user:create', 'user:edit', 'user:delete', 'user:import', 'user:export',
        'department:view', 'department:create', 'department:edit', 'department:delete',
        'role:view', 'role:create', 'role:edit', 'role:assign',
        'permission:view',
        'category:view', 'category:create', 'category:edit', 'category:delete',
        'question:view', 'question:create', 'question:edit', 'question:delete',
        'option:view', 'option:create', 'option:edit', 'option:delete',
        'response:view', 'response:export',
        'profile:view', 'profile:edit', 'password:change'
    ],
    '普通用户': [
        'survey:view',
        'profile:view', 'profile:edit', 'password:change'
    ]
}
