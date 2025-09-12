from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .permissions import IsTeacher, IsStudent, IsHOD
from .models import Department, Course, Section, TeachingAssignment, Enrollment, AttendanceSession, AttendanceMark
from .serializers import (
    DepartmentSerializer, CourseSerializer, SectionSerializer, TeachingAssignmentSerializer,
    EnrollmentSerializer, AttendanceSessionSerializer, AttendanceMarkSerializer
)

# ----- Simple CRUD for setup (HOD) -----
class DepartmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsHOD]
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsHOD]
    queryset = Course.objects.select_related("department").all()
    serializer_class = CourseSerializer

class SectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsHOD]
    queryset = Section.objects.select_related("course","course__department").all()
    serializer_class = SectionSerializer

class TeachingAssignmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsHOD]
    queryset = TeachingAssignment.objects.select_related("teacher","section").all()
    serializer_class = TeachingAssignmentSerializer

class EnrollmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsHOD]
    queryset = Enrollment.objects.select_related("student","section").all()
    serializer_class = EnrollmentSerializer

# ----- Teacher endpoints -----
class TeacherAttendanceViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsTeacher]
    queryset = AttendanceSession.objects.none()  # not used directly

    @action(detail=False, methods=["get"])
    def my_sections(self, request):
        sections = Section.objects.filter(teachers__teacher=request.user).select_related("course")
        data = SectionViewSet.serializer_class(sections, many=True, context={"request": request}).data
        return Response(data)

    @action(detail=False, methods=["post"])
    def open_session(self, request):
        section_id = request.data.get("section_id")
        if not section_id:
            return Response({"detail":"section_id required"}, status=400)
        # verify teacher teaches this section
        if not TeachingAssignment.objects.filter(teacher=request.user, section_id=section_id).exists():
            return Response({"detail":"Not assigned to this section"}, status=403)

        # prevent duplicates for same date
        today = timezone.localdate()
        exists = AttendanceSession.objects.filter(section_id=section_id, date=today, is_closed=False).exists()
        if exists:
            return Response({"detail":"Session already open today"}, status=400)

        session = AttendanceSession.objects.create(
            section_id=section_id, created_by=request.user, date=today
        )
        return Response(AttendanceSessionSerializer(session).data, status=201)

    @action(detail=False, methods=["post"])
    def mark(self, request):
        """
        Body: { "session_id": 1, "marks": [{"student": <id>, "status": "present|absent|late|excused"}] }
        """
        session_id = request.data.get("session_id")
        marks = request.data.get("marks", [])
        if not session_id or not isinstance(marks, list):
            return Response({"detail":"session_id and marks[] required"}, status=400)

        session = AttendanceSession.objects.select_related("section").get(id=session_id)
        # teacher must own this session via assignment
        if not TeachingAssignment.objects.filter(teacher=request.user, section=session.section).exists():
            return Response({"detail":"Not allowed on this session"}, status=403)
        if session.is_closed:
            return Response({"detail":"Session is closed"}, status=400)

        # validate students are enrolled in section
        valid_student_ids = set(Enrollment.objects.filter(section=session.section).values_list("student_id", flat=True))
        created = 0
        for item in marks:
            sid = item.get("student")
            status_ = item.get("status", "present")
            if sid in valid_student_ids:
                AttendanceMark.objects.update_or_create(
                    session=session, student_id=sid, defaults={"status": status_}
                )
                created += 1
        return Response({"updated": created})

    @action(detail=False, methods=["post"])
    def close_session(self, request):
        session_id = request.data.get("session_id")
        if not session_id:
            return Response({"detail":"session_id required"}, status=400)
        session = AttendanceSession.objects.select_related("section").get(id=session_id)
        if not TeachingAssignment.objects.filter(teacher=request.user, section=session.section).exists():
            return Response({"detail":"Not allowed"}, status=403)
        session.is_closed = True
        session.end_time = timezone.now()
        session.save(update_fields=["is_closed","end_time"])
        return Response(AttendanceSessionSerializer(session).data)

    @action(detail=False, methods=["get"])
    def section_summary(self, request):
        """
        ?section_id=ID → overall summary for each student in the section.
        Allowed only if the teacher is assigned to that section.
        """
        section_id = request.query_params.get("section_id")
        if not section_id:
            return Response({"detail": "section_id required"}, status=400)

        # Must be assigned to this section
        if not TeachingAssignment.objects.filter(teacher=request.user, section_id=section_id).exists():
            return Response({"detail": "Not assigned to this section"}, status=403)

        sessions = AttendanceSession.objects.filter(section_id=section_id, is_closed=True)
        total_sessions = sessions.count()

        enrollments = (
            Enrollment.objects
            .filter(section_id=section_id)
            .select_related("student")
            .order_by("student__username")
        )

        result = []
        for enr in enrollments:
            present = AttendanceMark.objects.filter(
                session__in=sessions,
                student=enr.student,
                status__in=["present", "late", "excused"],  # count excused as present for %
            ).count()
            result.append({
                "student_id": enr.student_id,
                "student_username": enr.student.username,
                "present_or_excused": present,
                "total_sessions": total_sessions,
                "percentage": (present * 100.0 / total_sessions) if total_sessions else 0.0,
            })

        return Response({
            "section_id": int(section_id),
            "total_sessions": total_sessions,
            "students": result,
        })    


    @action(detail=False, methods=["get"])
    def session_marks(self, request):
        """
        ?session_id=ID → full roster for that session.
        Missing marks are treated as 'absent'.
        """
        session_id = request.query_params.get("session_id")
        if not session_id:
            return Response({"detail": "session_id required"}, status=400)

        s = AttendanceSession.objects.select_related("section", "section__course").get(id=session_id)

        # Check assignment
        if not TeachingAssignment.objects.filter(teacher=request.user, section=s.section).exists():
            return Response({"detail": "Not assigned to this section"}, status=403)

        enrollments = Enrollment.objects.filter(section=s.section).select_related("student")
        marks_map = {
            m.student_id: m.status
            for m in AttendanceMark.objects.filter(session=s)
        }

        roster = [
            {
                "student_id": enr.student_id,
                "student_username": enr.student.username,
                "status": marks_map.get(enr.student_id, "absent"),
            }
            for enr in enrollments
        ]

        return Response({
            "session_id": s.id,
            "date": s.date,
            "section": f"{s.section.course.code}-{s.section.name}",
            "marks": roster,
        })    

