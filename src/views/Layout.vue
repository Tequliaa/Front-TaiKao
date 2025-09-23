<script setup>
import {
    Management,
    Ticket,
    Promotion,
    UserFilled,
    User,
    Crop,
    EditPen,
    SwitchButton,
    CaretBottom,
    Avatar,
    List,
    Menu,
    HomeFilled,
    Setting,
    Bell,
    Expand,
    Fold
} from '@element-plus/icons-vue'
import avatar from '@/assets/default.png'
import { ref, computed, onMounted, onUnmounted, nextTick, reactive } from 'vue'
//导入接口函数
import { userInfoGetService,userLogoutService } from '@/api/user.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'
const userInfoStore = useUserInfoStore();
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTokenStore } from '@/stores/token.js'
import { usePermission, PERMISSIONS } from '@/utils/permission.js'
const tokenStore = useTokenStore()
const { hasPermission, hasAnyPermission } = usePermission()

//获取个人信息
const getUserInf = async () => {
    let result = await userInfoGetService();
    //存储pinia
    userInfoStore.info = result.data;
    // 用户信息更新后重新检查权限
    await refreshPermissions();
}

//获取用户基本信息
getUserInf()

//dropDown条目被点击后，回调的函数
import { useRouter } from 'vue-router'
const router = useRouter()
const handleCommand = (command) => {
    if (command === 'logout') {
        //退出登录
        //退出登录
        ElMessageBox.confirm(
            '你确认退出登录吗？',
            '温馨提示',
            {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
            .then(async () => {
                //退出登录
                let result = await userLogoutService();
                if (result.code == 200) {
                    //清空pinia中的token和个人信息
                    userInfoStore.info = {}
                    tokenStore.token = ''
                    //跳转到登录页
                    router.push('/login')
                }
            })
            .catch(() => {
                //用户点击了取消
                ElMessage({
                    type: 'info',
                    message: '取消退出',
                })
            })
    } else {
        //路由
        router.push('/user/' + command)
    }
}

// 控制侧边栏折叠状态
const isCollapse = ref(false)
const toggleSidebar = () => {
    isCollapse.value = !isCollapse.value
}

// 检测是否为移动设备
const isMobile = ref(window.innerWidth <= 768)

// 监听窗口大小变化
const handleResize = () => {
    const wasMobile = isMobile.value
    isMobile.value = window.innerWidth <= 768
    
    if (isMobile.value) {
        isCollapse.value = true
    } else if (wasMobile) {
        // 从移动端切换到桌面端时，恢复侧边栏宽度
        isCollapse.value = false
    }
}

// 在组件挂载时添加窗口大小变化监听
onMounted(async () => {
    // 初始化时检查窗口大小
    handleResize()
    // 强制重新计算布局
    nextTick(() => {
        handleResize()
        // 再次检查以确保样式已应用
        setTimeout(() => {
            handleResize()
        }, 100)
    })
    window.addEventListener('resize', handleResize)
    
    // 检查权限 - 现在 getUserInf 中会自动调用 refreshPermissions
})

// 在组件卸载时移除监听
onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})

// 权限状态
const permissionState = reactive({
    canManageExam: false,
    canCreateExam: false,
    canEditExam: false,
    canDeleteExam: false,
    canPublishExam: false,
    canViewExamStats: false,
    
    canManageUser: false,
    canCreateUser: false,
    canEditUser: false,
    canDeleteUser: false,
    canImportUser: false,
    canExportUser: false,
    
    canManageDepartment: false,
    canCreateDepartment: false,
    canEditDepartment: false,
    canDeleteDepartment: false,
    
    canManageRole: false,
    canCreateRole: false,
    canEditRole: false,
    canDeleteRole: false,
    canAssignRole: false,
    
    canManagePermission: false,
    canViewPermission: false,
    
    canManageCategory: false,
    canManageQuestion: false,
    canManageOption: false,
    
    canManageResponse: false,
    canExportResponse: false,
    canDeleteResponse: false
})

