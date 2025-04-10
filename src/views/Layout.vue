<script setup>
import {
    Management,
    Promotion,
    UserFilled,
    User,
    Crop,
    EditPen,
    SwitchButton,
    CaretBottom,
    Avatar,
    List,
    Menu
} from '@element-plus/icons-vue'
import avatar from '@/assets/default.png'

//导入接口函数
import { userInfoGetService } from '@/api/user.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'
const userInfoStore = useUserInfoStore();
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTokenStore } from '@/stores/token.js'
const tokenStore = useTokenStore()

//获取个人信息
const getUserInf = async () => {
    let result = await userInfoGetService();
    //存储pinia
    userInfoStore.info = result.data;
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
            '你确认退出登录码？',
            '温馨提示',
            {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
            .then(async () => {
                //用户点击了确认
                //清空pinia中的token和个人信息
                userInfoStore.info = {}
                tokenStore.token = ''
                //跳转到登录页
                router.push('/login')
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

</script>

<template>
    <el-container class="layout-container">
        <!-- 左侧菜单 -->
        <el-aside width="200px">
            <div class="el-aside__logo">问卷管理平台</div>
            <el-menu active-text-color="#ffd04b" background-color="#232323" text-color="#fff" router>
                <el-menu-item index="/manage/userSurvey">
                    <el-icon>
                        <Avatar />
                    </el-icon>
                    <span>我的问卷</span>
                </el-menu-item>
                <el-menu-item index="/manage/user">
                    <el-icon>
                        <Management />
                    </el-icon>
                    <span>用户管理</span>
                </el-menu-item>

                <el-menu-item index="/manage/department">
                    <el-icon>
                        <List />
                    </el-icon>
                    <span>部门管理</span>
                </el-menu-item>

                <el-sub-menu index="geren1">
                    <template #title>
                        <el-icon>
                            <Menu />
                        </el-icon>
                        <span>问卷管理</span>
                    </template>
                    <el-menu-item index="/survey/survey">
                        <el-icon>
                            <User />
                        </el-icon>
                        <span>问卷管理</span>
                    </el-menu-item>
                    <el-menu-item index="/manage/category">
                        <el-icon>
                            <EditPen />
                        </el-icon>
                        <span>分类管理</span>
                    </el-menu-item>
                    <el-menu-item index="/manage/question">
                        <el-icon>
                            <Crop />
                        </el-icon>
                        <span>问题管理</span>
                    </el-menu-item>
                    <el-menu-item index="/manage/option">
                        <el-icon>
                            <EditPen />
                        </el-icon>
                        <span>选项管理</span>
                    </el-menu-item>
                </el-sub-menu>
                <!-- <el-menu-item index="/manage/survey">
                    <el-icon>
                        <Promotion />
                    </el-icon>
                    <span>问卷管理</span>
                </el-menu-item> -->

                <el-sub-menu index="geren2">
                    <template #title>
                        <el-icon>
                            <UserFilled />
                        </el-icon>
                        <span>个人中心</span>
                    </template>
                    <el-menu-item index="/user/info">
                        <el-icon>
                            <User />
                        </el-icon>
                        <span>基本资料</span>
                    </el-menu-item>
                    <el-menu-item index="/user/avatar">
                        <el-icon>
                            <Crop />
                        </el-icon>
                        <span>更换头像</span>
                    </el-menu-item>
                    <el-menu-item index="/user/password">
                        <el-icon>
                            <EditPen />
                        </el-icon>
                        <span>重置密码</span>
                    </el-menu-item>
                </el-sub-menu>
            </el-menu>
        </el-aside>
        <!-- 右侧主区域 -->
        <el-container>
            <!-- 头部区域 -->
            <el-header>
                <div>软件学院：<strong>{{ userInfoStore.info.name }}</strong></div>
                <el-dropdown placement="bottom-end" @command="handleCommand">
                    <span class="el-dropdown__box">
                        <el-avatar :src="avatar" />
                        <el-icon>
                            <CaretBottom />
                        </el-icon>
                    </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="info" :icon="User">基本资料</el-dropdown-item>
                            <el-dropdown-item command="avatar" :icon="Crop">更换头像</el-dropdown-item>
                            <el-dropdown-item command="password" :icon="EditPen">重置密码</el-dropdown-item>
                            <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </el-header>
            <!-- 中间区域 -->
            <el-main>
                <div>
                    <router-view></router-view>
                </div>
            </el-main>
            <!-- 底部区域 -->
            <el-footer>问卷调查管理系统 ©2025 Created by 饭得标</el-footer>
        </el-container>
    </el-container>
</template>

<style lang="scss" scoped>
.layout-container {
    height: 100vh;

    .el-aside {
        background-color: #232323;

        &__logo {
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 20px;
            font-weight: 550;
        }

        .el-menu {
            border-right: none;
        }
    }

    .el-header {
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .el-dropdown__box {
            display: flex;
            align-items: center;

            .el-icon {
                color: #999;
                margin-left: 10px;
            }

            &:active,
            &:focus {
                outline: none;
            }
        }
    }

    .el-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #666;
    }
}
</style>