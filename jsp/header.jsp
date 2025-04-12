<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>问卷调查平台</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="${pageContext.request.contextPath}/css/table.css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/bootstrap.min.css">

    <script src="${pageContext.request.contextPath}/js/jquery-3.6.0.min.js"></script>
    <script src="${pageContext.request.contextPath}/js/bootstrap.bundle.min.js"></script>

</head>
<body>
<header class="bg-dark text-white p-3">
    <%--container 页面内容自动居中 控制宽度 flex布局在同一行排列 垂直居中对齐--%>
    <div class="container d-flex justify-content-between align-items-center">
        <h1 class="h4">问卷调查平台</h1>
        <%--小于大屏时 折叠成汉堡菜单--%>
        <nav class="navbar navbar-expand-lg navbar-dark">
            <%--折叠按钮--%>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <%--margin-end margin-bottom--%>
                <ul class="navbar-nav me-auto mb-2 mb-lg-0 topNavigate">
                    <% if (!"普通用户".equals(session.getAttribute("userRole"))) { %>
                    <li class="nav-item"><a class="nav-link" href="/SurveyServlet?action=list&flag=1">首页</a></li>
                    <li class="nav-item"><a class="nav-link" href="/SurveyServlet?action=list">问卷管理</a></li>
                    <li class="nav-item"><a class="nav-link" href="/CategoryServlet?action=list">分类管理</a></li>
                    <li class="nav-item"><a class="nav-link" href="/QuestionServlet?action=list">题库管理</a></li>
                    <li class="nav-item"><a class="nav-link" href="/OptionServlet?action=list">选项管理</a></li>
                    <% } %>
                </ul>
            </div>
        </nav>
        <div class="user-info">
            <span>${sessionScope.username}</span>
            <a href="${pageContext.request.contextPath}/UserServlet?action=logout" class="btn btn-sm btn-danger">退出</a>
        </div>
    </div>
</header>
