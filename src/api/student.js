//导入request.js请求工具
import request from '@/utils/request.js'


//学生列表查询
export const studentListService = (params) => {
  console.log("到调用接口部分了")
  // const tokenStore = useTokenStore()
  return request.get('/student/survey?action=list',{params})
}


//添加学生
export const studentAddService = (studentModel)=>{
 /*  var params = new URLSearchParams()
  for (let key in studentModel) {
    params.append(key, studentModel[key])
  } */
  return request.put('/student/stu',studentModel)
}

//删除学生
export const studentDelService = (id)=>{
  return request.delete('/student/stu',{params:{id:id}})
}

//更新学生
export const studentUpdateService = (studentModel)=>{
   var params = new URLSearchParams()
   for (let key in studentModel) {
     params.append(key, studentModel[key])
   }
   return request.post('/student/stu',params)
 }