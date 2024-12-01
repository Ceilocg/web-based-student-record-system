import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ChevronDown, ChevronUp } from "lucide-react";

interface LearningArea {
  name: string;
  finalGrade: number;
  quarters: {
    [key: number]: number;
  };
}

interface Student {
  studentId: string;
  studentName: string;
  generalAverage: number;
  gradeLevel: string;
  sectionName: string;
  learningAreas: LearningArea[];
  adviserName: string;
}

const GradeAdmin: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const gradesCollection = collection(db, "grades");
      const gradesSnapshot = await getDocs(gradesCollection);

      if (gradesSnapshot.empty) {
        setStudents([]);
        setError("No students found in the grades collection.");
        return;
      }

      const fetchedStudents: Student[] = gradesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          studentId: data.studentId,
          studentName: data.studentName,
          generalAverage: data.generalAverage,
          gradeLevel: data.gradeLevel,
          sectionName: data.sectionName,
          adviserName: data.adviserName,
          learningAreas: data.learningAreas.map((area: any) => ({
            name: area.name,
            finalGrade: area.finalGrade,
            quarters: area.quarters,
          })),
        };
      });

      // Sort by grade level (7 to 12)
      fetchedStudents.sort((a, b) => parseInt(a.gradeLevel) - parseInt(b.gradeLevel));

      setStudents(fetchedStudents);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("An error occurred while fetching students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStudents();
  }, []);

  const toggleRow = (studentId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-300 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-200 text-lg font-medium">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">All Students in Grades Collection</h2>
      {students.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-center">Grade</th>
                <th className="border p-2 text-center">Section</th>
                <th className="border p-2 text-center">Adviser</th>
                <th className="border p-2 text-center">General Avg</th>
                <th className="border p-2 text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <React.Fragment key={student.studentId}>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-2">{student.studentName}</td>
                    <td className="border p-2 text-center">{student.gradeLevel}</td>
                    <td className="border p-2 text-center">{student.sectionName}</td>
                    <td className="border p-2 text-center">{student.adviserName}</td>
                    <td className="border p-2 text-center">{student.generalAverage.toFixed(2)}</td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => toggleRow(student.studentId)}
                        className="text-blue-500 hover:underline"
                      >
                        {expandedRows.has(student.studentId) ? (
                          <ChevronUp size={16} className="inline" />
                        ) : (
                          <ChevronDown size={16} className="inline" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedRows.has(student.studentId) && (
                    <tr>
                      <td colSpan={6} className="border p-2 bg-gray-50">
                        <table className="min-w-full">
                          <thead>
                            <tr>
                              <th className="border p-2 text-left">Subject</th>
                              <th className="border p-2 text-center">Final Grade</th>
                              <th className="border p-2 text-center">Quarters</th>
                            </tr>
                          </thead>
                          <tbody>
                            {student.learningAreas.map((area, index) => (
                              <tr key={index}>
                                <td className="border p-2">{area.name}</td>
                                <td className="border p-2 text-center">{area.finalGrade}</td>
                                <td className="border p-2 text-center">
                                  {Object.entries(area.quarters)
                                    .map(([quarter, grade]) => `Q${quarter}: ${grade}`)
                                    .join(", ")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600 text-center text-lg mt-8">No students found in the grades collection.</p>
      )}
    </div>
  );
};

export default GradeAdmin;
