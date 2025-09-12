# attendance/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone

# ----- Core (optional, for company/teams) -----
class Team(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    def __str__(self): return self.name

class Shift(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="shifts")
    name = models.CharField(max_length=100, default="General")
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_minutes = models.PositiveIntegerField(default=60)
    grace_minutes = models.PositiveIntegerField(default=10)
    def __str__(self): return f"{self.team}:{self.name}"

class AttendanceRecord(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="attendance")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    shift = models.ForeignKey(Shift, null=True, blank=True, on_delete=models.SET_NULL)
    work_date = models.DateField()
    clock_in_at = models.DateTimeField()
    clock_out_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        indexes = [models.Index(fields=["team", "user", "work_date"])]

# ----- Academics -----
class Department(models.Model):
    name = models.CharField(max_length=120, unique=True)
    def __str__(self): return self.name

class Course(models.Model):
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="courses")
    class Meta:
        unique_together = ("code", "department")
    def __str__(self): return f"{self.code} - {self.name}"

class Section(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="sections")
    name = models.CharField(max_length=50)   # e.g., "A"
    semester = models.CharField(max_length=20, blank=True)
    class Meta:
        unique_together = ("course", "name")
    def __str__(self): return f"{self.course.code}-{self.name}"

class TeachingAssignment(models.Model):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="teaching_assignments")
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="teachers")
    class Meta:
        unique_together = ("teacher", "section")

class Enrollment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments")
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="enrollments")
    class Meta:
        unique_together = ("student", "section")

class AttendanceSession(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="attendance_sessions")
    date = models.DateField(default=timezone.localdate)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_sessions")
    is_closed = models.BooleanField(default=False)

class AttendanceMark(models.Model):
    PRESENT, ABSENT, LATE, EXCUSED = "present", "absent", "late", "excused"
    STATUS_CHOICES = [(PRESENT,"Present"), (ABSENT,"Absent"), (LATE,"Late"), (EXCUSED,"Excused")]
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name="marks")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendance_marks")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PRESENT)
    marked_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ("session", "student")
