package com.example.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.entity.Survey;

public interface SurveyService extends IService<Survey> {
    /**
     * 获取问卷列表
     * @param status 问卷状态
     * @param keyword 搜索关键词
     * @param pageNum 页码
     * @param pageSize 每页大小
     * @return 分页结果
     */
    Page<Survey> getSurveyList(String status, String keyword, Integer pageNum, Integer pageSize);
} 