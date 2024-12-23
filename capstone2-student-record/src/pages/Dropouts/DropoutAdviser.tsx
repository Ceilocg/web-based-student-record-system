import  { useEffect, useState } from 'react'
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { auth, db } from '../../firebaseConfig'

interface Student {
  id: string;
  fullName: string;
  lrn: string;
  sex: string;
  age: number;
  birthdate: string;
  status: string;
  hasSecondSemesterGrade: boolean; // Add this property
}


interface Section {
  name: string
  students: Student[]
  adviser: string
  grade: string
}

export default function Component() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDropoutReasons, setShowDropoutReasons] = useState(false)
  const [selectedDropoutReason, setSelectedDropoutReason] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [, setStudentsWithGrades] = useState<Set<string>>(new Set());

  
  const dropoutReasons = [
   "Poverty",
"Child labor",
"High cost of education",
"Distance to school",
"Pregnancy",
"Family conflicts",
"Lack of motivation",
"Mental health issues",
"Unsafe school environment (e.g., Bullying)",
"Natural disasters",
  ].sort()


  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const gradesSnapshot = await getDocs(collection(db, 'grades'));
        const studentIds = new Set<string>();
  
        gradesSnapshot.forEach((doc) => {
          const gradeData = doc.data();
          if (gradeData.studentId) {
            studentIds.add(gradeData.studentId);
          }
        });
  
        setStudentsWithGrades(studentIds);
      } catch (error) {
        console.error('Error fetching grades:', error);
      }
    };
  
    fetchGrades();
  }, []);
   
  useEffect(() => {
    const fetchSectionsForAdviser = async () => {
      try {
        setLoading(true);
        setError(null);
  
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
  
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const fullname = userData?.fullname;
            const role = userData?.role;
  
            if (role === 'Adviser') {
              const sectionsRef = collection(db, 'sections');
              let sectionsQuery = query(
                sectionsRef,
                where('adviser', '==', fullname),
                where('semester', '==', '2nd') // First, try to fetch sections for the 2nd semester
              );
  
              let sectionsSnapshot = await getDocs(sectionsQuery);
  
              // If no sections are found for the 2nd semester, fetch all sections
              if (sectionsSnapshot.empty) {
                sectionsQuery = query(
                  sectionsRef,
                  where('adviser', '==', fullname) // Fetch all sections for the adviser
                );
                sectionsSnapshot = await getDocs(sectionsQuery);
              }
  
              const fetchedSections = sectionsSnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                adviser: doc.data().adviser,
                grade: doc.data().grade,
                students: doc.data().students || [], // Array of IDs (studentId or gradesId)
              }));
  
              const enrichedSections = await Promise.all(
                fetchedSections.map(async (section) => {
                  const studentDocs = await Promise.all(
                    section.students.map(async (id: string) => {
                      try {
                        let studentData = null;
                       
  
                        // Attempt to fetch as a grade ID
                        const gradeDocRef = doc(db, 'grades', id);
                        const gradeDocSnap = await getDoc(gradeDocRef);
  
                        if (gradeDocSnap.exists()) {
                          const gradeData = gradeDocSnap.data();
  
                          // Fetch enrollment form to get student details
                          const enrollmentDocRef = doc(db, 'enrollmentForms', gradeData.studentId);
                          const enrollmentDocSnap = await getDoc(enrollmentDocRef);
  
                          if (enrollmentDocSnap.exists()) {
                            const enrollmentData = enrollmentDocSnap.data();
                            studentData = {
                              id: gradeData.studentId,
                              fullName: `${enrollmentData.firstName} ${enrollmentData.middleName || ''} ${
                                enrollmentData.lastName
                              }`.trim(),
                              lrn: enrollmentData.lrn || '-',
                              sex: enrollmentData.sex,
                              age: enrollmentData.age,
                              birthdate: enrollmentData.birthdate,
                              status: enrollmentData.status || 'Enrolled',
                              hasSecondSemesterGrade: gradeData.semester === '2nd',
                              generalAverage: gradeData.generalAverage || null,
                            };
                          }
                        } else {
                          // If not found as a grade ID, fetch as a student ID
                          const studentDocRef = doc(db, 'enrollmentForms', id);
                          const studentDocSnap = await getDoc(studentDocRef);
  
                          if (studentDocSnap.exists()) {
                            const enrollmentData = studentDocSnap.data();
                            studentData = {
                              id,
                              fullName: `${enrollmentData.firstName} ${enrollmentData.middleName || ''} ${
                                enrollmentData.lastName
                              }`.trim(),
                              lrn: enrollmentData.lrn || '-',
                              sex: enrollmentData.sex,
                              age: enrollmentData.age,
                              birthdate: enrollmentData.birthdate,
                              status: enrollmentData.status || 'Enrolled',
                              hasSecondSemesterGrade: false,
                              generalAverage: null,
                            };
                          }
                        }
  
                        return studentData;
                      } catch (error) {
                        console.error(`Error fetching data for ID: ${id}`, error);
                        return null;
                      }
                    })
                  );
  
                  return {
                    ...section,
                    students: studentDocs.filter((s) => s !== null) as Student[], // Filter out nulls
                  };
                })
              );
  
              setSections(enrichedSections);
            } else {
              setError('You do not have permission to view this page.');
            }
          } else {
            setError('User data not found in the database.');
          }
        } else {
          setError('No user is logged in.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred while fetching sections.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchSectionsForAdviser();
  }, []);
  
  
  
  

  const handleDropoutClick = (student: Student) => {
    setSelectedStudent(student)
    setShowDropoutReasons(true)
  }

  const handleConfirmDropout = async () => {
    if (selectedStudent && selectedDropoutReason) {
      try {
        // Save the dropout request in the `dropouts` collection
        const dropoutRequest = {
          studentId: selectedStudent.id,
          studentName: selectedStudent.fullName,
          section: sections.find((section) =>
            section.students.some((s) => s.id === selectedStudent.id)
          )?.name,
          dropoutReason: selectedDropoutReason,
          requestedBy: auth.currentUser?.displayName || "Adviser",
          status: "Pending", // Default to pending for admin review
          timestamp: new Date(),
        };
  
        await addDoc(collection(db, "dropouts"), dropoutRequest);
  
        // Reset the selected student and reason
        setSelectedStudent(null);
        setSelectedDropoutReason(null);
        setShowDropoutReasons(false);
  
        // Display success message
        alert("Dropout request submitted successfully.");
      } catch (error) {
        console.error("Error submitting dropout request:", error);
        setError("Failed to submit dropout request. Please try again.");
      }
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

  // Render error message
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500 text-lg font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 ">
      {sections.length > 0 ? (
        sections.map((section, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-2xl font-semibold text-center mb-4">
              Grade level {section.grade} - {section.name}
            </h2>

            <div className="flex justify-around mb-4">
              <p>
                <strong>Name of Adviser:</strong> {section.adviser}
              </p>
              <p>
                <strong>Number Students:</strong> {section.students.length}
              </p>
              <p>
                <strong>Number of Request Dropouts:</strong>{' '}
                {section.students.filter((student) => student.status === 'Dropout').length}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-200 text-gray-700 text-left">
                    <th className="px-4 py-2 border">List of Students</th>
                    <th className="px-4 py-2 border">LRN</th>
                    <th className="px-4 py-2 border">Sex</th>
                    <th className="px-4 py-2 border">Age</th>
                    <th className="px-4 py-2 border">Birthdate</th>
                    <th className="px-4 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
  {section.students.map((student) => (
    <tr key={student.id} className="text-gray-600">
      <td className="px-4 py-2 border">{student.fullName}</td>
      <td className="px-4 py-2 border">{student.lrn}</td>
      <td className="px-4 py-2 border">{student.sex}</td>
      <td className="px-4 py-2 border">{student.age}</td>
      <td className="px-4 py-2 border">{student.birthdate}</td>
      <td className="px-4 py-2 border text-center">
        {student.hasSecondSemesterGrade ? (
          <span className="text-gray-400">Action Not Available</span>
        ) : (
          <button
            className={`hover:underline ${
              student.status === 'Dropout' ? 'text-red-500' : 'text-blue-500'
            }`}
            onClick={() => handleDropoutClick(student)}
            disabled={student.status === 'Dropout'}
          >
            {student.status === 'Dropout' ? 'Dropped Out' : 'Dropout'}
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>

              </table>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-600 text-center">No sections found.</p>
      )}

      {showDropoutReasons && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center mt-10">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Select Dropout Reason</h2>
            <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-2">
              {dropoutReasons.map((reason) => (
                <label key={reason} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="dropoutReason"
                    value={reason}
                    checked={selectedDropoutReason === reason}
                    onChange={(e) => setSelectedDropoutReason(e.target.value)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end space-x-4 pt-4 border-t">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowDropoutReasons(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={handleConfirmDropout}
                disabled={!selectedDropoutReason}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}