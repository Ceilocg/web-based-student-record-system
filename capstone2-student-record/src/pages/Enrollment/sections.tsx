import { useEffect, useState } from 'react'
import { collection,getDoc,addDoc, getDocs, doc, deleteDoc, updateDoc, query, where} from 'firebase/firestore'
import { db } from '../../firebaseConfig'
import { Loader2 } from 'lucide-react'

interface Section {
  id: string
  name: string
  students: string[]
  adviser?: string
  grade?: string 
  subjects?: string[]
  strand?: string
  tvlSubOption?: string
}

interface Adviser {
  id: string
  fullname: string
}

interface Student {
  id: string;
  fullName: string;
  gradeLevel: string;
}


export default function SectionList() {
  const [sections, setSections] = useState<Section[]>([])
  const [advisers, setAdvisers] = useState<Adviser[]>([])
  const [selectedAdviser, setSelectedAdviser] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showAssignAdviser, setShowAssignAdviser] = useState<boolean>(false);
  const [showAddSubjects, setShowAddSubjects] = useState<boolean>(false);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [showCreateSubject, setShowCreateSubject] = useState<boolean>(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]); 
  const [showSecondSemStudents, setShowSecondSemStudents] = useState(false);
  const [secondSemStudents, setSecondSemStudents] = useState<{ studentId: string; studentName: string; generalAverage: number }[]>([]);
  const [selectedSectionName, setSelectedSectionName] = useState<string | null>(null);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string | null>(null);
  const [_adviserId, setAdviserId] = useState<string | null>(null);
  const [adviserName, setAdviserName] = useState<string | null>(null);
  const [selectedSecondSemStudents, setSelectedSecondSemStudents] = useState<{ studentId: string; studentName: string }[]>([]);
  const [selectedStrand, setSelectedStrand] = useState<string | null>(null);

  

  const handleSecondSemEnrollment = async (sectionId: string) => {
    try {
      const gradesQuery = query(
        collection(db, "grades"),
        where("sectionId", "==", sectionId),
        where("semester", "==", "1st")
      );
      const gradesSnapshot = await getDocs(gradesQuery);
  
      if (gradesSnapshot.empty) {
        alert("No data found for this section.");
        return;
      }
  
      const sectionDetails = gradesSnapshot.docs[0].data();
      setSelectedSectionName(sectionDetails.sectionName || "N/A");
      setSelectedGradeLevel(sectionDetails.gradeLevel || "N/A");
      setSelectedStrand(sectionDetails.strand || "N/A");
      setAdviserId(sectionDetails.adviserId || null);
      setAdviserName(sectionDetails.adviserName || null);
  
      // Map students and ensure `studentId` is included
      const students = gradesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          studentName: data.studentName,
          generalAverage: data.generalAverage,
          studentId: doc.id, // Ensure this is included
        };
      });
  
      setSecondSemStudents(students);
      setShowSecondSemStudents(true);
    } catch (error) {
      console.error("Error fetching 2nd Sem Enrollment data:", error);
      alert("An error occurred while fetching the student list. Please try again.");
    }
  };
  
  


  const coreSubjectsForGrades7to10 = [
    "Filipino",
    "English",
    "Mathematics",
    "Science",
    "Araling Panlipunan (Social Studies)",
    "Edukasyon sa Pagpapakatao (EsP) - Values Education",
    "Edukasyong Pantahanan at Pangkabuhayan (EPP) - Technical-Vocational Education",
    "Mother Tongue",
    "Technology and Livelihood Education (TLE)",
    "MAPEH",
    "Music",
    "Arts",
    "PE (Physical Education)",
    "Health"
  ];

  const coreSubjectsForGrades11to12 = [
    "Oral Communication",
    "Reading and Writing",
    "Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino",
    "Pagbasa at Pagsusuri ng Iba’t Ibang Teksto Tungo sa Pananaliksik",
    "21st Century Literature from the Philippines and the World",
    "Contemporary Philippine Arts from the Regions",
    "Media and Information Literacy",
    "General Mathematics",
    "Statistics and Probability",
    "Earth and Life Science",
    "Physical Science",
    "Personal Development",
    "Understanding Culture, Society, and Politics",
    "Introduction to the Philosophy of the Human Person",
    "Physical Education and Health",
    "English for Academic and Professional Purposes",
    "Practical Research 1",
    "Practical Research 2",
    "Pagsulat sa Filipino sa Piling Larangan (Akademik, Isports, Sining at Tech-Voc)",
    "Empowerment Technologies (for the Strand)",
    "Entrepreneurship",
    "Inquiries, Investigations, and Immersion"
  ];

  const abmSubjectsForGrades11to12 = [
    "Applied Economics",
    "Business Ethics and Social Responsibility",
    "Fundamentals of Accountancy, Business, and Management 1 & 2",
    "Business Math",
    "Business Finance", 
    "Organization and Management", 
    "Principles of Marketing",
    "Work Immersion/Research/Career Advocacy/Culminating Activity"
  ];

  const stemSubjectsForGrades11to12 = [
    "Pre-Calculus",
    "Basic Calculus",
    "General Biology 1",
    "General Biology 2",
    "General Physics 1",
    "General Physics 2",
    "General Chemistry 1",
    "General Chemistry 2",
    "Work Immersion/Research/Career Advocacy/Culminating Activity"
  ]
  
  const gasSubjectsForGrades11to12 = [
    "Humanities 1",
    "Humanities 2",
    "Social Science 1",
    "Social Science 2",
    "Applied Economics",
    "Organization and Management",
    "Disaster Readiness and Risk Reduction",
    "Elective 1 & 2",
    "Work Immersion/Research/Career Advocacy/Culminating Activity"
  ]

  const humssSubjectsForGrades11to12 = [
    "Creative Writing / Malikhaing Pagsulat",
    "Introduction to World Religions and Belief Systems",
    "Creative Nonfiction",
    "Trends, Networks, and Critical Thinking in the 21st Century Culture",
    "Philippine Politics and Governance",
    "Community Engagement, Solidarity, and Citizenship",
    "Disciplines and Ideas in the Social Sciences",
    "Disciplines and Ideas in the Applied Social Sciences",
    "Work Immersion/Research/Career Advocacy/Culminating Activity"
  ]

  const heSubjectsForGrades11to12 = [
    "Bread and Pastry Production",
    "Food and Beverage Services",
    "Housekeeping",
    "Local Guiding Services",
    "Tourism Promotion Services",
    "Front Office Services",
    "Beauty Care (Nail Care)",
    "Hairdressing and Barbering",
    "Wellness Massage",
    "Dressmaking and Tailoring",
    "Handicraft (Crafts)"
  ]

  const cssSubjectsForGrades11to12 = [
    "Computer Hardware Servicing",
    "Networking Essentials",
    "Systems Servicing NC II",
    "Basic Electronics",
    "Work Immersion (OJT)"
  ]

  const cookerySubjectsForGrades11to12 = [
    "Introduction to Culinary Arts",
    "Food and Kitchen Safety",
    "Food Preparation and Cooking Techniques",
    "Menu Planning and Food Costing",
    "Bread and Pastry Production",
    "Work Immersion (OJT)"
  ]


  const handleStudentSelection = (
    e: React.ChangeEvent<HTMLInputElement>,
    student: { studentId: string; studentName: string; generalAverage: number }
  ) => {
    const { checked } = e.target;
  
    setSelectedSecondSemStudents((prev) =>
      checked
        ? [...prev, { studentId: student.studentId, studentName: student.studentName }]
        : prev.filter((s) => s.studentId !== student.studentId)
    );
  };
  
  
  



  const handleEnroll = async () => {
    if (!selectedSectionName || !selectedGradeLevel) {
      alert("Section name and grade level are required.");
      return;
    }
  
    if (selectedSecondSemStudents.length === 0) {
      alert("Please select at least one student.");
      return;
    }
  
    try {
      // Extract only the student IDs
      const studentIds = selectedSecondSemStudents.map((student) => student.studentId);
  
      // Reference to the new section
      const newSectionRef = collection(db, "sections");
  
      // Prepare the new section data
      const newSectionData = {
        name: `${selectedSectionName} - 2nd Sem`, // Append 2nd Sem to the section name
        grade: selectedGradeLevel,
        adviser: adviserName || "N/A",
        students: studentIds, // Save only student IDs
        semester: "2nd", // Mark it as 2nd Semester
        strand: selectedStrand,
        createdAt: new Date(), // Optional: Add a timestamp
      };
  
      // Add the new section document to Firestore
      const newSectionDoc = await addDoc(newSectionRef, newSectionData);
  
      console.log("New section created with ID:", newSectionDoc.id);
  
      // Close modal and reset state
      setShowSecondSemStudents(false);
      setSelectedSecondSemStudents([]);
      alert("New section created successfully!");
    } catch (error) {
      console.error("Error creating new section:", error);
      alert("An error occurred while creating the new section. Please try again.");
    }
  };
  
  
  
  
  
  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'enrollmentForms'));
        const studentsData: Student[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          fullName: `${doc.data().firstName} ${doc.data().middleName || ''} ${doc.data().lastName} ${doc.data().extensionName || ''}`.trim(),
          gradeLevel: doc.data().gradeLevel // Ensure gradeLevel is accessed from doc.data()
        }));
        
        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
  
    fetchAllStudents();
  }, []);
  
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchSections();
        await fetchAdvisers();
        await fetchAdditionalSubjects();
      } catch (err) {
        setError('An error occurred while fetching data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSubjectsForGrade = async () => {
      try {
        setLoading(true);
        await fetchAdditionalSubjects();
      } catch (err) {
        setError('An error occurred while fetching subjects. Please try again.');
        console.error('Error fetching subjects:', err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSectionId) {
      fetchSubjectsForGrade();
    }
  }, [selectedSectionId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchSections();
        await fetchAdvisers();
        await fetchAdditionalSubjects();
      } catch (err) {
        setError('An error occurred while fetching data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [selectedSectionId]);

  useEffect(() => {
    const fetchSubjectsForGrade = async () => {
      try {
        setLoading(true);
        await fetchAdditionalSubjects();
      } catch (err) {
        setError('An error occurred while fetching subjects. Please try again.');
        console.error('Error fetching subjects:', err);
      } finally {
        setLoading(false);
      }
    };
  
    if (selectedSectionId) {
      fetchSubjectsForGrade();
    }
  }, [selectedSectionId]);

  const fetchAdditionalSubjects = async () => {
    const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
    const additionalSubjects = subjectsSnapshot.docs.map((doc) => doc.data().name);
  
    const section = sections.find((sec) => sec.id === selectedSectionId);
    const isGrade7to10 = section && ["7", "8", "9", "10"].includes(section.grade || "");
    const isGrade11or12 = section && ["11", "12"].includes(section.grade || "");
    const isABMStrand = section && section.strand === "ABM";
    const isSTEMStrand = section && section.strand === "STEM";
    const isGASStrand = section && section.strand === "GAS";
    const isHUMSSStrand = section && section.strand === "HUMSS";
    const isHETvlSubOption = section && section.tvlSubOption === "HE";
    const isCSSSubOption = section && section.tvlSubOption === "CSS";
    const isCOOKERYSubOption = section && section.tvlSubOption === "Cookery";
    // Initialize with an empty array
    let subjectsToDisplay: string[] = [];
  
    if (isGrade7to10) {
      // Set subjects for grades 7-10
      subjectsToDisplay = [...coreSubjectsForGrades7to10, ...additionalSubjects];
    } else if (isGrade11or12) {
      // Check for specific strand options for grades 11-12
      if (isABMStrand) {
        subjectsToDisplay = [...coreSubjectsForGrades11to12, ...abmSubjectsForGrades11to12, ...additionalSubjects];
      } else if (isSTEMStrand) {
        subjectsToDisplay = [...coreSubjectsForGrades11to12, ...stemSubjectsForGrades11to12, ...additionalSubjects];
      } else if (isGASStrand) {
        subjectsToDisplay = [...coreSubjectsForGrades11to12, ...gasSubjectsForGrades11to12, ...additionalSubjects];
      } else if (isHUMSSStrand) {
        subjectsToDisplay = [...coreSubjectsForGrades11to12, ...humssSubjectsForGrades11to12, ...additionalSubjects];
      } else if (isHETvlSubOption) {
        subjectsToDisplay = [...coreSubjectsForGrades11to12, ...heSubjectsForGrades11to12, ...additionalSubjects];
      } else if (isCSSSubOption) {
        subjectsToDisplay = [...coreSubjectsForGrades11to12, ...cssSubjectsForGrades11to12, ...additionalSubjects];
      } else if (isCOOKERYSubOption) {
        subjectsToDisplay = [...coreSubjectsForGrades11to12, ...cookerySubjectsForGrades11to12, ...additionalSubjects];
      } else {
        // Default for grades 11-12 without specific strand options
        subjectsToDisplay = [...coreSubjectsForGrades11to12, ...additionalSubjects];
      }
    } else {
      // Handle cases that don't match any specific grade or strand criteria
      subjectsToDisplay = additionalSubjects;
    }
  
    // Set the available subjects in the state
    setAvailableSubjects(subjectsToDisplay);
  };
  
  
  
  const fetchSections = async () => {
    const querySnapshot = await getDocs(collection(db, 'sections'));
    const sectionsData: Section[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      students: doc.data().students || [],
      adviser: doc.data().adviser || '',
      grade: doc.data().grade || '', // Fetch gradeLevel here
      strand: doc.data().strand || '',
      tvlSubOption: doc.data().tvlSubOption || ''
    }));
    setSections(sectionsData);
  }

  const handleSelectAll = () => {
    if (selectedSubjects.length === availableSubjects.length) {
      // Deselect all
      setSelectedSubjects([]);
    } else {
      // Select all
      setSelectedSubjects(availableSubjects);
    }
  };
  
  const handleSubjectSelection = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(item => item !== subject) // Deselect subject
        : [...prev, subject] // Select subject
    );
  };
  
  
  
  const handleSaveSubjects = async (sectionId: string) => {
    try {
      // Reference to the section document in Firestore
      const sectionRef = doc(db, 'sections', sectionId);
  
      // Fetch the current subjects to check for duplicates
      const sectionSnapshot = await getDoc(sectionRef);
      const currentSubjects = sectionSnapshot.data()?.subjects || [];
  
      // Find duplicates between current subjects and selected subjects
      const duplicateSubjects = selectedSubjects.filter(subject => currentSubjects.includes(subject));
      
      if (duplicateSubjects.length > 0) {
        alert(`The following subjects are already assigned to this section: ${duplicateSubjects.join(', ')}`);
        return; // Exit the function without updating if duplicates are found
      }
  
      // Update the section document with the combined subjects (current + selected)
      const updatedSubjects = [...currentSubjects, ...selectedSubjects];
      await updateDoc(sectionRef, { subjects: updatedSubjects });
  
      // Update local state to reflect changes without a re-fetch
      setSections(prevSections =>
        prevSections.map(section =>
          section.id === sectionId ? { ...section, subjects: updatedSubjects } : section
        )
      );
  
      // Clear the selected subjects to uncheck the checkboxes
      setSelectedSubjects([]);
  
      alert('Subjects added successfully!');
    } catch (error) {
      console.error('Error saving subjects:', error);
      alert('An error occurred while saving the subjects. Please try again.');
    }
  };

  const handleShowStudents = async (studentIds: string[],) => {
    const sectionStudents = students.filter(student => studentIds.includes(student.id));
    setSelectedStudents(sectionStudents);
    setShowStudentList(true);
  };
  
  
  
  const handleCreateNewSubject = async () => {
    if (!newSubjectName) return;
  
    try {
      await addDoc(collection(db, 'subjects'), { name: newSubjectName });
      setAvailableSubjects((prev) => [...prev, newSubjectName]);
      setNewSubjectName('');
      setShowCreateSubject(false);
      alert(`Subject "${newSubjectName}" created successfully!`);
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('An error occurred while creating the subject. Please try again.');
    }
  };
  
  
  const handleDeleteSection = async (sectionId: string) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        const sectionDoc = await getDoc(doc(db, 'sections', sectionId)); // Changed from getDocs to getDoc
        const sectionData = sectionDoc.data();
    
        if (sectionData && sectionData.students && sectionData.students.length > 0) {
          const updatePromises = sectionData.students.map(async (studentId: string) => {
            const studentRef = doc(db, 'enrollmentForms', studentId);
            await updateDoc(studentRef, {
              section: '', // Clear the section field
            });
          });
    
          await Promise.all(updatePromises);
        }
    
        await deleteDoc(doc(db, 'sections', sectionId));
        setSections((prevSections) => prevSections.filter((section) => section.id !== sectionId));
        alert('Section deleted successfully, and student data updated.');
      } catch (error) {
        console.error('Error deleting section or updating students:', error);
        alert('An error occurred while deleting the section. Please try again.');
      }
    }
  };
  

  const fetchAdvisers = async () => {
    const advisersQuery = query(collection(db, 'users'), where('role', '==', 'Adviser'))
    const querySnapshot = await getDocs(advisersQuery)
    const advisersData: Adviser[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      fullname: doc.data().fullname,
    }))
    setAdvisers(advisersData)
  }


  

  const handleAssignAdviser = async () => {
    if (!selectedSectionId || !selectedAdviser) {
      alert('Please select a section and an adviser');
      return;
    }
  
    // Check if the selected adviser is already assigned to another section
    const adviserAlreadyAssigned = sections.find(
      section => section.adviser === selectedAdviser && section.id !== selectedSectionId
    );
  
    if (adviserAlreadyAssigned) {
      alert(`Adviser ${selectedAdviser} is already assigned to section "${adviserAlreadyAssigned.name}".`);
      return;
    }
  
    try {
      const sectionRef = doc(db, 'sections', selectedSectionId);
      await updateDoc(sectionRef, { adviser: selectedAdviser });
  
      setSections(prevSections =>
        prevSections.map(section =>
          section.id === selectedSectionId ? { ...section, adviser: selectedAdviser } : section
        )
      );
  
      alert('Adviser assigned successfully');
      setSelectedSectionId(null);
      setSelectedAdviser('');
    } catch (error) {
      console.error('Error assigning adviser:', error);
      alert('An error occurred while assigning the adviser. Please try again.');
    }
  };
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
<h2 className="text-3xl font-semibold text-gray-800 mb-4 text-center">
  List of Sections
