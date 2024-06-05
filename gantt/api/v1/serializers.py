from rest_framework import serializers
from rest_framework.response import Response
from gantt.models import Project, Person, PersonProject, Task
from django.db import transaction
from datetime import datetime


class CustomDateTimeField(serializers.DateTimeField):
    def to_internal_value(self, value):
        try:
            # Пытаемся преобразовать значение в формат datetime
            return datetime.strptime(value, '%d.%m.%Y, %H:%M')
        except ValueError:
            self.fail('invalid', format='DD.MM.YYYY, HH:MM')

    def to_representation(self, value):
        # Возвращаем значение в нужном формате
        return value.strftime('%d.%m.%Y, %H:%M')
    

class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class TaskReadSerializer(serializers.ModelSerializer): 
    assignees = PersonSerializer(many=True)

    class Meta:
        model = Task
        fields = ['id', 'name', 'type', 'status', 'assignees', 'color', 'start_datetime', 'end_datetime', 'modified']


class TaskWriteSerializer(serializers.ModelSerializer):
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    status = serializers.ChoiceField(choices=Task.StatusChoices.choices, required=False)
    assignees = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), many=True, required=False)
    class Meta:
        model = Task
        fields = ['id', 'name', 'type', 'start_datetime', 'end_datetime', 'status', 'assignees', 'color']

    def create(self, validated_data):
        assignees_data = validated_data.pop('assignees', [])
        task = Task.objects.create(**validated_data)
        self.update_assignees(task, assignees_data)
        return task
    
    def update(self, instance, validated_data):
        assignees_data = validated_data.pop('assignees', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if assignees_data is not None:
            self.update_assignees(instance, assignees_data)

        return instance

    def update_assignees(self, task, assignees_data):
        with transaction.atomic():
            project_members = PersonProject.objects.filter(project=task.project).values_list('person_id', flat=True)
            valid_assignees = [assignee for assignee in assignees_data if assignee.id in project_members]
            task.assignees.set(valid_assignees)

    def validate_assignees(self, value):
        task = self.instance
        if task:
            project_members = PersonProject.objects.filter(project=task.project).values_list('person_id', flat=True)
            for assignee in value:
                if assignee.id not in project_members:
                    raise serializers.ValidationError(f"Person with ID {assignee.id} is not a member of the project.")
        return value

   
        
class MemberWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['id', 'username']


class MemberReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class PersonProjectWriteSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)

    class Meta:
        model = PersonProject
        fields = ['username', 'role']

    def validate(self, data):
        username = data.get('username')
        role = data.get('role')
        project = self.context['view'].get_project_instance()

        # Check if the user already exists in the project
        if PersonProject.objects.filter(person__username=username, project=project).exists():
            raise serializers.ValidationError("This user is already a member of the project.")

        # Check if there is already an Admin in the project
        if role == PersonProject.RoleChoices.ADMIN and PersonProject.objects.filter(project=project, role=PersonProject.RoleChoices.ADMIN).exists():
            raise serializers.ValidationError("There can only be one Admin in the project.")

        return data

    def create(self, validated_data):
        username = validated_data.pop('username')
        try:
            person = Person.objects.get(username=username)
        except Person.DoesNotExist:
            raise serializers.ValidationError({"username": "User with this username does not exist."})

        person_project = PersonProject.objects.create(person=person, **validated_data)
        return person_project


class PersonProjectReadSerializer(serializers.ModelSerializer):
    person = MemberReadSerializer()

    class Meta:
        model = PersonProject
        fields = ['person', 'role']


class ProjectReadSerializer(serializers.ModelSerializer):
    members = PersonProjectReadSerializer(many=True, read_only=True, source='personproject_set')
    tasks = TaskReadSerializer(many=True, read_only=True, source='task_set')
    class Meta:
        model = Project
        fields = ['id', 'name', 'start_date', 'status', 'progress', 'creator', 'members', 'tasks']


class ProjectWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        status = serializers.ChoiceField(Project.StatusChoices.choices, required=False)
        fields = ['id', 'name', 'start_date', 'status']

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        validated_data['creator'] = user
        project = Project.objects.create(**validated_data)
        
        # Creating the PersonProject instance with the role of ADMIN
        PersonProject.objects.create(project=project, person=user, role=PersonProject.RoleChoices.ADMIN)

        return project