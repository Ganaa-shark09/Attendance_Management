import React from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

interface Section {
  id: number;
  name: string;
  course: { code: string };
}

const StudentDashboard: React.FC = () => {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [perc, setPerc] = React.useState<Record<number, number>>({});

  React.useEffect(() => {
    (async () => {
      const { data } = await api.get("/api/student/my_sections/");
      setSections(data);
      // fetch percentage per section
      const map: Record<number, number> = {};
      await Promise.all(
        data.map(async (sec: any) => {
          const res = await api.get(
            `/api/student/my_attendance/?section_id=${sec.id}`
          );
          map[sec.id] = res.data?.[0]?.percentage ?? 0;
        })
      );
      setPerc(map);
    })();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">My Sections</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {sections.map((s) => (
          <Link
            key={s.id}
            to={`/student/section/${s.id}`}
            className="border rounded-xl p-4 hover:shadow"
          >
            <div className="text-sm opacity-70">{s.course.code}</div>
            <div className="text-base font-medium">Section {s.name}</div>
            <div className="text-sm mt-2">
              Attendance: <b>{(perc[s.id] ?? 0).toFixed(1)}%</b>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default StudentDashboard;
