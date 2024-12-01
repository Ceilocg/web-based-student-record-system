import React, { useState, useEffect } from 'react';
import { submitEnrollmentForm } from '../Enrollment/enrollmentHandler';
import StudentList from './students';
import { doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebaseConfig";

interface FormData {
  schoolYear: string;
  gradeLevel: string;
  psaBirthCertNo: string;
  lrn: string;
  lastName: string;
  firstName: string;
  middleName: string;
  extensionName: string;
  birthdate: string;
  sex: string;
  age: string;
  placeOfBirth: string;
  motherTongue: string;
  ip: boolean;
  ipCommunity: string;
  is4ps: boolean;
  household4psId: string;
  hasDisability: boolean;
  disabilityType: string[];
  currentHouseNo: string;
  currentStreet: string;
  currentBarangay: string;
  currentMunicipality: string;
  currentProvince: string;
  currentCountry: string;
  currentZipCode: string;
  sameAsCurrentAddress: boolean;
  permanentHouseNo: string;
  permanentStreet: string;
  permanentBarangay: string;
  permanentMunicipality: string;
  permanentProvince: string;
  permanentCountry: string;
  permanentZipCode: string;
  fatherLastName: string;
  fatherFirstName: string;
  fatherMiddleName: string;
  motherLastName: string;
  motherFirstName: string;
  motherMiddleName: string;
  guardianLastName: string;
  guardianFirstName: string;
  guardianMiddleName: string;
}

const initialFormData: FormData = {
  schoolYear: '',
  gradeLevel: '',
  psaBirthCertNo: '',
  lrn: '',
  lastName: '',
  firstName: '',
  middleName: '',
  extensionName: '',
  birthdate: '',
  sex: '',
  age: '',
  placeOfBirth: '',
  motherTongue: '',
  ip: false,
  ipCommunity: '',
  is4ps: false,
  household4psId: '',
  hasDisability: false,
  disabilityType: [],
  currentHouseNo: '',
  currentStreet: '',
  currentBarangay: '',
  currentMunicipality: '',
  currentProvince: '',
  currentCountry: '',
  currentZipCode: '',
  sameAsCurrentAddress: false,
  permanentHouseNo: '',
  permanentStreet: '',
  permanentBarangay: '',
  permanentMunicipality: '',
  permanentProvince: '',
  permanentCountry: '',
  permanentZipCode: '',
  fatherLastName: '',
  fatherFirstName: '',
  fatherMiddleName: '',
  motherLastName: '',
  motherFirstName: '',
  motherMiddleName: '',
  guardianLastName: '',
  guardianFirstName: '',
  guardianMiddleName: '',
};

export default function EnrollmentForm() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const fetchUserRole = async (userId: string) => {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      setCurrentUserRole(userData.role);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserRole(user.uid);
      } else {
        setCurrentUserRole(null);
      }
    });
  }, []);

  useEffect(() => {
    if (formData.sameAsCurrentAddress) {
      setFormData(prev => ({
        ...prev,
        permanentHouseNo: prev.currentHouseNo,
        permanentStreet: prev.currentStreet,
        permanentBarangay: prev.currentBarangay,
        permanentMunicipality: prev.currentMunicipality,
        permanentProvince: prev.currentProvince,
        permanentCountry: prev.currentCountry,
        permanentZipCode: prev.currentZipCode,
      }));
    }
  }, [formData.sameAsCurrentAddress, formData.currentHouseNo, formData.currentStreet, formData.currentBarangay, formData.currentMunicipality, formData.currentProvince, formData.currentCountry, formData.currentZipCode]);

  if (currentUserRole === 'Adviser') {
    return null;  // Hide the form for advisers
  }

  useEffect(() => {
    // Calculate the current school year
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const schoolYear = `${currentYear}-${nextYear}`;

    // Set the school year in the form data
    setFormData((prevData) => ({
      ...prevData,
      schoolYear,
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
  
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  
    // Clear error when field is changed
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: undefined,
    }));
  };

  const handleMultiSelect = (name: keyof FormData, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
        ? [...(prev[name] as string[]), value]
        : (prev[name] as string[]).filter((item: string) => item !== value)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    let isValid = true;
  
    // Required fields validation
    if (!formData.gradeLevel) {
      newErrors.gradeLevel = 'Grade level is required';
      isValid = false;
    }
    if (!formData.psaBirthCertNo) {
      newErrors.psaBirthCertNo = 'PSA Birth Certificate No. is required';
      isValid = false;
    }
    if (!formData.lrn) {
      newErrors.lrn = 'LRN is required';
      isValid = false;
    } else if (!/^\d{12}$/.test(formData.lrn)) {
      newErrors.lrn = 'LRN must be exactly 12 digits';
      isValid = false;
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }
    if (!formData.birthdate) {
      newErrors.birthdate = 'Birthdate is required';
      isValid = false;
    }
    if (!formData.sex) {
      newErrors.sex = 'Sex is required';
      isValid = false;
    }
    if (!formData.age) {
      newErrors.age = 'Age is required';
      isValid = false;
    }
  
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const result = await submitEnrollmentForm(formData);
        if (result.success) {
          alert('Form submitted successfully!');
          setFormData(initialFormData);
        } else {
          alert(`Error submitting form: ${result.error}`);
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error submitting form. Please try again.');
      }
    } else {
      alert('Please correct the errors in the form.');
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement CSV parsing and form population logic
      console.log('CSV file selected:', file.name);
      alert('CSV upload functionality not implemented yet.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6 p-6 bg-gray-100 min-h-screen">
      {/* Enrollment Form */}
      <form onSubmit={handleSubmit} className="w-full lg:w-1/2 space-y-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gray-600 text-white py-4 px-6">
            <h1 className="text-2xl font-bold text-center">Enrollment Form</h1>
          </div>
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="schoolYear"
                  value={formData.schoolYear}
                  onChange={handleChange}
                  placeholder="School Year"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Grade Level</option>
                  {[7, 8, 9, 10, 11, 12].map((grade) => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Learner Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Learner Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="psaBirthCertNo"
                  value={formData.psaBirthCertNo}
                  onChange={handleChange}
                  placeholder="PSA Birth Certificate No."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="lrn"
                  value={formData.lrn}
                  onChange={handleChange}
                  placeholder="Learner Reference No. (LRN)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={12}
                  pattern="\d{12}"
                  title="LRN must be exactly 12 digits"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Middle Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                name="extensionName"
                value={formData.extensionName}
                onChange={handleChange}
                placeholder="Extension Name (e.g. Jr., III)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Age"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                name="placeOfBirth"
                value={formData.placeOfBirth}
                onChange={handleChange}
                placeholder="Place of Birth (Municipality/City)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="motherTongue"
                value={formData.motherTongue}
                onChange={handleChange}
                placeholder="Mother Tongue"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="ip"
                    checked={formData.ip}
                    onChange={handleChange}
                    className="mr-2 form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Belonging to Indigenous Peoples (IP) Community/Indigenous Cultural Community</span>
                </label>
                {formData.ip && (
                  <input
                    type="text"
                    name="ipCommunity"
                    value={formData.ipCommunity}
                    onChange={handleChange}
                    placeholder="Specify IP Community"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is4ps"
                    checked={formData.is4ps}
                    onChange={handleChange}
                    className="mr-2 form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Is your family a beneficiary of 4Ps?</span>
                </label>
                {formData.is4ps && (
                  <input
                    type="text"
                    name="household4psId"
                    value={formData.household4psId}
                    onChange={handleChange}
                    placeholder="4Ps Household ID Number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasDisability"
                    checked={formData.hasDisability}
                    onChange={handleChange}
                    className="mr-2 form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Is the child a Learner with Disability?</span>
                </label>
                {formData.hasDisability && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      'Visual Impairment', 'Hearing Impairment', 'Autism Spectrum Disorder',
                      'Learning Disability', 'Intellectual Disability', 'Speech/Language Disorder',
                      'Emotional-Behavioral Disorder', 'Orthopedic/Physical Handicap',
                      'Cerebral Palsy', 'Special Health Problem/Chronic Disease', 'Multiple Disorder'
                    ].map((disability) => (
                      <label key={disability} className="flex items-center">
                        <input
                          type="checkbox"
                          name="disabilityType"
                          value={disability}
                          checked={formData.disabilityType.includes(disability)}
                          onChange={(e) => handleMultiSelect('disabilityType', disability, e.target.checked)}
                          className="mr-2 form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{disability}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Address Information</h2>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Current Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    name="currentHouseNo"
                    value={formData.currentHouseNo}
                    onChange={handleChange}
                    placeholder="House No."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="currentStreet"
                    value={formData.currentStreet}
                    onChange={handleChange}
                    placeholder="Street Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="currentBarangay"
                    value={formData.currentBarangay}
                    onChange={handleChange}
                    placeholder="Barangay"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="currentMunicipality"
                    value={formData.currentMunicipality}
                    onChange={handleChange}
                    placeholder="Municipality/City"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="currentProvince"
                    value={formData.currentProvince}
                    onChange={handleChange}
                    placeholder="Province"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="currentCountry"
                    value={formData.currentCountry}
                    onChange={handleChange}
                    placeholder="Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    name="currentZipCode"
                    value={formData.currentZipCode}
                    onChange={handleChange}
                    placeholder="Zip Code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Permanent Address</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="sameAsCurrentAddress"
                    checked={formData.sameAsCurrentAddress}
                    onChange={handleChange}
                    className="mr-2 form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Same as Current Address</span>
                </label>
                {!formData.sameAsCurrentAddress && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      name="permanentHouseNo"
                      value={formData.permanentHouseNo}
                      onChange={handleChange}
                      placeholder="House No."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="permanentStreet"
                      value={formData.permanentStreet}
                      onChange={handleChange}
                      placeholder="Street Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="permanentBarangay"
                      value={formData.permanentBarangay}
                      onChange={handleChange}
                      placeholder="Barangay"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="permanentMunicipality"
                      value={formData.permanentMunicipality}
                      onChange={handleChange}
                      placeholder="Municipality/City"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="permanentProvince"
                      value={formData.permanentProvince}
                      onChange={handleChange}
                      placeholder="Province"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="permanentCountry"
                      value={formData.permanentCountry}
                      onChange={handleChange}
                      placeholder="Country"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      name="permanentZipCode"
                      value={formData.permanentZipCode}
                      onChange={handleChange}
                      placeholder="Zip Code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Parent's/Guardian's Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Parent's/Guardian's Information</h2>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Father's Name</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="fatherLastName"
                    value={formData.fatherLastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="fatherFirstName"
                    value={formData.fatherFirstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="fatherMiddleName"
                    value={formData.fatherMiddleName}
                    onChange={handleChange}
                    placeholder="Middle Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Mother's Maiden Name</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="motherLastName"
                    value={formData.motherLastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="motherFirstName"
                    value={formData.motherFirstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="motherMiddleName"
                    value={formData.motherMiddleName}
                    onChange={handleChange}
                    placeholder="Middle Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Legal Guardian's Name</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="guardianLastName"
                    value={formData.guardianLastName}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="guardianFirstName"
                    value={formData.guardianFirstName}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="guardianMiddleName"
                    value={formData.guardianMiddleName}
                    onChange={handleChange}
                    placeholder="Middle Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300"
              >
                Submit Enrollment Form
              </button>
              <label className="w-full sm:w-auto bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-300 cursor-pointer text-center">
                Upload CSV File
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </form>

      {/* Student List */}
      <div className="w-full lg:w-1/2">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gray-600 text-white py-4 px-6">
            <h2 className="text-2xl text-center font-bold">Student List</h2>
          </div>
          <div className="p-6">
            <StudentList />
          </div>
        </div>
      </div>
    </div>
  );
}

