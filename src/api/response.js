//导入request.js请求工具
import request from '@/utils/request.js'

// 提交问卷
export const submitResponseService = (formData) => {
    return request.post('/response/submit', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

// 获取问卷响应列表
export const getResponseListService = (params) => {
    return request.get('/response/list', { params })
}

// 获取问卷响应详情
export const getResponseDetailsService = (surveyId,userId) => {
    return request.get(`/response/details?surveyId=`+surveyId+'&userId='+userId)
}

// 获取问卷答题统计
export const getStatisticsService = (surveyId,departmentId) => {
    return request.get(`/response/statistics?surveyId=`+surveyId+'&departmentId='+departmentId)
}

// 删除问卷响应
export const deleteResponseService = (responseId) => {
    return request.delete(`/response/delete/${responseId}`)
}

export const getDetailsService = (surveyId,userId) => {
  console.log("到调用接口部分了")
  return request.get('/survey/details?userId='+userId+'&surveyId='+surveyId)
}