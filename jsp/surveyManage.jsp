<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>

<!-- jQuery 和自定义脚本 -->
<script src="${pageContext.request.contextPath}/js/jquery-3.6.0.min.js"></script>
<script src="${pageContext.request.contextPath}/js/delete.js"></script>
<script src="${pageContext.request.contextPath}/js/search.js"></script>

<div class="container my-4">
    <h1 class="mb-4">问卷管理</h1>

    <!-- 搜索框和“创建问卷”按钮 -->
    <div class="row mb-4">
        <div class="col-md-8">
            <form action="/SurveyServlet" method="get" id="searchForm" class="d-flex">
                <input type="hidden" name="action" value="list">
                <input type="hidden" name="whichPage" value="surveyManage">
                <input type="text" name="searchQuery" class="form-control me-2" placeholder="请输入问卷名称或描述">
                <button type="submit" class="btn btn-primary">搜索</button>
            </form>
        </div>
        <div class="col-md-4 text-end">
            <button class="btn btn-success" onclick="window.location.href='/pages/survey/createSurvey.jsp'">创建问卷</button>
        </div>
    </div>

    <!-- 问卷列表 -->
    <div class="row">
        <c:forEach var="survey" items="${surveys}" varStatus="status">
            <%-- col-md-4 在中等以及更大屏幕占4/12 1/3的宽度 --%>
            <%--mb-4 每个卡片底部的边距--%>
            <div class="col-md-4 mb-4">

                <%--卡片样式 高度百分百--%>
                <div class="card h-100">
                    <%--卡片内容部分--%>
                    <div class="card-body">
                        <%--子内容 标题和文本内容--%>
                        <h5 class="card-title">${survey.name}</h5>
                        <p class="card-text">更新于 ${survey.getFormattedUpdatedAt()}</p>
                    </div>
                    <%--flex布局 按钮在同一行显示, 左右两端对齐--%>
                    <div class="card-footer d-flex justify-content-between">
                        <%--btn-outline 只显示轮廓不填充颜色 小尺寸按钮--%>
                        <%--    <button onclick="window.location.href='http://www.baidu.com'">链接</button>--%>
                        <button class="btn btn-outline-primary btn-sm" onclick="window.location.href='/QuestionServlet?action=list&surveyId=${survey.surveyId}&page=1&YuLan=1'">预览</button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="window.location.href='/QuestionServlet?action=list&surveyId=${survey.surveyId}&page=1'">查看</button>
                        <button class="btn btn-outline-info btn-sm" onclick="window.location.href='/SurveyServlet?action=assign&id=${survey.surveyId}'">发放</button>
                        <button class="btn btn-outline-warning btn-sm" onclick="window.location.href='/SurveyServlet?action=edit&id=${survey.surveyId}'">编辑</button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteSurvey(${survey.surveyId})">删除</button>
                    </div>
                </div>
            </div>
        </c:forEach>
    </div>

    <!-- 分页 -->
    <nav aria-label="Page navigation">
        <ul class="pagination justify-content-center">
            <%-- 上一页 --%>
            <li class="page-item ${currentPage == 1 ? 'disabled' : ''}">
                <a class="page-link" href="/SurveyServlet?action=list&page=${currentPage - 1}&flag=1<c:if test="${not empty keyword}">&keyword=${keyword}</c:if>"
                   aria-label="Previous">&laquo;</a>
            </li>

            <c:choose>
                <%-- 如果总页数小于等于显示页码的数量，显示所有页码 --%>
                <c:when test="${totalPages <= 7}">
                    <c:forEach begin="1" end="${totalPages}" var="page">
                        <li class="page-item ${currentPage == page ? 'active' : ''}">
                            <a class="page-link" href="/SurveyServlet?action=list&page=${page}&flag=1<c:if test="${not empty keyword}">&keyword=${keyword}</c:if>"
                            >${page}</a>
                        </li>
                    </c:forEach>
                </c:when>
                <%-- 如果总页数大于显示页码的数量，控制页码范围 --%>
                <c:otherwise>
                    <%-- 显示第一页 --%>
                    <li class="page-item ${currentPage == 1 ? 'active' : ''}">
                        <a class="page-link" href="/SurveyServlet?action=list&page=${page}&flag=1<c:if test="${not empty keyword}">&keyword=${keyword}</c:if>"
                        >1</a>
                    </li>
                    <%-- 如果当前页大于4，显示省略号 --%>
                    <c:if test="${currentPage > 4}">
                        <li class="page-item disabled">
                            <span class="page-link">...</span>
                        </li>
                    </c:if>
                    <%-- 显示当前页及其前后2页，限定范围 --%>
                    <c:forEach begin="${currentPage - 2 > 1 ? currentPage - 2 : 2}"
                               end="${currentPage + 2 < totalPages ? currentPage + 2 : totalPages - 1}"
                               var="page">
                        <li class="page-item ${currentPage == page ? 'active' : ''}">
                            <a class="page-link" href="/SurveyServlet?action=list&page=${page}&flag=1<c:if test="${not empty keyword}">&keyword=${keyword}</c:if>"
                            >${page}</a>
                        </li>
                    </c:forEach>
                    <%-- 如果当前页小于总页数减3，显示省略号 --%>
                    <c:if test="${currentPage < totalPages - 3}">
                        <li class="page-item disabled">
                            <span class="page-link">...</span>
                        </li>
                    </c:if>
                    <%-- 显示最后一页 --%>
                    <li class="page-item ${currentPage == totalPages ? 'active' : ''}">
                        <a class="page-link" href="/SurveyServlet?action=list&page=${totalPages}&flag=1<c:if test="${not empty keyword}">&keyword=${keyword}</c:if>"
                        >${totalPages}</a>
                    </li>
                </c:otherwise>
            </c:choose>

            <li class="page-item ${currentPage == totalPages ? 'disabled' : ''}">
                <a class="page-link" href="/SurveyServlet?action=list&page=${currentPage + 1}&flag=1<c:if test="${not empty keyword}">&keyword=${keyword}</c:if>"
                   aria-label="Next">&raquo;</a>
            </li>
        </ul>
    </nav>
</div>
