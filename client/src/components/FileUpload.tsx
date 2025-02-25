import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface FileUploadState {
  file: File | null;
  isUploading: boolean;
  error: string | null;
}

const FileUpload = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<FileUploadState>({
    file: null,
    isUploading: false,
    error: null,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setState({
        file: event.target.files[0],
        isUploading: false,
        error: null,
      });
    }
  };

  const handleUpload = async () => {
    if (!state.file) return;

    try {
      setState((prev) => ({ ...prev, isUploading: true, error: null }));

      const formData = new FormData();
      formData.append("file", state.file);

      const response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      await response.json();

      // Show success message with toast
      toast.success(`File uploaded successfully: ${state.file.name}`, {
        position: "top-right",
        autoClose: 3000,
      });

      // Show success message briefly before redirecting
      setState((prev) => ({
        ...prev,
        isUploading: false,
      }));

      // Redirect to files list after upload
      setTimeout(() => {
        navigate("/files");
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
      setState((prev) => ({
        ...prev,
        error: "Failed to upload file. Please try again.",
        isUploading: false,
      }));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Upload File</h2>

      {state.error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {state.error}
        </div>
      )}

      <div className="mb-6">
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {state.file && (
          <p className="mt-2 text-sm text-gray-600">
            Selected file: {state.file.name} (
            {(state.file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!state.file || state.isUploading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {state.isUploading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Uploading...
          </>
        ) : (
          "Upload File"
        )}
      </button>

      {!state.isUploading &&
        state.file &&
        !state.error &&
        state.file?.type === "application/pdf" && (
          <p className="mt-4 text-sm text-gray-600">
            After uploading, you'll be redirected to the files list where you
            can extract text or anonymize your file.
          </p>
        )}
    </div>
  );
};

export default FileUpload;
