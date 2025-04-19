//导入request.js请求工具
import request from '@/utils/request'


//学生问卷查询
export const surveyListService = (params) => {
  console.log("到调用接口部分了")
  return request.get('/survey/list',{params})
}

// 获取问卷的所有信息，包括questions
export const getAllSurveysService = (userId) => {
  console.log("到调用接口部分了")
  return request.get('/survey/getAll?userId='+userId)
}

// 
export const getSurveyAndQuestionsById = (surveyId) => {
  console.log("到调用接口部分了")
  return request.get('/survey/getSurveyAndQuestionsById?surveyId='+surveyId)
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

// 保存构建问卷
export function saveBuildSurvey(survey, questions) {
  return request({
    url: '/survey/saveBuild',
    method: 'post',
    data: {
      survey: {
        surveyId: survey.surveyId,
        name: survey.name,
        description: survey.description,
        isCategory: survey.isCategory,
        // status: survey.status,
        allowView: survey.allowView
      },
      questions: questions.map(q => ({
        questionId: q.questionId,
        surveyId: q.surveyId,
        description: q.description,
        type: q.type,
        isRequired: q.isRequired,
        isOpen: q.isOpen,
        categoryId: q.categoryId,
        displayType: q.displayType,
        maxSelections: q.maxSelections,
        minSelections: q.minSelections,
        isSkip: q.isSkip,
        sortType: q.sortType,
        sortKey:q.sortKey,
        instructions: q.instructions,
        options: q.options
      }))
    }
  })
}

// 更新构建问卷
export function updateBuildSurvey(survey, questions) {
  return request({
    url: '/survey/updateBuild',
    method: 'post',
    data: {
      survey: {
        surveyId: survey.surveyId,
        name: survey.name,
        description: survey.description,
        isCategory: survey.isCategory,
        status: survey.status,
        allowView: survey.allowView
      },
      questions: questions.map(q => ({
        questionId: q.questionId,
        surveyId: q.surveyId,
        description: q.description,
        type: q.type,
        isRequired: q.isRequired,
        isOpen: q.isOpen,
        categoryId: q.categoryId,
        displayType: q.displayType,
        isSkip: q.isSkip,
        sortType: q.sortType,
        sortKey:q.sortKey,
        instructions: q.instructions,
        minSelections: q.minSelections,
        maxSelections: q.maxSelections,
        options: q.options
      }))
    }
  })
}

// 提交问卷
export function submitBuildSurvey(data) {
  return request({
    url: '/survey/submit',
    method: 'post',
    data
  })
}

// 获取问卷详情
export function getSurveyDetail(id) {
  return request({
    url: `/survey/detail/${id}`,
    method: 'get'
  })
}

