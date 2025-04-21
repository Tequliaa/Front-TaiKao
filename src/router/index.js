import { createRouter, createWebHistory } from 'vue-router'
// import HomeView from '../views/HomeView.vue'
//导入组件
import LoginVue from '@/views/Login.vue'
import LayoutVue from '@/views/Layout.vue'
import DepartmentVue from '@/views/manage/Department.vue'
import QuestionVue from '@/views/manage/Question.vue'
import CategoryVue from '@/views/manage/Category.vue'
import OptionVue from '@/views/manage/Option.vue'
import SurveyVue from '@/views/survey/Survey.vue'
import UserVue from '@/views/manage/User.vue'
import UserSurveyVue from '@/views/manage/UserSurvey.vue'
import UserInfoVue from '@/views/user/UserInfo.vue'
import UserAvatarVue from '@/views/user/UserAvatar.vue'
import UserResetPasswordVue from '@/views/user/UserResetPassword.vue'
import ResponseVue from '@/views/manage/ResponseList.vue'
import SurveyWriteVue from '@/views/survey/SurveyWrite.vue'
import SurveyViewVue from '@/views/survey/SurveyView.vue'
import SurveyStatisticsVue from '@/views/survey/SurveyStatistics.vue'
import UnfinishedListVue from '@/views/manage/UnfinishedList.vue'
import SurveyBuilder from '@/views/survey/SurveyBuilder.vue'
import SurveyPreview from '@/views/survey/SurveyPreview.vue'
// import SurveyBuild from '@/views/survey/SurveyBuild.vue'

const routes = [
  { path: '/login', component: LoginVue },
  { 
    path: '/', 
    component: LayoutVue,
    redirect: '/manage/userSurvey',
    children:[
      { path: '/survey/surveyPreview/:surveyId',component:SurveyPreview,props:true,name:'SurveyPreview'},
      { path: '/survey/builder/:surveyId?',component:SurveyBuilder,props:true,name:'SurveyBuilder'},
      { path: '/manage/unfinishedList/:surveyId/:departmentId?/:surveyName?/:departmentName?',component:UnfinishedListVue,props:true,name:'UnfinishedList'},
      { path: '/survey/surveyStatistics/:surveyId/:departmentId?/:departmentName?',component:SurveyStatisticsVue,props:true,name:'SurveyStatistics'},
      { path: '/survey/surveyView/:surveyId/:userId?/:userName?',component:SurveyViewVue,props:true,name:'SurveyView'},
      { path: '/survey/surveyWrite/:surveyId?',component:SurveyWriteVue,props:true,name:'SurveyWrite'},
      { path: '/manage/response/:surveyId?/:surveyName?',component:ResponseVue,props:true,name:'Response'},
      { path: '/manage/userSurvey/:userId?/:username?',component:UserSurveyVue,props:true,name:'UserSurvey'},
      { path: '/manage/category',component:CategoryVue},
      { path: '/manage/department',component:DepartmentVue},
      { path: '/manage/question/:surveyId?/:surveyName?',component:QuestionVue,props:true,name:'Question'},
      { path: '/manage/option/:questionId?/:questionName?',component:OptionVue,props:true,name:'Option'},
      { path: '/survey/survey',component:SurveyVue},
      { path: '/manage/user/:departmentId?/:departmentName?' ,component:UserVue,props:true,name:'User'},
      { path: '/user/info', component: UserInfoVue },
      { path: '/user/avatar', component: UserAvatarVue },
      { path: '/user/password', component: UserResetPasswordVue },
      // { path: '/survey/builder', name: 'SurveyBuilder', component: SurveyBuilder, meta: { title: '问卷构建器', icon: 'edit' } },
      // { path: '/survey/builder/:id', name: 'SurveyBuilderEdit', component: SurveyBuilder, meta: { title: '编辑问卷', icon: 'edit' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
