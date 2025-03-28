<script setup>
import { ref } from 'vue'
import { useUserInfoStore } from '@/stores/user.js';
import { userUpdateService } from '@/api/user';
import { ElMessage } from 'element-plus';
const userInfoStore = useUserInfoStore()

const userInfo = ref({ ...userInfoStore.info });
const updateName = async () => {
    let result = await userUpdateService(userInfo.value)
    ElMessage.success(result.message ? result.message : '修改成功')
    /* //更新pinia中的数据
    userInfoStore.info.nickname = userInfo.value.nickname
    userInfoStore.info.email = userInfo.value.email */
}


</script>
<template>
    <el-card class="page-container">
        <template #header>
            <div class="header">
                <span>基本资料</span>
            </div>
        </template>
        <el-row>
            <el-col :span="12">
                <el-form :model="userInfo" label-width="100px" size="large">
                    <el-form-item label="昵称">
                        <el-input v-model="userInfo.name" disabled></el-input>
                    </el-form-item>
                    <el-form-item label="修改昵称">
                        <el-input v-model="userInfo.name"></el-input>
                    </el-form-item>
                    <!-- <el-form-item label="用户邮箱">
                        <el-input v-model="userInfo.email" disabled></el-input>
                    </el-form-item> -->
                    <el-form-item>
                        <el-button type="primary" @click="updateName">提交修改</el-button>
                    </el-form-item>
                </el-form>
            </el-col>
        </el-row>
    </el-card>
</template>