// 检查权限
const checkPermissions = async () => {
    try {
        const { hasPermission } = usePermission()
        
        // 检查问卷管理权限
        permissionState.canManageExam = await hasPermission(PERMISSIONS.Exam_VIEW)
        permissionState.canCreateExam = await hasPermission(PERMISSIONS.Exam_CREATE)
        permissionState.canEditExam = await hasPermission(PERMISSIONS.Exam_EDIT)
        permissionState.canDeleteExam = await hasPermission(PERMISSIONS.Exam_DELETE)
        permissionState.canPublishExam = await hasPermission(PERMISSIONS.Exam_PUBLISH)
        permissionState.canViewExamStats = await hasPermission(PERMISSIONS.Exam_STATISTICS)
        
        // 检查用户管理权限
        permissionState.canManageUser = await hasPermission(PERMISSIONS.USER_VIEW)
        permissionState.canCreateUser = await hasPermission(PERMISSIONS.USER_CREATE)
        permissionState.canEditUser = await hasPermission(PERMISSIONS.USER_EDIT)
        permissionState.canDeleteUser = await hasPermission(PERMISSIONS.USER_DELETE)
        permissionState.canImportUser = await hasPermission(PERMISSIONS.USER_IMPORT)
        permissionState.canExportUser = await hasPermission(PERMISSIONS.USER_EXPORT)
        
        // 检查部门管理权限
        permissionState.canManageDepartment = await hasPermission(PERMISSIONS.DEPARTMENT_VIEW)
        permissionState.canCreateDepartment = await hasPermission(PERMISSIONS.DEPARTMENT_CREATE)
        permissionState.canEditDepartment = await hasPermission(PERMISSIONS.DEPARTMENT_EDIT)
        permissionState.canDeleteDepartment = await hasPermission(PERMISSIONS.DEPARTMENT_DELETE)
        
        // 检查角色管理权限
        permissionState.canManageRole = await hasPermission(PERMISSIONS.ROLE_VIEW)
        permissionState.canCreateRole = await hasPermission(PERMISSIONS.ROLE_CREATE)
        permissionState.canEditRole = await hasPermission(PERMISSIONS.ROLE_EDIT)
        permissionState.canDeleteRole = await hasPermission(PERMISSIONS.ROLE_DELETE)
        permissionState.canAssignRole = await hasPermission(PERMISSIONS.ROLE_ASSIGN)
        
        // 检查权限管理权限
        permissionState.canViewPermission = await hasPermission(PERMISSIONS.PERMISSION_VIEW)
        permissionState.canManagePermission = await hasPermission(PERMISSIONS.PERMISSION_MANAGE)
        
        // 检查分类管理权限
        permissionState.canManageCategory = await hasPermission(PERMISSIONS.CATEGORY_VIEW)
        
        // 检查问题管理权限
        permissionState.canManageQuestion = await hasPermission(PERMISSIONS.QUESTION_VIEW)
        
        // 检查选项管理权限
        permissionState.canManageOption = await hasPermission(PERMISSIONS.OPTION_VIEW)
        
        // 检查响应管理权限
        permissionState.canManageResponse = await hasPermission(PERMISSIONS.RESPONSE_VIEW)
        permissionState.canExportResponse = await hasPermission(PERMISSIONS.RESPONSE_EXPORT)
        permissionState.canDeleteResponse = await hasPermission(PERMISSIONS.RESPONSE_DELETE)
    } catch (error) {
        console.error('权限检查失败:', error)
    }
}

// 刷新权限 - 清除缓存并重新检查权限
const refreshPermissions = async () => {
    try {
        const { clearCache } = usePermission()
        // 清除权限缓存
        clearCache()
        // 重新检查权限
        await checkPermissions()
    } catch (error) {
        console.error('刷新权限失败:', error)
    }
}
</script>

