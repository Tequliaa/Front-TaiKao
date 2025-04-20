<script setup>
import {
    Edit,
    Delete,
    Pointer
} from '@element-plus/icons-vue'

import { nextTick, onMounted,computed, watch ,reactive} from 'vue';
import { ref } from 'vue'
//分类列表查询
import { getParentCategories, categoryListService, categoryAddService, categoryDelService, categoryUpdateService } from '@/api/category.js'
//导入接口函数
import { userInfoGetService } from '@/api/user.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'

//富文本编辑器
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

import { ElMessage, ElMessageBox } from 'element-plus'
// import { name } from 'element-plus/dist/locale/zh-cn'
import LoadingWrapper from '@/components/LoadingWrapper.vue'

const userInfoStore = useUserInfoStore();

//获取个人信息
const getUserInf = async () => {
    let result = await userInfoGetService();
    //存储pinia
    userInfoStore.info = result.data;
}

//获取用户基本信息
getUserInf()

//分类数据模型
const categories = ref([
    {
        "categoryId": 1,
        "categoryName": "早餐调查分类",
        "parentCategoryName": "张三",
        "description": "这是什么相关的分类",
        "categoryLevel": "1"
    }
])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(8)//每页条数
const keyword = ref('')

// 添加加载状态
const loading = ref(true)

// 修改获取分类数据的方法
const getCategories = async () => {
    try {
        let params = {
            userId:userInfoStore.info.id,
            keyword: keyword.value,
            pageNum: pageNum.value,
            pageSize: pageSize.value
        }
        let result = await categoryListService(params);
        //渲染总条数
        total.value = result.data.totalCount
        //渲染列表数据
        categories.value = result.data.categories
    } catch (error) {
        ElMessage.error('获取分类列表失败')
    }
}

// 初始化数据
const initData = async () => {
    loading.value = true
    try {
        await Promise.all([
            getUserInf(),
            getCategories(),
            getparentCategories()
        ])
    } finally {
        loading.value = false
    }
}

// 在组件挂载时初始化数据
onMounted(() => {
    initData()
    window.addEventListener('resize', () => {
        // 强制更新组件
        nextTick(() => {
            // 这里不需要做任何事情，computed 属性会自动重新计算
        });
    });
})

const parentCategories = ref({
})

const getparentCategories = async () => {
    let result = await getParentCategories(userInfoStore.info.id);
    parentCategories.value = result.data;
}


console.log("123")
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getCategories();
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getCategories()
}

//在category.vue中标识是添加分类还是编辑分类
const addCategoryFlag = ref(true);

//控制抽屉是否显示
const visibleDrawer = ref(false)

//添加表单数据模型
const categoryModel = ref({
    categoryId: '',
    categoryName: '',
    categoryLevel: 1, // 设置默认层级为1
    parentCategoryId: '',
    parentCategoryName: '',
    description: '',
    userId: '',
})




//打开添加分类窗口
const openAddDialog = () => {
    getparentCategories();
    categoryModel.value = {
        categoryLevel: 1, // 设置默认层级为1
    };
    visibleDrawer.value = true;
    addCategoryFlag.value = true;
       // 使用 Vue 的 nextTick 确保 DOM 更新完成后再清空编辑器内容
       nextTick(() => {
        const editor = document.querySelector('.ql-editor');
        if (editor) editor.innerHTML = ''; // 清空编辑器内容
    });
    console.log('categoryModel: '+categoryModel.value.description)
}

//添加分类处理逻辑
const addCategory = async () => {
    categoryModel.value.createdBy = userInfoStore.info.id
    let result = await categoryAddService(categoryModel.value);
    ElMessage.success(result.message ? result.message : '添加成功')
    //再次调用getCategories,获取分类
    getCategories()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    categoryModel.value = {};
}

