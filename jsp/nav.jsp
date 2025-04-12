<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%--先隐藏 点按钮后显示 d-md-none大屏（>768px）不显示--%>
<nav class="collapse bg-light d-md-none" id="topSidebar">
  <%--横向均匀分布 p-2有内边框 没那么紧凑--%>
  <ul class="nav d-flex flex-row justify-content-around p-2">
    <% if (!"普通用户".equals(session.getAttribute("userRole"))) { %>
    <li class="nav-item survey"><a class="nav-link" href="/SurveyServlet?action=list">问卷管理</a></li>
    <li class="nav-item department"><a class="nav-link" href="/DepartmentServlet?action=list">部门管理</a></li>
    <% } %>

    <% if ("超级管理员".equals(session.getAttribute("userRole"))) { %>
    <li class="nav-item user"><a class="nav-link" href="/UserServlet?action=list">用户管理</a></li>
    <% } %>

    <li class="nav-item mySurveys"><a class="nav-link" href="/UserSurveyServlet?action=list&id=' + ${userId})">我的问卷</a></li>
    <li class="nav-item"><a class="nav-link" href="/pages/user/personalCenter.jsp">个人中心</a></li>
  </ul>
</nav>
