<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<aside class="col-md-3 col-lg-2 bg-light sidebar pt-4 d-none d-md-block">
    <ul class="nav flex-column">
        <% if (!"普通用户".equals(session.getAttribute("userRole"))) { %>
        <li class="nav-item"><a class="nav-link" href="/SurveyServlet?action=list">问卷管理</a></li>
        <li class="nav-item department"><a class="nav-link" href="/DepartmentServlet?action=list">部门管理</a></li>
        <% } %>
        <% if ("超级管理员".equals(session.getAttribute("userRole"))) { %>
        <li class="nav-item user"><a class="nav-link" href="/UserServlet?action=list">用户管理</a></li>
        <% } %>
        <li class="nav-item mySurveys"><a class="nav-link" href="/UserSurveyServlet?action=list&id=' + ${userId}">我的问卷</a></li>
        <li class="nav-item"><a class="nav-link" href="/pages/user/personalCenter.jsp">个人中心</a></li>

    </ul>
</aside>
