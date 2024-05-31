from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.shortcuts import render,redirect
from gantt.forms import SignUpForm
from django.http import HttpResponse
from django.urls import reverse
import json

# Create your views here.

def signup(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('/signin/')
        
    elif request.method == 'GET':
        form = SignUpForm()
    return render(request, 'registration/signup.html', {'form': form})

def signin(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('/')
    elif request.method == 'GET':
        form = AuthenticationForm()
    return render(request, 'registration/signin.html', {'form': form})

#! Implement mechanism of remembering last project user worked on


@login_required
def index(request):
    current_project = request.session['project']['id'] if 'project' in request.session and 'id' in request.session['project'] else None
    data = {
        'user' : {
            'id': request.user.id
            },
        'project': {
            'id': current_project
            },
        'content': {
            'statuses': {
                'no status': {'class': 'list-group-item-info', 'text': 'Не установлен'},
                'at risk': {'class': 'list-group-item-warning', 'text':'Под угрозой'},
                'expired': {'class': 'list-group-item-danger', 'text': 'Просрочен'},
                'as scheduled': {'class': 'list-group-item-success', 'text': 'По графику'},
            },
            'task_statuses': {
                'done': {'class': 'badge-success'},
                'open': {'class': 'badge-primary'},
                'in progress': {'class': 'badge-warning'},
                'closed': {'class': 'badge-dark'},

            },
            'roles': {
                'Admin': {'text': 'Владелец проекта'},
                'Editor': {'text': 'Участник'},
            },
            'months':[
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ]
        }
    }
    
    template = 'index/project.html'
    context = { 'context_data': json.dumps(data, ensure_ascii=False) }
    return render(request, template, context)

@login_required
def logout_view(request):
    logout(request)
    return redirect('')