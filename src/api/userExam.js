//导入request.js请求工具
import request from '@/utils/request.js'


//用户试卷列表查询
export const userExamListService = (params) => {
  return request.get('/userExam/list',{params})
}

//未完成用户列表
export const unfinishedListService = (params)=>{
  return request.get('/userExam/unfinishedUsers',{params})
}

// 向部门成员分配试卷
export const assignExamToDepartment = (departmentId,examId) => {
    return request.post('/userExam/assignExam?departmentId='+departmentId+'&examId='+examId)
  }

//更新用户答卷信息
export const userExamUpdateService = (examId,userId,status)=>{
   return request.post('/userExam/update?examId='+examId+'&userId='+userId+'&status='+status)
}  

// 获取用户答卷信息
export const userExamGetService = (params) => {
  return request.get('/userExam/getUserExam',{params})  
}

// 导出未完成名单
export const exportUnfinishedListService = (id, departmentId) => {
  return request.get('/userExam/exportUnfinishedList', {
    params: {
      examId:id,
      departmentId
    },
    responseType: 'blob'
  })
}