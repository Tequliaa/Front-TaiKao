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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginVue },
    { 
      path: '/', 
      component: LayoutVue,
      //重定向  默认打开的路由
      redirect: '/survey/survey',
      //子路由
      children:[
        { path: '/manage/unfinishedList/:surveyId/:departmentId?/:surveyName?',component:UnfinishedListVue,props:true,name:'UnfinishedList'},
        { path: '/survey/surveyStatistics/:surveyId/:departmentId?',component:SurveyStatisticsVue,props:true,name:'SurveyStatistics'},
        { path: '/survey/surveyView/:surveyId/:userId?/:userName?',component:SurveyViewVue,props:true,name:'SurveyView'},
        { path: '/survey/surveyWrite/:surveyId?',component:SurveyWriteVue,props:true,name:'SurveyWrite'},
        { path: '/manage/response/:surveyId?/:surveyName?',component:ResponseVue,props:true,name:'Response'},
        { path: '/manage/userSurvey/:userId?/:username?',component:UserSurveyVue,props:true,name:'UserSurvey'},
        { path: '/manage/category',component:CategoryVue},
        { path: '/manage/department',component:DepartmentVue},
        { path: '/manage/question/:surveyId?/:surveyName?',component:QuestionVue,props:true,name:'Question'},
        { path: '/manage/Option/:questionId?/:questionName?',component:OptionVue,props:true,name:'Option'},
        { path: '/survey/survey',component:SurveyVue},
        { path: '/manage/user' ,component:UserVue},
        { path: '/user/info', component: UserInfoVue },
        { path: '/user/avatar', component: UserAvatarVue },
        { path: '/user/password', component: UserResetPasswordVue },
      ]
    }
    
  ],
})

export default router
