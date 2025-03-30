//导入request.js请求工具
import request from '@/utils/request.js'


//答题情况列表
export const responseListService = (params) => {
  console.log("到调用接口部分了")
  return request.get('/response/list',{params})
}

export const getAllSurveysService = (userId) => {
  console.log("到调用接口部分了")
  return request.get('/survey/getAll?userId='+userId)
}

//添加问卷
export const surveyAddService = (studentModel)=>{
  return request.post('/survey/add',studentModel)
}

//删除问卷
export const surveyDelService = (id)=>{
  return request.delete('/survey/delete?surveyId='+id)
}

//更新问卷
export const surveyUpdateService = (studentModel)=>{
   return request.put('/survey/update',studentModel)
 }