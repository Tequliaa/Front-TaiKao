-- RBAC权限系统初始化SQL脚本
-- 请根据实际数据库表结构调整表名和字段名

-- 1. 插入权限数据
INSERT INTO permission (name, permission_code, comment,create_time) VALUES
('查看考试', 'exam:view', '查看考试列表和详情',now()),
('创建考试', 'exam:create', '创建新考试',now()),
('编辑考试', 'exam:edit', '编辑考试内容',now()),
('删除考试', 'exam:delete', '删除考试',now()),
('发布考试', 'exam:publish', '发布考试到部门',now()),
('查看考试统计', 'exam:statistics', '查看考试统计数据',now()),

('查看用户', 'user:view', '查看用户列表和详情',now()),
('创建用户', 'user:create', '创建新用户',now()),
('编辑用户', 'user:edit', '编辑用户信息',now()),
('删除用户', 'user:delete', '删除用户',now()),
('导入用户', 'user:import', '批量导入用户',now()),
('导出用户', 'user:export', '导出用户列表',now()),

('查看部门', 'department:view', '查看部门列表和详情',now()),
('创建部门', 'department:create', '创建新部门',now()),
('编辑部门', 'department:edit', '编辑部门信息',now()),
('删除部门', 'department:delete', '删除部门',now()),

('查看角色', 'role:view', '查看角色列表和详情',now()),
('创建角色', 'role:create', '创建新角色',now()),
('编辑角色', 'role:edit', '编辑角色信息',now()),
('删除角色', 'role:delete', '删除角色',now()),
('分配角色', 'role:assign', '将角色分配给用户或部门',now()),

('查看权限', 'permission:view', '查看权限列表和详情',now()),
('管理权限', 'permission:manage', '管理权限分配',now()),

('查看分类', 'category:view', '查看分类列表和详情',now()),
('创建分类', 'category:create', '创建新分类',now()),
('编辑分类', 'category:edit', '编辑分类信息',now()),
('删除分类', 'category:delete', '删除分类',now()),

('查看问题', 'question:view', '查看问题列表和详情',now()),
('创建问题', 'question:create', '创建新问题',now()),
('编辑问题', 'question:edit', '编辑问题内容',now()),
('删除问题', 'question:delete', '删除问题',now()),

('查看选项', 'option:view', '查看选项列表和详情',now()),
('创建选项', 'option:create', '创建新选项',now()),
('编辑选项', 'option:edit', '编辑选项内容',now()),
('删除选项', 'option:delete', '删除选项',now()),

('查看响应', 'response:view', '查看考试响应数据',now()),
('导出响应', 'response:export', '导出响应数据',now()),
('删除响应', 'response:delete', '删除响应数据',now()),

('查看个人资料', 'profile:view', '查看个人资料信息',now()),
('编辑个人资料', 'profile:edit', '编辑个人资料信息',now()),
('修改密码', 'password:change', '修改登录密码',now());

-- 2. 插入角色数据
INSERT INTO role (name, comment) VALUES
('超级管理员', '系统最高权限角色'),
('普通管理员', '具有大部分管理权限的角色'),
('普通用户', '基础操作权限的角色'),
('只读用户', '只能查看数据的角色');

-- 3. 分配角色权限
-- 超级管理员 - 拥有所有权限
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p WHERE r.name = '超级管理员';

-- 普通管理员 - 拥有除权限管理外的大部分权限
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p 
WHERE r.name = '普通管理员' 
AND p.code IN (
  'exam:view', 'exam:create', 'exam:edit', 'exam:delete', 'exam:publish', 'exam:statistics',
  'user:view', 'user:create', 'user:edit', 'user:delete', 'user:import', 'user:export',
  'department:view', 'department:create', 'department:edit', 'department:delete',
  'role:view', 'role:create', 'role:edit', 'role:assign',
  'permission:view',
  'category:view', 'category:create', 'category:edit', 'category:delete',
  'question:view', 'question:create', 'question:edit', 'question:delete',
  'option:view', 'option:create', 'option:edit', 'option:delete',
  'response:view', 'response:export',
  'profile:view', 'profile:edit', 'password:change'
);

-- 普通用户 - 拥有基础的考试操作权限
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p 
WHERE r.name = '普通用户' 
AND p.code IN (
  'exam:view', 'exam:create', 'exam:edit',
  'response:view',
  'profile:view', 'profile:edit', 'password:change'
);

-- 只读用户 - 只能查看数据
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p 
WHERE r.name = '只读用户' 
AND p.code IN (
  'exam:view',
  'response:view',
  'profile:view', 'password:change'
);

-- 4. 示例：创建一个超级管理员用户
-- 注意：这里的密码需要根据实际的密码加密方式进行设置
-- 下面的密码只是示例，实际使用时请使用正确的加密方式
-- INSERT INTO user (username, password, name, role) VALUES
-- ('admin', '加密后的密码', '超级管理员', '超级管理员');

-- 5. 提示：如果需要修改表名或字段名，请根据实际数据库结构调整上述SQL语句