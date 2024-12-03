import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import LearningAreaTable from './LearningAreaTable';  // Adjust path if needed
import { ChevronDown, ChevronUp, Search, Download } from 'lucide-react';

interface LearningArea {
  name: string;
  finalGrade: number;
  semesters: {
    1: number;
    2: number;
  };
  quarters: {
    1: number;
    2: number;
    3: number;
    4: number;
  }; // Add quarters
}


interface Student {
  studentId: string;
  studentName: string;
  generalAverage: number;
  semester1GeneralAverage?: number; // New field for Grade 11/12 semester 1 average
  semester2GeneralAverage?: number; // New field for Grade 11/12 semester 2 average
  gradeLevel: string;
  sectionName: string;
  learningAreas: LearningArea[];
  adviserName: string;
}


const GradeAdmin: React.FC = () => {
  const [juniorHighStudents, setJuniorHighStudents] = useState<Student[]>([]);
  const [seniorHighStudents, setSeniorHighStudents] = useState<Student[]>([]);
  const [graduates, setGraduates] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("name");
  const [activeTab, setActiveTab] = useState("junior");

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      setError(null);
  
      const gradesCollection = collection(db, "grades");
      const gradesSnapshot = await getDocs(gradesCollection);
  
      if (gradesSnapshot.empty) {
        setJuniorHighStudents([]);
        setSeniorHighStudents([]);
        setGraduates([]);
        setError("No students found in the grades collection.");
        return;
      }
  
      const studentMap = new Map<string, Student>();
  
      gradesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const studentId = data.studentId;
        const semester = data.semester; // "1st" or "2nd"
  
        // Map learning areas
        const newLearningArea = data.learningAreas.map((area: any) => ({
          name: area.name,
          finalGrade: area.finalGrade,
          quarters: area.quarters,
        }));
  
        // Calculate final average for this semester
        const semesterAverage =
          newLearningArea.reduce((sum: number, area: any) => sum + area.finalGrade, 0) /
          newLearningArea.length;
  
        if (studentMap.has(studentId)) {
          const existingStudent = studentMap.get(studentId);
  
          // Add semester-specific average for grades 11 and 12
          if (semester === "1st") {
            existingStudent!.semester1GeneralAverage = semesterAverage;
          } else if (semester === "2nd") {
            existingStudent!.semester2GeneralAverage = semesterAverage;
          }
  
          // Append learning areas to existing student
          existingStudent!.learningAreas.push(...newLearningArea);
        } else {
          // Add new student to the map
          studentMap.set(studentId, {
            studentId,
            studentName: data.studentName,
            generalAverage: data.generalAverage || 0,
            gradeLevel: data.gradeLevel,
            sectionName: data.sectionName,
            adviserName: data.adviserName,
            learningAreas: newLearningArea,
            semester1GeneralAverage: semester === "1st" ? semesterAverage : undefined,
            semester2GeneralAverage: semester === "2nd" ? semesterAverage : undefined,
          });
        }
      });
  
      const fetchedStudents = Array.from(studentMap.values());
  
      // Sort by grade level (7 to 12)
      fetchedStudents.sort(
        (a, b) => parseInt(a.gradeLevel) - parseInt(b.gradeLevel)
      );
  
      // Separate students by grade level
      const juniorHigh = fetchedStudents.filter(
        (student) => parseInt(student.gradeLevel) <= 10
      );
      const seniorHigh = fetchedStudents.filter(
        (student) => parseInt(student.gradeLevel) > 10
      );
  
      // Only include students with both 1st and 2nd semester averages in Graduates
      const graduates = fetchedStudents.filter(
        (student) =>
          parseInt(student.gradeLevel) === 12 &&
          student.semester1GeneralAverage !== undefined &&
          student.semester2GeneralAverage !== undefined
      );
  
      setJuniorHighStudents(juniorHigh);
      setSeniorHighStudents(seniorHigh);
      setGraduates(graduates);
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

  const filterStudents = (students: Student[]) => {
    return students.filter((student) => {
      const searchValue = searchTerm.toLowerCase();
      switch (searchCategory) {
        case "name":
          return student.studentName.toLowerCase().includes(searchValue);
        case "gradeLevel":
          return student.gradeLevel.toLowerCase().includes(searchValue);
        case "section":
          return student.sectionName.toLowerCase().includes(searchValue);
        case "adviser":
          return student.adviserName.toLowerCase().includes(searchValue);
        default:
          return true;
      }
    });
  };

  const exportToCSV = (students: Student[], filename: string) => {
    const headers = ['Name', 'Grade Level', 'Section', 'Adviser', 'General Average'];
    const subjectHeaders = ['Subject', 'Final Grade'];
  
    const csvContent = students.map(student => {
      const basicInfo = [
        student.studentName,
        student.gradeLevel,
        student.sectionName,
        student.adviserName,
        student.generalAverage.toFixed(2)
      ];
  
      const subjectsInfo = student.learningAreas.map(area => [
        area.name,
        area.finalGrade,
       
      ]).flat();
  
      return [...basicInfo, ...subjectsInfo].join(',');
    });
  
    const csv = [
      [...headers, ...Array(Math.max(...students.map(s => s.learningAreas.length))).fill(subjectHeaders).flat()].join(','),
      ...csvContent
    ].join('\n');
  
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };




  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-300 rounded-full animate-spin"></div>
          <span className="text-gray-200 text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  const StudentTable: React.FC<{
    students: Student[];
    expandedRows: Set<string>;
    toggleRow: (studentId: string) => void;
  }> = ({ students, expandedRows, toggleRow }) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Grade
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Section
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Adviser
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                General Avg
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <React.Fragment key={student.studentId}>
                <tr className="hover:bg-gray-50 transition duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.studentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {student.gradeLevel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {student.sectionName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {student.adviserName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
  {parseInt(student.gradeLevel) >= 11 ? (
    <div>
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          student.semester1GeneralAverage && student.semester1GeneralAverage >= 75
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        1st Sem: {student.semester1GeneralAverage?.toFixed(2) || "N/A"}
      </span>
      <br />
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          student.semester2GeneralAverage && student.semester2GeneralAverage >= 75
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        2nd Sem: {student.semester2GeneralAverage?.toFixed(2) || "N/A"}
      </span>
    </div>
  ) : (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        student.generalAverage >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {student.generalAverage.toFixed(2)}
    </span>
  )}
