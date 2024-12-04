import React, { useState, useRef } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { submitFormRequest } from './requestHandler';
import { Timestamp } from 'firebase/firestore';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const RequestForm: React.FC = () => {
  const [depedForm, setDepedForm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [lrn, setLrn] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [strand, setStrand] = useState('');
  const [yearGraduated, setYearGraduated] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [track, setTrack] = useState('');
  const [tvlSubOption, setTvlSubOption] = useState('');
  const [showTVLSubOptions, setShowTVLSubOptions] = useState(false);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [greeting, setGreeting] = useState('');
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    navigate(-1);
  };

  const resetForm = () => {
    setDepedForm('');
    setFirstName('');
    setMiddleInitial('');
    setLastName('');
    setSuffix('');
    setLrn('');
    setContactNumber('');
    setEmail('');
    setStrand('');
    setYearGraduated('');
    setTrack('');
    setTvlSubOption('');
    setGradeLevel('');
    setGreeting('');
  };

  const validateForm = () => {
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

    if (depedForm === 'Diploma' && !strand) {
      setError('Please select a strand for Diploma.');
      setOpenSnackbar(true);
      return false;
    }

    if (depedForm === 'Good Moral' && gradeLevel !== '10' && gradeLevel !== '12') {
      setError('For Good Moral, please select either Grade 10 or Grade 12.');
      setOpenSnackbar(true);
      return false;
    }

    if (depedForm === 'Good Moral' && gradeLevel === '12' && !strand) {
      setError('Please select a strand for Grade 12 Good Moral.');
      setOpenSnackbar(true);
      return false;
    }

    if (depedForm !== 'Diploma' && depedForm !== 'Good Moral' && !gradeLevel) {
      setError('Please select a grade level.');
      setOpenSnackbar(true);
      return false;
    }

    if (strand === 'TVL' && !tvlSubOption) {
      setError('Please select a TVL sub-option.');
      setOpenSnackbar(true);
      return false;
    }

    if (depedForm !== 'Form 138' && depedForm !== 'Certificate of Enrollment' && depedForm !== 'Good Moral' && !yearGraduated) {
      setError('Please select the school year you graduated.');
      setOpenSnackbar(true);
      return false;
    }

    return true;
  };

  const handleGradeLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGradeLevel = e.target.value;
    setGradeLevel(selectedGradeLevel);
  
    if (['7', '8', '9', '10'].includes(selectedGradeLevel) || (depedForm === 'Good Moral' && selectedGradeLevel === '10')) {
      setStrand('');
      setTrack('');
      setTvlSubOption('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    const formData: any = {
      depedForm,
      firstName,
      middleInitial,
      lastName,
      suffix,
      lrn,
      contactNumber,
      email,
      timestamp: Timestamp.now(),
    };

    if (depedForm === 'Diploma' || (depedForm === 'Good Moral' && gradeLevel === '12') || (depedForm !== 'Good Moral' && !['7', '8', '9', '10'].includes(gradeLevel))) {
      formData.strand = strand;
    }

    if (depedForm !== 'Diploma') {
      formData.gradeLevel = gradeLevel;
    }

    if (depedForm !== 'Form 138' && depedForm !== 'Certificate of Enrollment' && depedForm !== 'Good Moral') {
      formData.yearGraduated = yearGraduated;
    }

    if (track) {
      formData.track = track;
    }
    if (tvlSubOption) {
      formData.tvlSubOption = tvlSubOption;
    }

    try {
      await submitFormRequest(formData, resetForm, setError, setOpenSnackbar);
      setError('');
      setOpenSnackbar(false);
      setGreeting(`Thank you, ${firstName} ${lastName}! Your request for ${depedForm} has been submitted successfully.`);
    } catch (error) {
      setError('An error occurred while submitting the form. Please try again.');
      console.error(error);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleStrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStrand = e.target.value;
    setStrand(selectedStrand);
    setShowTVLSubOptions(selectedStrand === 'TVL');
    if (selectedStrand !== 'TVL') {
      setTvlSubOption('');
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
                  maxLength={2}
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

              {(depedForm === 'Diploma' || (depedForm === 'Good Moral' && gradeLevel === '12') || (depedForm !== 'Good Moral' && !['7', '8', '9', '10'].includes(gradeLevel))) && (
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

              {(depedForm !== 'Form 138' && depedForm !== 'Certificate of Enrollment' && depedForm !== 'Good Moral') && (
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

              {depedForm !== 'Diploma' && (
                <div className="mb-4">
                  <label htmlFor="gradeLevel" className="text-white">Grade Level</label>
                  <select
                    id="gradeLevel"
                    value={gradeLevel}
                    onChange={handleGradeLevelChange}
                    className="w-full p-2 mt-2 border rounded bg-gray-700 text-white"
                  >
                    <option value="">-- Select Grade Level --</option>
                    {depedForm === 'Good Moral' ? (
                      <>
                        <option value="10">Grade 10</option>
                        <option value="12">Grade 12</option>
                      </>
                    ) : (
                      <>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <button type="submit" className="w-full bg-blue-500 p-2 text-white rounded hover:bg-blue-600 transition">
                Submit Request
              </button>
            </>
          )}
        </form>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
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

