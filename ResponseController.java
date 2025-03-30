package SurveySystem.Controller;

import SurveySystem.Model.*;
import SurveySystem.Service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.sql.Timestamp;
import java.util.*;

@RestController
@RequestMapping("/response")
public class ResponseController {

    private final ResponseService responseService;
    private final SurveyService surveyService;
    private final QuestionService questionService;
    private final OptionService optionService;
    private final UserSurveyService userSurveyService;

    @Autowired
    public ResponseController(ResponseService responseService,
                            SurveyService surveyService,
                            QuestionService questionService,
                            OptionService optionService,
                            UserSurveyService userSurveyService) {
        this.responseService = responseService;
        this.surveyService = surveyService;
        this.questionService = questionService;
        this.optionService = optionService;
        this.userSurveyService = userSurveyService;
    }

    @GetMapping("/list")
    public Result<Map<String, Object>> listResponses(
            @RequestParam int surveyId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "9") int pageSize) {
        System.out.println("到ResponseList了");
        try {
            int unfinishedTotalRecords = userSurveyService.getUserInfoCount(surveyId, 0);
            List<UserSurvey> userSurveys = userSurveyService.getUserDepartmentInfoBySurveyId(surveyId);
            int totalRecords = responseService.countSurveyResponses(surveyId);
            int totalCount = (int) Math.ceil((double) totalRecords / pageSize);
            List<Response> responses = responseService.getSurveyResponsesSummary(surveyId, pageNum, pageSize);

            Map<String, Object> resultMap = new HashMap<>();
            resultMap.put("unfinishedTotalRecords", unfinishedTotalRecords);
            resultMap.put("userSurveys", userSurveys);
            resultMap.put("responses", responses);
            resultMap.put("totalCount", totalCount);

            return Result.success(resultMap);
        } catch (Exception e) {
            return Result.error("获取问卷响应列表失败：" + e.getMessage());
        }
    }

    @GetMapping("/details")
    public Result<Map<String, Object>> getResponseDetails(
            @RequestParam int surveyId,
            @RequestParam int userId) {
        System.out.println("这里是response的details");
        try {
            List<Response> userResponses = responseService.getUserResponsesForSurvey(surveyId, userId);
            UserSurvey userSurvey = userSurveyService.getUserSurveyByUserIdAndSurveyId(userId, surveyId);
            List<Question> questions = questionService.getQuestionsBySurveyId(surveyId);

            Map<Integer, Integer> questionIndexMap = new HashMap<>();
            for (int i = 0; i < questions.size(); i++) {
                questionIndexMap.put(questions.get(i).getQuestionId(), i + 1);
            }

            for (Question question : questions) {
                List<Option> options = optionService.getOptionsByQuestionId(question.getQuestionId());
                question.setOptions(options);
            }

            Map<String, Object> resultMap = new HashMap<>();
            resultMap.put("userResponses", userResponses);
            resultMap.put("userSurvey", userSurvey);
            resultMap.put("questions", questions);
            resultMap.put("questionIndexMap", questionIndexMap);

            return Result.success(resultMap);
        } catch (Exception e) {
            return Result.error("获取响应详情失败：" + e.getMessage());
        }
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getResponseStatistics(
            @RequestParam int surveyId,
            @RequestParam(required = false) Integer departmentId) {
        try {
            Survey survey = surveyService.getSurveyById(surveyId);
            List<Question> questions = questionService.getQuestionsBySurveyId(surveyId);
            
            for (Question question : questions) {
                List<Option> options = optionService.getOptionsWithCheckCountByQuestionId(question.getQuestionId(), departmentId);
                question.setOptions(options);
            }

            int unfinishedTotalRecords = userSurveyService.getUserInfoCount(surveyId, departmentId);

            Map<String, Object> resultMap = new HashMap<>();
            resultMap.put("survey", survey);
            resultMap.put("questions", questions);
            resultMap.put("unfinishedTotalRecords", unfinishedTotalRecords);
            resultMap.put("departmentId", departmentId);

            return Result.success(resultMap);
        } catch (Exception e) {
            return Result.error("获取响应统计失败：" + e.getMessage());
        }
    }

    @PostMapping("/submit")
    public Result<Void> submitResponse(
            @RequestParam int surveyId,
            @RequestParam(defaultValue = "false") boolean isSaveAction,
            @RequestParam(required = false) Integer answerUserId,
            @RequestParam Map<String, String> formData,
            @RequestParam(required = false) List<MultipartFile> files) {
        System.out.println("到submit了");
        try {
            // 获取当前用户信息
            int userId = Integer.parseInt(formData.get("userId"));
            String userRole = formData.get("userRole");
            String ipAddress = formData.get("ipAddress");

            // 处理重新提交的情况
            if ("remake".equals(formData.get("actionType")) && "超级管理员".equals(userRole)) {
                if (answerUserId != null) {
                    remakeSurvey(surveyId, answerUserId);
                    return Result.success();
                }
                return Result.error("重新提交失败：未指定用户ID");
            }

            // 检查是否已提交
            UserSurvey userSurvey = userSurveyService.getUserSurveyByUserIdAndSurveyId(userId, surveyId);
            if ("已完成".equals(userSurvey.getStatus())) {
                return Result.error("您已提交过该问卷");
            }

            // 初始化响应记录
            initializeResponses(surveyId, userId, ipAddress);

            // 处理文件上传
            if (files != null && !files.isEmpty()) {
                handleFileUploads(files, surveyId, userId, ipAddress);
            }

            // 处理表单数据
            processFormData(formData, surveyId, userId, ipAddress, isSaveAction);

            // 完成问卷
            completeSurvey(surveyId, userId, isSaveAction);

            return Result.success();
        } catch (Exception e) {
            return Result.error("提交响应失败：" + e.getMessage());
        }
    }

    private void handleFileUploads(List<MultipartFile> files, int surveyId, int userId, String ipAddress) throws IOException {
        String uploadPath = "uploads" + File.separator;
        File uploadDir = new File(uploadPath);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        List<String> allowedFileTypes = Arrays.asList("jpg", "jpeg", "png", "gif", "pdf", "docx", "xlsx");

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                String fileExtension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
                
                if (!allowedFileTypes.contains(fileExtension)) {
                    throw new IllegalArgumentException("不支持的文件类型: " + fileExtension);
                }

                if (file.getSize() > 10 * 1024 * 1024) {
                    throw new IllegalArgumentException("文件过大，请上传小于 10MB 的文件");
                }

                File destFile = new File(uploadDir, fileName);
                file.transferTo(destFile);

                String filePath = "/uploads/" + fileName;
                int questionId = extractQuestionIdFromFileName(file.getName());
                
                Response response = new Response();
                response.setSurveyId(surveyId);
                response.setQuestionId(questionId);
                response.setUserId(userId);
                response.setIpAddress(ipAddress);
                response.setFilePath(filePath);
                responseService.saveFilePathToDatabase(response);
            }
        }
    }

    private void processFormData(Map<String, String> formData, int surveyId, int userId, String ipAddress, boolean isSaveAction) throws Exception {
        for (Map.Entry<String, String> entry : formData.entrySet()) {
            String paramName = entry.getKey();
            String paramValue = entry.getValue();

            if (paramName.startsWith("question_")) {
                int questionId = Integer.parseInt(paramName.split("_")[1]);
                processQuestionAnswer(paramName, paramValue, surveyId, questionId, ipAddress, userId, isSaveAction);
            } else if (paramName.startsWith("rating_")) {
                processRatingAnswer(paramName, paramValue, surveyId, ipAddress, userId);
            } else if (paramName.startsWith("open_answer_")) {
                processOpenAnswer(paramName, paramValue);
            }
        }
    }

    private void processQuestionAnswer(String paramName, String paramValue, int surveyId, int questionId, 
                                     String ipAddress, int userId, boolean isSaveAction) throws Exception {
        if (paramName.contains("_row_")) {
            String rowOptionId = paramName.split("_")[3];
            saveMatrixResponse(surveyId, questionId, rowOptionId, paramValue, ipAddress, userId, isSaveAction);
        } else {
            saveResponse(surveyId, questionId, paramValue, ipAddress, userId, isSaveAction);
        }
    }

    private void processRatingAnswer(String paramName, String paramValue, int surveyId, String ipAddress, int userId) throws Exception {
        String[] parts = paramName.split("_");
        int questionId = Integer.parseInt(parts[1]);
        int optionId = Integer.parseInt(parts[2]);

        Response response = new Response();
        response.setSurveyId(surveyId);
        response.setQuestionId(questionId);
        response.setOptionId(optionId);
        response.setRowId(0);
        response.setColumnId(0);
        response.setResponseData(paramValue);
        response.setUserId(userId);
        response.setIpAddress(ipAddress);
        response.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        responseService.updateResponse(response);
    }

    private void processOpenAnswer(String paramName, String paramValue){
        int optionId = Integer.parseInt(paramName.split("_")[2]);
        Response response = new Response();
        response.setOptionId(optionId);
        response.setResponseData(paramValue);
        response.setIsValid(paramValue == null || "".equals(paramValue) ? 0 : 1);
        responseService.updateResponseData(response);
    }

    private void saveResponse(int surveyId, int questionId, String answer, String ipAddress, int userId, boolean isSaveAction) throws Exception {
        Response response = new Response();
        response.setSurveyId(surveyId);
        response.setQuestionId(questionId);

        if (answer.matches("\\d+")) {
            response.setOptionId(Integer.parseInt(answer));
            response.setResponseData("");
        } else {
            response.setOptionId(0);
            response.setResponseData(answer);
        }
        
        response.setRowId(0);
        response.setColumnId(0);
        response.setUserId(userId);
        response.setIpAddress(ipAddress);
        response.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        responseService.updateResponse(response);
    }

    private void saveMatrixResponse(int surveyId, int questionId, String rowOptionId, String columnOptionId, 
                                  String ipAddress, int userId, boolean isSaveAction){
        Response response = new Response();
        response.setSurveyId(surveyId);
        response.setQuestionId(questionId);
        response.setRowId(Integer.parseInt(rowOptionId));
        response.setColumnId(Integer.parseInt(columnOptionId));
        response.setResponseData("");
        response.setOptionId(0);
        response.setUserId(userId);
        response.setIpAddress(ipAddress);
        response.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        responseService.updateResponse(response);
    }

    private void completeSurvey(int surveyId, int userId, boolean isSaveAction) throws Exception {
        if (!isSaveAction) {
            userSurveyService.updateSurveyStatusBySurveyAndUser(surveyId, userId, "已完成", 
                new Timestamp(System.currentTimeMillis()));
        }
    }

    private void remakeSurvey(int surveyId, int userId) throws Exception {
        userSurveyService.updateSurveyStatusBySurveyAndUser(surveyId, userId, "未完成", 
            new Timestamp(System.currentTimeMillis()));
    }

    private void initializeResponses(int surveyId, int userId, String ipAddress) throws Exception {
        List<Question> questions = questionService.getQuestionsBySurveyId(surveyId);
        if (!responseService.checkResponseExists(userId, surveyId)) {
            List<Response> initialResponses = new ArrayList<>();
            
            for (Question question : questions) {
                String questionType = String.valueOf(question.getType());
                
                if ("矩阵单选".equals(questionType) || "矩阵多选".equals(questionType)) {
                    List<Option> rowOptions = optionService.getRowOptionsByQuestionId(question.getQuestionId());
                    List<Option> columnOptions = optionService.getColumnOptionsByQuestionId(question.getQuestionId());

                    for (Option row : rowOptions) {
                        for (Option column : columnOptions) {
                            Response responseRecord = createInitialResponse(surveyId, question.getQuestionId(), 
                                userId, ipAddress, row.getOptionId(), column.getOptionId());
                            initialResponses.add(responseRecord);
                        }
                    }
                } else if ("单选".equals(questionType) || "多选".equals(questionType) || "评分题".equals(questionType)) {
                    List<Option> options = optionService.getOptionsByQuestionId(question.getQuestionId());
                    for (Option option : options) {
                        Response responseRecord = createInitialResponse(surveyId, question.getQuestionId(), 
                            userId, ipAddress, 0, 0);
                        responseRecord.setOptionId(option.getOptionId());
                        initialResponses.add(responseRecord);
                    }
                } else if ("填空".equals(questionType)) {
                    Response responseRecord = createInitialResponse(surveyId, question.getQuestionId(), 
                        userId, ipAddress, 0, 0);
                    initialResponses.add(responseRecord);
                }
            }
            
            responseService.saveResponses(initialResponses);
        }
        responseService.resetIsValidForResponses(userId, surveyId);
    }

    private Response createInitialResponse(int surveyId, int questionId, int userId, String ipAddress, 
                                         int rowId, int columnId) {
        Response responseRecord = new Response();
        responseRecord.setSurveyId(surveyId);
        responseRecord.setQuestionId(questionId);
        responseRecord.setUserId(userId);
        responseRecord.setIpAddress(ipAddress);
        responseRecord.setResponseData("");
        responseRecord.setIsValid(0);
        responseRecord.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        responseRecord.setRowId(rowId);
        responseRecord.setColumnId(columnId);
        return responseRecord;
    }

    private int extractQuestionIdFromFileName(String fileName) {
        return Integer.parseInt(fileName.split("_")[1]);
    }
}

