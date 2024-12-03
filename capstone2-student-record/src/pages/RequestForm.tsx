import React, { useState, useRef } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { submitFormRequest } from './requestHandler'; // Import Firestore submission handler
import { Timestamp } from 'firebase/firestore'; // For Firestore's timestamp

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const RequestForm: React.FC = () => {
  const [depedForm, setDepedForm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState(''); // New field for Middle Initial
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState(''); // New field for Suffix
  const [lrn, setLrn] = useState(''); // LRN as string to handle precision issues
  const [contactNumber, setContactNumber] = useState(''); // Contact number as string to handle precision issues
  const [email, setEmail] = useState('');
  const [strand, setStrand] = useState('');
  const [yearGraduated, setYearGraduated] = useState('');
  const [gradeLevel, setGradeLevel] = useState(''); // New state for grade level
  const [track, setTrack] = useState('');
  const [tvlSubOption, setTvlSubOption] = useState(''); // Add state for TVL sub-options
  const [showTVLSubOptions, setShowTVLSubOptions] = useState(false); // Control TVL options visibility
  const [error, setError] = useState(''); // Error state for validation messages
  const [openSnackbar, setOpenSnackbar] = useState(false); // Control snackbar visibility
  const [greeting, setGreeting] = useState(''); // State for greeting message
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    navigate(-1);
  };

  const resetForm = () => {
    setDepedForm('');
    setFirstName('');
    setMiddleInitial(''); // Reset middle initial
    setLastName('');
    setSuffix(''); // Reset suffix
    setLrn('');
    setContactNumber('');
    setEmail('');
    setStrand('');
    setYearGraduated('');
    setTrack('');
    setTvlSubOption(''); // Reset TVL sub-option
    setGradeLevel(''); // Reset grade level
    setGreeting(''); // Reset greeting message
  };

  const validateForm = () => {
    // Validate if all required fields are filled
    if (!depedForm) {
      setError('Please select a request certificate.');
      setOpenSnackbar(true);
      return false;
    }

    if (!firstName || !lastName) {
      setError('First Name and Last Name are required.');
      setOpenSnackbar(true);
      return false;
    }

    if (!lrn || !/^\d{12}$/.test(lrn)) {
      setError('LRN must consist of 12 digits.');
      setOpenSnackbar(true);
      return false;
    }

    if (!contactNumber || !/^(09|\+639)\d{9}$/.test(contactNumber)) {
      setError('Contact number must be a valid Philippine number (09XXXXXXXXX or +639XXXXXXXXX).');
      setOpenSnackbar(true);
      return false;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      setOpenSnackbar(true);
      return false;
    }

    // Validate Strand and Sub-options (if necessary)
    if (!strand) {
      setError('Please select a strand.');
      setOpenSnackbar(true);
      return false;
    }

    if (strand === 'TVL' && !tvlSubOption) {
      setError('Please select a TVL sub-option.');
      setOpenSnackbar(true);
      return false;
    }

    // Validate Year Graduated or Grade Level based on depedForm selection
    if (depedForm !== 'Form 138' && depedForm !== 'Certificate of Enrollment') {
      if (!yearGraduated) {
        setError('Please select the school year you graduated.');
        setOpenSnackbar(true);
        return false;
      }
    } else {
      if (!gradeLevel) {
        setError('Please select a grade level.');
        setOpenSnackbar(true);
        return false;
      }
    }

    return true;
  };

  const handleGradeLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGradeLevel = e.target.value;
    setGradeLevel(selectedGradeLevel);
  
    // Hide Strand/Track for Grade 7-10
    if (['7', '8', '9', '10'].includes(selectedGradeLevel)) {
      setStrand(''); // Reset strand
      setTrack(''); // Reset track
      setTvlSubOption(''); // Reset TVL options
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before proceeding
    const isValid = validateForm();
    if (!isValid) return; // Stop if validation fails

    // Create formData object conditionally based on visible fields
    const formData: any = {
      depedForm,
      firstName,
      middleInitial, // Include middle initial (even if blank)
      lastName,
      suffix, // Include suffix (even if blank)
      lrn,
      contactNumber,
      email,
      strand,
      timestamp: Timestamp.now(), // Use Firestore Timestamp for consistency
    };

    // Conditionally add yearGraduated or gradeLevel based on depedForm
    if (depedForm !== 'Form 138' && depedForm !== 'Certificate of Enrollment') {
      if (yearGraduated) {
        formData.yearGraduated = yearGraduated; // Include yearGraduated if applicable
      }
    } else {
      if (gradeLevel) {
        formData.gradeLevel = gradeLevel; // Include gradeLevel if applicable
      }
    }

    // Add track and tvlSubOption if they are selected
    if (track) {
      formData.track = track;
    }
    if (tvlSubOption) {
      formData.tvlSubOption = tvlSubOption;
    }

    // Submit the form data
    await submitFormRequest(formData, resetForm, setError, setOpenSnackbar);

    // Clear the error and close the Snackbar after successful submission
    setError('');
    setOpenSnackbar(false);

    // Set the greeting message upon successful submission
    setGreeting(`Thank you, ${firstName} ${lastName}! Your request for ${depedForm} has been submitted successfully.`);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleStrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStrand = e.target.value;
    setStrand(selectedStrand);
    if (selectedStrand === 'TVL') {
      setShowTVLSubOptions(true); // Show TVL sub-options when "TVL" is selected
    } else {
      setShowTVLSubOptions(false);
      setTvlSubOption(''); // Reset TVL sub-options when another strand is selected
    }
  };

  return (
    <div
      className="flex items-center justify-center h-screen"
      style={{
        backgroundImage: 'url("https://i.ibb.co/SdYsqpn/382103576-748388327301878-8681280576890683558-n.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      <div
        ref={formRef}
        className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full overflow-auto"
        style={{
          position: 'relative',
          zIndex: 1,
          opacity: 0.9,
          paddingTop: '60px',
          paddingBottom: '20px',
          maxHeight: '90vh',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <IconButton onClick={handleBack} style={{ color: 'white' }}>
          <ArrowBackIcon />
        </IconButton>

        {/* Display the greeting message at the top */}
        {greeting && (
          <div className="mb-4 text-white text-center">
            {greeting}
          </div>
        )}

        <h2 className="text-2xl mb-4 text-white text-center">Request a Form</h2>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <label htmlFor="depedForm" className="text-white">Select Request Certificate</label>
            <select
              id="depedForm"
              value={depedForm}
              onChange={(e) => setDepedForm(e.target.value)}
              className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
            >
              <option value="">-- Select Request Certificate --</option>
              <option value="Form 137">Form 137</option>
              <option value="Form 138">Form 138</option>
              <option value="Good Moral">Good Moral</option>
              <option value="Certificate of Enrollment">Certificate of Enrollment</option>
              <option value="Diploma">Diploma</option>
              <option value="Completion">Certificate of Completion</option>
            </select>
          </div>

          {depedForm && (
            <>
              <div className="mb-4">
                <label htmlFor="firstName" className="text-white">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="middleInitial" className="text-white">Middle Initial (Optional)</label>
                <input
                  id="middleInitial"
                  type="text"
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value)}
                  className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                  placeholder="e.g., F."
                  maxLength={2} // Limit to 2 characters
                />
              </div>

              <div className="mb-4">
                <label htmlFor="lastName" className="text-white">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="suffix" className="text-white">Suffix (Optional)</label>
                <input
                  id="suffix"
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                  placeholder="e.g., Jr., Sr., III"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="lrn" className="text-white">LRN</label>
                <input
                  id="lrn"
                  type="text"
                  value={lrn}
                  onChange={(e) => setLrn(e.target.value)}
                  className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                  required
                  minLength={12}
                  maxLength={12}
                  placeholder="12-digit LRN"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="contactNumber" className="text-white">Contact Number</label>
                <input
                  id="contactNumber"
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                  required
                  pattern="^(09|\+639)\d{9}$"
                  placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="text-white">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                  required
                />
              </div>
              {['11', '12'].includes(gradeLevel) && (
              <>
              
            <div className="mb-4">
              <label htmlFor="strand" className="text-white">Strand</label>
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

          {showTVLSubOptions && (
              <div className="mb-4">
                <label htmlFor="tvlSubOption" className="text-white">TVL Sub-Option</label>
                     <select
                        id="tvlSubOption"
                        value={tvlSubOption}
                        onChange={(e) => setTvlSubOption(e.target.value)}
                        className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                       >
                       <option value="">-- Select TVL Sub-Option --</option>
                       <option value="CSS">Computer Systems Servicing (CSS)</option>
                       <option value="Cookery">Cookery</option>
                       </select>
                       </div>
                      )}
                     </>
                    )}


              {showTVLSubOptions && (
                <div className="mb-4">
                  <label htmlFor="tvlSubOption" className="text-white">TVL Sub-Option</label>
                  <select
                    id="tvlSubOption"
                    value={tvlSubOption}
                    onChange={(e) => setTvlSubOption(e.target.value)}
                    className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                  >
                    <option value="">-- Select TVL Sub-Option --</option>
                    <option value="CSS">Computer Systems Servicing (CSS)</option>
                    <option value="Cookery">Cookery</option>
                  </select>
                </div>
              )}

              {/* Conditionally render School Year Graduated or Grade Level based on depedForm */}
              {(depedForm !== 'Form 138' && depedForm !== 'Certificate of Enrollment') && (
                <div className="mb-4">
                  <label htmlFor="yearGraduated" className="text-white">School Year Graduated</label>
                  <select
                    id="yearGraduated"
                    value={yearGraduated}
                    onChange={(e) => setYearGraduated(e.target.value)}
                    className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                  >
                    <option value="">-- Select School Year --</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2023-2024">2023-2024</option>
                    <option value="2022-2023">2022-2023</option>
                    <option value="2021-2022">2021-2022</option>
                    <option value="2020-2021">2020-2021</option>
                    <option value="2019-2020">2019-2020</option>
                    <option value="2018-2019">2018-2019</option>
                    <option value="2017-2018">2017-2018</option>
                  </select>
                </div>
              )}

<div className="mb-4">
  <label htmlFor="gradeLevel" className="text-white">Grade Level</label>
  <select
    id="gradeLevel"
    value={gradeLevel}
    onChange={handleGradeLevelChange} // Use the updated change handler
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


              <button type="submit" className="w-full bg-blue-500 p-2 text-white rounded hover:bg-blue-600 transition">
                Submit Request
              </button>
            </>
          )}
        </form>

        {/* Snackbar for error handling */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000} // Snackbar will automatically hide after 6 seconds
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default RequestForm;
