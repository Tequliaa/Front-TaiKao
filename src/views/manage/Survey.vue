<script setup>
import {
    Edit,
    Delete,
    Pointer
} from '@element-plus/icons-vue'

import { nextTick } from 'vue';
import { ref } from 'vue'
//问卷列表查询
import { surveyListService, surveyAddService, surveyDelService, surveyUpdateService } from '@/api/survey.js'
//导入接口函数
import { userInfoGetService } from '@/api/user.js'
//导入pinia
import { useUserInfoStore } from '@/stores/user.js'

//富文本编辑器
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

import { ElMessage, ElMessageBox } from 'element-plus'
// import { name } from 'element-plus/dist/locale/zh-cn'
import SurveyPreview from './SurveyPreview.vue'

const userInfoStore = useUserInfoStore();

//获取个人信息
const getUserInf = async () => {
    let result = await userInfoGetService();
    //存储pinia
    userInfoStore.info = result.data;
}

//获取用户基本信息
getUserInf()

//问卷数据模型
const surveys = ref([
    {
        "surveyId": 1,
        "name": "早餐调查问卷",
        "createdByName": "张三",
        "status": "草稿",
        "allowView": "1",
    }
])

//分页条数据模型
const pageNum = ref(1)//当前页
const total = ref(20)//总条数
const pageSize = ref(8)//每页条数
const keyword = ref('')
const getSurveys = async () => {
    let params = {
        keyword: keyword.value,
        pageNum: pageNum.value,
        pageSize: pageSize.value
    }
    let result = await surveyListService(params);
    //渲染总条数
    total.value = result.data.totalCount
    //渲染列表数据
    surveys.value = result.data.surveys
}
getSurveys()
console.log("123")
//当每页条数发生了变化，调用此函数
const onSizeChange = (size) => {
    pageSize.value = size;
    getSurveys();
}
//当前页码发生变化，调用此函数
const onCurrentChange = (num) => {
    pageNum.value = num;
    getSurveys()
}

//在survey.vue中标识是添加问卷还是编辑问卷
const addSurveyFlag = ref(true);

//控制抽屉是否显示
const visibleDrawer = ref(false)

//添加表单数据模型
const surveyModel = ref({
    surveyId: '',
    name: '',
    description:'',
    createdByName: '',
    status: '',
    allowView: '',
    userId: '',
})

//打开添加问卷窗口
const openAddDialog = () => {
    surveyModel.value = {};
    visibleDrawer.value = true;
    addSurveyFlag.value = true;
       // 使用 Vue 的 nextTick 确保 DOM 更新完成后再清空编辑器内容
       nextTick(() => {
        const editor = document.querySelector('.ql-editor');
        if (editor) editor.innerHTML = ''; // 清空编辑器内容
    });
    console.log('surveyModel: '+surveyModel.value.description)
}

//添加问卷处理逻辑
const addSurvey = async () => {
    surveyModel.value.userId = userInfoStore.info.id
    let result = await surveyAddService(surveyModel.value);
    ElMessage.success(result.message ? result.message : '添加成功')
    //再次调用getSurveys,获取问卷
    getSurveys()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    surveyModel.value = {};
}

