import { useState, useEffect } from 'react';
import { collection, getDocs, } from 'firebase/firestore';
import { db } from '../../firebaseConfig';



export default function Component() {
  const [learningAreas, setLearningAreas] = useState<string[]>([]);

  const coreValues = [
    {
      name: "1. Maka-Diyos",
      behavior: "Expresses one's spiritual beliefs while respecting the spiritual beliefs of others"
    },
    {
      name: "2. Makatao",
      behavior: "Is sensitive to individual, social, and cultural differences"
    },
    {
      name: "3. Maka-kalikasan",
      behavior: "Cares for the environment and utilizes resources wisely, judiciously, and economically"
    },
    {
      name: "4. Makabansa",
      behavior: "Demonstrates pride in being a Filipino; exercises the rights and responsibilities of a Filipino citizen"
    }
  ];


    useEffect(() => {
      const fetchSubjects = async () => {
        try {
          const sectionsRef = collection(db, 'sections');
          const sectionsSnapshot = await getDocs(sectionsRef);
  
          // Assuming each document in "sections" contains a "subjects" field as an array
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
  
    const calculateFinalGrade = () => {
      // Placeholder logic: Implement the final grade calculation logic here
      return null; // Replace null with dynamic grade calculation
    };
  
    return (
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="border rounded shadow p-4">
          <h2 className="text-lg font-bold mb-4">REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</h2>
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 p-2 w-1/3">Learning Areas</th>
                <th className="border border-gray-200 p-2 text-center">Quarter 1</th>
                <th className="border border-gray-200 p-2 text-center">Quarter 2</th>
                <th className="border border-gray-200 p-2 text-center">Quarter 3</th>
                <th className="border border-gray-200 p-2 text-center">Quarter 4</th>
                <th className="border border-gray-200 p-2 text-center">Final Grade</th>
                <th className="border border-gray-200 p-2 text-center">Remarks</th>
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
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.value.length > 2) {
                            target.value = target.value.slice(0, 3); // Trim to 2 digits
                          }
                        }}
                      />
                    </td>
                  ))}
                  <td className="border border-gray-200 p-2 text-center">
                    {calculateFinalGrade() || "-"}
                  </td>
                  <td className="border border-gray-200 p-2 text-center">
                    <input
                      type="number"
                      className="w-full text-center"
                      min="0"
                      max="9"
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.value.length > 1) {
                          target.value = target.value.slice(0, 1); // Trim to 2 digits
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} className="border border-gray-200 p-2 font-bold text-right">
                  General Average
                </td>
                <td className="border border-gray-200 p-2 text-center">
                  {calculateFinalGrade() || "-"}
                </td>
                <td className="border border-gray-200 p-2"></td>
              </tr>
            </tbody>
          </table>
  

      </div>

      <div className="border rounded shadow p-4">
        <h2 className="text-lg font-bold mb-4">REPORT ON LEARNER'S OBSERVED VALUES</h2>
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 p-2 w-1/4">Core Values</th>
              <th className="border border-gray-200 p-2 w-1/2">Behavior Statements</th>
              <th className="border border-gray-200 p-2 text-center">Quarter 1</th>
              <th className="border border-gray-200 p-2 text-center">Quarter 2</th>
              <th className="border border-gray-200 p-2 text-center">Quarter 3</th>
              <th className="border border-gray-200 p-2 text-center">Quarter 4</th>
            </tr>
          </thead>
          <tbody>
            {coreValues.map((value) => (
              <tr key={value.name}>
                <td className="border border-gray-200 p-2">{value.name}</td>
                <td className="border border-gray-200 p-2">{value.behavior}</td>
                {[1, 2, 3, 4].map((i) => (
                  <td key={i} className="border border-gray-200 p-2 text-center"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded shadow p-4">
          <h3 className="text-sm font-bold mb-2">Descriptors</h3>
          <table className="w-full border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="border border-gray-200 p-2">Outstanding</td>
                <td className="border border-gray-200 p-2">90 - 100</td>
                <td className="border border-gray-200 p-2">Passed</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2">Very Satisfactory</td>
                <td className="border border-gray-200 p-2">85 - 89</td>
                <td className="border border-gray-200 p-2">Passed</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2">Satisfactory</td>
                <td className="border border-gray-200 p-2">80 - 84</td>
                <td className="border border-gray-200 p-2">Passed</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2">Fairly Satisfactory</td>
                <td className="border border-gray-200 p-2">75 - 79</td>
                <td className="border border-gray-200 p-2">Passed</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2">Did Not Meet Expectations</td>
                <td className="border border-gray-200 p-2">Below 75</td>
                <td className="border border-gray-200 p-2">Failed</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border rounded shadow p-4">
          <h3 className="text-sm font-bold mb-2">Marking</h3>
          <table className="w-full border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="border border-gray-200 p-2">AO</td>
                <td className="border border-gray-200 p-2">Always Observed</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2">SO</td>
                <td className="border border-gray-200 p-2">Sometimes Observed</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2">RO</td>
                <td className="border border-gray-200 p-2">Rarely Observed</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-2">NO</td>
                <td className="border border-gray-200 p-2">Not Observed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
