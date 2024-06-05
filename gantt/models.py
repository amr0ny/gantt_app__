from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from gantt.mixins import TimeStampedMixin, UUIDMixin


# TODO: constraints which are essential

class Person(AbstractUser):
    class Meta:
        db_table = "content\".\"person"


class Project(TimeStampedMixin, UUIDMixin):
    class StatusChoices(models.TextChoices):
        AS_SCHEDULED = 'as scheduled'
        AT_RISK = 'at risk'
        EXPIRED = 'expired'
        NO_STATUS = 'no status'

    name = models.CharField('name', max_length=255)
    start_date = models.DateField('start_date')
    status = models.TextField('status', choices=StatusChoices.choices, default=StatusChoices.NO_STATUS)
    progress = models.FloatField('progress', validators=[MinValueValidator(0),
                                                         MaxValueValidator(1)], default=0)
    members = models.ManyToManyField(Person, through='PersonProject', related_name='projects')
    creator = models.ForeignKey(Person, on_delete=models.DO_NOTHING, related_name='created_projects', blank=True)
    class Meta:
        db_table = "content\".\"project"


# TODO: Implement mechanism of subtasks
class Task(UUIDMixin, TimeStampedMixin):
    class TypeChoices(models.TextChoices):
        TASK = 'task'
        SUBTASK = 'subtask'
        MILESTONE = 'milestone'

    class StatusChoices(models.TextChoices):
        OPEN = 'open'
        IN_PROGRESS = 'in progress'
        DONE = 'done'
        CLOSED = 'closed'
    
    class PriorityChoices(models.TextChoices):
        THE_HIGHEST = 'the highest'
        HIGH = 'high'
        MEDIUM = 'medium'
        LOW = 'low'
        THE_LOWEST = 'the lowest'
    
    name = models.CharField('name', max_length=255)
    status = models.TextField('status', choices=StatusChoices.choices, default=StatusChoices.OPEN)
    type = models.TextField('type', choices=TypeChoices.choices)
    color = models.CharField(max_length=9);
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    assignees = models.ManyToManyField(Person, related_name='tasks',
                                     limit_choices_to={'projects': project})
    # TODO: probably it's good idea to add field 'subtasks' or smth
    start_datetime = models.DateTimeField('start_datetime')
    end_datetime = models.DateTimeField('end_datetime')
    class Meta:
        db_table = "content\".\"task"
        ordering = ['created']
        # TODO: Add indices


class File(UUIDMixin, TimeStampedMixin):
    task = models.ForeignKey(Task, related_name='files', on_delete=models.CASCADE)
    file = models.FileField(upload_to='task_files/')
    assignee = models.ForeignKey(Person, related_name='files', on_delete=models.CASCADE)
    class Meta:
        db_table = "content\".\"file"
        # TODO: Add indices


#! Add post_save signal to handle permissions
class PersonProject(UUIDMixin):
    
    class RoleChoices(models.TextChoices):
        ADMIN = 'admin'
        ADVANCED = 'advanced'
        EDITOR = 'editor'
        RESCTRICTED = 'restricted'
    
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    role = models.TextField('role', choices=RoleChoices.choices)

    class Meta:
        db_table = "content\".\"person_project"
        indexes = [
            models.Index(fields=['person']),
            models.Index(fields=['project']),
        ]

    @classmethod
    def create(cls, project, person, role):
        instance = cls(project=project, person=person, role=role)
        instance.save()
        return instance