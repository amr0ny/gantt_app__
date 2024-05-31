import os

STATIC_ROOT = os.getenv('STATIC_ROOT', '/var/www/static')
#MEDIA_ROOT = os.getenv('MEDIA_ROOT', '/var/www/media')
STATIC_URL = os.getenv('STATIC_URL', '/static/')
#MEDIA_URL = os.getenv('MEDIA_URL', 'media/')

STATICFILES_DIRS = ('static/',)