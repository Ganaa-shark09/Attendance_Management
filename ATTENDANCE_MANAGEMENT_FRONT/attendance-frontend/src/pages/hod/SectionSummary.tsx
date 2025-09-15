import React from "react";
import { api } from "../../lib/api";

interface Row {
  student_id: number;
  student_username: string;
  present_or_excused: number;
  total_sessions: number;
  percentage: number;
}

const HODSectionSummary: React.FC = () => {
  const [sectionId, setSectionId] = React.useState<string>("");
  const [rows, setRows] = React.useState<Row[]>([]);
  const [total, setTotal] = React.useState<number>(0);

  const fetchData = async () => {
    if (!sectionId) return;
    const { data } = await api.get(
      `/api/hod/section_summary/?section_id=${sectionId}`
    );
    setRows(data.students);
    setTotal(data.total_sessions);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">HOD – Section Summary</h2>
      <div className="flex gap-2 items-center">
        <input
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          placeholder="Section ID"
          className="border rounded px-3 py-2"
        />
        <button
          onClick={fetchData}
          className="px-3 py-2 rounded bg-black text-white"
        >
          Load
        </button>
      </div>
      <div className="overflow-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Student</th>
              <th className="p-2 text-left">Present/Excused</th>
              <th className="p-2 text-left">Total Sessions</th>
              <th className="p-2 text-left">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student_id} className="border-t">
                <td className="p-2">@{r.student_username}</td>
                <td className="p-2">{r.present_or_excused}</td>
                <td className="p-2">{r.total_sessions}</td>
                <td className="p-2">{r.percentage.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td className="p-2">Totals</td>
              <td className="p-2"></td>
              <td className="p-2">{total}</td>
              <td className="p-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
export default HODSectionSummary;
