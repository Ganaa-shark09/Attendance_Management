from rest_framework.routers import DefaultRouter
from .views_academics import (
    DepartmentViewSet, CourseViewSet, SectionViewSet,
    TeachingAssignmentViewSet, EnrollmentViewSet,
    TeacherAttendanceViewSet, StudentAttendanceViewSet, HODReportsViewSet
)

router = DefaultRouter()
# Setup (HOD)
router.register("departments", DepartmentViewSet, basename="departments")
router.register("courses", CourseViewSet, basename="courses")
router.register("sections", SectionViewSet, basename="sections")
router.register("teaching-assignments", TeachingAssignmentViewSet, basename="teaching-assignments")
router.register("enrollments", EnrollmentViewSet, basename="enrollments")
# Roles
router.register("teacher", TeacherAttendanceViewSet, basename="teacher")
router.register("student", StudentAttendanceViewSet, basename="student")
router.register("hod", HODReportsViewSet, basename="hod")

urlpatterns = router.urls
