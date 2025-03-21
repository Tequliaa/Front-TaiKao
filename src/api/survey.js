//导入request.js请求工具
import request from '@/utils/request.js'


//学生问卷查询
export const surveyListService = (params) => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/student/survey?action=list',{params})
}

export const getAllSurveysService = () => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/student/survey?action=getAll')
}

//添加问卷
export const surveyAddService = (studentModel)=>{
 /*  var params = new URLSearchParams()
  for (let key in studentModel) {
    params.append(key, studentModel[key])
  } */
  return request.put('/student/survey',studentModel)
}

//删除问卷
export const surveyDelService = (id)=>{
  return request.post('/student/survey?action=delete&surveyId='+id)
}

//更新问卷
export const surveyUpdateService = (studentModel)=>{
   var params = new URLSearchParams()
   for (let key in studentModel) {
     params.append(key, studentModel[key])
   }
   return request.post('/student/survey?action=edit',params)
 }