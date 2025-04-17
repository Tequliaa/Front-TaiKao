package SurveySystem.Controller;


import SurveySystem.Model.Option;
import SurveySystem.Model.Question;
import SurveySystem.Model.Result;
import SurveySystem.Model.Survey;
import SurveySystem.Service.OptionService;
import SurveySystem.Service.QuestionService;
import SurveySystem.Service.SurveyService;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/survey")
public class SurveyController {

    private final SurveyService surveyService;
    private final QuestionService questionService;
    private final OptionService optionService;
    public SurveyController(SurveyService surveyService,
                            QuestionService questionService,
                            OptionService optionService) {
        this.surveyService = surveyService;
        this.questionService = questionService;
        this.optionService = optionService;
    }


    @GetMapping("/list")
    public Result<Map<String, Object>> listSurveys(
            @RequestParam int pageNum,
            @RequestParam int pageSize,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "1") int userId,
            @RequestParam(defaultValue = "超级管理员") String role) {
        List<Survey> surveys = surveyService.getSurveysByPage(pageNum, pageSize,keyword, userId, role);
        int totalCount = surveyService.getSurveyCount(userId, keyword,role);
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("surveys", surveys);
        resultMap.put("totalCount", totalCount);
        return Result.success(resultMap);
    }

    @GetMapping("/getAll")
    public Result<List<Survey>> getAllSurveys(@RequestParam int userId) {
        System.out.println("请求到这里了");
        List<Survey> surveys = surveyService.getAllSurveys(userId);
        return Result.success(surveys);
    }

    @GetMapping("/getSurveyAndQuestionsById")
    public Result<Map<String, Object>> getSurveyById(@RequestParam int surveyId) {
        Survey survey = surveyService.getSurveyById(surveyId);
        List<Question> questions=questionService.getAllQuestions(surveyId);
        for(Question question:questions){
            List<Option> options= optionService.getOptionsByQuestionId(question.getQuestionId());
            question.setOptions(options);
        }
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("survey",survey);
        resultMap.put("questions",questions);
        return Result.success(resultMap);
    }

    @Data
    public class SurveySaveDTO {
        private Survey survey;
        private List<Question> questions;
    }

    @PostMapping("/saveBuild")
    public Result<Void> saveSurvey(@RequestBody SurveySaveDTO dto) {
        Survey survey = dto.survey;
        List<Question> questions=dto.questions;
        if(survey.getSurveyId()!=0){
            surveyService.updateSurvey(survey);
            handleSurveyContent(questions,survey);
        }else{
            surveyService.createSurvey(survey);
            handleSurveyContent(questions,survey);
        }
        return Result.success();
    }


    @PostMapping("/updateBuild")
    public Result<Void> updateBuildSurvey(@RequestBody SurveySaveDTO dto) {
        Survey survey = dto.survey;
        List<Question> questions=dto.questions;
        surveyService.updateSurvey(survey);
        handleSurveyContent(questions,survey);
        return Result.success();
    }

    public void handleSurveyContent(List<Question> questions,Survey survey){
        for(Question question:questions){
            if(question.getQuestionId()!=0){
                question.setSurveyId(survey.getSurveyId());
                int questionId = question.getQuestionId();
                questionService.updateQuestion(question);
                for(Option option:question.getOptions()){
                    if(option.getOptionId()!=0){
                        option.setQuestionId(questionId);
                        optionService.updateOption(option);
                    }else {
                        optionService.addOption(option);
                    }
                }
            }else {
                questionService.addQuestionAndReturnId(question);
                int questionId =question.getQuestionId();
                question.setSurveyId(survey.getSurveyId());
                for(Option option:question.getOptions()){
                    if(option.getOptionId()!=0){
                        option.setQuestionId(questionId);
                        optionService.updateOption(option);
                    }else {
                        optionService.addOption(option);
                    }
                }
            }
        }
    }

    @PostMapping("/add")
    public Result<Void> createSurvey(@RequestBody Survey survey) {
        surveyService.createSurvey(survey);
        return Result.success();
    }

    @PutMapping("/update")
    public Result<Void> updateSurvey(@RequestBody Survey survey) {
        surveyService.updateSurvey(survey);
        return Result.success();
    }

    @DeleteMapping("/delete")
    public Result<Void> deleteSurvey(@RequestParam int surveyId) {
        surveyService.deleteSurvey(surveyId);
        return Result.success();
    }
}