</h2>
{sections.length > 0 ? (
  <div className="overflow-x-auto">
    <table className="min-w-full table-auto border-separate border-spacing-0">
      <thead>
        <tr className="bg-gray-100 text-left text-sm text-gray-600">
          <th className="px-4 py-2 border-b">Section Name</th>
          <th className="px-4 py-2 border-b">Number of Students</th>
          <th className="px-4 py-2 border-b">Adviser</th>
          <th className="px-4 py-2 border-b">Grade Level</th>
          <th className="px-4 py-2 border-b">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sections
          .slice() // Clone the array to avoid mutating the original state
          .sort((a, b) => {
            // Convert grade to numbers for proper numeric sorting
            const gradeA = parseInt(a.grade || "0", 10);
            const gradeB = parseInt(b.grade || "0", 10);
            return gradeA - gradeB;
          })
          .map((section, index) => (
            <tr
              key={section.id}
              className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
            >
              <td className="px-4 py-2 border-b text-sm text-gray-700">
                {section.name}
              </td>
              <td
                className="px-4 py-2 border-b text-sm text-gray-700 cursor-pointer underline text-blue-600"
                onClick={() => handleShowStudents(section.students)}
              >
                {section.students.length}
              </td>
              <td className="px-4 py-2 border-b text-sm text-gray-700">
                {section.adviser || "Not assigned"}
              </td>
              <td className="px-4 py-2 border-b text-sm text-gray-700">
                {section.grade || "Not specified"}
              </td>
              <td className="px-4 py-2 border-b text-sm">
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      setSelectedSectionId(section.id);
                      setShowAssignAdviser(true);
                      setShowAddSubjects(false);
                    }}
                    className="bg-gray-800 text-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-700 transition-colors"
                  >
                    Assign Adviser
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSectionId(section.id);
                      setShowAddSubjects(true);
                      setShowAssignAdviser(false);
                    }}
                    className="bg-gray-800 text-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-700 transition-colors"
                  >
                    Assign Subject
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="bg-gray-800 text-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-700 transition-colors"
                  >
                    Delete
                  </button>
                  {["11", "12"].includes(section.grade || "") && (
                    <button
                      onClick={() => handleSecondSemEnrollment(section.id)}
                      className="bg-gray-800 text-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-700 transition-colors"
                    >
                      2nd Sem Enrollment
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
) : (
  <p className="text-center text-gray-600">No sections found.</p>
)}


