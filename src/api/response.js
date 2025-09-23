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
export const getResponseDetailsService = (examId,userId) => {
    return request.get(`/response/details?examId=`+examId+'&userId='+userId)
}

// 获取问卷答题统计
export const getStatisticsService = (examId,departmentId) => {
    return request.get(`/response/statistics?examId=`+examId+'&departmentId='+departmentId)
}

// 删除问卷响应
export const deleteResponseService = (responseId) => {
    return request.delete(`/response/delete/${responseId}`)
}

export const getDetailsService = (examId,userId) => {
  console.log("到调用接口部分了")
  return request.get('/exam/details?userId='+userId+'&examId='+examId)
}


export const getExamAnalysis = (examId,departmentId) => {
  console.log("到调用接口部分了")
  return request.get('/response/analysis?examId='+examId+'&departmentId='+departmentId)
}