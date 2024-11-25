import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

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

interface SubmissionResult {
  success: boolean;
  error?: string;
}

export async function submitEnrollmentForm(formData: FormData): Promise<SubmissionResult> {
  try {
    const enrollmentFormsCollection = collection(db, 'enrollmentForms');
    const docRef = await addDoc(enrollmentFormsCollection, formData);
    console.log('Document written with ID: ', docRef.id);
    return { success: true };
  } catch (error) {
    console.error('Error adding document: ', error);
    return { success: false, error: (error as Error).message };
  }
}