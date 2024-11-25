import React, { useState, useEffect } from "react";
import { ref, getDownloadURL, uploadBytesResumable, listAll } from "firebase/storage";
import { storage, db } from "../firebaseConfig";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { TextField, Button, Card, CardHeader, CardContent, Typography, IconButton } from "@mui/material";
import { Download,UploadCloud, Search } from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface FileData {
  name: string;
  url: string;
}

interface TemplateSection {
  title: string;
  folder: string;
  items: FileData[];
}

export default function FormTemplates() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({
    "Grade 7-10 ECR Templates": null,
    "Class Record": null,
    "School Form": null,
    "Senior High Class Record Templates": null,
  });
  const [fileNames, setFileNames] = useState<{ [key: string]: string }>({
    "Grade 7-10 ECR Templates": "",
    "Class Record": "",
    "School Form": "",
    "Senior High Class Record Templates": "",
  });
  const [templateSections, setTemplateSections] = useState<TemplateSection[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchFilesFromFirebase = async () => {
    const sections: TemplateSection[] = [
      {
        title: "Grade 7-10 ECR Templates",
        folder: "templates/Grade 7-10 ECR Templates/",
        items: [],
      },
      {
        title: "Class Record",
        folder: "templates/Class Record/",
        items: [],
      },
      {
        title: "School Form",
        folder: "templates/School Form/",
        items: [],
      },
      {
        title: "Senior High Class Record Templates",
        folder: "templates/Senior High Class Record Templates/",
        items: [],
      },
    ];

    for (const section of sections) {
      const folderRef = ref(storage, section.folder);
      const res = await listAll(folderRef);

      const sectionItems = await Promise.all(
        res.items.map(async (itemRef) => {
          const downloadURL = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            url: downloadURL,
          };
        })
      );

      section.items = sectionItems;
    }

    setTemplateSections(sections);
  };

  useEffect(() => {
    fetchFilesFromFirebase();
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionTitle: string
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => ({
        ...prev,
        [sectionTitle]: files[0],
      }));
    }
  };

  const handleFileNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionTitle: string
  ) => {
    setFileNames((prev) => ({
      ...prev,
      [sectionTitle]: e.target.value,
    }));
  };

  const handleUpload = async (sectionTitle: string) => {
    const selectedFile = selectedFiles[sectionTitle];
    const newFileName = fileNames[sectionTitle] || selectedFile?.name;

    if (!selectedFile || !newFileName) {
      console.log("No file or file name specified for section:", sectionTitle);
      return;
    }

    console.log("Uploading file:", newFileName);

    const storageRef = ref(storage, `templates/${sectionTitle}/${newFileName}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done for ${sectionTitle}`);
        setUploadProgress((prev) => ({
          ...prev,
          [sectionTitle]: progress,
        }));
      },
      (error) => {
        console.error("Upload failed:", error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("File uploaded successfully. Download URL:", downloadURL);

          const fileData: FileData = {
            name: newFileName,
            url: downloadURL,
          };

          await setDoc(doc(db, "templates", `${sectionTitle}-${newFileName}`), fileData);
          console.log("File metadata saved to Firestore.");

          fetchFilesFromFirebase();
          setUploadProgress((prev) => ({
            ...prev,
            [sectionTitle]: 0,
          }));
        } catch (error) {
          console.error("Error saving file metadata:", error);
        }
      }
    );
  };

  const filteredSections = templateSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

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

  return (
    <div className="min-h-screen bg-gray-800 p-8">
      <Card className="max-w-4xl mx-auto shadow-xl rounded-lg">
        <CardHeader
          title="Templates"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center"
          titleTypographyProps={{ variant: "h3", fontWeight: "bold" }}
        />
        <CardContent className="p-6 space-y-6">
          {/* Search Bar */}
          <div className="flex justify-end mb-4">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton>
                    <Search />
                  </IconButton>
                ),
              }}
            />
          </div>

          {/* Template Sections */}
          {filteredSections.map((section, index) => (
            <div key={index} className="mb-8 last:mb-0">
              <Typography variant="h5" className="text-indigo-700 font-semibold">
                {section.title}
              </Typography>

              {/* File Upload Section */}
<div className="mb-4">
  <div className="flex flex-col space-y-2">
    {currentUserRole === "Admin" ? (
      <>
        {/* File input */}
        <TextField
          type="file"
          inputProps={{ accept: ".xlsx, .xls" }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFileChange(e, section.title)
          }
        />

        {/* New file name input */}
        <TextField
          fullWidth
          placeholder="New file name (optional)"
          variant="outlined"
          value={fileNames[section.title] || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFileNameChange(e, section.title)
          }
        />

        {/* Upload button */}
        <Button
          variant="contained"
          onClick={() => handleUpload(section.title)}
          disabled={!selectedFiles[section.title]}
          startIcon={<UploadCloud className="mr-2 h-4 w-4" />}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
        >
          Upload
        </Button>

        {/* Upload progress */}
        {uploadProgress[section.title] > 0 && (
          <p className="text-indigo-600">
            Upload Progress: {uploadProgress[section.title]}%
          </p>
        )}
      </>
    ) : (
      <p className="text-red-600"></p>
    )}
  </div>
</div>


              {/* Display uploaded files in this section */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="grid grid-cols-2 items-center font-semibold px-6 py-3 bg-gray-100">
                  <span className="text-gray-700">Template Name</span>
                  <span className="text-right text-gray-700">Action</span>
                </div>
                {section.items.length > 0 ? (
                  section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`grid grid-cols-2 items-center px-6 py-4 ${
                        itemIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-indigo-100 transition duration-150 ease-in-out`}
                    >
                      <span className="text-gray-800 font-medium">{item.name}</span>
                      <div className="text-right">
                        <Button
                          variant="outlined"
                          onClick={() => window.open(item.url, "_blank")}
                          startIcon={<Download className="mr-2 h-4 w-4" />}
                          className="border-indigo-500 text-indigo-500 hover:bg-indigo-50"
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-4 text-gray-500 italic">No templates found</div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