</td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <button
                      onClick={() => toggleRow(student.studentId)}
                      className="text-blue-600 hover:text-blue-900 transition duration-150 ease-in-out"
                    >
                      {expandedRows.has(student.studentId) ? (
                        <ChevronUp className="inline-block w-5 h-5" />
                      ) : (
                        <ChevronDown className="inline-block w-5 h-5" />
                      )}
                    </button>
                  </td>
                </tr>
  
                {/* Render the expanded row */}
                {expandedRows.has(student.studentId) && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        {/* Display detailed learning area data */}
                        <LearningAreaTable learningAreas={student.learningAreas} gradeLevel={student.gradeLevel}/>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-red-500 to-pink-600">
        <div className="bg-white bg-opacity-90 border-l-4 border-red-500 text-red-700 p-8 rounded-lg shadow-2xl max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-lg">{error}</p>
          <button 
            onClick={fetchAllStudents}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
            Student Grades Overview
          </h2>
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="gradeLevel">Grade Level</option>
              <option value="section">Section</option>
              <option value="adviser">Adviser</option>
            </select>
            <button
              onClick={() => exportToCSV([...juniorHighStudents, ...seniorHighStudents, ...graduates], 'student_grades.csv')}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 flex items-center justify-center"
            >
              <Download className="mr-2 h-4 w-4" /> Export to CSV
            </button>
          </div>
          
          <div className="mb-4">
            <div className="flex border-b border-gray-200">
              {['junior', 'senior', 'graduates'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'junior' ? 'Junior High' : tab === 'senior' ? 'Senior High' : 'Graduates'}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'junior' && (
            <StudentTable 
              students={filterStudents(juniorHighStudents)} 
              expandedRows={expandedRows}
              toggleRow={toggleRow}
            />
          )}
          {activeTab === 'senior' && (
            <StudentTable 
              students={filterStudents(seniorHighStudents)} 
              expandedRows={expandedRows}
              toggleRow={toggleRow}
            />
          )}
          {activeTab === 'graduates' && (
            <StudentTable 
              students={filterStudents(graduates)} 
              expandedRows={expandedRows}
              toggleRow={toggleRow}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GradeAdmin;

