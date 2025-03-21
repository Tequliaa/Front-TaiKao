//导入request.js请求工具
import request from '@/utils/request.js'


//获取一级分类
export const getParentCategories = () => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/student/category?action=getParentCategories')
}

//获取全部分类
export const getAllCategoriesService = () => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/student/category?action=getAll')
}

//分类查询
export const categoryListService = (params) => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/student/category?action=list',{params})
}


//添加分类
export const categoryAddService = (categoryModel)=>{
 /*  var params = new URLSearchParams()
  for (let key in categoryModel) {
    params.append(key, categoryModel[key])
  } */
  return request.put('/student/category',categoryModel)
}

//删除分类
export const categoryDelService = (id)=>{
  return request.post('/student/category?action=delete&categoryId='+id)
}

//更新分类
export const categoryUpdateService = (categoryModel)=>{
   var params = new URLSearchParams()
   for (let key in categoryModel) {
     params.append(key, categoryModel[key])
   }
   return request.post('/student/category?action=update',params)
 }