<template>
    <el-container class="layout-container" :class="{ 'mobile-layout': isMobile }">
        <!-- 左侧菜单 - 在移动端变为顶部菜单 -->
        <el-aside :width="isMobile ? '100%' : (isCollapse ? '64px' : '240px')" class="sidebar-container" :class="{ 'mobile-sidebar': isMobile }">
            <!-- 移动端菜单 -->
            <div v-if="isMobile" class="mobile-menu">
                <el-menu 
                    active-text-color="#4a90e2" 
                    background-color="#2c3e50" 
                    text-color="#ecf0f1" 
                    router
                    mode="horizontal"
                    class="mobile-menu-container">
                    <el-menu-item index="/manage/userExam" class="mobile-menu-item">
                        <el-icon><Avatar /></el-icon>
                        <span>我的问卷</span>
                    </el-menu-item>

                    <!-- 管理员菜单 -->
                    <template v-if="permissionState.canManageExam || permissionState.canManageUser || permissionState.canManageDepartment || permissionState.canManageRole || permissionState.canManagePermission || permissionState.canManageCategory || permissionState.canManageQuestion || permissionState.canManageOption">
                        <el-sub-menu v-if="permissionState.canManageExam || permissionState.canManageCategory || permissionState.canManageQuestion || permissionState.canManageOption" index="geren1" class="mobile-submenu">
                            <template #title>
                                <el-icon><Menu /></el-icon>
                                <span>问卷管理</span>
                            </template>
                            <el-menu-item v-if="permissionState.canManageExam" index="/exam/exam" class="mobile-submenu-item">
                                <el-icon><User /></el-icon>
                                <span>问卷管理</span>
                            </el-menu-item>
                            <el-menu-item v-if="permissionState.canManageExam" index="/exam/builder" class="mobile-submenu-item">
                                <el-icon><EditPen /></el-icon>
                                <span>问卷构建器</span>
                            </el-menu-item>
                            <el-menu-item v-if="permissionState.canManageCategory" index="/manage/category" class="mobile-submenu-item">
                                <el-icon><EditPen /></el-icon>
                                <span>分类管理</span>
                            </el-menu-item>
                            <el-menu-item v-if="permissionState.canManageQuestion" index="/manage/question" class="mobile-submenu-item">
                                <el-icon><Crop /></el-icon>
                                <span>问题管理</span>
                            </el-menu-item>
                            <el-menu-item v-if="permissionState.canManageOption" index="/manage/option" class="mobile-submenu-item">
                                <el-icon><EditPen /></el-icon>
                                <span>选项管理</span>
                            </el-menu-item>
                        </el-sub-menu>
                        <el-menu-item v-if="permissionState.canManageDepartment" index="/manage/department" class="mobile-menu-item">
                            <el-icon><List /></el-icon>
                            <span>部门管理</span>
                        </el-menu-item>
                        <el-menu-item v-if="permissionState.canManageUser" index="/manage/user" class="mobile-menu-item">
                            <el-icon><Management /></el-icon>
                            <span>用户管理</span>
                        </el-menu-item>
                        <el-menu-item v-if="permissionState.canManageRole" index="/manage/role" class="mobile-menu-item">
                            <el-icon><User /></el-icon>
                            <span>角色管理</span>
                        </el-menu-item>
                        <el-menu-item v-if="permissionState.canManagePermission" index="/manage/permission" class="mobile-menu-item">
                            <el-icon><Ticket /></el-icon>
                            <span>权限管理</span>
                        </el-menu-item>
                    </template>

                    <el-sub-menu index="geren2" class="mobile-submenu">
                        <template #title>
                            <el-icon><UserFilled /></el-icon>
                            <span>个人中心</span>
                        </template>
                        <el-menu-item index="/user/info" class="mobile-submenu-item">
                            <el-icon><User /></el-icon>
                            <span>基本资料</span>
                        </el-menu-item>
                        <!-- <el-menu-item index="/user/avatar" class="mobile-submenu-item">
                            <el-icon><Crop /></el-icon>
                            <span>更换头像</span>
                        </el-menu-item> -->
                        <el-menu-item index="/user/password" class="mobile-submenu-item">
                            <el-icon><EditPen /></el-icon>
                            <span>重置密码</span>
                        </el-menu-item>
                        <el-menu-item index="/user/logout" class="mobile-submenu-item" @click="handleCommand('logout')">
                            <el-icon><SwitchButton /></el-icon>
                            <span>退出登录</span>
                        </el-menu-item>
                    </el-sub-menu>
                </el-menu>
            </div>
            <!-- 桌面端头部 -->
            <div v-else class="sidebar-header">
                <div class="logo-container">
                    <span class="logo-text" v-if="!isCollapse">问卷管理平台</span>
                    <el-icon class="collapse-btn" @click="toggleSidebar">
                        <component :is="isCollapse ? 'Expand' : 'Fold'" />
                    </el-icon>
                </div>
            </div>
            <!-- 桌面端菜单 -->
            <el-menu 
                v-if="!isMobile"
                active-text-color="#4a90e2" 
                background-color="#2c3e50" 
                text-color="#ecf0f1" 
                router
                :collapse="isCollapse"
                :collapse-transition="false"
                class="sidebar-menu">
                
                <el-menu-item index="/manage/userExam" class="menu-item">
                    <el-icon><Avatar /></el-icon>
                    <template #title>我的问卷</template>
                </el-menu-item>
                <el-menu-item index="/exam/builder" class="submenu-item">
                            <el-icon><EditPen /></el-icon>
                            <template #title>问卷构建器</template>
                </el-menu-item>
                <!-- 管理员菜单 -->
                <template v-if="permissionState.canManageExam || permissionState.canManageUser || permissionState.canManageDepartment || permissionState.canManageRole || permissionState.canManagePermission || permissionState.canManageCategory || permissionState.canManageQuestion || permissionState.canManageOption">
                    <el-sub-menu v-if="permissionState.canManageExam || permissionState.canManageCategory || permissionState.canManageQuestion || permissionState.canManageOption" index="geren1" class="submenu">
                        <template #title>
                            <el-icon><Menu /></el-icon>
                            <span>考试管理</span>
                        </template>
                        <el-menu-item v-if="permissionState.canManageExam" index="/exam/exam" class="submenu-item">
                            <el-icon><User /></el-icon>
                            <template #title>试卷管理</template>
                        </el-menu-item>

                        <el-menu-item v-if="permissionState.canManageCategory" index="/manage/category" class="submenu-item">
                            <el-icon><EditPen /></el-icon>
                            <template #title>分类管理</template>
                        </el-menu-item>
                        <el-menu-item v-if="permissionState.canManageQuestion" index="/manage/question" class="submenu-item">
                            <el-icon><Crop /></el-icon>
                            <template #title>问题管理</template>
                        </el-menu-item>
                        <el-menu-item v-if="permissionState.canManageOption" index="/manage/option" class="submenu-item">
                            <el-icon><EditPen /></el-icon>
                            <template #title>选项管理</template>
                        </el-menu-item>
                    </el-sub-menu>
                    <el-menu-item v-if="permissionState.canManageDepartment" index="/manage/department" class="menu-item">
                        <el-icon><List /></el-icon>
                        <template #title>部门管理</template>
                    </el-menu-item>
                        <el-menu-item v-if="permissionState.canManageUser" index="/manage/user" class="menu-item">
                            <el-icon><Management /></el-icon>
                            <template #title>用户管理</template>
                        </el-menu-item>
                        <el-menu-item v-if="permissionState.canManageRole" index="/manage/role" class="menu-item">
                            <el-icon><User /></el-icon>
                            <template #title>角色管理</template>
                        </el-menu-item>
                        <el-menu-item v-if="permissionState.canManagePermission" index="/manage/permission" class="menu-item">
                            <el-icon><Ticket /></el-icon>
                            <template #title>权限管理</template>
                        </el-menu-item>
                </template>

                <el-sub-menu index="geren2" class="submenu">
                    <template #title>
                        <el-icon><UserFilled /></el-icon>
                        <span>个人中心</span>
                    </template>
                    <el-menu-item index="/user/info" class="submenu-item">
                        <el-icon><User /></el-icon>
                        <template #title>基本资料</template>
                    </el-menu-item>
                    <!-- <el-menu-item index="/user/avatar" class="submenu-item">
                        <el-icon><Crop /></el-icon>
                        <template #title>更换头像</template>
                    </el-menu-item> -->
                    <el-menu-item index="/user/password" class="submenu-item">
                        <el-icon><EditPen /></el-icon>
                        <template #title>重置密码</template>
                    </el-menu-item>
                    <el-menu-item index="/user/logout" class="submenu-item"  @click="handleCommand('logout')">
                        <el-icon><SwitchButton /></el-icon>
                        <template #title>退出登录</template>
                    </el-menu-item>
                </el-sub-menu>
            </el-menu>
        </el-aside>
        <!-- 右侧主区域 -->
        <el-container class="main-container" :class="{ 'mobile-main': isMobile }">
            <!-- 头部区域 -->
            <el-header class="main-header" v-if="!isMobile">
                <div class="header-left">
                    <el-breadcrumb separator="/">
                        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                        <el-breadcrumb-item>当前页面</el-breadcrumb-item>
                    </el-breadcrumb>
                </div>
                <div class="header-right" v-if="!isMobile">
                    <div class="user-info" v-if="!isMobile">
                        <!-- <el-icon class="notification-icon"><Bell /></el-icon> -->
                        <!-- <div class="department-info">
                            <span class="department-label">用户昵称：</span>
                            <span class="user-name">{{ userInfoStore.info.name }}</span>
                        </div> -->
                    </div>
                    <el-dropdown placement="bottom-end" @command="handleCommand" class="user-dropdown">
                        <div class="avatar-container">
                            <el-avatar :src="avatar" class="user-avatar" />
                            <span class="user-name-mobile" v-if="!isMobile">{{ userInfoStore.info.name }}</span>
                            <el-icon class="dropdown-icon"><CaretBottom /></el-icon>
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="info" :icon="User">基本资料</el-dropdown-item>
                                <!-- <el-dropdown-item command="avatar" :icon="Crop">更换头像</el-dropdown-item> -->
                                <el-dropdown-item command="password" :icon="EditPen">重置密码</el-dropdown-item>
                                <el-dropdown-item divided command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-header>
            <!-- 中间区域 -->
            <el-main class="main-content">
                <router-view></router-view>
            </el-main>
            <!-- 底部区域 -->
            <el-footer class="main-footer">
                <div class="footer-content">
                    <span>问卷调查管理系统 ©2025 Created by 饭得标</span>
                </div>
            </el-footer>
        </el-container>
    </el-container>
