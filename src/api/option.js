//导入request.js请求工具
import request from '@/utils/request.js'


//选项列表查询
export const optionListService = (params) => {
  return request.get('/option/list',{params})
}


//添加选项
export const optionAddService = (optionModel)=>{
  return request.post('/option/add',optionModel)
}

//删除选项
export const optionDelService = (id)=>{
  return request.delete('/option/delete',{params:{optionId:id}})
}

//更新选项
export const optionUpdateService = (optionModel)=>{
   return request.put('/option/update',optionModel)
 }