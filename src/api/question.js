//导入request.js请求工具
import request from '@/utils/request.js'


//问题列表查询
export const questionListService = (params) => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/question?action=list',{params})
}

//问题列表查询
export const getAllQuestionsService = (surveyId) => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/question?action=getAll&surveyId='+surveyId)
}


//添加问题
export const questionAddService = (questionModel)=>{
 /*  var params = new URLSearchParams()
  for (let key in studentModel) {
    params.append(key, studentModel[key])
  } */
  return request.put('/question',questionModel)
}

//删除问题
export const questionDelService = (id)=>{
  return request.delete('/question',{params:{questionId:id}})
}

//更新问题
export const questionUpdateService = (questionModel)=>{
   var params = new URLSearchParams()
   for (let key in questionModel) {
     params.append(key, questionModel[key])
   }
   return request.post('/question?action=update',params)
 }