//定制请求的实例

//导入axios  npm install axios
import axios from 'axios';
import { ElMessage } from 'element-plus'
//导入token状态
import { useTokenStore } from '@/stores/token.js';
//
import router from '@/router'

//定义一个变量,记录公共的前缀  ,  baseURL
const baseURL = '/api';
const instance = axios.create({ baseURL })

//添加请求拦截器
instance.interceptors.request.use(
    (config)=>{
        //在发送请求之前做什么
        let tokenStore = useTokenStore()
        //如果token中有值，在携带
        if(tokenStore.token){
            config.headers.Authorization=tokenStore.token
        }
        // console.log("token: "+tokenStore.token)
        return config
    },
    (err)=>{
        //如果请求错误做什么
        Promise.reject(err)
    }
)

// 响应拦截器
instance.interceptors.response.use(
    result => {
        // 如果是Blob响应（如文件下载），直接返回原始响应
        if (result.config.responseType === 'blob' || result.data instanceof Blob) {
            return result;
        }
        
        // 普通JSON响应处理
        if (result.data.code == 0) {
            return result.data;
        }
        
        ElMessage.error(result.data.message || '服务异常');
        return Promise.reject(result.data);
    },
    err => {
        // 处理Blob类型的错误响应
        if (err.response && err.config.responseType === 'blob') {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        ElMessage.error(errorData.message || '服务异常');
                        reject(errorData);
                    } catch (e) {
                        ElMessage.error('文件处理失败');
                        reject(new Error('文件处理失败'));
                    }
                };
                reader.readAsText(err.response.data);
            });
        }
        
        if(err.response?.status === 401){
            ElMessage.error('请先登录！')
            router.push('/login')
        }else{
            ElMessage.error('服务异常');
        }
        return Promise.reject(err);
    }
);

export default instance;