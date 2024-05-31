# myapp/urls.py
from django.urls import path, include
from gantt.api.v1.views import ProjectViewSet, TaskViewSet, MemberViewSet, ContextDataUpdateAPIView
from rest_framework_nested import routers

router = routers.DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')

project_router = routers.NestedDefaultRouter(router, r'projects', lookup='project')
project_router.register(r'tasks', TaskViewSet, basename='project-tasks')

project_router.register(r'members', MemberViewSet, basename='project-members')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(project_router.urls)),
    path('context/', ContextDataUpdateAPIView.as_view()),
]
