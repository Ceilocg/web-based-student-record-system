import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { FaUserGraduate } from 'react-icons/fa';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: string;
  fullName: string;
  gradeLevel: string;
}

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [updatedGradeLevel, setUpdatedGradeLevel] = useState<string>('');
  const [activeGradeFilter, setActiveGradeFilter] = useState<string | null>(null);
  const [userCounts, setUserCounts] = useState<any>({ '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0 });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [strand, setStrand] = useState<string>('');
  const [tvlSubOption, setTvlSubOption] = useState<string>('');
  const [showTVLSubOptions, setShowTVLSubOptions] = useState<boolean>(false);
  const [newSectionName, setNewSectionName] = useState<string>('');


  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentsAndUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'enrollmentForms'));
        const studentsData: Student[] = [];
  
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const fullName = `${data.firstName} ${data.middleName} ${data.lastName} ${data.extensionName || ''}`;
  
          // Only include students who do not have a section
          if (!data.section) {
            studentsData.push({
              id: doc.id,
              fullName,
              gradeLevel: data.gradeLevel,
            });
          }
        });
  
        setStudents(studentsData);
        setFilteredStudents(studentsData);
  
        const counts = studentsData.reduce((acc: any, student) => {
          acc[student.gradeLevel] = (acc[student.gradeLevel] || 0) + 1;
          return acc;
        }, { '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0 });
  
        setUserCounts(counts);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
  
    fetchStudentsAndUsers();
  }, []);
  

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setUpdatedGradeLevel(student.gradeLevel);
  };

  const handleSaveEdit = async () => {
    if (editingStudent) {
      const studentRef = doc(db, 'enrollmentForms', editingStudent.id);

      try {
        await updateDoc(studentRef, {
          gradeLevel: updatedGradeLevel,
        });
        setStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.id === editingStudent.id ? { ...student, gradeLevel: updatedGradeLevel } : student
          )
        );
        setFilteredStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.id === editingStudent.id ? { ...student, gradeLevel: updatedGradeLevel } : student
          )
        );
        setEditingStudent(null);
      } catch (error) {
        console.error('Error updating student:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  const filterByGrade = (grade: string) => {
    const filtered = students.filter((student) => student.gradeLevel === grade);
    setFilteredStudents(filtered);
    setActiveGradeFilter(grade);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  
    if (query.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter((student) =>
        student.fullName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prevSelected) => {
      if (prevSelected.includes(studentId)) {
        return prevSelected.filter((id) => id !== studentId);
      } else {
        return [...prevSelected, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((student) => student.id));
    }
  };

  const handleCreateSection = async () => {
    if (newSectionName.trim() === '') {
      alert('Please enter a section name');
      return;
    }
  
    try {
      // Create a new section document in the 'sections' collection
      const sectionRef = await addDoc(collection(db, 'sections'), {
        name: newSectionName,
        students: selectedStudents,
        grade: gradeLevel,
        strand: strand,
        tvlSubOption,
      });
  
      console.log('Section created with ID:', sectionRef.id);
      alert('New section created successfully!');
  
      const updatePromises = selectedStudents.map(async (studentId) => {
        const studentRef = doc(db, 'enrollmentForms', studentId);
      
        // Update the student document with additional fields if applicable
        await updateDoc(studentRef, {
          section: newSectionName, // Store the section name
          gradeLevel: gradeLevel,
          strand: strand || null, // Update strand if provided
          tvlSubOption: tvlSubOption || null, // Update tvlSubOption if provided
        });
      });
      
      // Wait for all student updates to complete
      await Promise.all(updatePromises);
      
      alert('Students updated with new section, strand, and TVL sub-option successfully!');
      
  
      // Clear the form after submission
      setSelectedStudents([]);
      setGradeLevel('');
      setTvlSubOption('');
      setNewSectionName('');
    } catch (error) {
      console.error("Error creating section or updating students:", error);
      alert("Error creating section or updating students");
    }
  };
  

  const handleGradeLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGrade = e.target.value;
    setGradeLevel(selectedGrade);
    if (selectedGrade === '11' || selectedGrade === '12') {
      setShowTVLSubOptions(true);
    } else {
      setShowTVLSubOptions(false);
      setStrand(''); // Reset Strand and TVL Sub-options when selecting Grade 7-10
      setTvlSubOption('');
    }
  };

  const handleStrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStrand = e.target.value;
    setStrand(selectedStrand);

    if (selectedStrand === 'TVL') {
      setShowTVLSubOptions(true);
    } else {
      setShowTVLSubOptions(false);
      setTvlSubOption('');
    }
  };

  // Function to handle creating a new section with selected students

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-semibold text-gray-800 mb-4 text-center">List of Students</h2>

      <div>
        <h3 className="text-xl font-semibold mb-2">Junior High</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {['7', '8', '9', '10'].map((grade) => (
            <button
              key={grade}
              onClick={() => filterByGrade(grade)}
              className={`flex items-center justify-center ${activeGradeFilter === grade ? 'bg-gray-250 shadow-lg' : 'bg-gray-300'} text-black px-4 py-2 rounded-md text-sm transition-transform transform duration-200 hover:scale-105 hover:bg-gray-500 focus:outline-none`}
            >
              <FaUserGraduate className="mr-2" />
              Grade {grade} ({userCounts[grade]})
            </button>
          ))}
        </div>

        <h3 className="text-xl font-semibold mb-2">Senior High</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {['11', '12'].map((grade) => (
            <button
              key={grade}
              onClick={() => filterByGrade(grade)}
              className={`flex items-center justify-center ${activeGradeFilter === grade ? 'bg-gray-250 shadow-lg' : 'bg-gray-300'} text-black px-4 py-2 rounded-md text-sm transition-transform transform duration-200 hover:scale-105 hover:bg-gray-500 focus:outline-none`}
            >
              <FaUserGraduate className="mr-2" />
              Grade {grade} ({userCounts[grade]})
            </button>
          ))}
        </div>
      </div>


<div className="mb-4 mt-6 flex flex-col sm:flex-row items-center sm:items-start sm:justify-between space-y-4 sm:space-y-0">
      
  {/* Search Box First */}
  <div className="relative sm:flex-1">
    <input
      type="text"
      value={searchQuery}
      onChange={handleSearchChange}
      placeholder="Search by Name"
      className="px-4 py-2 border rounded-md text-sm w-full sm:max-w-md "
    />
    <FaSearch
      className="absolute top-1/2 right-2 transform -translate-y-1/2 text-blue-500 cursor-pointer"
      onClick={() => handleSearchChange({ target: { value: searchQuery } } as React.ChangeEvent<HTMLInputElement>)}
    />
  </div>

  {/* Selected Students Count Second */}
  <p className="text-gray-700 text-lg sm:ml-10">Selected Students: {selectedStudents.length}</p>
</div>

      {/* Section Creation Form */}
      <div className="mb-1 mt-1 space-y-1">
      {/* First Row: Grade Level and Strand/Track Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {/* Grade Level Dropdown */}
        <div className="mb-2">
          <label htmlFor="gradeLevel" className="text-black">Grade Level</label>
          <select
            id="gradeLevel"
            value={gradeLevel}
            onChange={handleGradeLevelChange}
            className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
          >
            <option value="">-- Select Grade Level --</option>
            <option value="7">Grade 7</option>
            <option value="8">Grade 8</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>

        {/* Strand/Track Dropdown (for Grade 11 and 12) */}
        {(gradeLevel === '11' || gradeLevel === '12') && (
          <div className="mb-2">
            <label htmlFor="strand" className="text-black">Strand/Track</label>
            <select
              id="strand"
              value={strand}
              onChange={handleStrandChange}
              className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
            >
              <option value="">-- Select Strand or Track --</option>
              <option value="ABM">Accountancy, Business, and Management (ABM)</option>
              <option value="GAS">General Academic Strand (GAS)</option>
              <option value="HUMSS">Humanities and Social Sciences (HUMSS)</option>
              <option value="STEM">Science, Technology, Engineering, and Mathematics (STEM)</option>
              <option value="TVL">Technical Vocational Livelihood</option>
            </select>
          </div>
        )}
      </div>

      {/* TVL Sub-Option Dropdown (only shown if "TVL" strand is selected) */}
      {showTVLSubOptions && (
        <div className="mb-1">
          <label htmlFor="tvlSubOption" className="text-black">TVL Sub-Option</label>
          <select
            id="tvlSubOption"
            value={tvlSubOption}
            onChange={(e) => setTvlSubOption(e.target.value)}
            className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
          >
            <option value="">-- Select TVL Sub-Option --</option>
            <option value="CSS">Computer Systems Servicing (CSS)</option>
            <option value="Cookery">Cookery</option>
            <option value="HE"> Home Economics (HE)  </option>
          </select>
        </div>
      )}

      {/* Second Row: Section Creation Form */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
        <div className="flex-1">
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder="Enter new section name"
            className="px-4 py-2 border rounded-md text-sm w-full sm:w-72"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleCreateSection}
            className="bg-green-500 text-white px-4 py-2 rounded-md text-sm"
          >
            Create
          </button>
          <button
            onClick={() => navigate('/sections')}
            className="bg-green-500 text-white px-4 py-2 rounded-md text-sm"
          >
            Sections
          </button>
        </div>
      </div>
    </div>

      {/* Table of Students */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-100 text-left text-sm text-gray-600">
              <th className="px-4 py-2 border-b">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === filteredStudents.length}
                  onChange={handleSelectAll}
                  className="form-checkbox"
                />
              </th>
              <th className="px-4 py-2 border-b">Full Name</th>
              <th className="px-4 py-2 border-b">Grade Level</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr
                key={student.id}
                className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
              >
                <td className="px-4 py-2 border-b">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleSelectStudent(student.id)}
                    className="form-checkbox"
                  />
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-700">{student.fullName}</td>
                <td className="px-4 py-2 border-b text-sm text-gray-700">
                  {editingStudent && editingStudent.id === student.id ? (
                    <input
                      type="text"
                      value={updatedGradeLevel}
                      onChange={(e) => setUpdatedGradeLevel(e.target.value)}
                      className="px-2 py-1 border rounded-md text-sm"
                    />
                  ) : (
                    student.gradeLevel
                  )}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-700">
                  {editingStudent && editingStudent.id === student.id ? (
                    <div className="space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditClick(student)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default StudentList;
