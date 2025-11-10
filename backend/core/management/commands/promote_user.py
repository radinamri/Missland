from django.core.management.base import BaseCommand, CommandError
from core.models import User


class Command(BaseCommand):
    help = 'Promote a user to ADMIN or ANNOTATOR role'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to promote')
        parser.add_argument(
            '--role',
            type=str,
            default='ADMIN',
            choices=['ADMIN', 'ANNOTATOR', 'SUPERUSER'],
            help='Role to assign (ADMIN, ANNOTATOR, or SUPERUSER)'
        )
        parser.add_argument(
            '--staff',
            action='store_true',
            help='Also mark user as Django staff (for admin panel access)'
        )
        parser.add_argument(
            '--superuser',
            action='store_true',
            help='Also mark user as Django superuser (full admin rights)'
        )

    def handle(self, *args, **options):
        email = options['email']
        role = options['role']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise CommandError(f'User with email "{email}" does not exist')

        old_role = user.role
        user.role = role
        
        if options['staff']:
            user.is_staff = True
            self.stdout.write(f'  - Marked as Django staff')
        
        if options['superuser']:
            user.is_superuser = True
            user.is_staff = True  # Superusers are also staff
            self.stdout.write(f'  - Marked as Django superuser')
        
        user.save()
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated user {email}:')
        )
        self.stdout.write(f'  Role: {old_role} → {role}')
        self.stdout.write(f'  Staff: {user.is_staff}')
        self.stdout.write(f'  Superuser: {user.is_superuser}')
