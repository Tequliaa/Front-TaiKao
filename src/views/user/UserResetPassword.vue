<script setup>
import { ref } from 'vue'
import { useUserInfoStore } from '@/stores/user.js';
import { userPasswordUpdateService } from '@/api/user.js'
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router'
const userInfoStore = useUserInfoStore()


const userInfo = ref({
    username: '',
    oldPwd: '',
    newPwd: '',
    rePwd: '',
})
userInfo.value = { ...userInfoStore.info };

//自定义确认密码的校验函数
const rePasswordValid = (rule, value, callback) => {
    if (value == null || value === '') {
        callback(new Error('请再次确认密码'))
    } else if (userInfo.value.newPwd !== value) {
        callback(new Error('两次输入密码不一致'))
    } else {
        callback()
    }
}

//修改密码表单校验
const rules = {
    oldPwd: [
        { required: true, message: '请输入旧密码', trigger: 'blur' },
        { min: 3, max: 16, message: '长度在3到16个字符', trigger: 'blur' }
    ],
    newPwd: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 3, max: 16, message: '长度在3到16个字符', trigger: 'blur' }
    ],
    rePwd: [
        { validator: rePasswordValid, trigger: 'blur' }
    ]
}
const router = useRouter();
const updateUserInfo = async () => {
    let result = await userPasswordUpdateService(userInfo.value)
    ElMessage.success(result.message ? result.message : '修改成功')
    router.push('/login')
    /* //更新pinia中的数据
    userInfoStore.info.nickname = userInfo.value.nickname
    userInfoStore.info.email = userInfo.value.email */
}

</script>
<template>
    <el-card class="page-container">
        <template #header>
            <div class="header">
                <span>修改密码</span>
            </div>
        </template>
        <el-row>
            <el-col :span="12">
                <el-form :model="userInfo" :rules="rules" label-width="100px" size="large">
                    <el-form-item label="昵称">
                        <el-input v-model="userInfo.name" disabled></el-input>
                    </el-form-item>
                    <el-form-item label="旧密码" prop="oldPwd">
                        <el-input v-model="userInfo.oldPwd" type="password"></el-input>
                    </el-form-item>
                    <el-form-item label="新密码" prop="newPwd">
                        <el-input v-model="userInfo.newPwd" type="password"></el-input>
                    </el-form-item>
                    <el-form-item label="重复密码" prop="rePwd">
                        <el-input v-model="userInfo.rePwd" type="password"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="updateUserInfo">修改</el-button>
                    </el-form-item>
                </el-form>
            </el-col>
        </el-row>
    </el-card>
</template>