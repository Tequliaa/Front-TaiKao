//导入request.js请求工具
import request from '@/utils/request'


//学生试卷查询
export const examListService = (params) => {
  console.log("到调用接口部分了")
  return request.get('/exam/list',{params})
}

// 获取试卷的所有信息，包括questions
export const getAllExamsService = (userId) => {
  console.log("到调用接口部分了")
  return request.get('/exam/getAll?userId='+userId)
}

// 
export const getExamAndQuestionsById = (id) => {
  console.log("到调用接口部分了")
  return request.get('/exam/getExamAndQuestionsById?id='+id)
}
//添加试卷
export const examAddService = (studentModel)=>{
  return request.post('/exam/add',studentModel)
}

//删除试卷
export const examDelService = (id)=>{
  return request.delete('/exam/delete?id='+id)
}
//更新试卷
export const examUpdateService = (studentModel)=>{
   return request.put('/exam/update',studentModel)
 }

// 保存构建试卷
export function saveBuildExam(exam, questions, { categories }) {
  return request({
    url: '/exam/saveBuild',
    method: 'post',
    data: {
      exam: {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        isCategory: exam.isCategory,
        createdBy:exam.createdBy,
        // status: exam.status,
        allowView: exam.allowView
      },
      categories: categories.map(c => ({
        categoryId: c.categoryId,
        sortKey: c.sortKey
      })),
      questions: questions.map(q => ({
        questionId: q.questionId,
        id: q.id,
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
        sortKey: q.sortKey,
        instructions: q.instructions,
        options: q.options
      }))
    }
  })
}

// 更新构建试卷
export function updateBuildExam(exam, questions, { categories }) {
  return request({
    url: '/exam/updateBuild',
    method: 'post',
    data: {
      exam: {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        isCategory: exam.isCategory,
        createdBy:exam.createdBy,
        status: exam.status,
        allowView: exam.allowView
      },
      categories: categories.map(c => ({
        categoryId: c.categoryId,
        sortKey: c.sortKey
      })),
      questions: questions.map(q => ({
        questionId: q.questionId,
        id: q.id,
        description: q.description,
        type: q.type,
        isRequired: q.isRequired,
        isOpen: q.isOpen,
        categoryId: q.categoryId,
        displayType: q.displayType,
        isSkip: q.isSkip,
        sortType: q.sortType,
        sortKey: q.sortKey,
        instructions: q.instructions,
        minSelections: q.minSelections,
        maxSelections: q.maxSelections,
        options: q.options
      }))
    }
  })
}

// 提交试卷
export function submitBuildExam(data) {
  return request({
    url: '/exam/submit',
    method: 'post',
    data
  })
}

// 获取试卷详情
export function getExamDetail(id) {
  return request({
    url: `/exam/detail/${id}`,
    method: 'get'
  })
}

