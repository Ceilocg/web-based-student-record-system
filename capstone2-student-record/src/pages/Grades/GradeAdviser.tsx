import { useEffect, useState, useRef } from 'react'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../firebaseConfig'
import { Search } from 'lucide-react'

interface Student {
  id: string
  fullName: string
  lrn: string
  sex: string
  age: number
  birthdate: string
}

interface Section {
  id: string
  name: string
  students: Student[]
  adviser: string
  grade: string
  strand?: string;
  tvlSubOption?: string;
  semester?: '1st' | '2nd' | null;
}

interface LearningArea {
  name: string;
  quarters: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
  finalGrade: number;
}

interface GradeData {
  studentId: string;
  studentName: string;
  adviserId: string | undefined;
  adviserName: string;
  sectionId: string;
  sectionName: string;
  gradeLevel: string;
  schoolYear: string;
  semester?: '1st' | '2nd';
  learningAreas: LearningArea[];
  generalAverage: number;
  timestamp: ReturnType<typeof serverTimestamp>;
  strand?: string;
  tvlSubOption?: string;
}

export default function GradeAdviser() {
  const [learningAreas, setLearningAreas] = useState<string[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [grades, setGrades] = useState<{ [area: string]: number[] }>({})
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [currentAdviser, setCurrentAdviser] = useState<string>('')
  const [selectedSemester, setSelectedSemester] = useState<'1st' | '2nd'>('1st')
  const searchRef = useRef<HTMLDivElement>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [studentAverages, setStudentAverages] = useState<{ [studentId: string]: number }>({});
  const [studentCount, setStudentCount] = useState(0);


  const fetchStudentsForSection = async (sectionId: string) => {
    try {
      setLoading(true);
      setError(null);
  
      // Fetch the section document
      const sectionDocRef = doc(db, "sections", sectionId);
      const sectionDocSnap = await getDoc(sectionDocRef);
  
      if (sectionDocSnap.exists()) {
        const sectionData = sectionDocSnap.data();
  
        // Extract the students array (array of grade IDs)
        const gradeIds = sectionData.students || [];
  
        // Fetch grade and enrollment data for each student
        const studentDataPromises = gradeIds.map(async (gradeId: string) => {
          try {
            const gradeDocRef = doc(db, "grades", gradeId);
            const gradeDocSnap = await getDoc(gradeDocRef);
  
            if (!gradeDocSnap.exists()) {
              console.warn(`Grade document not found for ID: ${gradeId}`);
              return null;
            }
  
            const gradeData = gradeDocSnap.data() as GradeData;
  
            // Fetch the enrollment form to get the LRN
            const enrollmentDocRef = doc(db, "enrollmentForms", gradeData.studentId);
            const enrollmentDocSnap = await getDoc(enrollmentDocRef);
  
            if (!enrollmentDocSnap.exists()) {
              console.warn(`Enrollment form not found for student ID: ${gradeData.studentId}`);
              return null;
            }
  
            const enrollmentData = enrollmentDocSnap.data();
  
            return {
              id: gradeData.studentId,
              fullName: gradeData.studentName,
              lrn: enrollmentData.lrn || "-", // Fallback to "-" if LRN is missing
              generalAverage: gradeData.generalAverage || 0,
            };
          } catch (error) {
            console.error(`Error fetching data for grade ID: ${gradeId}`, error);
            return null;
          }
        });
  
        // Resolve all promises and filter out nulls
        const students = (await Promise.all(studentDataPromises)).filter(
          (student): student is Student => student !== null
        );
  
        // Update state with fetched students
        setFilteredStudents(students);
  
        // Set the count of students based on fetched data
        setStudentCount(students.length);
      } else {
        console.error("Section not found.");
        setFilteredStudents([]);
        setStudentCount(0); // No students in the section
      }
    } catch (error) {
      console.error("Error fetching students for section:", error);
      setError("An error occurred while fetching students.");
    } finally {
      setLoading(false);
    }
  };
  
  
  const isGrade11or12 = (grade: string) => {
    return grade === "11" || grade === "12";
  };

  const fetchGrades = async (semester: '1st' | '2nd' | null) => {
    try {
      setLoading(true);
      let gradesQuery;
  
      if (semester) {
        // Filter grades by semester for Grade 11/12
        gradesQuery = query(
          collection(db, "grades"),
          where("semester", "==", semester)
        );
      } else {
        // Fetch all grades for non-semester-based sections (Grades 7-10)
        gradesQuery = query(collection(db, "grades"));
      }
  
      const gradesSnapshot = await getDocs(gradesQuery);
  
      const averages: { [studentId: string]: number } = {};
      gradesSnapshot.forEach((gradeDoc) => {
        const gradeData = gradeDoc.data() as GradeData;
        averages[gradeData.studentId] = gradeData.generalAverage;
      });
  
      setStudentAverages(averages);
    } catch (err) {
      console.error("Error fetching grades:", err);
      setError("An error occurred while fetching grades.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (selectedSectionId) {
      const selectedSection = sections.find((section) => section.id === selectedSectionId);
  
      if (selectedSection) {
        if (selectedSection.semester) {
          // Fetch grades filtered by semester for Grades 11/12
          fetchGrades(selectedSemester);
        } else {
          // Fetch all grades for Grades 7-10
          fetchGrades(null);
        }
  
        // Fetch students for the selected section
        fetchStudentsForSection(selectedSectionId);
      }
    }
  }, [selectedSectionId, selectedSemester]);
  
  

  const fetchSubjects = async (sectionId: string) => {
    try {
      const sectionDocRef = doc(db, 'sections', sectionId)
      const sectionDocSnap = await getDoc(sectionDocRef)

      if (sectionDocSnap.exists()) {
        const data = sectionDocSnap.data()
        const subjects = data?.subjects || []
        setLearningAreas(subjects)
      } else {
        console.error('Section not found')
        setLearningAreas([])
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
      setLearningAreas([])
    }
  }

  const calculateMAPEHGrade = (quarter: number): number | null => {
    const music = grades["Music"]?.[quarter] || 0
    const arts = grades["Arts"]?.[quarter] || 0
    const pe = grades["PE (Physical Education)"]?.[quarter] || 0
    const health = grades["Health"]?.[quarter] || 0
  
    const total = music + arts + pe + health
    return total > 0 ? Math.round(total / 4) : null
  }

  const calculateFinalGrade = (grades: number[]): number | null => {
    const validGrades = grades.filter(grade => grade !== null && !isNaN(grade))
    return validGrades.length > 0 ? Math.round(validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length) : null
  }

  const calculateGeneralAverage = () => {
    const finalGrades = learningAreas.map((area) => {
      if (isGrade11or12(sections.find(s => s.id === selectedSectionId)?.grade || '')) {
        return calculateFinalGrade([grades[area]?.[0] || 0, grades[area]?.[1] || 0]) || 0;
      } else {
        return area === "MAPEH"
          ? calculateFinalGrade(grades["MAPEH"] || [])
          : calculateFinalGrade(grades[area] || []);
      }
    });
    const validGrades = finalGrades.filter((grade): grade is number => grade !== null);
    if (validGrades.length === 0) return "-";
    const average = validGrades.reduce((acc, grade) => acc + grade, 0) / validGrades.length;
    return Math.round(average);
  };

  const handleGradeChange = (area: string, quarter: number, value: string) => {
    const newGrades = { ...grades }
    const updatedQuarters = newGrades[area] || []
    updatedQuarters[quarter] = parseFloat(value) || 0
    newGrades[area] = updatedQuarters
    setGrades(newGrades)

    if (["Music", "Arts", "PE (Physical Education)", "Health"].includes(area)) {
      setGrades((prevGrades) => {
        const newMAPEHGrades = [0, 1, 2, 3].map((q) => {
          const grade = calculateMAPEHGrade(q)
          return grade !== null ? grade : 0
        })
        return {
          ...prevGrades,
          "MAPEH": newMAPEHGrades,
        }
      })
    }
  }

  const fetchSectionsForAdviser = async () => {
    try {
      setLoading(true);
      setError(null);
  
      const user = auth.currentUser;
      if (!user) {
        setError("No user is logged in.");
        return;
      }
  
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (!userDocSnap.exists()) {
        setError("User data not found in the database.");
        return;
      }
  
      const userData = userDocSnap.data();
      const fullname = userData?.fullname;
      const role = userData?.role;
  
      if (role !== "Adviser") {
        setError("You do not have permission to view this page.");
        return;
      }
  
      setCurrentAdviser(fullname);
  
      // Fetch sections assigned to this adviser
      const sectionsRef = collection(db, "sections");
      const sectionsQuery = query(sectionsRef, where("adviser", "==", fullname));
      const sectionsSnapshot = await getDocs(sectionsQuery);
  
      // Map and identify sections with and without the semester field
      const allSections = sectionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          adviser: data.adviser,
          grade: data.grade,
          students: data.students || [],
          strand: data.strand,
          tvlSubOption: data.tvlSubOption,
          semester: data.semester || null, // Include semester if it exists
        };
      });
  
      // Separate sections with and without semester field
      const sectionsWithSemester = allSections.filter((section) => section.semester !== null);
      const sectionsWithoutSemester = allSections.filter((section) => section.semester === null);
  
      // Determine which sections to display
      const sectionsToDisplay = sectionsWithSemester.length > 0
        ? sectionsWithSemester // If sections with semesters exist, only show those
        : sectionsWithoutSemester; // Otherwise, show sections without semester
  
      const enrichedSections = await Promise.all(
        sectionsToDisplay.map(async (section) => {
          const studentDocs = await Promise.all(
            section.students.map(async (studentId: string) => {
              const studentDoc = await getDoc(doc(db, "enrollmentForms", studentId));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                if (studentData.status !== "Dropout") {
                  return {
                    id: studentDoc.id,
                    fullName: `${studentData.firstName} ${studentData.middleName || ""} ${studentData.lastName}`.trim(),
                    lrn: studentData.lrn,
                    sex: studentData.sex,
                    age: studentData.age,
                    birthdate: studentData.birthdate,
                    status: studentData.status,
                  };
                }
              }
              return null; // Exclude students with Dropout status or missing data
            })
          );
          return {
            ...section,
            students: studentDocs.filter((s): s is Student => s !== null), // Filter out null values
          };
        })
      );
  
      if (enrichedSections.length > 0) {
        setSections(enrichedSections);
        setSelectedSectionId(enrichedSections[0]?.id || null);
        await fetchSubjects(enrichedSections[0]?.id || "");
      } else {
        setSections([]);
        setLearningAreas([]);
      }
    } catch (err) {
      console.error("Error fetching sections:", err);
      setError("An error occurred while fetching sections.");
    } finally {
      setLoading(false);
    }
  };
  
  
  

  const handleSearch = () => {
    if (selectedSectionId) {
      const section = sections.find(s => s.id === selectedSectionId)
      if (section) {
        const filtered = section.students.filter(student => 
          student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredStudents(filtered)
      }
    }
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    setIsSearching(false)
    setSearchTerm(student.fullName)
    console.log(`Selected student with ID: ${student.id}`)
  }

  const handleSemesterChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSem = event.target.value as '1st' | '2nd';
    setSelectedSemester(selectedSem);
  
    try {
      // Fetch the sections again for the current adviser based on the selected semester
      const user = auth.currentUser;
      if (!user) {
        setErrorMessage("No user is logged in.");
        return;
      }
  
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (!userDocSnap.exists()) {
        setErrorMessage("User data not found.");
        return;
      }
  
      const fullname = userDocSnap.data()?.fullname;
  
      // Fetch sections assigned to the adviser and filter by semester
      const sectionsRef = collection(db, "sections");
      const sectionsQuery = query(
        sectionsRef,
        where("adviser", "==", fullname),
        where("semester", "==", selectedSem)
      );
      const sectionsSnapshot = await getDocs(sectionsQuery);
  
      // Map the sections and fetch their students
      const enrichedSections = await Promise.all(
        sectionsSnapshot.docs.map(async (sectionDoc) => {
          const sectionData = sectionDoc.data();
          const studentDocs = await Promise.all(
            (sectionData.students || []).map(async (studentId: string) => {
              const studentDoc = await getDoc(doc(db, "enrollmentForms", studentId));
              if (studentDoc.exists() && studentDoc.data()?.status !== "Dropout") {
                const studentData = studentDoc.data();
                return {
                  id: studentDoc.id,
                  fullName: `${studentData.firstName} ${studentData.middleName || ""} ${studentData.lastName}`.trim(),
                  lrn: studentData.lrn,
                  sex: studentData.sex,
                  age: studentData.age,
                  birthdate: studentData.birthdate,
                  status: studentData.status,
                };
              }
              return null;
            })
          );
  
          return {
            id: sectionDoc.id,
            name: sectionData.name,
            adviser: sectionData.adviser,
            grade: sectionData.grade,
            students: studentDocs.filter((s): s is Student => s !== null),
            strand: sectionData.strand,
            tvlSubOption: sectionData.tvlSubOption,
            semester: sectionData.semester,
          };
        })
      );
  
      // Update the sections and reset other state if necessary
      setSections(enrichedSections);
      if (enrichedSections.length > 0) {
        setSelectedSectionId(enrichedSections[0].id);
        await fetchSubjects(enrichedSections[0].id);
      } else {
        setSelectedSectionId(null);
        setLearningAreas([]);
      }
    } catch (error) {
      console.error("Error fetching sections for the selected semester:", error);
      setErrorMessage("An error occurred while fetching sections.");
    }
  };
  

  const saveGrades = async () => {
    if (!selectedStudent || !selectedSectionId) {
      setErrorMessage("Please select a student and ensure a section is selected.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const section = sections.find((s) => s.id === selectedSectionId);
    if (!section) {
      setErrorMessage("Section not found.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      let gradesQuery;
      if (isGrade11or12(section.grade)) {
        gradesQuery = query(
          collection(db, "grades"),
          where("studentId", "==", selectedStudent.id),
          where("sectionId", "==", selectedSectionId),
          where("semester", "==", selectedSemester)
        );
      } else {
        gradesQuery = query(
          collection(db, "grades"),
          where("studentId", "==", selectedStudent.id),
          where("sectionId", "==", selectedSectionId)
        );
      }
      const existingGradesSnapshot = await getDocs(gradesQuery);

      if (!existingGradesSnapshot.empty) {
        setErrorMessage(
          isGrade11or12(section.grade)
            ? `Grades for this student already exist for the ${selectedSemester} semester.`
            : "Grades for this student already exist."
        );
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      const generalAverage = calculateGeneralAverage();

      const learningAreasData: LearningArea[] = learningAreas.map((area) => ({
        name: area,
        quarters: isGrade11or12(section.grade)
          ? {
              1: grades[area]?.[0] || 0,
              2: grades[area]?.[1] || 0,
              3: 0,
              4: 0,
            }
          : {
              1: grades[area]?.[0] || 0,
              2: grades[area]?.[1] || 0,
              3: grades[area]?.[2] || 0,
              4: grades[area]?.[3] || 0,
            },
        finalGrade: isGrade11or12(section.grade)
          ? calculateFinalGrade([grades[area]?.[0] || 0, grades[area]?.[1] || 0]) || 0
          : calculateFinalGrade(grades[area] || []) || 0,
      }));

      const gradeData: GradeData = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.fullName,
        adviserId: auth.currentUser?.uid,
        adviserName: currentAdviser,
        sectionId: selectedSectionId,
        sectionName: section.name,
        gradeLevel: section.grade,
        strand:section.strand,
        schoolYear: new Date().getFullYear().toString(),
        learningAreas: learningAreasData,
        generalAverage: generalAverage === "-" ? 0 : Number(generalAverage),
        timestamp: serverTimestamp(),
        ...(isGrade11or12(section.grade) && { semester: selectedSemester }),
      };

      await addDoc(collection(db, "grades"), gradeData);

      setSuccessMessage("Grades saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset state after saving
      setGrades({});
      setSelectedStudent(null);
      setSearchTerm("");
      setFilteredStudents([]);
    } catch (error) {
      console.error("Error saving grades:", error);
      setErrorMessage("An error occurred while saving grades.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  useEffect(() => {
    fetchSectionsForAdviser()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    handleSearch()
  }, [searchTerm])

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500 text-lg font-medium">{error}</div>
      </div>
    );
  }

  const categorizeSubject = (subject: string): string => {
    const coreSubjects = [
      "Oral Communication",
      "Reading and Writing",
      "Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino",
      "Pagbasa at Pagsusuri ng Iba't Ibang Teksto Tungo sa Pananaliksik",
      "General Mathematics",
      "Statistics and Probability",
      "Earth and Life Science",
      "Physical Science",
      "Understanding Culture, Society, and Politics",
      "Introduction to the Philosophy of the Human Person",
      "21st Century Literature from the Philippines and the World",
      "Contemporary Philippine Arts from the Regions",
      "Physical Education and Health (PEH)"
    ];

    const appliedSubjects = [
      "Empowerment Technologies (E-Tech)",
      "English for Academic and Professional Purposes",
      "Practical Research 1",
      "Practical Research 2",
      "Filipino sa Piling Larangan",
      "Entrepreneurship"
    ];

    if (coreSubjects.includes(subject)) return "CORE";
    if (appliedSubjects.includes(subject)) return "APPLIED";
    return "SPECIALIZED";
  };

  return (
    <div className="container mx-auto p-4">
      {successMessage && (
        <div className="fixed top-0 left-0 right-0 p-4 bg-green-500 text-white text-center">
          {successMessage}
        </div>
      )}
  
      {errorMessage && (
        <div className="fixed top-0 left-0 right-0 p-4 bg-red-500 text-white text-center">
          {errorMessage}
        </div>
      )}
  
      {sections.length > 0 ? (
        sections.map((section, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-2xl font-semibold text-center mb-4">
              Grade level {section.grade} - {section.name}
              {section.strand && (
                <span className="block text-lg font-medium text-gray-600">
                  Strand: {section.strand}
                </span>
              )}
              {section.tvlSubOption && (
                <span className="block text-lg font-medium text-gray-600">
                  TVL Specialization: {section.tvlSubOption}
                </span>
              )}
            </h2>
            <div className="flex justify-center items-center space-x-4 mb-4">
              <p className="text-center">
                <strong>Name of Adviser:</strong> {section.adviser}
              </p>
              <p className="text-center">
  <strong>Number of Students:</strong> {studentCount > 0 ? studentCount : section.students.length}
</p>

              {isGrade11or12(section.grade) && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="semester" className="font-bold">Semester:</label>
                  <select
  id="semester"
  value={selectedSemester}
  onChange={handleSemesterChange} // Updated to trigger the new logic
  className="border rounded p-1"
>
  <option value="1st">1st Semester</option>
  <option value="2nd">2nd Semester</option>
</select>

                </div>
              )}
            </div>
            {selectedStudent && (
              <p className="text-center mb-4">
                <strong>Selected Student:</strong> {selectedStudent.fullName}
              </p>
            )}
  
            <div className="flex items-center justify-center space-x-6 mb-8">
              <div className="w-full md:w-1/2 lg:w-1/3" ref={searchRef}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for a student"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearching(true)}
                    className="w-full p-2 pr-10 border rounded bg-white text-gray-900"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600" />
                </div>
                {isSearching && (
                  <div className="absolute mt-2 w-1/4 bg-white border rounded shadow-lg max-h-60 overflow-y-auto z-10">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => handleStudentSelect(student)}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          {student.fullName}
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-2 text-gray-600">No students found</p>
                    )}
                  </div>
                )}
              </div>
            </div>
  
            <div className="flex justify-between gap-4">
              {isGrade11or12(section.grade) ? (
                <div className="w-full p-6 border rounded shadow">
                  <h2 className="text-lg font-bold mb-4">
                    REPORT ON LEARNING PROGRESS AND ACHIEVEMENT - {selectedSemester} Semester
                  </h2>
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 p-2">Subject Category</th>
                        <th className="border border-gray-200 p-2">SUBJECTS</th>
                        <th colSpan={2} className="border border-gray-200 p-2 text-center">Quarter</th>
                        <th className="border border-gray-200 p-2 text-center">SEM FINAL GRADE</th>
                        <th className="border border-gray-200 p-2 text-center">ACTION TAKEN</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-2"></th>
                        <th className="border border-gray-200 p-2"></th>
                        <th className="border border-gray-200 p-2 text-center">1ST</th>
                        <th className="border border-gray-200 p-2 text-center">2ND</th>
                        <th className="border border-gray-200 p-2"></th>
                        <th className="border border-gray-200 p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {learningAreas.map((area) => (
                        <tr key={area}>
                          <td className="border border-gray-200 p-2 text-center">{categorizeSubject(area)}</td>
                          <td className="border border-gray-200 p-2">{area}</td>
                          {[0, 1].map((quarter) => (
                            <td key={quarter} className="border border-gray-200 p-2 text-center">
                              <input
                                type="number"
                                className="w-full text-center"
                                min="0"
                                max="100"
                                value={grades[area]?.[quarter] || ""}
                                onChange={(e) => handleGradeChange(area, quarter, e.target.value)}
                                required
                              />
                            </td>
                          ))}
                          <td className="border border-gray-200 p-2 text-center">
                            {calculateFinalGrade([grades[area]?.[0] || 0, grades[area]?.[1] || 0]) ?? "-"}
                          </td>
                          <td className="border border-gray-200 p-2 text-center">
                            {(calculateFinalGrade([grades[area]?.[0] || 0, grades[area]?.[1] || 0]) || 0) >= 75 ? "PASSED" : "FAILED"}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={2} className="border border-gray-200 p-2">
                          General Ave. for the Semester:
                        </td>
                        <td colSpan={2} className="border border-gray-200 p-2 text-center">
                          {calculateGeneralAverage()}
                        </td>
                        <td className="border border-gray-200 p-2"></td>
                        <td className="border border-gray-200 p-2 text-center">
                          {Number(calculateGeneralAverage()) >= 75 ? "PASSED" : "FAILED"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="w-1/2 p-6 border rounded shadow">
                  <h2 className="text-lg font-bold mb-4">
                    REPORT ON LEARNING PROGRESS AND ACHIEVEMENT
                  </h2>
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 p-2 w-1/3">
                          Learning Areas
                        </th>
                        <th className="border border-gray-200 p-2 text-center">1</th>
                        <th className="border border-gray-200 p-2 text-center">2</th>
                        <th className="border border-gray-200 p-2 text-center">3</th>
                        <th className="border border-gray-200 p-2 text-center">4</th>
                        <th className="border border-gray-200 p-2 text-center">
                          Final Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {learningAreas.map((area) => (
                        <tr key={area}>
                          <td className="border border-gray-200 p-2">{area}</td>
                          {[0, 1, 2, 3].map((quarter) => (
                            <td
                              key={quarter}
                              className="border border-gray-200 p-2 text-center"
                            >
                              <input
                                type="number"
                                className="w-full text-center"
                                min="0"
                                max="100"
                                value={grades[area]?.[quarter] || ""}
                                onChange={(e) =>
                                  handleGradeChange(area, quarter, e.target.value)
                                }
                                required
                              />
                            </td>
                          ))}
                          <td className="border border-gray-200 p-2 text-center">
                            {area === "MAPEH"
                              ? calculateFinalGrade(grades["MAPEH"] || []) ?? "-"
                              : calculateFinalGrade(grades[area] || []) ?? "-"}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="border border-gray-200 p-2 font-bold">
                          General Average
                        </td>
                        <td
                          colSpan={5}
                          className="border border-gray-200 p-2 text-center"
                        >
                          {calculateGeneralAverage()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
  
  <div className="w-1/2 p-6 border rounded shadow">
  <h2 className="text-lg font-bold mb-4">List of Students</h2>
  <table className="w-full border-collapse border border-gray-200">
    <thead>
      <tr className="bg-gray-100">
        <th className="border border-gray-200 p-2">Name</th>
        <th className="border border-gray-200 p-2">LRN</th>
        <th className="border border-gray-200 p-2 text-center">
          General Average
        </th>
      </tr>
    </thead>
    <tbody>
      {/* Conditional Rendering Based on Semester */}
      {selectedSectionId && sections.some((section) => section.id === selectedSectionId && section.semester) ? (
        /* Render Logic for Sections with Semester */
        filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <tr key={student.id}>
              <td className="border border-gray-200 p-2">{student.fullName}</td>
              <td className="border border-gray-200 p-2">{student.lrn || "-"}</td>
              <td className="border border-gray-200 p-2 text-center">
            {studentAverages[student.id] !== undefined
              ? studentAverages[student.id].toFixed(2)
              : "-"}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={3}
              className="border border-gray-200 p-2 text-center text-gray-500"
            >
              No students found for the selected section.
            </td>
          </tr>
        )
      ) : (
        /* Render Logic for Sections Without Semester */
        sections.map((section) =>
          section.students.map((student) => (
            <tr key={student.id}>
              <td className="border border-gray-200 p-2">{student.fullName}</td>
              <td className="border border-gray-200 p-2">{student.lrn}</td>
              <td className="border border-gray-200 p-2 text-center">
                {studentAverages[student.id] !== undefined
                  ? studentAverages[student.id].toFixed(2)
                  : "-"}
              </td>
            </tr>
          ))
        )
      )}
    </tbody>
  </table>
</div>

            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={saveGrades}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Save Grades
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-600 text-center">No sections found.</p>
      )}
    </div>
  );
}

