import React, { useState, useEffect } from 'react';
import { submitEnrollmentForm } from '../Enrollment/enrollmentHandler';
import StudentList from './students';
import { doc,  getDoc } from "firebase/firestore";
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
    <div className="flex space-x-6">
      {/* Enrollment Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl w-1/2 p-6 space-y-8">
        <h1 className="text-3xl font-bold text-center mb-6"> Enrollment Form</h1>
      {/* Basic Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
        <input
        type="text"
        name="schoolYear"
        value={formData.schoolYear}
        onChange={handleChange}
        placeholder="School Year"
        className="border p-2 rounded"
        readOnly // Make the input read-only
      />
          <select
            name="gradeLevel"
            value={formData.gradeLevel}
            onChange={handleChange}
            className="border p-2 rounded"
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
        <h2 className="text-xl font-semibold">Learner Information</h2>
        <input
          type="text"
          name="psaBirthCertNo"
          value={formData.psaBirthCertNo}
          onChange={handleChange}
          placeholder="PSA Birth Certificate No."
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="lrn"
          value={formData.lrn}
          onChange={handleChange}
          placeholder="Learner Reference No. (LRN)"
          className="w-full border p-2 rounded"
          maxLength={12}
          pattern="\d{12}"
          title="LRN must be exactly 12 digits"
        />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              className={`border p-2 rounded w-full ${errors.lastName ? 'border-red-500' : ''}`}
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
              className={`border p-2 rounded w-full ${errors.firstName ? 'border-red-500' : ''}`}
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
          </div>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            placeholder="Middle Name"
            className="border p-2 rounded"
          />
        </div>
        <input
          type="text"
          name="extensionName"
          value={formData.extensionName}
          onChange={handleChange}
          placeholder="Extension Name (e.g. Jr., III)"
          className="w-full border p-2 rounded"
        />
        <div className="grid grid-cols-3 gap-4">
          <input
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <select
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            className="border p-2 rounded"
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
            className="border p-2 rounded"
          />
        </div>
        <input
          type="text"
          name="placeOfBirth"
          value={formData.placeOfBirth}
          onChange={handleChange}
          placeholder="Place of Birth (Municipality/City)"
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="motherTongue"
          value={formData.motherTongue}
          onChange={handleChange}
          placeholder="Mother Tongue"
          className="w-full border p-2 rounded"
        />
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="ip"
              checked={formData.ip}
              onChange={handleChange}
              className="mr-2"
            />
            Belonging to Indigenous Peoples (IP) Community/Indigenous Cultural Community
          </label>
          {formData.ip && (
            <input
              type="text"
              name="ipCommunity"
              value={formData.ipCommunity}
              onChange={handleChange}
              placeholder="Specify IP Community"
              className="w-full border p-2 rounded"
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
              className="mr-2"
            />
            Is your family a beneficiary of 4Ps?
          </label>
          {formData.is4ps && (
            <input
              type="text"
              name="household4psId"
              value={formData.household4psId}
              onChange={handleChange}
              placeholder="4Ps Household ID Number"
              className="w-full border p-2 rounded"
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
              className="mr-2"
            />
            Is the child a Learner with Disability?
          </label>
          {formData.hasDisability && (
            <div className="grid grid-cols-2 gap-2">
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
                    className="mr-2"
                  />
                  {disability}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Address Information</h2>
        <div className="space-y-2">
          <h3 className="font-medium">Current Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              name="currentHouseNo"
              value={formData.currentHouseNo}
              onChange={handleChange}
              placeholder="House No."
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="currentStreet"
              value={formData.currentStreet}
              onChange={handleChange}
              placeholder="Street Name"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="currentBarangay"
              value={formData.currentBarangay}
              onChange={handleChange}
              placeholder="Barangay"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="currentMunicipality"
              value={formData.currentMunicipality}
              onChange={handleChange}
              placeholder="Municipality/City"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="currentProvince"
              value={formData.currentProvince}
              onChange={handleChange}
              placeholder="Province"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="currentCountry"
              value={formData.currentCountry}
              onChange={handleChange}
              placeholder="Country"
              className="border p-2 rounded"
            />
            <input
              type="number"
              name="currentZipCode"
              value={formData.currentZipCode}
              onChange={handleChange}
              placeholder="Zip Code"
              className="border p-2 rounded"
            />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Permanent Address</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="sameAsCurrentAddress"
              checked={formData.sameAsCurrentAddress}
              onChange={handleChange}
              className="mr-2"
            />
            Same as Current Address
          </label>
          {!formData.sameAsCurrentAddress && (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                name="permanentHouseNo"
                value={formData.permanentHouseNo}
                onChange={handleChange}
                placeholder="House No."
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="permanentStreet"
                value={formData.permanentStreet}
                onChange={handleChange}
                placeholder="Street Name"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="permanentBarangay"
                value={formData.permanentBarangay}
                onChange={handleChange}
                placeholder="Barangay"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="permanentMunicipality"
                value={formData.permanentMunicipality}
                onChange={handleChange}
                placeholder="Municipality/City"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="permanentProvince"
                value={formData.permanentProvince}
                onChange={handleChange}
                placeholder="Province"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="permanentCountry"
                value={formData.permanentCountry}
                onChange={handleChange}
                placeholder="Country"
                className="border p-2 rounded"
              />
              <input
                type="number"
                name="permanentZipCode"
                value={formData.permanentZipCode}
                onChange={handleChange}
                placeholder="Zip Code"
                className="border p-2 rounded"
              />
            </div>
          )}
        </div>
      </div>

      {/* Parent's/Guardian's Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Parent's/Guardian's Information</h2>
        <div className="space-y-2">
          <h3 className="font-medium">Father's Name</h3>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              name="fatherLastName"
              value={formData.fatherLastName}
              onChange={handleChange}
              placeholder="Last Name"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="fatherFirstName"
              value={formData.fatherFirstName}
              onChange={handleChange}
              placeholder="First Name"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="fatherMiddleName"
              value={formData.fatherMiddleName}
              onChange={handleChange}
              placeholder="Middle Name"
              className="border p-2 rounded"
            />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Mother's Maiden Name</h3>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              name="motherLastName"
              value={formData.motherLastName}
              onChange={handleChange}
              placeholder="Last Name"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="motherFirstName"
              value={formData.motherFirstName}
              onChange={handleChange}
              placeholder="First Name"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="motherMiddleName"
              value={formData.motherMiddleName}
              onChange={handleChange}
              placeholder="Middle Name"
              className="border p-2 rounded"
            />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Legal Guardian's Name</h3>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              name="guardianLastName"
              value={formData.guardianLastName}
              onChange={handleChange}
              placeholder="Last Name"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="guardianFirstName"
              value={formData.guardianFirstName}
              onChange={handleChange}
              placeholder="First Name"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="guardianMiddleName"
              value={formData.guardianMiddleName}
              onChange={handleChange}
              placeholder="Middle Name"
              className="border p-2 rounded"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
          Submit Enrollment Form
        </button>
        <label className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 cursor-pointer">
          Upload CSV File
          <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
        </label>
      </div>
    </form>
    {/* Student List */}
    <div className="w-1/2 p-6 space-y-8">
        <StudentList />
      </div>
    </div>
  );
}