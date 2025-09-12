from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    class Roles(models.TextChoices):
        STUDENT = "student", "Student"
        TEACHER = "teacher", "Teacher"
        HOD = "hod", "Head of Dept"

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.STUDENT)
    employee_id = models.CharField(max_length=50, blank=True)  # for teacher/HOD
    roll_number = models.CharField(max_length=50, blank=True)  # for student
