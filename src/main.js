import './assets/main.scss'
import './styles/responsive.scss'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
//导入持久化插件
import {createPersistedState} from'pinia-persistedstate-plugin'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

//中文语言包
import locale from 'element-plus/dist/locale/zh-cn.js'


import App from './App.vue'
import router from './router'
// 导入权限指令
import { permission, role } from './directives/permission.js'

const app = createApp(App)

const pinia = createPinia()
const persist = createPersistedState()
//pinia使用持久化插件
pinia.use(persist)
app.use(pinia)
app.use(router)
// app.use(ElementPlus)

// 使用中文语言包
app.use(ElementPlus,{locale})

// 注册权限指令
app.directive('permission', permission)
app.directive('role', role)

app.mount('#app')
