<template>
    <div class="loading-wrapper">
        <el-skeleton :loading="loading" animated :rows="10">
            <template #default>
                <slot></slot>
            </template>
        </el-skeleton>
    </div>
</template>


<script setup>
defineProps({
    loading: {
        type: Boolean,
        required: true
    }
})
</script>

<style lang="scss" scoped>
.loading-wrapper {
    min-height: 100vh;
    background-color: #f8f9fa;
}
</style>