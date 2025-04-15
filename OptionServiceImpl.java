package com.example.service.impl;

import com.example.entity.Option;
import com.example.mapper.OptionMapper;
import com.example.service.OptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class OptionServiceImpl implements OptionService {

    @Autowired
    private OptionMapper optionMapper;

    @Override
    public List<Option> getOptionsWithCheckCountByQuestionId(int questionId, int departmentId) {
        return optionMapper.getOptionsWithCheckCountByQuestionId(questionId, departmentId);
    }
    
    @Override
    public List<Map<String, Object>> getMatrixCellCheckCount(int questionId, int departmentId) {
        return optionMapper.getMatrixCellCheckCount(questionId, departmentId);
    }
} 