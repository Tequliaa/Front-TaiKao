//导入request.js请求工具
import request from '@/utils/request.js'


//用户问卷列表查询
export const userSurveyListService = (params) => {
  return request.get('/userSurvey/list',{params})
}

//未完成用户列表
export const unfinishedListService = (params)=>{
  return request.get('/survey/unfinishedUsers',{params})
}

// 向部门成员分配问卷
export const assignSurveyToDepartment = (departmentId,surveyId) => {
    return request.post('/userSurvey/assignSurvey?departmentId='+departmentId+'&surveyId='+surveyId)
  }

//更新用户答卷信息
export const userSurveyUpdateService = (id,status)=>{
   return request.post('/userSurvey/update',{id,status})
}  

// 获取用户答卷信息
export const userSurveyGetService = (params) => {
  return request.get('/userSurvey/getUserSurvey',{params})  
}