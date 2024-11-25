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
  learningAreas: LearningArea[];
  generalAverage: number; // Added to reflect general average in the schema
  timestamp: ReturnType<typeof serverTimestamp>;
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
  const searchRef = useRef<HTMLDivElement>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [studentAverages, setStudentAverages] = useState<{ [studentId: string]: number }>({});



  // Fetch grades and general averages
  const fetchGrades = async () => {
    try {
      const gradesQuery = query(collection(db, "grades"));
      const gradesSnapshot = await getDocs(gradesQuery);
  
      const averages: { [studentId: string]: number } = {};
      gradesSnapshot.forEach((gradeDoc) => {
        const gradeData = gradeDoc.data() as GradeData;
        averages[gradeData.studentId] = gradeData.generalAverage;
      });
  
      setStudentAverages(averages); // Use the new state
    } catch (err) {
      console.error("Error fetching grades:", err);
    }
  };
  

// Call this in useEffect or wherever you fetch data
useEffect(() => {
  fetchGrades();
}, []);


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
    const finalGrades = learningAreas.map((area) =>
      area === "MAPEH"
        ? calculateFinalGrade(grades["MAPEH"] || [])
        : calculateFinalGrade(grades[area] || [])
    );
    const validGrades = finalGrades.filter((grade): grade is number => grade !== null);
    if (validGrades.length === 0) return "-";
    const average = validGrades.reduce((acc, grade) => acc + grade, 0) / validGrades.length;
    return Math.round(average);
  };
  

  const handleGradeChange = (area: string, quarter: number, value: string) => {
    const newGrades = { ...grades }
    const updatedQuarters = newGrades[area] || []
    updatedQuarters[quarter] = parseFloat(value) || 0 // Ensure input is a number
    newGrades[area] = updatedQuarters
    setGrades(newGrades)

    if (["Music", "Arts", "PE (Physical Education)", "Health"].includes(area)) {
      setGrades((prevGrades) => {
        const newMAPEHGrades = [0, 1, 2, 3].map((q) => {
          const grade = calculateMAPEHGrade(q)
          return grade !== null ? grade : 0 // Default to 0 if grade is null
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
      setLoading(true)
      setError(null)

      const user = auth.currentUser
      if (!user) {
        setError('No user is logged in.')
        return
      }

      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        setError('User data not found in the database.')
        return
      }

      const userData = userDocSnap.data()
      const fullname = userData?.fullname
      const role = userData?.role

      if (role !== 'Adviser') {
        setError('You do not have permission to view this page.')
        return
      }

      setCurrentAdviser(fullname)

      const sectionsRef = collection(db, 'sections')
      const sectionsQuery = query(sectionsRef, where('adviser', '==', fullname))
      const sectionsSnapshot = await getDocs(sectionsQuery)

      const fetchedSections = sectionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        adviser: doc.data().adviser,
        grade: doc.data().grade,
        students: doc.data().students || [],
      }))

      const enrichedSections = await Promise.all(
        fetchedSections.map(async (section) => {
          const studentDocs = await Promise.all(
            section.students.map(async (studentId: string) => {
              const studentDoc = await getDoc(doc(db, 'enrollmentForms', studentId))
              return studentDoc.exists()
                ? {
                    id: studentDoc.id,
                    fullName: `${studentDoc.data().firstName} ${studentDoc.data().middleName || ''} ${studentDoc.data().lastName}`.trim(),
                    lrn: studentDoc.data().lrn,
                    sex: studentDoc.data().sex,
                    age: studentDoc.data().age,
                    birthdate: studentDoc.data().birthdate,
                  }
                : null
            })
          )
          return {
            ...section,
            students: studentDocs.filter((s): s is Student => s !== null),
          }
        })
      )

      if (enrichedSections.length > 0) {
        setSections(enrichedSections)
        setSelectedSectionId(enrichedSections[0]?.id || null)
        await fetchSubjects(enrichedSections[0]?.id || '')
      } else {
        setSections([])
        setLearningAreas([])
      }
    } catch (err) {
      console.error('Error fetching sections:', err)
      setError('An error occurred while fetching sections.')
    } finally {
      setLoading(false)
    }
  }

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
    // Here you would typically load the selected student's grades
    console.log(`Selected student with ID: ${student.id}`)
  }

  const saveGrades = async () => {
    if (!selectedStudent || !selectedSectionId) {
      setErrorMessage("Please select a student and ensure a section is selected.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
  
    const section = sections.find(s => s.id === selectedSectionId);
    if (!section) {
      setErrorMessage("Section not found.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
  
    // Check for existing grades
    try {
      const gradesQuery = query(
        collection(db, 'grades'),
        where('studentId', '==', selectedStudent.id),
        where('sectionId', '==', selectedSectionId)
      );
      const existingGradesSnapshot = await getDocs(gradesQuery);
  
      if (!existingGradesSnapshot.empty) {
        setErrorMessage("Grades for this student already exist.");
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
  
      // Calculate general average before saving
      const generalAverage = calculateGeneralAverage();

  
      // Proceed to save grades
      const learningAreasData: LearningArea[] = learningAreas.map(area => ({
        name: area,
        quarters: {
          1: grades[area]?.[0] || 0,
          2: grades[area]?.[1] || 0,
          3: grades[area]?.[2] || 0,
          4: grades[area]?.[3] || 0,
        },
        finalGrade: calculateFinalGrade(grades[area] || []) || 0,
      }));
  
      const gradeData: GradeData = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.fullName,
        adviserId: auth.currentUser?.uid,
        adviserName: currentAdviser,
        sectionId: selectedSectionId,
        sectionName: section.name,
        gradeLevel: section.grade,
        schoolYear: new Date().getFullYear().toString(),
        learningAreas: learningAreasData,
        generalAverage: generalAverage === "-" ? 0 : generalAverage, // Save the general average
        timestamp: serverTimestamp(),
      };
  
      await addDoc(collection(db, 'grades'), gradeData);
  
      setSuccessMessage("Grades saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
  
      // Reset input fields and states
      setGrades({});
      setSelectedStudent(null);
      setSearchTerm('');
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

  // Render error message
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500 text-lg font-medium">{error}</div>
      </div>
    );
  }

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
            </h2>
            <div className="flex justify-center items-center space-x-4 mb-4">
              <p className="text-center">
                <strong>Name of Adviser:</strong> {section.adviser}
              </p>
              <p className="text-center">
                <strong>Number of Students:</strong> {section.students.length}
              </p>
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
              {/* REPORT ON LEARNING PROGRESS AND ACHIEVEMENT */}
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
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={saveGrades}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Save Grades
                  </button>
                </div>
              </div>
  
{/* STUDENT LIST */}
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
      {sections.map((section) =>
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
      )}
    </tbody>
  </table>
</div>


            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-600 text-center">No sections found.</p>
      )}
    </div>
  );
  
}