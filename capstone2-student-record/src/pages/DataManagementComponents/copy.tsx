import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { auth, db } from '../../firebaseConfig';

interface Student {
  id: string;
  fullName: string;
  lrn: string;
  sex: string;
  age: number;
  birthdate: string;
}

const Grades: React.FC = () => {
  const [sections, setSections] = useState<{ name: string; students: Student[]; adviser: string; grade: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectionsForAdviser = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const user = auth.currentUser;
        if (user) {
          // Fetch user data
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const fullname = userData?.fullname;
            const role = userData?.role;

            if (role === 'Adviser') {
              // If the user is an Adviser, fetch assigned sections
              const sectionsRef = collection(db, 'sections');
              const sectionsQuery = query(sectionsRef, where('adviser', '==', fullname));
              const sectionsSnapshot = await getDocs(sectionsQuery);

              const fetchedSections = sectionsSnapshot.docs.map((doc) => ({
                name: doc.data().name,
                adviser: doc.data().adviser,
                grade: doc.data().grade,
                students: doc.data().students || [], // Ensure students field exists
              }));

              // Fetch students data for each section
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
            {/* Section Header */}
            <h2 className="text-2xl font-semibold text-center mb-4">
              Grade level {section.grade} - {section.name}
            </h2>

            <div className="flex justify-around mb-4">
              <p><strong>Name of Adviser:</strong> {section.adviser}</p>
              <p><strong>Number Students:</strong> {section.students.length}</p>
              <p><strong>Number of Request Dropouts:</strong> 0</p> {/* Placeholder for dropout requests */}
            </div>

            {/* Table Layout */}
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
                      <td className="px-4 py-2 border">
                        <Link
                          to={`/student/${student.id}`} // Define the route with student ID
                          className="text-blue-500 hover:underline"
                        >
                          {student.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-2 border">{student.lrn}</td>
                      <td className="px-4 py-2 border">{student.sex}</td>
                      <td className="px-4 py-2 border">{student.age}</td>
                      <td className="px-4 py-2 border">{student.birthdate}</td>
                      <td className="px-4 py-2 border text-center">
                        <button className="text-blue-500 hover:underline">Details</button>
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
    </div>
  );
};

export default Grades;