# ----- Student endpoints -----
class StudentAttendanceViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsStudent]

    @action(detail=False, methods=["get"])
    def my_sections(self, request):
        sections = Section.objects.filter(enrollments__student=request.user).select_related("course")
        data = SectionViewSet.serializer_class(sections, many=True, context={"request": request}).data
        return Response(data)

    @action(detail=False, methods=["get"])
    def my_attendance(self, request):
        """
        Optional query params: section_id
        Returns marks + percentage for each section (or a specific one).
        """
        section_id = request.query_params.get("section_id")
        sections = Section.objects.filter(enrollments__student=request.user)
        if section_id:
            sections = sections.filter(id=section_id)

        result = []
        for sec in sections:
            sessions = AttendanceSession.objects.filter(section=sec, is_closed=True)
            total = sessions.count()
            present = AttendanceMark.objects.filter(session__in=sessions, student=request.user, status__in=["present","late"]).count()
            result.append({
                "section": f"{sec.course.code}-{sec.name}",
                "total_sessions": total,
                "present_or_late": present,
                "percentage": (present * 100.0 / total) if total else 0.0,
            })
        return Response(result)

    @action(detail=False, methods=["get"])
    def marks(self, request):
        """
        ?section_id=ID → list each closed session with student's mark.
        Treats missing mark as 'absent'.
        """
        section_id = request.query_params.get("section_id")
        if not section_id:
            return Response({"detail": "section_id required"}, status=400)

        # Ensure the student is enrolled
        if not Enrollment.objects.filter(section_id=section_id, student=request.user).exists():
            return Response({"detail": "Not enrolled in this section"}, status=403)

        sessions = (
            AttendanceSession.objects
            .filter(section_id=section_id, is_closed=True)
            .order_by("date", "start_time")
        )

        rows = []
        for s in sessions:
            mark = AttendanceMark.objects.filter(session=s, student=request.user).first()
            rows.append({
                "session_id": s.id,
                "date": s.date,
                "status": mark.status if mark else "absent",
            })
        return Response(rows)

    

# ----- HOD endpoints (reports) -----
class HODReportsViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsHOD]

    @action(detail=False, methods=["get"])
    def section_summary(self, request):
        """?section_id=ID → present %, counts."""
        section_id = request.query_params.get("section_id")
        if not section_id:
            return Response({"detail":"section_id required"}, status=400)

        sessions = AttendanceSession.objects.filter(section_id=section_id, is_closed=True)
        total_sessions = sessions.count()
        enrollments = Enrollment.objects.filter(section_id=section_id).values_list("student_id", flat=True)

        data = []
        for student_id in enrollments:
            present = AttendanceMark.objects.filter(session__in=sessions, student_id=student_id, status__in=["present","late"]).count()
            data.append({
                "student_id": student_id,
                "present": present,
                "total": total_sessions,
                "percentage": (present * 100.0 / total_sessions) if total_sessions else 0.0,
            })
        return Response({"section_id": section_id, "students": data})

