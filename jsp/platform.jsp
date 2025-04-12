<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ include file="header.jsp" %>
<%@ include file="nav.jsp" %>


<div class="container-fluid">
    <div class="row">
        <%@ include file="sidebar.jsp" %>
        <main class="col-md-9 col-lg-10 p-4">
            <div id="main-content">
                <%@ include file="survey/surveyManage.jsp" %>
            </div>
        </main>
    </div>
</div>
<%@ include file="footer.jsp" %>