//导入request.js请求工具
import request from '@/utils/request.js'


//选项列表查询
export const optionListService = (params) => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/option?action=list',{params})
}


//添加选项
export const optionAddService = (optionModel)=>{
 /*  var params = new URLSearchParams()
  for (let key in studentModel) {
    params.append(key, studentModel[key])
  } */
  return request.put('/option',optionModel)
}

//删除选项
export const optionDelService = (id)=>{
  return request.delete('/option',{params:{optionId:id}})
}

//更新选项
export const optionUpdateService = (optionModel)=>{
   var params = new URLSearchParams()
   for (let key in optionModel) {
     params.append(key, optionModel[key])
   }
   return request.post('/option?action=update',params)
 }