//导入request.js请求工具
import request from '@/utils/request.js'


//问题列表查询
export const questionListService = (params) => {
  return request.get('/question/list',{params})
}

//问题列表查询
export const getAllQuestionsService = (surveyId) => {
  return request.get('/question/getAll?surveyId='+surveyId)
}


//添加问题
export const questionAddService = (questionModel)=>{
  return request.post('/question/add',questionModel)
}

//删除问题
export const questionDelService = (id)=>{
  return request.delete('/question/delete',{params:{questionId:id}})
}

//更新问题
export const questionUpdateService = (questionModel)=>{
   return request.put('/question/update',questionModel)
 }