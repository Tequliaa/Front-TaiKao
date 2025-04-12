<script setup>
import { User, Lock } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { registerService, loginService } from '@/api/user.js'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
//导入token状态
import { useTokenStore } from '@/stores/token.js'

//控制注册与登录表单的显示， 默认显示注册
const isRegister = ref(false)
//用于设置路由切换
const router = useRouter();

//调用useTokenStore得到状态
const tokenStore = useTokenStore();

//用于注册的数据模型
const registerData = ref({
    username: '',
    password: '',
    rePassword: '',
    departmentId: 0
})
//自定义确认密码的校验函数
const rePasswordValid = (rule, value, callback) => {
    if (value == null || value === '') {
        callback(new Error('请再次确认密码'))
    } else if (registerData.value.password !== value) {
        callback(new Error('两次输入密码不一致'))
    } else {
        callback()
    }
}
//用于注册的表单校验模型
const registerDataRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 16, message: '用户名的长度必须为2~16位', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 3, max: 16, message: '密码长度必须为3~16位', trigger: 'blur' }
    ],
    rePassword: [
        { validator: rePasswordValid, trigger: 'blur' }
    ]
}

//用于注册的事件函数
const register = async () => {
    //console.log('注册...');
    let result = await registerService(registerData.value);
    if (result.code == 0) {
        ElMessage.success(result.message ? result.message : '注册成功');
        isRegister.value = false;
        //清空数据模型
        clearRegisterData();
    } else {
        ElMessage.error(result.message ? result.message : '注册失败!');
    }

}

//定义函数，清空数据模型的数据
const clearRegisterData = () => {
    registerData.value = {
        username: '',
        password: '',
        rePassword: ''
    }
}
//用于登录的事件函数
const login = async () => {
    let result = await loginService(registerData.value)
    if (result.code == 0) {

        //保存token
        tokenStore.setToken(result.data)

        // alert('登录成功!')
        ElMessage.success(result.message ? result.message : '登录成功!');
        router.push('/')
    } else {
        //alert('登录失败!')
        ElMessage.error(result.message ? result.message : '登录失败!');
    }
}
</script>

<template>
    <div class="login-container">
        <div class="login-box">
            <div class="login-left">
                <div class="login-banner">
                    <h1 class="banner-title">问卷调查平台</h1>
                    <p class="banner-subtitle">专业的问卷设计与数据分析工具</p>
                    <div class="banner-features">
                        <div class="feature-item">
                            <i class="el-icon-document"></i>
                            <span>多样化问卷模板</span>
                        </div>
                        <div class="feature-item">
                            <i class="el-icon-data-analysis"></i>
                            <span>智能数据分析</span>
                        </div>
                        <div class="feature-item">
                            <i class="el-icon-share"></i>
                            <span>便捷分享与协作</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="login-right">
                <div class="form-container">
                    <div class="form-header">
                        <h2>{{ isRegister ? '创建账号' : '欢迎回来' }}</h2>
                        <p>{{ isRegister ? '请填写以下信息完成注册' : '请登录您的账号' }}</p>
                    </div>
                    
                    <!-- 注册表单 -->
                    <el-form ref="form" size="large" autocomplete="off" :model="registerData" v-if="isRegister"
                        :rules="registerDataRules" class="login-form">
                        <el-form-item prop="username">
                            <el-input :prefix-icon="User" placeholder="请输入用户名" v-model="registerData.username"></el-input>
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input :prefix-icon="Lock" type="password" placeholder="请输入密码"
                                v-model="registerData.password"></el-input>
                        </el-form-item>
                        <el-form-item prop="rePassword">
                            <el-input :prefix-icon="Lock" type="password" placeholder="请再次输入密码"
                                v-model="registerData.rePassword"></el-input>
                        </el-form-item>
                        <!-- 注册按钮 -->
                        <el-form-item>
                            <el-button class="submit-btn" type="primary" @click="register">
                                注册
                            </el-button>
                        </el-form-item>
                        <div class="form-footer">
                            <span>已有账号？</span>
                            <el-link type="primary" :underline="false" @click="isRegister = false; clearRegisterData();">
                                立即登录
                            </el-link>
                        </div>
                    </el-form>

                    <!-- 登录表单 -->
                    <el-form ref="form" size="large" autocomplete="off" :model="registerData" v-else :rules="registerDataRules" class="login-form">
                        <el-form-item prop="username">
                            <el-input :prefix-icon="User" placeholder="请输入用户名" v-model="registerData.username"></el-input>
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input name="password" :prefix-icon="Lock" type="password" placeholder="请输入密码"
                                v-model="registerData.password"></el-input>
                        </el-form-item>
                        <!-- 登录按钮 -->
                        <el-form-item>
                            <el-button class="submit-btn" type="primary" @click="login">登录</el-button>
                        </el-form-item>
                        <div class="form-footer">
                            <span>没有账号？</span>
                            <el-link type="primary" :underline="false" @click="isRegister = true; clearRegisterData();">
                                立即注册
                            </el-link>
                        </div>
                    </el-form>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.login-container {
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
    overflow: hidden;
}

.login-box {
    display: flex;
    width: 900px;
    height: 600px;
    background-color: #fff;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.login-left {
    flex: 1;
    background: linear-gradient(135deg, #409EFF 0%, #2c3e50 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: white;
}

.login-banner {
    text-align: center;
    
    .banner-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 16px;
        letter-spacing: 1px;
    }
    
    .banner-subtitle {
        font-size: 18px;
        opacity: 0.9;
        margin-bottom: 40px;
    }
    
    .banner-features {
        display: flex;
        flex-direction: column;
        gap: 20px;
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 16px;
            
            i {
                font-size: 24px;
            }
        }
    }
}

.login-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
}

.form-container {
    width: 100%;
    max-width: 360px;
}

.form-header {
    text-align: center;
    margin-bottom: 30px;
    
    h2 {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
    }
    
    p {
        font-size: 14px;
        color: #909399;
    }
}

.login-form {
    .el-form-item {
        margin-bottom: 24px;
    }
    
    .el-input {
        height: 50px;
        
        :deep(.el-input__wrapper) {
            box-shadow: 0 0 0 1px #dcdfe6 inset;
            border-radius: 8px;
            transition: all 0.3s;
            
            &:hover {
                box-shadow: 0 0 0 1px #c0c4cc inset;
            }
            
            &.is-focus {
                box-shadow: 0 0 0 1px #409EFF inset;
            }
        }
        
        :deep(.el-input__prefix) {
            font-size: 18px;
            color: #909399;
        }
    }
    
    .submit-btn {
        width: 100%;
        height: 50px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        margin-top: 10px;
        background: linear-gradient(90deg, #409EFF 0%, #3a8ee6 100%);
        border: none;
        transition: all 0.3s;
        
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
        }
    }
}

.form-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    font-size: 14px;
    color: #606266;
    
    .el-link {
        font-weight: 500;
    }
}

@media (max-width: 768px) {
    .login-box {
        flex-direction: column;
        width: 90%;
        height: auto;
    }
    
    .login-left {
        padding: 30px;
    }
    
    .login-right {
        padding: 30px;
    }
}
</style>