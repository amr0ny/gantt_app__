from django.urls import path, include


urlpatterns = [
    path('v1/', include('gantt.api.v1.urls'))
]