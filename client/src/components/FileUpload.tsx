import { useState } from "react";

interface FileUploadState {
  file: File | null;
  isUploaded: boolean;
  uploadedFileId: string | null;
}

const FileUpload = () => {
  const [state, setState] = useState<FileUploadState>({
    file: null,
    isUploaded: false,
    uploadedFileId: null,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setState({
        file: event.target.files[0],
        isUploaded: false,
        uploadedFileId: null,
      });
    }
  };

  const handleUpload = async () => {
    if (!state.file) return;

    try {
      const formData = new FormData();
      formData.append("file", state.file);
      await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("File uploaded:", state.file);
      setState((prev) => ({ ...prev, isUploaded: true }));
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleAnonymize = async () => {
    if (!state.uploadedFileId) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/anonymize/${state.uploadedFileId}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();
      console.log("File anonymized:", data);
    } catch (error) {
      console.error("Anonymization error:", error);
    }
  };
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upload File</h2>
      <div className="mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <div className="space-x-4">
        <button
          onClick={handleUpload}
          disabled={!state.file}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Upload
        </button>
        <button
          onClick={handleAnonymize}
          disabled={!state.isUploaded}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Anonymize
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
