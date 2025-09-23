import { createRouter, createWebHistory } from 'vue-router'
// import HomeView from '../views/HomeView.vue'
//导入组件
import LoginVue from '@/views/Login.vue'
import LayoutVue from '@/views/Layout.vue'
import DepartmentVue from '@/views/manage/Department.vue'
import QuestionVue from '@/views/manage/Question.vue'
import CategoryVue from '@/views/manage/Category.vue'
import OptionVue from '@/views/manage/Option.vue'
import UserVue from '@/views/manage/User.vue'
import UserExamVue from '@/views/manage/UserExam.vue'
import UserInfoVue from '@/views/user/UserInfo.vue'
import UserAvatarVue from '@/views/user/UserAvatar.vue'
import UserResetPasswordVue from '@/views/user/UserResetPassword.vue'
import ResponseVue from '@/views/manage/ResponseList.vue'
import UnfinishedListVue from '@/views/manage/UnfinishedList.vue'
import RoleVue from '@/views/manage/Role.vue'
import PermissionVue from '@/views/manage/Permission.vue'
import ExamVue from '@/views/exam/Exam.vue'
import ExamBuilder from '@/views/exam/ExamBuilder.vue'
import ExamPreview from '@/views/exam/ExamPreview.vue'
import ExamBuildPreview from '@/views/exam/ExamBuildPreview.vue'
import ExamWrite from '@/views/exam/ExamWrite.vue'
import ExamStatistics from '@/views/exam/ExamStatistics.vue'
import ExamView from '@/views/exam/ExamView.vue'

// import ExamBuild from '@/views/exam/ExamBuild.vue'

const routes = [
  { path: '/login', component: LoginVue },
  { 
    path: '/', 
    component: LayoutVue,
    redirect: '/manage/userExam',
    children:[
      { path: '/manage/role',component:RoleVue},
      { path: '/manage/permission',component:PermissionVue},
      { path: '/exam/exam',component:ExamVue},
      { path: '/exam/builder/:examId?',component:ExamBuilder,props:true,name:'ExamBuilder'},
      { path: '/exam/examPreview/:examId?',component:ExamPreview,props:true,name:'ExamPreview'},
      { path: '/exam/examBuildPreview/:examId?',component:ExamBuildPreview,props:true,name:'ExamBuildPreview'},
      { path: '/exam/examWrite/:examId?',component:ExamWrite,props:true,name:'ExamWrite'},
      { path: '/exam/examStatistics/:examId?/:departmentId?',component:ExamStatistics,props:true,name:'ExamStatistics'},
      { path: '/manage/unfinishedList/:examId/:departmentId?/:examName?/:departmentName?',component:UnfinishedListVue,props:true,name:'UnfinishedList'},
      { path: '/manage/response/:examId?/:examName?',component:ResponseVue,props:true,name:'Response'},
      { path: '/manage/userExam/:userId?/:username?',component:UserExamVue,props:true,name:'UserExam'},
      { path: '/exam/examView/:examId?/:examName?',component:ExamView,props:true,name:'ExamView'},
      { path: '/manage/category',component:CategoryVue},
      { path: '/manage/department',component:DepartmentVue},
      { path: '/manage/question/:examId?/:examName?',component:QuestionVue,props:true,name:'Question'},
      { path: '/manage/option/:questionId?/:questionName?',component:OptionVue,props:true,name:'Option'},
      { path: '/manage/user/:departmentId?/:departmentName?' ,component:UserVue,props:true,name:'User'},
      { path: '/user/info', component: UserInfoVue },
      { path: '/user/avatar', component: UserAvatarVue },
      { path: '/user/password', component: UserResetPasswordVue },
      // { path: '/exam/builder', name: 'ExamBuilder', component: ExamBuilder, meta: { title: '问卷构建器', icon: 'edit' } },
      // { path: '/exam/builder/:id', name: 'ExamBuilderEdit', component: ExamBuilder, meta: { title: '编辑问卷', icon: 'edit' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