</template>

<style lang="scss" scoped>
.layout-container {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    
    &.mobile-layout {
        flex-direction: column;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }
}

.sidebar-container {
    background-color: #2c3e50;
    transition: all 0.3s;
    overflow: hidden;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    z-index: 10;
    
    &.mobile-sidebar {
        width: 100% !important;
        height: auto;
        position: relative;
        transform: translateY(0);
        transition: all 0.3s ease;
    }
    
    .sidebar-header {
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 16px;
        overflow: hidden;
        background-color: #34495e;
        
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            
            .logo-img {
                height: 32px;
                margin-right: 8px;
            }
            
            .logo-text {
                color: #fff;
                font-size: 18px;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-align: center;
                flex: 1;
                margin-right: 16px;
            }
            
            .collapse-btn {
                color: #ecf0f1;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.3s;
                
                &:hover {
                    color: #4a90e2;
                }
            }
        }
    }
    
    .sidebar-menu {
        border-right: none;
        
        :deep(.el-menu-item) {
            height: 50px;
            line-height: 50px;
            margin: 4px 0;
            border-radius: 4px;
            margin-left: 16px;
            margin-right: 16px;
            
            &.is-active {
                background-color: #4a90e2;
                color: #fff;
                
                &::before {
                    display: none;
                }
            }
            
            &:hover {
                background-color: rgba(255, 255, 255, 0.08);
            }
            
            .el-icon {
                font-size: 18px;
                margin-right: 8px;
            }
        }
        
        :deep(.el-sub-menu__title) {
            height: 50px;
            line-height: 50px;
            margin: 4px 0;
            border-radius: 4px;
            margin-left: 16px;
            margin-right: 16px;
            
            &:hover {
                background-color: rgba(255, 255, 255, 0.08);
            }
            
            .el-icon {
                font-size: 18px;
                margin-right: 8px;
            }
        }
        
        :deep(.el-menu-item.is-active) {
            background-color: #4a90e2;
            color: #fff;
        }
    }
    
    .mobile-menu {
        height: 64px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        background-color: #2c3e50;
        display: flex;
        align-items: center;
        
        .mobile-menu-container {
            display: flex;
            flex-direction: row;
            height: 64px;
            border-bottom: none;
            min-width: max-content;
            width: 100%;
            
            :deep(.el-menu-item), :deep(.el-sub-menu__title) {
                height: 64px;
                line-height: 64px;
                padding: 0 16px;
                white-space: nowrap;
                flex-shrink: 0;
                
                .el-icon {
                    margin-right: 4px;
                }
            }
            
            :deep(.el-sub-menu) {
                .el-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    width: auto;
                    min-width: 150px;
                    background-color: #2c3e50;
                    border-radius: 0 0 4px 4px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    z-index: 100;
                }
            }
        }
    }
}

