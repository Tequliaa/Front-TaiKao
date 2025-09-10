<template>
  <div class="captcha-container">
    <div class="captcha-input-wrapper">
      <el-input
        v-model="captchaCode"
        placeholder="图形验证码"
        size="large"
        class="captcha-input"
        @keyup.enter="$emit('enter')"
      />
      <div class="captcha-image-wrapper" @click="refreshCaptcha">
        <img 
          v-if="captchaImage" 
          :src="captchaImage" 
          class="captcha-image"
          alt="验证码"
          title="点击刷新验证码"
        />
        <div v-else class="captcha-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getCaptchaService, verifyCaptchaService } from '@/api/captcha.js'

const emit = defineEmits(['enter', 'verified'])

// 验证码相关数据
const captchaCode = ref('')
const captchaImage = ref('')
const captchaToken = ref('')

// 获取验证码
const refreshCaptcha = async () => {
  try {
    const result = await getCaptchaService(captchaToken.value)
    if (result.code === 200) {
      captchaToken.value = result.data.token
      captchaImage.value = result.data.imageBase64
      captchaCode.value = '' // 清空输入框
    } else {
      ElMessage.error(result.message || '获取验证码失败')
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    ElMessage.error('获取验证码失败，请重试')
  }
}

// 验证验证码
const verifyCaptcha = async () => {
  if (!captchaCode.value.trim()) {
    ElMessage.warning('请输入图形验证码')
    return false
  }
  
  try {
    const result = await verifyCaptchaService({
      token: captchaToken.value,
      code: captchaCode.value
    })
    
    if (result.code === 200) {
      emit('verified', result.data)
      return true
    } else {
      ElMessage.error(result.message || '验证码错误')
      refreshCaptcha() // 验证失败后刷新验证码
      return false
    }
  } catch (error) {
    console.error('验证码验证失败:', error)
    ElMessage.error('验证码验证失败，请重试')
    refreshCaptcha()
    return false
  }
}

// 清空验证码
const clearCaptcha = () => {
  captchaCode.value = ''
}

// 组件挂载时获取验证码
onMounted(() => {
  refreshCaptcha()
})

// 暴露方法给父组件
defineExpose({
  verifyCaptcha,
  clearCaptcha,
  refreshCaptcha
})
</script>

<style lang="scss" scoped>
.captcha-container {
  width: 100%;
}

.captcha-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-input {
  flex: 1;
  
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
}

.captcha-image-wrapper {
  width: 120px;
  height: 50px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  transition: all 0.3s;
  
  &:hover {
    border-color: #409EFF;
    background-color: #f0f9ff;
  }
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.captcha-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  
  .el-icon {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .captcha-input-wrapper {
    flex-direction: column;
    gap: 8px;
  }
  
  .captcha-image-wrapper {
    width: 100%;
    height: 60px;
  }
}
</style>
