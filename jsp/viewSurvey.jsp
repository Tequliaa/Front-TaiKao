<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ include file="/pages/header.jsp" %>
<%@ include file="/pages/nav.jsp" %>
<script src="/js/script.js"></script>
<script src="/js/validateForm.js"></script>
<script src="/js/jumpToQuestion.js" defer></script>
<div class="container-fluid">
    <div class="row">
        <%@ include file="/pages/sidebar.jsp" %>
        <main class="col-md-9 col-lg-10 p-4">
            <div id="main-content">
                <div class="container">
                    <h1 class="my-4">${survey.name}
                        <c:if test="${userRole != '普通用户' && departmentId != null}">
                            <button class="btn btn-outline-danger btn-sm" onclick="window.location.href='/UserSurveyServlet?action=unfinished&surveyId=${survey.surveyId}&surveyName=${survey.name}&departmentId=${departmentId}'">${departmentName}未答题人数:${unfinishedTotalRecords}</button>
                        </c:if>
                    </h1>
                    <h6 class="my-4">${survey.description}</h6>

                    <form id="surveyForm" action="/ResponseServlet" method="POST" enctype="multipart/form-data">
                        <input type="hidden" name="surveyId" value="${survey.surveyId}" />
                        <div class="survey-container">
                            <div class="content-container">
                                <c:forEach var="question" items="${questions}" varStatus="status">
                                    <div id="question_${question.questionId}"
                                         class="question-container mb-4"
                                         data-index="${status.index + 1}"
                                         <c:if test="${question.isSkip == 1}">data-has-skip="1"</c:if>">

                                        <div class="question-number h6">
                                                ${status.index + 1}. ${question.description}(${question.type},
                                                    <c:choose>
                                                        <c:when test="${question.isRequired == 1}">必答</c:when>
                                                        <c:otherwise>选填</c:otherwise>
                                                    </c:choose>)
                                        </div>

                                        <div class="options-container">
                                            <c:choose>
                                                <%-- 处理单选题 --%>
                                                <c:when test="${question.type == '单选'}">
                                                    <div class="form-check">
                                                        <c:forEach var="option" items="${question.options}" varStatus="optStatus">
                                                            <div class="form-check-option">
                                                                <input type="radio" name="question_${question.questionId}" value="${option.optionId}"
                                                                       id="option_${option.optionId}" data-skipto="${option.skipTo}"
                                                                       class="form-check-input radio-input" <c:if test="${question.isRequired == 1}"> required </c:if>
                                                                        <c:forEach var="userResponse" items="${userResponses}">
                                                                            <c:if test="${userResponse.questionId == question.questionId && userResponse.optionId == option.optionId && userResponse.isValid == 1}"> checked </c:if>
                                                                        </c:forEach> />
                                                                <label class="form-check-label" for="option_${option.optionId}">
                                                                        ${fn:substring('ABCDEFGHIJKLMNOPQRSTUVWXYZ', optStatus.index, optStatus.index + 1)}.
                                                                    <c:choose>
                                                                        <c:when test="${option.isOpenOption == 1}">
                                                                            <input type="text" name="open_answer_${option.optionId}" placeholder="${option.description}"
                                                                                    <c:forEach var="userResponse" items="${userResponses}">
                                                                                        <c:if test="${userResponse.optionId == option.optionId && userResponse.isValid == 1}">
                                                                                            value="${userResponse.responseData}"
                                                                                        </c:if>
                                                                                    </c:forEach> />
                                                                        </c:when>
                                                                        <c:otherwise>
                                                                            ${option.description}
                                                                            <c:if test="${option.isSkip == 1 && not empty questionIndexMap[option.skipTo]}">
                                                                                <span class="text-info">(跳转至第${questionIndexMap[option.skipTo]}题)</span>
                                                                            </c:if>
                                                                            <c:if test="${unfinishedTotalRecords != null}">
                                                                                <span class="text-info-emphasis">(选择次数为${option.checkCount})</span>
                                                                            </c:if>

                                                                        </c:otherwise>
                                                                    </c:choose>
                                                                </label>
                                                            </div>
                                                        </c:forEach>
                                                    </div>
                                                </c:when>

                                                <%-- 处理多选题 --%>
                                                <c:when test="${question.type == '多选'}">
                                                    <div class="form-check more-choice" data-required="${question.isRequired}">
                                                        <c:forEach var="option" items="${question.options}" varStatus="optStatus">
                                                            <div class="form-check-option more-option" data-required="${question.isRequired}">
                                                                <input type="checkbox" name="question_${question.questionId}" value="${option.optionId}"
                                                                       id="option_${option.optionId}" class="form-check-input"
                                                                        <c:forEach var="userResponse" items="${userResponses}" >
                                                                            <c:if test="${userResponse.questionId == question.questionId && userResponse.optionId == option.optionId && userResponse.isValid == 1}"> checked </c:if>
                                                                        </c:forEach> />
                                                                <label class="form-check-label" for="option_${option.optionId}">
                                                                        ${fn:substring('ABCDEFGHIJKLMNOPQRSTUVWXYZ', optStatus.index, optStatus.index + 1)}.
                                                                    <c:choose>
                                                                        <c:when test="${option.isOpenOption == 1}">
                                                                            <input type="text" name="open_answer_${option.optionId}" placeholder="${option.description}"
                                                                                    <c:forEach var="userResponse" items="${userResponses}">
                                                                                        <c:if test="${userResponse.optionId == option.optionId && userResponse.isValid == 1}">
                                                                                            value="${userResponse.responseData}"
                                                                                        </c:if>
                                                                                    </c:forEach> />
                                                                        </c:when>
                                                                        <c:otherwise>
                                                                            ${option.description}
                                                                            <c:if test="${unfinishedTotalRecords != null}">
                                                                                <span class="text-info-emphasis">(选择次数为${option.checkCount})</span>
                                                                            </c:if>
                                                                        </c:otherwise>
                                                                    </c:choose>
                                                                </label>
                                                            </div>
                                                        </c:forEach>
                                                    </div>
                                                </c:when>

                                                <%-- 处理填空题 --%>
                                                <c:when test="${question.type == '填空'}">
                                                    <div class="form-group">
                                                        <input type="text" name="question_${question.questionId}" class="form-control"
                                                                <c:if test="${question.isRequired == 1}"> required </c:if>
                                                                <c:forEach var="userResponse" items="${userResponses}">
                                                                    <c:if test="${userResponse.questionId == question.questionId && userResponse.isValid == 1}">
                                                                        value="${userResponse.responseData}"
                                                                    </c:if>
                                                                </c:forEach> />
                                                    </div>
                                                </c:when>

                                                <%-- 处理评分题 --%>
                                                <c:when test="${question.type == '评分题'}">
                                                    <div class="rating-question">
                                                        <c:forEach var="option" items="${question.options}" varStatus="optStatus">
                                                            <div class="form-group">
                                                                <label for="rating_${question.questionId}_${option.optionId}" class="form-label">
                                                                        ${option.description}:
                                                                </label>
                                                                <input type="number" id="rating_${question.questionId}_${option.optionId}" name="rating_${question.questionId}_${option.optionId}"
                                                                       class="form-control" min="1" max="10"
                                                                        <c:forEach var="userResponse" items="${userResponses}">
                                                                            <c:if test="${userResponse.questionId == question.questionId && userResponse.optionId == option.optionId && userResponse.isValid == 1}">
                                                                                value="${userResponse.responseData}"
                                                                            </c:if>
                                                                        </c:forEach>
                                                                        <c:if test="${question.isRequired == 1}"> required </c:if> />
                                                            </div>
                                                        </c:forEach>
                                                    </div>
                                                </c:when>

                                                <%-- 处理矩阵单选/多选 --%>
                                                <c:when test="${question.type == '矩阵单选' || question.type == '矩阵多选'}">
                                                    <%--<table class="table table-bordered">--%>
                                                    <%--<table class="table table-bordered <c:if test="${question.type == '矩阵多选'}">matrix-multiple-choice"</c:if>>--%>
                                                    <table class="table table-bordered ${question.type == '矩阵多选' ? 'matrix-multiple-choice' : question.type == '矩阵单选' ? 'matrix-single-choice' : ''}">
                                                    <thead>
                                                        <tr>
                                                            <th class="text-center">行/列</th>
                                                            <c:forEach var="column" items="${question.options}">
                                                                <c:if test="${column.type == '列选项'}">
                                                                    <th class="text-center">${column.description}</th>
                                                                </c:if>
                                                            </c:forEach>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <c:forEach var="row" items="${question.options}">
                                                            <c:if test="${row.type == '行选项'}">
                                                                <tr>
                                                                    <td>${row.description}</td>
                                                                    <c:forEach var="column" items="${question.options}">
                                                                        <c:if test="${column.type == '列选项'}">
                                                                            <td>
                                                                                <c:choose>
                                                                                    <c:when test="${question.type == '矩阵单选'}">
                                                                                        <input type="radio" name="question_${question.questionId}_row_${row.optionId}"
                                                                                               value="${column.optionId}" id="row_${row.optionId}_column_${column.optionId}"
                                                                                                <c:if test="${question.isRequired == 1}"> required </c:if>
                                                                                                <c:forEach var="userResponse" items="${userResponses}">
                                                                                                    <c:if test="${userResponse.questionId == question.questionId && userResponse.rowId == row.optionId && userResponse.columnId == column.optionId && userResponse.isValid == 1}"> checked </c:if>
                                                                                                </c:forEach> />
                                                                                    </c:when>

                                                                                    <c:when test="${question.type == '矩阵多选'}">
                                                                                        <input type="checkbox"
                                                                                               name="question_${question.questionId}_row_${row.optionId}_column_${column.optionId}"
                                                                                               data-row-id="${row.optionId}"
                                                                                               data-question-id="${question.questionId}"
                                                                                               value="${column.optionId}"
                                                                                               id="row_${row.optionId}_column_${column.optionId}"
                                                                                                <c:forEach var="userResponse" items="${userResponses}">
                                                                                                    <c:if test="${userResponse.questionId == question.questionId && userResponse.rowId == row.optionId && userResponse.columnId == column.optionId && userResponse.isValid == 1}">
                                                                                                        checked
                                                                                                    </c:if>
                                                                                                </c:forEach> />
                                                                                    </c:when>
                                                                                </c:choose>
                                                                            </td>
                                                                        </c:if>
                                                                    </c:forEach>
                                                                </tr>
                                                            </c:if>
                                                        </c:forEach>
                                                        </tbody>
                                                    </table>
                                                </c:when>

                                                <%-- 处理文件上传题 --%>
                                                <c:when test="${question.type == '文件上传题'}">
                                                    <div class="form-group">
                                                        <input type="file" name="question_${question.questionId}" class="form-control-file"
                                                               accept=".jpg,.png,.pdf,.docx" <c:if test="${question.isRequired == 1}"> required </c:if> />
                                                        <c:forEach var="userResponse" items="${userResponses}">
                                                            <c:if test="${userResponse.questionId == question.questionId && userResponse.isValid == 1}">
                                                                <p>已上传文件：<a href="${userResponse.filePath}" target="_blank">${userResponse.filePath}</a></p>
                                                            </c:if>
                                                        </c:forEach>
                                                    </div>
                                                </c:when>
                                            </c:choose>
                                        </div>
                                    </div>
                                </c:forEach>
                            </div>


                        <div class="form-group text-center">
                            <%--          ${userResponses == null ? '' : 'disabled style="background-color: gray; cursor: not-allowed;"'}>--%>
                            <%-- 保存按钮 --%>
                            <input type="hidden" name="answerUserId" value="${answerUserId}">
                            <input type="hidden" name="actionType1" id="actionType1" value="">

                            <button type="submit" id="remakeButton" class="btn btn-primary"
                            ${userRole == '超级管理员' ? '' : 'style="display: none;"'}
                            ${userSurvey.status == '已完成' || userId == 0 ? '' : 'disabled style="background-color: gray; cursor: not-allowed;"'}>
                                打回重做
                            </button>


                            <button type="submit" id="saveButton" class="btn btn-primary"
                            ${userSurvey.status == '未完成' || userId == 0? '' : 'disabled style="background-color: gray; cursor: not-allowed;"'}>
                                保存问卷
                            </button>

                            <%--提交按钮 --%>
                            <button type="submit" id="submitButton" name="actionType" value="submit" class="btn btn-success"
                            ${userSurvey.status == '未完成' || userId == 0? '' : 'disabled style="background-color: gray; cursor: not-allowed;"'}>
                                提交问卷
                            </button>

                        </div>

                    </form>
                </div>
            </div>
        </main>
    </div>
</div>
<%@ include file="/pages/footer.jsp" %>