//删除问卷
const delsurvey = (row) => {
    ElMessageBox.confirm(
        '你确认删除该问卷吗？',
        '温馨提示',
        {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(async () => {
            //用户点击了确认
            let result = await surveyDelService(row.surveyId)
            ElMessage({
                type: 'success',
                message: '删除成功',
            })
            //再次调用再次调用getSurveys，获取问卷
            getSurveys()
        })
        .catch(() => {
            //用户点击了取消
            ElMessage({
                type: 'info',
                message: '取消删除',
            })
        })
}

//修改问卷回显
const editSurveyEcho = (row) => {
    //操作改为编辑
    addSurveyFlag.value = false;
    //显示抽屉
    visibleDrawer.value = true
    surveyModel.value = row;
    // console.log('surveyModel: '+surveyModel.value.description)
}

//修改问卷
const editSurvey = async () => {
    surveyModel.value.userId = userInfoStore.info.id
    let result = await surveyUpdateService(surveyModel.value);
    ElMessage.success(result.message ? result.message : '修改成功')
    //再次调用getSurveys,获取问卷
    getSurveys()
    //隐藏抽屉
    visibleDrawer.value = false

    //清空页面数据
    surveyModel.value = {};
}

const options = [
  {
    value: 1,
    label: '是',
  },
  {
    value: 0,
    label: '否',
  }
]
import { debounce } from 'lodash';

const handleInputChange = debounce(() => {
    console.log("触发函数了")
    getSurveys()
    }, 500);  // 延时 500ms

const getPlainText = (htmlContent)=> {
      // 使用正则去掉 HTML 标签，获取纯文本
      const div = document.createElement('div');
      div.innerHTML = htmlContent;
      return div.textContent || div.innerText || '';
}

// 预览对话框控制
const previewVisible = ref(false)
const currentSurveyId = ref(null)

// 打开预览
const openPreview = (row) => {
    currentSurveyId.value = row.surveyId
    previewVisible.value = true
}
</script>
<template>
    <el-card class="page-container">
        <template #header>
            <div class="header">
                <span>问卷管理</span>
                <div class="extra">
                    <el-input v-model="keyword"  @input="handleInputChange" placeholder="请输入问卷名称或描述" />
                    <el-button type="primary" @click="openAddDialog()">添加问卷</el-button>
                </div>
            </div>
        </template>

        <!-- 问卷列表 -->
        <el-table :data="surveys" style="width: 100%">
            <!-- <el-table-column label="序号" prop="surveyId"></el-table-column> -->
            <el-table-column label="序号" style="text-align: center;" align="center" width="100" type="index"></el-table-column>
            <el-table-column label="问卷名称" style="text-align: center;" align="center" prop="name"></el-table-column>
            <el-table-column label="创建人" style="text-align: center;" align="center" prop="createdByName"> </el-table-column>
            <el-table-column label="状态" style="text-align: center;" align="center" prop="status"></el-table-column>
            <el-table-column label="答后允许查看" style="text-align: center;" align="center" prop="allowView">
                <template #default="{ row }">{{ row.allowView === 1 ? '是' : '否' }}
                </template>
            </el-table-column>
            <el-table-column label="操作" style="text-align: center;" align="center" width="150">
                <template #default="{ row }">
                    <el-tooltip content="预览" placement="top">
                        <el-button :icon="Pointer" circle plain type="primary" @click="openPreview(row)"></el-button>
                    </el-tooltip>
                    <el-tooltip content="编辑" placement="top">
                        <el-button :icon="Edit" circle plain type="primary" @click="editSurveyEcho(row)"></el-button>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                        <el-button :icon="Delete" circle plain type="danger" @click="delsurvey(row)"></el-button>
                    </el-tooltip>          
                </template>
            </el-table-column>

            <template #empty>
                <el-empty description="没有数据" />
            </template>
        </el-table>

        <!-- 分页条 -->
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[3, 5, 10, 15]"
            layout="jumper, total, sizes, prev, pager, next" background :total="total" @size-change="onSizeChange"
            @current-change="onCurrentChange" style="margin-top: 20px; justify-content: flex-end" />
    </el-card>


    <!-- 抽屉 -->
    <el-drawer v-model="visibleDrawer" :title="addSurveyFlag ? '添加问卷' : '编辑问卷'" direction="rtl" size="50%">
        <!-- 添加问卷表单 -->
        <el-form :model="surveyModel" label-width="100px">
            <el-form-item label="问卷名称">
                <el-input v-model="surveyModel.name" placeholder="请输入问卷名称"></el-input>
            </el-form-item>
            <el-form-item label="问卷描述">
                <div class="editor">
                    <quill-editor theme="snow" v-model:content="surveyModel.description" contentType="html">
                    </quill-editor>
                </div>
            </el-form-item>
            <el-form-item label="答完再次查看">
                <el-select v-model="surveyModel.allowView" clearable placeholder="答完是否可再次查看">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"/>
                </el-select>
            </el-form-item>

            
            <el-form-item>
                <el-button type="primary" @click="addSurveyFlag ? addSurvey() : editSurvey()">{{ addSurveyFlag ?
                        "添加" :
                        "修改" }}</el-button>
                <el-button type="info" @click="visibleDrawer = false">取消</el-button>
            </el-form-item>
        </el-form>
    </el-drawer>

    <!-- 预览对话框 -->
    <el-dialog
        v-model="previewVisible"
        title="问卷预览"
        width="80%"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="true">
        <SurveyPreview v-if="currentSurveyId" :surveyId="currentSurveyId" />
    </el-dialog>
</template>
<style lang="scss" scoped>
.page-container {
    min-height: 100%;
    box-sizing: border-box;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .extra {
        display: flex;
        align-items: center;  /* 确保垂直居中对齐 */
        gap: 10px;  /* 在所有子元素之间添加 10px 的间隔 */
    }

    .el-input {
        width: 240px;  /* 输入框的宽度 */
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