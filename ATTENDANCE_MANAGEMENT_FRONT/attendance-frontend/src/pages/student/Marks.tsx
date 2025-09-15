import React from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";

interface Row {
  session_id: number;
  date: string;
  status: string;
}

const StudentMarks: React.FC = () => {
  const { id } = useParams();
  const [rows, setRows] = React.useState<Row[]>([]);

  React.useEffect(() => {
    (async () => {
      const { data } = await api.get(`/api/student/marks/?section_id=${id}`);
      setRows(data);
    })();
  }, [id]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">
        Session History (Section {id})
      </h2>
      <div className="overflow-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.session_id} className="border-t">
                <td className="p-2">{r.date}</td>
                <td className="p-2 capitalize">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <a
        className="inline-block mt-4 bg-black text-white px-3 py-1 rounded"
        href={`/api/student/export_csv/?section_id=${id}`}
        target="_blank"
      >
        Download CSV
      </a>
    </div>
  );
};
export default StudentMarks;
