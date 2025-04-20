//导入request.js请求工具
import request from '@/utils/request.js'


//问题列表查询
export const questionListService = (params) => {
  return request.get('/question/list',{params})
}

//获取所有问题
export const getAllQuestionsService = (userId) => {
  return request.get('/question/getAll?userId='+userId)
}

//问题列表查询
export const getAllQuestionsBySurveyIdService = (surveyId,userId) => {
  return request.get('/question/getAll?surveyId='+surveyId+'&userId='+userId)
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