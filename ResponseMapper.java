// 获取用户已有的文件响应记录
@Select("SELECT * FROM response WHERE user_id = #{userId} AND survey_id = #{surveyId} AND file_path IS NOT NULL")
List<Response> selectExistingFileResponses(@Param("userId") int userId, @Param("surveyId") int surveyId);

// 重置指定用户的响应记录的有效性，但排除指定的记录ID
@Update("UPDATE response SET is_valid = 0 WHERE user_id = #{userId} AND survey_id = #{surveyId} AND id NOT IN " +
        "<foreach collection='excludedIds' item='id' open='(' separator=',' close=')'>" +
        "#{id}" +
        "</foreach>")
void resetIsValidForResponsesExcludingIds(@Param("userId") int userId, @Param("surveyId") int surveyId, 
                                        @Param("excludedIds") Set<Integer> excludedIds); 