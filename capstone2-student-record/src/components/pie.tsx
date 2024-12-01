import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the import based on your project setup

// Register necessary components for the Doughnut chart
ChartJS.register(ArcElement, Tooltip, Legend);

// Define the type of your Firestore document
interface EnrollmentForm {
  gradeLevel: string;
  status: string;
  sex: string;
}

const DoughnutChart: React.FC = () => {
  const [gradeLevelCounts, setGradeLevelCounts] = useState<{ [key: string]: { male: number; female: number } }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Detect dark mode
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Color palette for light and dark modes
  const colors = {
    light: {
      male: ['#8ECAE6', '#219EBC', '#023047', '#FFB703', '#FB8500', '#E63946', '#457B9D'], // Softer palette
      female: ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF'],
    },
    dark: {
      male: ['#90E0EF', '#0077B6', '#023E8A', '#FFB703', '#FB8500', '#D62828', '#1D3557'], // Muted for dark mode
      female: ['#F94144', '#F3722C', '#F9C74F', '#90BE6D', '#43AA8B', '#577590', '#8ECAE6'],
    },
  };

  const currentColors = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const q = query(collection(db, 'enrollmentForms'));
        const querySnapshot = await getDocs(q);

        const gradeLevels = ['7', '8', '9', '10', '11', '12'];
        const initialCounts = gradeLevels.reduce((acc, grade) => {
          acc[grade] = { male: 0, female: 0 };
          return acc;
        }, {} as { [key: string]: { male: number; female: number } });

        querySnapshot.forEach((doc) => {
          const data = doc.data() as EnrollmentForm;
          const gradeLevel = data.gradeLevel;
          const sex = data.sex?.toLowerCase();
          const status = data.status;

          if (status !== 'Dropout') {
            if (sex === 'male' || sex === 'female') {
              if (gradeLevels.includes(gradeLevel)) {
                initialCounts[gradeLevel][sex]++;
              }
            }
          }
        });

        setGradeLevelCounts(initialCounts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const totalMaleCount = Object.values(gradeLevelCounts).reduce((acc, grade) => acc + (grade.male || 0), 0);
  const totalFemaleCount = Object.values(gradeLevelCounts).reduce((acc, grade) => acc + (grade.female || 0), 0);

  const data = {
    labels: [
      'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
      'Overall Male', 'Overall Female',
    ],
    datasets: [
      {
        label: 'Male Counts',
        data: [...Object.keys(gradeLevelCounts).map((grade) => gradeLevelCounts[grade]?.male || 0), totalMaleCount],
        backgroundColor: currentColors.male,
        borderColor: currentColors.male.map((color) => `${color}99`), // Softer borders
        borderWidth: 1,
      },
      {
        label: 'Female Counts',
        data: [...Object.keys(gradeLevelCounts).map((grade) => gradeLevelCounts[grade]?.female || 0), totalFemaleCount],
        backgroundColor: currentColors.female,
        borderColor: currentColors.female.map((color) => `${color}99`), // Softer borders
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        enabled: true,
      },
    },
    cutout: '50%',
  };

  return (
    <div className="w-full h-auto flex flex-col items-center">
      <h2 className={`text-xl font-semibold mb-4 text-center ${isDarkMode ? 'text-white-200' : 'text-gray-800'}`}>
        Enrollment Breakdown by Grade Level and Gender
      </h2>
      <div className="w-full h-80 sm:h-96 md:h-112 flex items-center justify-center">
        {isLoading ? (
          <p className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>Loading...</p>
        ) : (
          <Doughnut data={data} options={options} />
        )}
      </div>
    </div>
  );
};

export default DoughnutChart;
