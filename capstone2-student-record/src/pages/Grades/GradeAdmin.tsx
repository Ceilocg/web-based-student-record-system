import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const GradeAdmin: React.FC = () => {
  const [sections, setSections] = useState<{ name: string; students: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllSections = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all sections from Firestore
        const sectionsRef = collection(db, 'sections');
        const sectionsSnapshot = await getDocs(sectionsRef);

        // Extract section names and student lists
        const fetchedSections = sectionsSnapshot.docs.map(doc => ({
          name: doc.data().name,
          students: doc.data().students || [], // Ensure students field exists
        }));

        setSections(fetchedSections);
      } catch (err) {
        console.error("Error fetching sections:", err);
        setError("An error occurred while fetching sections.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllSections();
  }, []);

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
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Sections</h2>
      {sections.length > 0 ? (
        sections.map((section, index) => (
          <div key={index} className="mb-4">
            <h3 className="text-xl font-bold text-gray-700">{section.name}</h3>
            <ul className="list-disc list-inside text-gray-600">
              {section.students.map((student, idx) => (
                <li key={idx}>{student}</li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p className="text-gray-600 text-center">No sections found.</p>
      )}
    </div>
  );
};

export default GradeAdmin;