{showStudentList && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
    <div className="bg-white rounded-md p-4 shadow-lg max-w-lg w-full">
      <h3 className="text-xl font-semibold mb-4">List of Students</h3>
      <ul className="list-disc pl-6 space-y-2">
        {selectedStudents.map((student) => (
          <li key={student.id} className="flex justify-between items-center">
            <span>{student.fullName}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          setShowStudentList(false);
        }}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      >
        Close
      </button>
    </div>
  </div>
)}

{showSecondSemStudents && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg max-w-md w-full">
      {/* Display Section Name and Grade Level */}
      <h2 className="text-lg font-bold mb-2">
        Grade {selectedGradeLevel || "N/A"} {selectedStrand || "N/A"} - {selectedSectionName || "N/A"}
      </h2>
     
      <h3 className="text-sm text-gray-400 mb-4">2nd Sem Enrollment Students</h3>

      <ul className="space-y-2">
        {secondSemStudents.length > 0 ? (
          secondSemStudents.map((student, index) => (
            <li key={index} className="flex justify-between items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={student.studentName}
                  onChange={(e) => handleStudentSelection(e, student)}
                  className="form-checkbox text-blue-600"
                />
                <span>{student.studentName}</span>
              </label>
              <span className="text-gray-400">{student.generalAverage.toFixed(2)}%</span>
            </li>
          ))
        ) : (
          <p className="text-gray-400">No students found for 2nd Semester.</p>
        )}
      </ul>

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setShowSecondSemStudents(false)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Close
        </button>
        <button
          onClick={handleEnroll}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Enroll
        </button>
      </div>
    </div>
  </div>
)}


      {showCreateSubject && (
        <div className="mt-4 bg-white p-4 rounded-md shadow">
          <h3 className="text-lg font-semibold mb-2">Create New Subject</h3>
          <input
            type="text"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="Enter subject name"
            className="px-3 py-2 border rounded-md text-sm w-full mb-2"
          />
          <button
            onClick={handleCreateNewSubject}
            className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition-colors"
          >
            Save Subject
          </button>
          <button
            onClick={() => setShowCreateSubject(false)}
            className="ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
  
      {/* Assign Adviser UI */}
      {showAssignAdviser && selectedSectionId && (
        <div className="mt-4 bg-white p-4 rounded-md shadow">
          <h3 className="text-lg font-semibold mb-2">Assign Adviser</h3>
          <div className="flex items-center">
            <select
              value={selectedAdviser}
              onChange={(e) => setSelectedAdviser(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm flex-grow mr-2"
            >
              <option value="">Select an Adviser</option>
              {advisers.map((adviser) => (
                <option key={adviser.id} value={adviser.fullname}>
                  {adviser.fullname}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                handleAssignAdviser();
                setShowAssignAdviser(false);
              }}
              className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition-colors"
            >
              Assign
            </button>
          </div>
        </div>
      )}
  
      {/* Add Subjects UI */}
      {showAddSubjects && selectedSectionId && (
        <div className="mt-4 bg-white p-4 rounded-md shadow">
          <h3 className="text-lg font-semibold mb-2">Add Subjects</h3>
  
          {/* Select All Checkbox */}
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={selectedSubjects.length === availableSubjects.length}
              className="mr-2"
            />
            <label>Select All</label>
          </div>
  
          {/* Checkbox list for individual subjects in a column */}
          <div className="flex flex-col space-y-2">
            {availableSubjects.map((subject, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  value={subject}
                  checked={selectedSubjects.includes(subject)}
                  onChange={() => handleSubjectSelection(subject)}
                  className="mr-2"
                />
                {subject}
              </label>
            ))}
          </div>
  
          {/* Buttons for saving and creating new subjects */}
          <button
            onClick={() => handleSaveSubjects(selectedSectionId)}
            className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition-colors mt-4 mr-4"
          >
            Save Subjects
          </button>
          <button
            onClick={() => setShowCreateSubject(true)}
            className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors mt-4"
          >
            Create New Subject
          </button>
  
          {/* Form to create a new subject */}
          {showCreateSubject && (
            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Enter new subject name"
                className="px-3 py-2 border rounded-md text-sm w-full mb-2"
              />
              <button
                onClick={handleCreateNewSubject}
                className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition-colors"
              >
                Save Subject
              </button>
              <button
                onClick={() => setShowCreateSubject(false)}
                className="ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