.main-container {
    display: flex;
    flex-direction: column;
    background-color: #f5f7fa;
    transition: margin-left 0.3s;
    
    &.mobile-main {
        margin-left: 0;
        width: 100%;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }
}

.main-header {
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 64px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    position: relative;
    z-index: 9;
    
    .header-left {
        .el-breadcrumb {
            font-size: 14px;
        }
    }
    
    .header-right {
        display: flex;
        align-items: center;
        
        .user-info {
            display: flex;
            align-items: center;
            margin-right: 24px;
            
            .notification-icon {
                font-size: 20px;
                color: #666;
                margin-right: 16px;
                cursor: pointer;
                
                &:hover {
                    color: #4a90e2;
                }
            }
            
            .department-info {
                display: flex;
                align-items: center;
                
                .department-label {
                    color: #666;
                    margin-right: 4px;
                }
                
                .user-name {
                    font-weight: 500;
                    color: #333;
                }
            }
        }
        
        .user-dropdown {
            .avatar-container {
                display: flex;
                align-items: center;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: all 0.3s;
                
                &:hover {
                    background-color: rgba(0, 0, 0, 0.025);
                }
                
                .user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                
                .user-name-mobile {
                    font-size: 14px;
                    color: #333;
                    margin-right: 4px;
                }
                
                .dropdown-icon {
                    color: #999;
                    font-size: 12px;
                }
            }
        }
    }
}

.main-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    transition: padding 0.3s;
    
    @media (max-width: 768px) {
        overflow-y: visible;
    }
}

.main-footer {
    height: 48px;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 -1px 4px rgba(0, 21, 41, 0.08);
    
    .footer-content {
        color: #666;
        font-size: 14px;
    }
}

/* 响应式样式 */
@media (max-width: 768px) {
    .layout-container {
        flex-direction: column;
    }
    
    .sidebar-container {
        width: 100% !important;
        height: auto;
    }
    
    .main-header {
        padding: 0 16px;
        
        .header-left {
            display: none;
        }
    }
    
    .main-content {
        padding: 16px;
    }
    
    .main-footer {
        height: 40px;
        
        .footer-content {
            font-size: 12px;
        }
    }
}

/* 添加遮罩层样式 */
.sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9;
    display: none;
    
    &.visible {
        display: block;
    }
}
</style>