// 获取用户已有的文件响应记录
public List<Response> getExistingFileResponses(int userId, int surveyId) {
    return responseMapper.selectExistingFileResponses(userId, surveyId);
}

// 重置指定用户的响应记录的有效性，但排除指定的记录ID
public void resetIsValidForResponsesExcludingIds(int userId, int surveyId, Set<Integer> excludedIds) {
    responseMapper.resetIsValidForResponsesExcludingIds(userId, surveyId, excludedIds);
}

// 获取指定问题的所有文件记录
public List<Response> getExistingFileResponses(int questionId) {
    return responseMapper.selectExistingFileResponsesByQuestionId(questionId);
} 