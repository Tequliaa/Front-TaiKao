package com.example.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.Survey;
import com.example.mapper.SurveyMapper;
import com.example.service.SurveyService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class SurveyServiceImpl extends ServiceImpl<SurveyMapper, Survey> implements SurveyService {

    @Override
    public Page<Survey> getSurveyList(String status, String keyword, Integer pageNum, Integer pageSize) {
        LambdaQueryWrapper<Survey> wrapper = new LambdaQueryWrapper<>();
        
        // 状态筛选
        if (StringUtils.hasText(status)) {
            wrapper.eq(Survey::getStatus, status);
        }
        
        // 关键词搜索
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Survey::getTitle, keyword)
                    .or()
                    .like(Survey::getDescription, keyword));
        }
        
        // 按创建时间倒序排序
        wrapper.orderByDesc(Survey::getCreateTime);
        
        return page(new Page<>(pageNum, pageSize), wrapper);
    }
} 