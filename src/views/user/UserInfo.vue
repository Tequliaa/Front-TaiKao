<script setup>
import { ref } from 'vue'
import { useUserInfoStore } from '@/stores/user.js';
const userInfoStore = useUserInfoStore()

const userInfo = ref({ ...userInfoStore.info });



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
                    <el-form-item label="登录名称">
                        <el-input v-model="userInfo.username" disabled></el-input>
                    </el-form-item>
                    <el-form-item label="用户邮箱">
                        <el-input v-model="userInfo.email" disabled></el-input>
                    </el-form-item>
                    <!-- <el-form-item>
                        <el-button type="primary">提交修改</el-button>
                    </el-form-item> -->
                </el-form>
            </el-col>
        </el-row>
    </el-card>
</template>