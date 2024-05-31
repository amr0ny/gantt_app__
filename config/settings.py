from dotenv import load_dotenv
from split_settings.tools import include

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
include('components/paths.py')

# Security
include('components/security.py')

# Application definition
include('components/applications.py')

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
include('components/database.py')

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators
include('components/auth.py')

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/
include('components/locale.py')

# Static files (CSS, JavaScript, Images)
# TODO: Find out the way to use static files in projects
# https://docs.djangoproject.com/en/4.2/howto/static-files/
include('components/static.py')


include('components/logging.py')