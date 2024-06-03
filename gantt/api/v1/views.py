from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from gantt.models import Project, Task, PersonProject
from rest_framework.permissions import IsAuthenticated
from .serializers import ProjectReadSerializer, ProjectWriteSerializer, TaskReadSerializer, TaskWriteSerializer, PersonProjectReadSerializer, PersonProjectWriteSerializer
from .permissions import IsCreatorOrTeamMemberPermission

# ! Must fix the bug with permissions
class ProjectViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsCreatorOrTeamMemberPermission]
    pagination_class = None
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            queryset = Project.objects.filter(Q(creator=user) | Q(members=user)).distinct()
        else:
            queryset = Project.objects.none()
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        project = serializer.instance
        read_serializer = ProjectReadSerializer(project)
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'count': queryset.count(),
            'results': serializer.data
        }
        return Response(response_data)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProjectReadSerializer
        return ProjectWriteSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsCreatorOrTeamMemberPermission])
    def add_member(self, request, pk=None):
        project = self.get_object()
        user_id = request.data.get('user_id')
        if user_id:
            try:
                user = get_user_model().objects.get(id=user_id)
                project.members.add(user)
                return Response(status=status.HTTP_204_NO_CONTENT)
            except get_user_model().DoesNotExist:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"detail": "User ID not provided"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsCreatorOrTeamMemberPermission])
    def add_task(self, request, pk=None):
        project = self.get_object()
        serializer = TaskWriteSerializer(data=request.data, context={'request': request, 'project': project})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskViewSet(ModelViewSet):
    permission_classes = [IsCreatorOrTeamMemberPermission]
    pagination_class = None
    
    def get_queryset(self):
        user = self.request.user
        project = self.get_project_instance()
        if user.is_authenticated:
            queryset = Task.objects.filter(project=project).order_by('start_datetime')
        else:
            queryset = Project.objects.none()
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return TaskReadSerializer
        return TaskWriteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        task = serializer.instance
        read_serializer = TaskReadSerializer(task)
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        project = self.get_project_instance()
        context['project'] = project
        return context
        
    def perform_create(self, serializer):
        project = self.get_project_instance()
        serializer.save(project=project)

    def get_project_instance(self):
        project_id = self.kwargs.get('project_pk')
        project = get_object_or_404(Project, id=project_id)
        self.check_object_permissions(self.request, project)
        return project


class ContextDataUpdateAPIView(APIView):
    def post(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'User is not authenticated'}, status=status.HTTP_403_FORBIDDEN)

        updates = request.data
        updated = {}
        print(updates)
        for key, value in updates.items():

            print(key, value)
            request.session[key] = value
            updated[key] = value
        
        print(updated)
        return Response(updated, status=status.HTTP_200_OK)
    

class MemberViewSet(ModelViewSet):
    permission_classes = [IsCreatorOrTeamMemberPermission]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        project = self.get_project_instance()
        if user.is_authenticated:
            queryset = PersonProject.objects.filter(project=project)
        else:
            queryset = PersonProject.objects.none()
        return queryset
    
    def get_object(self):
        """
        Returns the object the view is displaying.

        You may want to override this if you need to provide non-standard
        queryset lookups.  Eg if objects are referenced using multiple
        keyword arguments in the url conf.
        """
        queryset = self.filter_queryset(self.get_queryset())

        # Perform the lookup filtering.
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        assert lookup_url_kwarg in self.kwargs, (
            'Expected view %s to be called with a URL keyword argument '
            'named "%s". Fix your URL conf, or set the `.lookup_field` '
            'attribute on the view correctly.' %
            (self.__class__.__name__, lookup_url_kwarg)
        )

        person = self.kwargs[lookup_url_kwarg]
        project = self.get_project_instance()
        obj = get_object_or_404(queryset, project=project, person=person)

        # May raise a permission denied
        self.check_object_permissions(self.request, obj)

        return obj
    
    def get_project_instance(self):
        project_id = self.kwargs.get('project_pk')
        project = get_object_or_404(Project, id=project_id)
        self.check_object_permissions(self.request, project)
        return project
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Добавьте здесь вашу логику проверки полей
        if instance.role == 'admin':
            return Response({"error": "Cannot remove an admin member"}, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return PersonProjectReadSerializer
        return PersonProjectWriteSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        person_project = serializer.instance
        read_serializer = PersonProjectReadSerializer(person_project)
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        project = self.get_project_instance()
        serializer.save(project=project)