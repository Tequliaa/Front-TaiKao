import { createRouter, createWebHistory } from 'vue-router'
// import HomeView from '../views/HomeView.vue'
//导入组件
import LoginVue from '@/views/Login.vue'
import LayoutVue from '@/views/Layout.vue'
import DepartmentVue from '@/views/manage/Department.vue'
import QuestionVue from '@/views/manage/Question.vue'
import CategoryVue from '@/views/manage/Category.vue'
import OptionVue from '@/views/manage/Option.vue'
import SurveyVue from '@/views/manage/Survey.vue'
import UserVue from '@/views/manage/User.vue'
import UserInfoVue from '@/views/user/UserInfo.vue'
import UserAvatarVue from '@/views/user/UserAvatar.vue'
import UserResetPasswordVue from '@/views/user/UserResetPassword.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginVue },
    { 
      path: '/', 
      component: LayoutVue,
      //重定向  默认打开的路由
      redirect: '/manage/survey',
      //子路由
      children:[
        { path: '/manage/category',component:CategoryVue},
        { path: '/manage/department',component:DepartmentVue},
        { path: '/manage/question',component:QuestionVue},
        { path: '/manage/Option',component:OptionVue},
        { path: '/manage/survey',component:SurveyVue},
        { path: '/manage/user' ,component:UserVue},
        { path: '/user/info', component: UserInfoVue },
        { path: '/user/avatar', component: UserAvatarVue },
        { path: '/user/password', component: UserResetPasswordVue },
      ]
    }
    
  ],
})

export default router
