from rest_framework import serializers
from .models import Department, Course, Section, TeachingAssignment, Enrollment, AttendanceSession, AttendanceMark

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta: model = Department; fields = "__all__"

class CourseSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(source="department", queryset=Department.objects.all(), write_only=True)
    class Meta: model = Course; fields = ["id","code","name","department","department_id"]

class SectionSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(source="course", queryset=Course.objects.all(), write_only=True)
    class Meta: model = Section; fields = ["id","name","semester","course","course_id"]

class TeachingAssignmentSerializer(serializers.ModelSerializer):
    class Meta: model = TeachingAssignment; fields = "__all__"

class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta: model = Enrollment; fields = "__all__"

class AttendanceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSession
        fields = ["id","section","date","start_time","end_time","created_by","is_closed"]
        read_only_fields = ["created_by","start_time","end_time","is_closed"]

class AttendanceMarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceMark
        fields = ["id","session","student","status","marked_at"]
        read_only_fields = ["marked_at"]
