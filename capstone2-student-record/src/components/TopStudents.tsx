import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where, limit } from "firebase/firestore";
import { db } from "../firebaseConfig";

interface Student {
  studentId: string;
  studentName: string;
  gradeLevel: string;
  sectionName: string;
  generalAverage: number;
}

interface TopStudentsProps {
  darkMode: boolean;
  sections: string[];
}


const TopStudents: React.FC<TopStudentsProps> = ({ darkMode }) => {
  const [topOverall, setTopOverall] = useState<Student[]>([]);
  const [topByGrade, setTopByGrade] = useState<{ [grade: string]: Student[] }>({});
  const [topBySection, setTopBySection] = useState<{ [section: string]: Student[] }>({});
  const [sections, setSections] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const gradesSnapshot = await getDocs(collection(db, "grades"));

        const uniqueSections = new Set<string>();
        gradesSnapshot.forEach((doc) => {
          const section = doc.data().sectionName;
          if (section) uniqueSections.add(section);
        });

        setSections(Array.from(uniqueSections));
      } catch (err) {
        console.error("Error fetching sections:", err);
        setError("Failed to fetch sections. Please try again.");
      }
    };

    const fetchTopStudents = async () => {
      try {
        // Fetch Overall Top 10 Students
        const overallQuery = query(
          collection(db, "grades"),
          orderBy("generalAverage", "desc"),
          limit(10)
        );
        const overallSnapshot = await getDocs(overallQuery);

        const overallStudents = overallSnapshot.docs.map((doc) => ({
          studentId: doc.id,
          studentName: doc.data().studentName || "N/A",
          gradeLevel: doc.data().gradeLevel || "N/A",
          sectionName: doc.data().sectionName || "N/A",
          generalAverage: doc.data().generalAverage || 0,
        }));
        setTopOverall(overallStudents);

        // Fetch Top 10 Students by Grade Level
        const gradeLevels = ["7", "8", "9", "10", "11", "12"];
        const gradeLevelData: { [grade: string]: Student[] } = {};

        for (const grade of gradeLevels) {
          const gradeQuery = query(
            collection(db, "grades"),
            where("gradeLevel", "==", grade),
            orderBy("generalAverage", "desc"),
            limit(10)
          );
          const gradeSnapshot = await getDocs(gradeQuery);

          gradeLevelData[grade] = gradeSnapshot.docs.map((doc) => ({
            studentId: doc.id,
            studentName: doc.data().studentName || "N/A",
            gradeLevel: doc.data().gradeLevel || "N/A",
            sectionName: doc.data().sectionName || "N/A",
            generalAverage: doc.data().generalAverage || 0,
          }));
        }
        setTopByGrade(gradeLevelData);

        // Fetch Top 10 Students by Section
        const sectionData: { [section: string]: Student[] } = {};

        for (const section of sections) {
          const sectionQuery = query(
            collection(db, "grades"),
            where("sectionName", "==", section),
            orderBy("generalAverage", "desc"),
            limit(10)
          );
          const sectionSnapshot = await getDocs(sectionQuery);

          sectionData[section] = sectionSnapshot.docs.map((doc) => ({
            studentId: doc.id,
            studentName: doc.data().studentName || "N/A",
            gradeLevel: doc.data().gradeLevel || "N/A",
            sectionName: doc.data().sectionName || "N/A",
            generalAverage: doc.data().generalAverage || 0,
          }));
        }
        setTopBySection(sectionData);
      } catch (err) {
        console.error("Error fetching top students:", err);
        setError("Failed to fetch top students. Please try again.");
      }
    };

    fetchSections().then(fetchTopStudents);
  }, [sections]);

  return (
    <div className={`p-6 ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"} rounded-lg shadow-md`}>
      <h3 className="text-xl font-semibold mb-4 text-center">Top Students</h3>
      {error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="space-y-6">
          {/* Overall Top 10 */}
          <Section title="Overall Top 10" students={topOverall} darkMode={darkMode} />

          {/* Top by Grade Level */}
          {Object.keys(topByGrade).map((grade) => (
            <Section key={grade} title={`Top 10 in Grade ${grade}`} students={topByGrade[grade]} darkMode={darkMode} />
          ))}

          {/* Top by Section */}
          {sections.length > 0 ? (
            sections.map((section) => (
              <Section
                key={section}
                title={`Top 10 in Section ${section}`}
                students={topBySection[section] || []}
                darkMode={darkMode}
              />
            ))
          ) : (
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>No sections available.</p>
          )}
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; students: Student[]; darkMode: boolean }> = ({ title, students, darkMode }) => (
  <div>
    <h4 className="text-lg font-medium mb-3">{title}</h4>
    {students.length > 0 ? (
      <div className="space-y-3">
        {students.map((student, index) => (
          <StudentCard key={index} student={student} index={index} darkMode={darkMode} />
        ))}
      </div>
    ) : (
      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>No data available.</p>
    )}
  </div>
);

const StudentCard: React.FC<{ student: Student; index: number; darkMode: boolean }> = ({ student, index, darkMode }) => (
  <div
    className={`flex items-center space-x-3 p-3 ${
      darkMode ? "bg-gray-700" : "bg-gray-100"
    } rounded-lg`}
  >
    <div
      className={`w-8 h-8 rounded-full ${
        darkMode ? "bg-gray-600" : "bg-gray-300"
      } flex items-center justify-center`}
    >
      {index + 1}
    </div>
    <div>
      <p className="font-medium">{student.studentName}</p>
      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        Grade {student.gradeLevel} - Section {student.sectionName} - {student.generalAverage}%
      </p>
    </div>
  </div>
);

export default TopStudents;
