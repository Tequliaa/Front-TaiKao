package com.example.controller;

import com.example.entity.Survey;
import com.example.service.SurveyService;
import com.example.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/survey")
public class SurveyController {
    @Autowired
    private SurveyService surveyService;

    // 保存问卷
    @PostMapping("/save")
    public Result saveSurvey(@RequestBody Survey survey) {
        try {
            // 设置创建时间
            survey.setCreateTime(LocalDateTime.now());
            // 设置更新时间
            survey.setUpdateTime(LocalDateTime.now());
            // 设置状态为草稿
            survey.setStatus("draft");
            // 保存问卷
            surveyService.save(survey);
            return Result.success(survey.getId());
        } catch (Exception e) {
            return Result.error("保存问卷失败");
        }
    }

    // 更新问卷
    @PutMapping("/update")
    public Result updateSurvey(@RequestBody Survey survey) {
        try {
            // 设置更新时间
            survey.setUpdateTime(LocalDateTime.now());
            // 更新问卷
            surveyService.updateById(survey);
            return Result.success();
        } catch (Exception e) {
            return Result.error("更新问卷失败");
        }
    }

    // 提交问卷
    @PostMapping("/submit")
    public Result submitSurvey(@RequestBody Survey survey) {
        try {
            // 设置更新时间
            survey.setUpdateTime(LocalDateTime.now());
            // 设置状态为已发布
            survey.setStatus("published");
            // 更新问卷
            surveyService.updateById(survey);
            return Result.success();
        } catch (Exception e) {
            return Result.error("提交问卷失败");
        }
    }

    // 获取问卷详情
    @GetMapping("/detail/{id}")
    public Result getSurveyDetail(@PathVariable Integer id) {
        try {
            Survey survey = surveyService.getById(id);
            if (survey == null) {
                return Result.error("问卷不存在");
            }
            return Result.success(survey);
        } catch (Exception e) {
            return Result.error("获取问卷详情失败");
        }
    }

    // 获取问卷列表
    @GetMapping("/list")
    public Result getSurveyList(@RequestParam(required = false) String status,
                              @RequestParam(required = false) String keyword,
                              @RequestParam(defaultValue = "1") Integer pageNum,
                              @RequestParam(defaultValue = "10") Integer pageSize) {
        try {
            Page<Survey> page = surveyService.getSurveyList(status, keyword, pageNum, pageSize);
            return Result.success(page);
        } catch (Exception e) {
            return Result.error("获取问卷列表失败");
        }
    }

    // 删除问卷
    @DeleteMapping("/delete/{id}")
    public Result deleteSurvey(@PathVariable Integer id) {
        try {
            surveyService.removeById(id);
            return Result.success();
        } catch (Exception e) {
            return Result.error("删除问卷失败");
        }
    }
} 