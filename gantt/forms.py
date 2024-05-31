from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from gantt.models import Person

class SignUpForm(UserCreationForm):
    
    username = forms.CharField(max_length=150, label='Логин',
                               widget=forms.TextInput(attrs={'class': 'w-100'}))
    first_name = forms.CharField(max_length=150, label="Имя",
                                 widget=forms.TextInput(attrs={'class': 'w-100'}))
    last_name = forms.CharField(max_length=150, label="Фамилия",
                                widget=forms.TextInput(attrs={'class': 'w-100'}))
    email = forms.EmailField(max_length=150, label='Электронная почта',
                             widget=forms.EmailInput(attrs={'class': 'w-100'}))
    password1 = forms.CharField(max_length=150, label='Пароль',
                                widget=forms.PasswordInput(attrs={'class':'w-100', "autocomplete": "new-password"}))
    password2 = forms.CharField(max_length=150, label='Подтверждение пароля',
                                widget=forms.PasswordInput(attrs={'class':'w-100'}), strip=False)
    class Meta:
        model = Person
        fields = ('first_name', 'last_name', 'username', 'email')
