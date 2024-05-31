from rest_framework import permissions


class IsCreatorOrTeamMemberPermission(permissions.IsAuthenticated):
    """
    Пользователь должен быть аутентифицированным и либо создателем проекта, либо участником проекта.
    """

    def has_object_permission(self, request, view, obj):
        if request.method == 'GET':
            if hasattr(obj, 'creator') and hasattr(obj, 'members'):

                # Check if the user is the creator or a member of the object
                return obj.creator == request.user or request.user in obj.members.all()
            elif hasattr(obj, 'project'):
                # Check if the user is the creator or a member of the project related to the object
                return obj.project.creator == request.user or request.user in obj.project.members.all()
        else:
            if hasattr(obj, 'creator') and hasattr(obj, 'members'):
                return obj.creator == request.user
            elif hasattr(obj, 'project'):
                return obj.project.creator == request.user

        print('Failed')
        return False  # If the action is not 'retrieve' or 'list' or if the necessary attributes are not present
