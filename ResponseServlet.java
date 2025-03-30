package Servlet;

import javax.servlet.RequestDispatcher;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import Model.*;
import Service.*;
import Service.ServiceImpl.*;

import javax.servlet.ServletException;
import javax.servlet.http.*;

import java.io.InputStream;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024 * 1, // 1MB
        maxFileSize = 1024 * 1024 * 10,      // 10MB
        maxRequestSize = 1024 * 1024 * 100   // 100MB
)
@WebServlet("/ResponseServlet")
public class ResponseServlet extends HttpServlet {
    private final ResponseService responseService = new ResponseServiceImpl();
    private final SurveyService surveyService = new SurveyServiceImpl();
    private final QuestionService questionService = new QuestionServiceImpl();
    private final OptionService optionService = new OptionServiceImpl();
    private final UserSurveyService userSurveyService = new UserSurveyServiceImpl();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String action = request.getParameter("action");
        if("list".equals(action)){
            listResponse(request,response);
        } else if("details".equals(action)){
            try {
                details(request,response);
            } catch (SQLException e) {
                throw new RuntimeException(e);
            }
        } else if ("statistics".equals(action)) {
            try {
                statistics(request,response);
            } catch (SQLException e) {
                throw new RuntimeException(e);
            }
        }
    }

    private void statistics(HttpServletRequest request, HttpServletResponse response) throws SQLException, ServletException, IOException {
        int surveyId = Integer.parseInt(request.getParameter("surveyId"));
        String strDepartmentId = request.getParameter("departmentId");
        int departmentId = 0;
        if(strDepartmentId!=null){
            departmentId = Integer.parseInt(strDepartmentId);
        }
        request.setAttribute("departmentId",departmentId);
        Survey survey = surveyService.getSurveyById(surveyId);
        request.setAttribute("survey", survey);
        OptionService optionService = new OptionServiceImpl();
        List<Question> questions = questionService.getQuestionsBySurveyId(surveyId);
        for(Question question : questions){
            List<Option> options = optionService.getOptionsWithCheckCountByQuestionId(question.getQuestionId(),departmentId);
            question.setOptions(options);
        }
        request.setAttribute("questions", questions);
        int unfinishedTotalRecords = userSurveyService.getUserInfoCount(surveyId,departmentId);
        request.setAttribute("unfinishedTotalRecords",unfinishedTotalRecords);

        RequestDispatcher dispatcher = request.getRequestDispatcher("/pages/survey/viewSurvey.jsp");
        dispatcher.forward(request,response);
    }

    //答卷详情
    private void details(HttpServletRequest request, HttpServletResponse response) throws IOException, SQLException, ServletException {
        int surveyId = Integer.parseInt(request.getParameter("surveyId"));
        int userId = Integer.parseInt(request.getParameter("userId"));
        request.setAttribute("answerUserId",userId);
        List<Response> userResponses = responseService.getUserResponsesForSurvey(surveyId, userId);
        request.setAttribute("userResponses", userResponses);

        Survey survey = surveyService.getSurveyById(surveyId);
        request.setAttribute("survey", survey);

        UserSurvey userSurvey = userSurveyService.getUserSurveyByUserIdAndSurveyId(userId,surveyId);
        request.setAttribute("userSurvey",userSurvey);

        OptionService optionService = new OptionServiceImpl();
        List<Question> questions = questionService.getQuestionsBySurveyId(surveyId);
        Map<Integer, Integer> questionIndexMap = new HashMap<>();
        for (int i = 0; i < questions.size(); i++) {
            questionIndexMap.put(questions.get(i).getQuestionId(), i + 1);
        }
        request.setAttribute("questionIndexMap", questionIndexMap);
        for(Question question : questions){
            List<Option> options = optionService.getOptionsByQuestionId(question.getQuestionId());
            question.setOptions(options);
        }

        //System.out.println("Response details: "+questions);
        // 设置属性到请求范围
        request.setAttribute("questions", questions);
        RequestDispatcher dispatcher = request.getRequestDispatcher("/pages/survey/viewSurvey.jsp");
        dispatcher.forward(request,response);
    }

    //答卷大致情况
    private void listResponse(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        int currentPage = 1;
        int pageSize = 9;
        String pageParam = request.getParameter("page");
        if (pageParam != null) {
            try {
                currentPage = Integer.parseInt(pageParam); // 可能引发异常，需处理
            } catch (NumberFormatException e) {
                currentPage = 1; // 默认页码
            }
        }
        try {
            int surveyId = Integer.parseInt(request.getParameter("surveyId"));


            request.setAttribute("surveyId", surveyId);
            Survey survey = surveyService.getSurveyById(surveyId);
            request.setAttribute("survey", survey);

            int unfinishedTotalRecords = userSurveyService.getUserInfoCount(surveyId,0);
            request.setAttribute("unfinishedTotalRecords",unfinishedTotalRecords);

            List<UserSurvey> userSurveys = userSurveyService.getUserDepartmentInfoBySurveyId(surveyId);
            request.setAttribute("userSurveys",userSurveys);

            int totalRecords = responseService.countSurveyResponses(surveyId);
            int totalPages = (int) Math.ceil((double) totalRecords / pageSize);

            List<Response> responsesSummary = responseService.getSurveyResponsesSummary(surveyId,currentPage,pageSize);

            request.setAttribute("responsesSummary", responsesSummary);
            request.setAttribute("currentPage", currentPage);
            request.setAttribute("totalPages", totalPages);
            request.getRequestDispatcher("/pages/response/responseList.jsp").forward(request, response);
        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to fetch survey responses.");
        }
    }

    //处理post请求
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("text/html;charset=UTF-8");
        String actionType = request.getParameter("actionType1"); // 获取操作类型：submit 或 save
        boolean isSaveAction = "save".equals(actionType);
        System.out.println("actionType: "+actionType);
        try {
            // 1. 获取问卷 ID 和 IP 地址
            int surveyId = Integer.parseInt(request.getParameter("surveyId"));

            HttpSession session = request.getSession();
            int userId = (int) session.getAttribute("userId");
            String userRole = (String) session.getAttribute("userRole");
            String ipAddress = getClientIp(request);
            if("remake".equals(actionType)&&"超级管理员".equals(userRole)){
                int answerUserId = Integer.parseInt(request.getParameter("answerUserId"));
                remakeSurvey(surveyId,answerUserId);
                response.sendRedirect("/ResponseServlet?action=list&surveyId="+surveyId);
                return;
            }
            if ("0:0:0:0:0:0:0:1".equals(ipAddress)) {
                ipAddress = "127.0.0.1";
            }




            //1.匿名用户答题
            // userSurvey里面不存储匿名用户的问卷，只能让匿名用户进行提交。
            //2.获取匿名用户答题记录
            //userId，surveyId，ipAddress获取其答题记录



            //如果userId为0
            UserSurvey userSurvey = userSurveyService.getUserSurveyByUserIdAndSurveyId(userId,surveyId);
            if("已完成".equals(userSurvey.getStatus())){
                response.getWriter().println("您已提交过该问卷");
                return;
            }
            initializeResponses(surveyId,userId,ipAddress);

            Collection<Part> parts = request.getParts(); // 获取所有表单的字段和文件

            String uploadPath = getServletContext().getRealPath("/") + "uploads" + File.separator;
            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }


            List<String> allowedFileTypes = Arrays.asList("jpg", "jpeg", "png", "gif", "pdf", "docx", "xlsx");

            for (Part part : parts) {
                if (part.getContentType() != null && part.getSize() > 0) {
                    //System.out.println("Part name: " + part.getName());
                    String fileName = System.currentTimeMillis() + "_" + part.getSubmittedFileName();
                    String fileExtension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
                    if (!allowedFileTypes.contains(fileExtension)) {
                        response.getWriter().println("不支持的文件类型: " + fileExtension);
                        continue;
                    }

                    if (part.getSize() > 10 * 1024 * 1024) {
                        response.getWriter().println("文件过大，请上传小于 10MB 的文件");
                        continue;
                    }

                    File file = new File(uploadDir, fileName);
                    try (InputStream inputStream = part.getInputStream();
                         FileOutputStream fos = new FileOutputStream(file)) {
                        byte[] buffer = new byte[1024];
                        int bytesRead;
                        while ((bytesRead = inputStream.read(buffer)) != -1) {
                            fos.write(buffer, 0, bytesRead);
                        }
                    }

                    String filePath = "/uploads/" + fileName;
                    int questionId = extractQuestionIdFromPartName(part.getName());
                    Response response1 = new Response();
                    response1.setSurveyId(surveyId);
                    response1.setQuestionId(questionId);
                    response1.setUserId(userId);
                    response1.setIpAddress(ipAddress);
                    response1.setFilePath(filePath);
                    responseService.saveFilePathToDatabase(response1);

                    //System.out.println("文件已上传到: " + file.getAbsolutePath());
                }
            }

            //System.out.println("上传完文件到的地方");


            // 3. 处理请求中的每个参数
            processRequestParameters(request, surveyId, userId, ipAddress, isSaveAction);
            completeSurvey(surveyId, userId, isSaveAction);
            response.sendRedirect("/UserSurveyServlet?action=list&id="+userId);
            //}

        } catch (Exception e) {
            e.printStackTrace();
            response.sendRedirect(request.getContextPath() + "/pages/error.jsp");
        }
    }

    private int extractQuestionIdFromPartName(String partName) {
        int questionId = Integer.parseInt(partName.split("_")[1]);
        return questionId; // 没有找到则返回 -1
    }


    private void processRequestParameters(HttpServletRequest request, int surveyId, int userId, String ipAddress, boolean isSaveAction) throws Exception {
        Enumeration<String> parameterNames = request.getParameterNames();
        while (parameterNames.hasMoreElements()) {
            String paramName = parameterNames.nextElement();
            String[] paramValues = request.getParameterValues(paramName);
            //System.out.println("Parameter Name: " + paramName);

            if (paramName.startsWith("question_")) {
                int questionId = Integer.parseInt(paramName.split("_")[1]);
                processQuestionAnswers(paramName, paramValues, surveyId, questionId, ipAddress, userId, isSaveAction);
            } else if (paramName.startsWith("rating_")) {
                processRatingAnswers(paramName, paramValues, surveyId, ipAddress, userId);
            }
            else if (paramName.startsWith("open_answer_")) {
                //System.out.println("判断是否有开放选项");
                processOpenAnswer(paramName, paramValues);
            }
        }
    }

    private void processQuestionAnswers(String paramName, String[] paramValues, int surveyId, int questionId, String ipAddress, int userId, boolean isSaveAction) throws Exception {
        if (paramName.contains("_row_")) {  // 处理矩阵类型
            String rowOptionId = paramName.split("_")[3];
            for (String paramValue : paramValues) {
                saveMatrixResponse(surveyId, questionId, rowOptionId, paramValue, ipAddress, userId, isSaveAction);
            }
        } else {
            for (String paramValue : paramValues) {
                saveResponse(surveyId, questionId, paramValue, ipAddress, userId, isSaveAction);
            }
        }
    }

    private void processRatingAnswers(String paramName, String[] paramValues, int surveyId, String ipAddress, int userId) throws SQLException {
        String[] parts = paramName.split("_");
        int questionId = Integer.parseInt(parts[1]);
        int optionId = Integer.parseInt(parts[2]);

        for (String paramValue : paramValues) {
            Response response1 = new Response();
            response1.setSurveyId(surveyId);
            response1.setQuestionId(questionId);
            response1.setOptionId(optionId);
            response1.setRowId(0);
            response1.setColumnId(0);
            response1.setResponseData(paramValue);  // 保存评分值
            response1.setUserId(userId);
            response1.setIpAddress(ipAddress);
            response1.setCreatedAt(LocalDateTime.now());
            responseService.updateResponse(response1);
        }
    }

    private void processOpenAnswer(String paramName, String[] paramValues) throws SQLException {
        int optionId = Integer.parseInt(paramName.split("_")[2]);
        for (String paramValue : paramValues) {
            Response response1 = new Response();
            response1.setOptionId(optionId);
            response1.setResponseData(paramValue);
            response1.setIsValid(paramValue==null||"".equals(paramValue) ? 0 : 1);
            responseService.updateResponseData(response1);
            //System.out.println("处理开放答案: "+paramValue);
        }
    }

    private void completeSurvey(int surveyId, int userId, boolean isSaveAction) throws SQLException {
        Timestamp completedAt = new Timestamp(System.currentTimeMillis());
        if (!isSaveAction) {
            System.out.println("isSaveAction: "+isSaveAction);
            System.out.println("下面进行完成操作：");
            userSurveyService.updateSurveyStatusBySurveyAndUser(surveyId, userId, "已完成", completedAt);
        }
    }
    private void remakeSurvey(int surveyId, int userId) throws SQLException {
        Timestamp completedAt = new Timestamp(System.currentTimeMillis());
        System.out.println("下面进行完成操作：");
        userSurveyService.updateSurveyStatusBySurveyAndUser(surveyId, userId, "未完成", completedAt);
    }
    public void initializeResponses(int surveyId, int userId, String ipAddress) throws Exception {
        // 1. 获取问卷所有问题
        List<Question> questions = questionService.getQuestionsBySurveyId(surveyId);
        // 2. 检查是否已有记录，避免重复初始化
        if (!responseService.isResponseSubmitted(userId, surveyId)) {
            //System.out.println("问题判断前");
            // 3. 遍历所有问题
            List<Response> initialResponses = new ArrayList<>();
            for (Question question : questions) {

                String questionType = String.valueOf(question.getType());
                // 检查是否为矩阵单选或多选题
                if ("矩阵单选".equals(questionType) || "矩阵多选".equals(questionType)){
                    //System.out.println("矩阵单选多选部分");
                    List<Option> rowOptions = optionService.getRowOptionsByQuestionId(question.getQuestionId());
                    List<Option> columnOptions = optionService.getColumnOptionsByQuestionId(question.getQuestionId());

                    // 遍历所有行和列，生成初始响应记录
                    for (Option row : rowOptions) {
                        for (Option column : columnOptions) {
                            Response responseRecord = new Response();
                            responseRecord.setSurveyId(surveyId);
                            responseRecord.setQuestionId(question.getQuestionId());
                            responseRecord.setUserId(userId);
                            responseRecord.setIpAddress(ipAddress);
                            responseRecord.setResponseData(""); // 初始为空
                            responseRecord.setIsValid(0);   // 初始无效
                            responseRecord.setCreatedAt(new Timestamp(System.currentTimeMillis()).toLocalDateTime());

                            // 设置矩阵行列ID
                            responseRecord.setRowId(row.getOptionId());
                            responseRecord.setColumnId(column.getOptionId());
                            //System.out.println("矩阵单选多选部分");
                            //System.out.println(responseRecord);
                            initialResponses.add(responseRecord);
                        }
                    }
                }
                else if ("单选".equals(questionType)||"多选".equals(questionType)||"评分题".equals(questionType)) {
                    //System.out.println("单选多选评分题部分");
                    List<Option> Options = optionService.getOptionsByQuestionId(question.getQuestionId());
                    for(Option option : Options){
                        Response responseRecord = new Response();
                        responseRecord.setOptionId(option.getOptionId());
                        responseRecord.setSurveyId(surveyId);
                        responseRecord.setQuestionId(question.getQuestionId());
                        responseRecord.setUserId(userId);
                        responseRecord.setIpAddress(ipAddress);
                        responseRecord.setResponseData(""); // 初始为空
                        responseRecord.setIsValid(0);   // 初始无效
                        responseRecord.setCreatedAt(new Timestamp(System.currentTimeMillis()).toLocalDateTime());

                        // 设置矩阵行列ID
                        responseRecord.setRowId(0);
                        responseRecord.setColumnId(0);
                        //System.out.println("单选多选评分题部分");
                        //System.out.println(responseRecord);
                        initialResponses.add(responseRecord);
                    }
                } else if ("填空".equals(questionType)) {
                    Response responseRecord = new Response();
                        //System.out.println("填空");
                        responseRecord.setOptionId(0);
                        responseRecord.setSurveyId(surveyId);
                        responseRecord.setQuestionId(question.getQuestionId());
                        responseRecord.setUserId(userId);
                        responseRecord.setIpAddress(ipAddress);
                        responseRecord.setResponseData(""); // 初始为空
                        responseRecord.setIsValid(0);   // 初始无效
                        responseRecord.setCreatedAt(new Timestamp(System.currentTimeMillis()).toLocalDateTime());
                        // 设置矩阵行列ID
                        responseRecord.setRowId(0);
                        responseRecord.setColumnId(0);
                        //System.out.println("填空部分");
                        //System.out.println(responseRecord);
                        initialResponses.add(responseRecord);
                }
                //System.out.println(responseRecord);
            }
            //System.out.println("调用服务层前");
            // 4. 批量插入初始响应记录
            responseService.saveResponses(initialResponses);
        }
        responseService.resetIsValidForResponses(userId,surveyId);
    }


    /**
     * 保存响应记录到数据库
     */
    private void saveResponse(int surveyId, int questionId, String answer, String ipAddress ,int userId,boolean isSaveAction) throws Exception {
        Response response = new Response();
        response.setSurveyId(surveyId);
        response.setQuestionId(questionId);

        if (answer.matches("\\d+")) {  // 非填空题，保存选项 ID
            response.setOptionId(Integer.parseInt(answer));
            response.setResponseData("");
        } else {  // 填空题或开放答案，保存文本答案
            response.setOptionId(0);
            response.setResponseData(answer);
        }
        response.setRowId(0);
        response.setColumnId(0);
        //HttpSession session = request.getSession();
        response.setUserId(userId); // 示例用户 ID
        response.setIpAddress(ipAddress);
        response.setCreatedAt(LocalDateTime.now());
        responseService.updateResponse(response);


    }

    /**
     * 保存矩阵单选或矩阵多选的响应
     */
    private void saveMatrixResponse(int surveyId, int questionId, String rowOptionId, String columnOptionId, String ipAddress ,int userId,boolean isSaveAction) throws Exception {
        Response response = new Response();
        response.setSurveyId(surveyId);
        response.setQuestionId(questionId);
        response.setRowId(Integer.parseInt(rowOptionId));  // 行选项 ID
        response.setColumnId(Integer.parseInt(columnOptionId));  // 列选项 ID
        response.setResponseData("");
        // 矩阵问题处理为多选或单选
        response.setOptionId(0); // 默认填空类型（矩阵中的非选项）
        response.setUserId(userId);  // 示例用户 ID
        response.setIpAddress(ipAddress);
        response.setCreatedAt(LocalDateTime.now());
        responseService.updateResponse(response);

    }


    //获取用户IP地址
    public String getClientIp(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }

        // 如果有多个 IP，取第一个
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }

        return ipAddress;
    }

}

