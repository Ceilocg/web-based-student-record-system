import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

interface Student {
  id: string;
  fullName: string;
  lrn: string;
  sex: string;
  age: number;
  birthdate: string;
}

const Component: React.FC = () => {
  const [learningAreas, setLearningAreas] = useState<string[]>([]);
  const [sections, setSections] = useState<{ name: string; students: Student[]; adviser: string; grade: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<{ [area: string]: number[] }>({});
  const [remarks, setRemarks] = useState<{ [area: string]: string }>({});


  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const sectionsRef = collection(db, 'sections');
        const sectionsSnapshot = await getDocs(sectionsRef);

        const subjectsSet = new Set<string>();
        sectionsSnapshot.forEach((doc) => {
          const data = doc.data();
          const subjects = data?.subjects || [];
          subjects.forEach((subject: string) => subjectsSet.add(subject));
        });

        setLearningAreas(Array.from(subjectsSet));
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchSectionsForAdviser = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = auth.currentUser;
        if (!user) {
          setError('No user is logged in.');
          return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setError('User data not found in the database.');
          return;
        }

        const userData = userDocSnap.data();
        const fullname = userData?.fullname;
        const role = userData?.role;

        if (role !== 'Adviser') {
          setError('You do not have permission to view this page.');
          return;
        }

        const sectionsRef = collection(db, 'sections');
        const sectionsQuery = query(sectionsRef, where('adviser', '==', fullname));
        const sectionsSnapshot = await getDocs(sectionsQuery);

        const fetchedSections = sectionsSnapshot.docs.map((doc) => ({
          name: doc.data().name,
          adviser: doc.data().adviser,
          grade: doc.data().grade,
          students: doc.data().students || [],
        }));

        const enrichedSections = await Promise.all(
          fetchedSections.map(async (section) => {
            const studentDocs = await Promise.all(
              section.students.map(async (studentId: string) => {
                const studentDoc = await getDoc(doc(db, 'enrollmentForms', studentId));
                return studentDoc.exists()
                  ? {
                      id: studentDoc.id,
                      fullName: `${studentDoc.data().firstName} ${studentDoc.data().middleName || ''} ${studentDoc.data().lastName}`.trim(),
                      lrn: studentDoc.data().lrn,
                      sex: studentDoc.data().sex,
                      age: studentDoc.data().age,
                      birthdate: studentDoc.data().birthdate,
                    }
                  : null;
              })
            );
            return {
              ...section,
              students: studentDocs.filter((s) => s !== null) as Student[],
            };
          })
        );

        setSections(enrichedSections);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred while fetching sections.');
      } finally {
        setLoading(false);
      }
    };

    fetchSectionsForAdviser();
  }, []);

  const calculateFinalGrade = (quarters: number[]) => {
    if (quarters.length < 4) return null; // Ensure 4 quarters exist
    const average = quarters.reduce((acc, grade) => acc + grade, 0) / 4;
    return average.toFixed(2); // Return average rounded to 2 decimal places
  };

  const handleRemarksChange = (area: string, value: string) => {
    setRemarks((prev) => ({ ...prev, [area]: value }));
  };
   
  const handleGradeChange = (area: string, quarter: number, value: string) => {
    const newGrades = { ...grades };
    const updatedQuarters = newGrades[area] || [];
    updatedQuarters[quarter] = parseFloat(value) || 0; // Ensure input is a number
    newGrades[area] = updatedQuarters;
    setGrades(newGrades);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {sections.length > 0 ? (
        sections.map((section, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-2xl font-semibold text-center mb-4">
              Grade level {section.grade} - {section.name}
            </h2>

            <div className="p-4 space-y-4">
              <div className="border rounded shadow p-4">
                <h2 className="text-lg font-bold mb-4">REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</h2>
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 p-2 w-1/3">Learning Areas</th>
                      <th className="border border-gray-200 p-2 text-center">1</th>
                      <th className="border border-gray-200 p-2 text-center">2</th>
                      <th className="border border-gray-200 p-2 text-center">3</th>
                      <th className="border border-gray-200 p-2 text-center">4</th>
                      <th className="border border-gray-200 p-2 text-center">Final Grade</th>
                    </tr>
                  </thead>
                  <tbody>
  {learningAreas.map((area) => (
    <tr key={area}>
      <td className="border border-gray-200 p-2">{area}</td>
      {[1, 2, 3, 4].map((quarter) => (
        <td key={quarter} className="border border-gray-200 p-2 text-center">
          <input
            type="number"
            className="w-full text-center"
            min="0"
            max="100"
            value={grades[area]?.[quarter - 1] || ''}
            onChange={(e) => handleGradeChange(area, quarter - 1, e.target.value)}
          />
        </td>
      ))}
      <td className="border border-gray-200 p-2 text-center">
        {calculateFinalGrade(grades[area] || []) || "-"}
      </td>
      <td className="border border-gray-200 p-2 text-center">
        <input
          type="text"
          className="w-full text-center"
          value={remarks[area] || ''}
          onChange={(e) => handleRemarksChange(area, e.target.value)}
        />
      </td>
    </tr>
  ))}
  <tr>
    <td colSpan={5} className="border border-gray-200 p-2 font-bold text-right">
      General Average
    </td>
    <td className="border border-gray-200 p-2 text-center">
     
      <input
        type="text"
        className="w-full text-center"
        value={remarks['generalAverage'] || ''}
        onChange={(e) => handleRemarksChange('generalAverage', e.target.value)}
      />
    </td>
  </tr>
</tbody>

                </table>
                
            <div className="flex flex-col gap-y-4 mb-4">
  <select
    id="studentSelect"
    className="w-1/4 p-2 mt-6 border rounded bg-gray-700 text-white"
  >
    <option value="">-- Select a Student --</option>
    {section.students.map((student) => (
      <option key={student.id} value={student.id}>
        {student.fullName}
      </option>
    ))}
  </select>

  <div>
    <p><strong>Name of Adviser:</strong> {section.adviser}</p>
  </div>

  <div>
    <p><strong>Number Students:</strong> {section.students.length}</p>
  </div>
            </div>

              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-600 text-center">No sections found.</p>
      )}
    </div>
  );
};

export default Component;
