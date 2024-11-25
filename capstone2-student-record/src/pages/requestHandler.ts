import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the import path based on your project structure

// Type definition for formData
interface FormData {
  depedForm?: string;
  firstName?: string;
  middleInitial?: string;  // Add middleInitial field to the type
  lastName?: string;
  suffix?: string;         // Add suffix field to the type
  lrn?: string;
  contactNumber?: string;
  email?: string;
  strand?: string;
  yearGraduated?: string;
  gradeLevel?: string;
  track?: string;
  tvlSubOption?: string;
  [key: string]: any; // Allow additional fields
}

// The function to submit the form request to Firestore
export const submitFormRequest = async (
  formData: FormData, // Strong typing helps catch errors early
  resetForm: () => void,
  setError: (error: string) => void,
  setOpenSnackbar: (open: boolean) => void
) => {
  try {
    // Define a complete formData object with default "N/A" values for missing fields
    const formRequest = {
      depedForm: formData.depedForm || 'N/A',
      firstName: formData.firstName || 'N/A',
      middleInitial: formData.middleInitial || 'N/A',  // Include middle initial
      lastName: formData.lastName || 'N/A',
      suffix: formData.suffix || 'N/A',  // Include suffix
      lrn: formData.lrn || 'N/A',
      contactNumber: formData.contactNumber || 'N/A',
      email: formData.email || 'N/A',
      strand: formData.strand || 'N/A',
      yearGraduated: formData.yearGraduated || 'N/A',
      gradeLevel: formData.gradeLevel || 'N/A',
      track: formData.track || 'N/A',
      tvlSubOption: formData.tvlSubOption || 'N/A',
      status: 'pending',  // Ensure the request status is set to 'pending'
      timestamp: Timestamp.now(),  // Use Firestore's Timestamp for consistency
    };

    // Add the form request to the 'form_requests' collection in Firestore
    await addDoc(collection(db, 'form_requests'), formRequest);

    console.log('Form submitted successfully!');
    resetForm();  // Reset the form fields after successful submission
    setOpenSnackbar(true);  // Open the Snackbar for success feedback (optional if you want to show a success message)

  } catch (error) {
    console.error('Error submitting the form: ', error);
    // Handle any errors during submission
    setError('Error submitting the form: ' + (error instanceof Error ? error.message : error));
    setOpenSnackbar(true);  // Open the Snackbar with the error message
  }
};