//删除分类
const delCategory = (row) => {
    ElMessageBox.confirm(
        '你确认删除该分类吗？',
        '温馨提示',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(async () => {
            //用户点击了确认
            let result = await categoryDelService(row.categoryId)
            ElMessage({
                type: 'success',
                message: '删除成功',
            })
            //再次调用再次调用getCategories，获取分类
            getCategories()
        })
        .catch(() => {
            //用户点击了取消
            ElMessage({
                type: 'info',
                message: '取消删除',
            })
        })
}

//修改分类回显
const editCategoryEcho = (row) => {
    getparentCategories();
    //操作改为编辑
    addCategoryFlag.value = false;
    //显示抽屉
    visibleDrawer.value = true
    categoryModel.value = row;
    // console.log('categoryModel: '+categoryModel.value.description)
}

//修改分类
const editCategory = async () => {
    categoryModel.value.userId = userInfoStore.info.id
    let result = await categoryUpdateService(categoryModel.value);
    ElMessage.success(result.message ? result.message : '修改成功')
    //再次调用getCategories,获取分类
    getCategories()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    categoryModel.value = {};
}
import { debounce } from 'lodash';

const handleInputChange = debounce(() => {
    console.log("触发函数了")
    getCategories()
    }, 500);  // 延时 500ms

const levelOptions = [
  {
    value: 1,
    label: '1级分类',
  },
  {
    value: 2,
    label: '2级分类',
  }
]

const getPlainText = (htmlContent)=> {
      // 使用正则去掉 HTML 标签，获取纯文本
      const div = document.createElement('div');
      div.innerHTML = htmlContent;
      return div.textContent || div.innerText || '';
    }

// 检测是否为移动设备
const isMobile = computed(() => {
    return window.innerWidth <= 768;
})

onMounted(() => {
window.addEventListener('resize', () => {
        // 强制更新组件
        nextTick(() => {
            // 这里不需要做任何事情，computed 属性会自动重新计算
        });
    });
})
</script>
<template>
    <LoadingWrapper :loading="loading">
        <el-card class="page-container">
            <template #header>
                <div class="header">
                    <span>分类管理</span>
                    <div class="extra">
                        <el-input v-model="keyword"  @input="handleInputChange" placeholder="请输入分类名称或描述" />
                        <el-button type="primary" @click="openAddDialog()" class="hide-on-mobile">添加分类</el-button>
                    </div>
                </div>
            </template>

            <!-- 分类列表 -->
            <el-table :data="categories" style="width: 100%">
                <!-- <el-table-column label="序号" prop="categoryId"></el-table-column> -->
                <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
                <el-table-column label="分类名称" style="text-align: center;" align="center" prop="categoryName"></el-table-column>
                <el-table-column label="分类描述" style="text-align: center;" align="center">
                    <template #default="scope">
                    <!-- 通过 row.description 获取每行数据的部门介绍，并去掉 HTML 标签 -->
                    <span>{{ getPlainText(scope.row.description) }}</span>
                </template>
                </el-table-column>
                <el-table-column label="上级分类" style="text-align: center;" align="center" prop="parentCategoryName">
                    <template #default="{ row }">{{ row.parentCategoryName === null ? '无' : row.parentCategoryName }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" style="text-align: center;" align="center" width="150">
                    <template #default="{ row }">
                        <el-tooltip content="查看" placement="top">
                            <el-button :icon="Pointer" circle plain type="primary"></el-button>
                        </el-tooltip>
                        <el-tooltip content="编辑" placement="top">
                            <el-button :icon="Edit" circle plain type="primary" @click="editCategoryEcho(row)"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button :icon="Delete" circle plain type="danger" @click="delCategory(row)"></el-button>
                        </el-tooltip>          
                    </template>
                </el-table-column>

                <template #empty>
                    <el-empty description="没有数据" />
                </template>
            </el-table>

            <!-- 分页条 -->
            <el-pagination 
                v-model:current-page="pageNum" 
                v-model:page-size="pageSize" 
                :page-sizes="[3, 5, 10, 15]"
                :layout="isMobile ? 'prev, pager, next' : 'jumper, total, sizes, prev, pager, next'" 
                background 
                :pager-count="5"
                :total="total" 
                @size-change="onSizeChange"
                @current-change="onCurrentChange" 
                class="pagination-container" />
        </el-card>
    </LoadingWrapper>


    <!-- 抽屉 -->
    <el-drawer v-model="visibleDrawer" :title="addCategoryFlag ? '添加分类' : '编辑分类'" direction="rtl" size="50%">
        <!-- 添加分类表单 -->
        <el-form :model="categoryModel" label-width="100px">
            <el-form-item label="分类名称">
                <el-input v-model="categoryModel.categoryName" placeholder="请输入分类名称"></el-input>
            </el-form-item>

            <el-form-item label="分类描述">
                <div class="editor">
                    <quill-editor theme="snow" v-model:content="categoryModel.description" content-type="html">
                    </quill-editor>
                </div>
            </el-form-item>
            <el-form-item label="分类层级">
                <el-select v-model="categoryModel.categoryLevel" clearable placeholder="请选择分类等级">
                    <el-option v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>
            <el-form-item label="上级分类" v-if="categoryModel.categoryLevel === 2">
                <el-select v-model="categoryModel.parentCategoryId" clearable placeholder="请选择上级分类">
                    <el-option v-for="item in parentCategories" :key="item.categoryId" :label="item.categoryName" :value="item.categoryId"/>
                </el-select>
            </el-form-item>


            
            <el-form-item>
                <el-button type="primary" @click="addCategoryFlag ? addCategory() : editCategory()">{{ addCategoryFlag ?
                        "添加" :
                        "修改" }}</el-button>
                <el-button type="info" @click="visibleDrawer = false">取消</el-button>
            </el-form-item>
        </el-form>
    </el-drawer>
</template>
<style lang="scss" scoped>
.page-container {
    min-height: 100%;
    box-sizing: border-box;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap; /* 允许在移动端换行 */
        gap: 10px; /* 添加间距 */
        
        span {
            font-size: 16px;
            font-weight: 500;
            white-space: nowrap; /* 防止文字换行 */
        }
    }
    
    .extra {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap; /* 允许在移动端换行 */
    }

    .el-input {
        width: 240px; /* 输入框的宽度 */
    }
    
    /* 移动端响应式样式 */
    @media (max-width: 768px) {
        .header {
            flex-direction: column;
            align-items: flex-start;
            
            span {
                margin-bottom: 10px;
            }
        }
        
        .extra {
            width: 100%;
            justify-content: space-between;
            
            .el-input {
                width: 100%;
                margin-bottom: 10px;
            }
            
            .el-button {
                width: 100%;
            }
        }
    }
}
/* 分页样式 */
:deep(.pagination-container) {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    
    @media (max-width: 768px) {
        justify-content: center;
    }
}
/* 隐藏移动端元素 */
:deep(.hide-on-mobile) {
    @media (max-width: 768px) {
        display: none !important;
    }
}
/* 抽屉样式 */
.avatar-uploader {
    :deep() {
        .avatar {
            width: 178px;
            height: 178px;
            display: block;
        }

        .el-upload {
            border: 1px dashed var(--el-border-color);
            border-radius: 6px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: var(--el-transition-duration-fast);
        }

        .el-upload:hover {
            border-color: var(--el-color-primary);
        }

        .el-icon.avatar-uploader-icon {
            font-size: 28px;
            color: #8c939d;
            width: 178px;
            height: 178px;
            text-align: center;
        }
    }
}

.editor {
    width: 100%;

    :deep(.ql-editor) {
        min-height: 200px;
    }
}
</style>