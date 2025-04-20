//导入request.js请求工具
import request from '@/utils/request.js'


//获取一级分类
export const getParentCategories = () => {
  return request.get('/category/getParentCategories')
}

//获取全部分类
export const getAllCategoriesService = () => {
  return request.get('/category/getAll')
}

//根据用户获取近8条分类
export const getAllCategoriesByIdService = (userId) => {
  return request.get('/category/getAllById?userId='+userId)
}

//分类查询
export const categoryListService = (params) => {
  return request.get('/category/list',{params})
}


//添加分类
export const categoryAddService = (categoryModel)=>{
  return request.post('/category/add',categoryModel)
}

//删除分类
export const categoryDelService = (id)=>{
  return request.delete('/category/delete?categoryId='+id)
}

//更新分类
export const categoryUpdateService = (categoryModel)=>{
   return request.put('/category/update',categoryModel)
 }