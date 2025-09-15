import React from "react";
import { api } from "../../lib/api";
type Student = {
  student_id: number;
  username: string;
  name: string;
  roll_number: string;
  email: string;
};

type Status = "present" | "absent" | "late" | "excused";

const statusOptions: Status[] = ["present", "absent", "late", "excused"];

const TeacherSections: React.FC = () => {
  const [sections, setSections] = React.useState<Section[]>([]);
  const [activeSec, setActiveSec] = React.useState<number | null>(null);
  const [roster, setRoster] = React.useState<Student[]>([]);
  const [marks, setMarks] = React.useState<Record<number, Status>>({});
  const [sessionId, setSessionId] = React.useState<number | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const { data } = await api.get("/api/teacher/my_sections/");
      setSections(data);
    })();
  }, []);

  const loadRoster = async (sectionId: number) => {
    setActiveSec(sectionId);
    const { data } = await api.get(
      `/api/teacher/roster/?section_id=${sectionId}`
    );
    setRoster(data.students);
    setMarks({});
    setSessionId(null);
    setMessage(null);
  };

  const openSession = async () => {
    if (!activeSec) return;
    const { data } = await api.post("/api/teacher/open_session/", {
      section_id: activeSec,
    });
    setSessionId(data.id);
    setMessage(`Opened session #${data.id} for section ${activeSec}`);
  };

  const updateMark = (studentId: number, value: Status) => {
    setMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const saveMarks = async () => {
    if (!sessionId) {
      setMessage("Open a session first");
      return;
    }
    const payload = {
      session_id: sessionId,
      marks: Object.entries(marks).map(([sid, status]) => ({
        student: Number(sid),
        status,
      })),
    };
    await api.post("/api/teacher/mark/", payload);
    setMessage("Marks saved");
  };

  const closeSession = async () => {
    if (!sessionId) {
      setMessage("No open session to close");
      return;
    }
    await api.post("/api/teacher/close_session/", { session_id: sessionId });
    setMessage(`Session #${sessionId} closed`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">My Sections</h2>
      <div className="flex gap-2 flex-wrap">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => loadRoster(s.id)}
            className={`px-3 py-1 rounded border ${
              activeSec === s.id ? "bg-black text-white" : "bg-white"
            }`}
          >
            {s.course.code} - {s.name}
          </button>
        ))}
      </div>

      {activeSec && (
        <div className="border rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Section {activeSec} Roster</div>
            <div className="flex gap-2">
              <button
                onClick={openSession}
                className="px-3 py-1 rounded bg-black text-white"
              >
                Open Session
              </button>
              <button onClick={saveMarks} className="px-3 py-1 rounded border">
                Save Marks
              </button>
              <button
                onClick={closeSession}
                className="px-3 py-1 rounded border"
              >
                Close Session
              </button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Roll</th>
                  <th className="p-2 text-left">Student</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((st) => (
                  <tr key={st.student_id} className="border-t">
                    <td className="p-2">{st.roll_number || "-"}</td>
                    <td className="p-2">
                      {st.name}{" "}
                      <span className="opacity-60">@{st.username}</span>
                    </td>
                    <td className="p-2">
                      <select
                        className="border rounded px-2 py-1"
                        value={marks[st.student_id] || ""}
                        onChange={(e) =>
                          updateMark(st.student_id, e.target.value as Status)
                        }
                      >
                        <option value="">— choose —</option>
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {message && <div className="mt-3 text-sm">{message}</div>}
        </div>
      )}
    </div>
  );
};
export default TeacherSections;
