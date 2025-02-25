import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface FileRecord {
  id: string;
  originalName: string;
  anonymizedName: string | null;
  textExtracted: boolean;
}

const FileList = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(
    new Set()
  );
  const [actionStatus, setActionStatus] = useState<{
    id: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  // For Ollama text anonymization
  const [wordToAnonymize, setWordToAnonymize] = useState<string>("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  // For tracking background jobs
  const [backgroundJobs, setBackgroundJobs] = useState<Map<string, string>>(
    new Map()
  );

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/api/files");
        const data = await response.json();

        // Check if any pending jobs have completed
        const currentFiles = files;
        const newFiles = data;

        // Check for completed text extractions
        if (currentFiles.length > 0) {
          for (const newFile of newFiles) {
            const oldFile = currentFiles.find((f) => f.id === newFile.id);
            if (oldFile && !oldFile.textExtracted && newFile.textExtracted) {
              // Text extraction completed
              toast.success(
                `Text extraction completed for ${newFile.originalName}`,
                {
                  toastId: `extract-${newFile.id}`,
                }
              );
              // Remove from tracking
              if (backgroundJobs.has(`extract-${newFile.id}`)) {
                setBackgroundJobs((prev) => {
                  const updated = new Map(prev);
                  updated.delete(`extract-${newFile.id}`);
                  return updated;
                });
              }
            }

            // Check for completed anonymizations
            if (oldFile && !oldFile.anonymizedName && newFile.anonymizedName) {
              toast.success(
                `Anonymization completed for ${newFile.originalName}`,
                {
                  toastId: `anon-${newFile.id}`,
                }
              );
              // Remove from tracking
              if (backgroundJobs.has(`anon-${newFile.id}`)) {
                setBackgroundJobs((prev) => {
                  const updated = new Map(prev);
                  updated.delete(`anon-${newFile.id}`);
                  return updated;
                });
              }
            }
          }
        }

        setFiles(data);
      } catch (error) {
        console.error("Error fetching files:", error);
        toast.error("Failed to fetch files list");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();

    // Set up regular polling for background jobs
    const interval = setInterval(() => {
      if (backgroundJobs.size > 0) {
        fetchFiles();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [backgroundJobs]);

  const handleAIAnonymize = async (fileId: string) => {
    if (!wordToAnonymize.trim()) {
      toast.error("Please enter a word to anonymize");
      wordInputRef.current?.focus();
      return;
    }

    try {
      // Add file to processing state
      setProcessingFiles((prev) => new Set(prev).add(fileId));
      setSelectedFileId(null);

      toast.info(`Starting AI anonymization of word "${wordToAnonymize}"...`, {
        autoClose: 2000,
      });

      const response = await fetch(
        `http://localhost:3000/api/anonymized/${fileId}?word=${encodeURIComponent(
          wordToAnonymize
        )}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process anonymization");
      }

      const data = await response.json();

      console.log("data: ", data);
      toast.success(
        `AI anonymization completed: "${wordToAnonymize}" redacted`
      );

      // Clear the word input
      setWordToAnonymize("");

      // Refresh file list to show the updated anonymization status
      refreshFileList();
    } catch (error) {
      console.error("AI Anonymization error:", error);
      toast.error(
        `Anonymization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Remove file from processing state
      setProcessingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const handleExtractText = async (fileId: string) => {
    try {
      // Add file to processing state
      setProcessingFiles((prev) => new Set(prev).add(fileId));

      const response = await fetch(
        `http://localhost:3000/api/extract-text/${fileId}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start text extraction");
      }

      const data = await response.json();

      console.log("Text extraction started:", data);
      // Create a toast for starting the process
      toast.info(
        `Text extraction started for file ${
          files.find((f) => f.id === fileId)?.originalName
        }`,
        {
          autoClose: 2000,
        }
      );

      // Add to background jobs tracking
      setBackgroundJobs((prev) => {
        const updated = new Map(prev);
        updated.set(`extract-${fileId}`, "processing");
        return updated;
      });

      // Update file in list with processing status
      setActionStatus({
        id: fileId,
        message: "Text extraction started",
        type: "success",
      });

      // Refresh file list after a short delay
      setTimeout(() => {
        refreshFileList();
        // Clear status message after a few seconds
        setTimeout(() => setActionStatus(null), 3000);
      }, 1000);
    } catch (error) {
      console.error("Error starting text extraction:", error);
      toast.error(`Failed to start text extraction: ${error}`);
      setActionStatus({
        id: fileId,
        message: "Failed to start text extraction",
        type: "error",
      });
    } finally {
      // Remove file from processing state
      setProcessingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const handleAnonymize = async (fileId: string) => {
    try {
      // Add file to processing state
      setProcessingFiles((prev) => new Set(prev).add(fileId));

      const response = await fetch(
        `http://localhost:3000/api/anonymize/${fileId}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to anonymize file");
      }

      const data = await response.json();

      console.log("Anonymization started:", data);
      // Create a toast for starting the process
      toast.info(
        `Anonymization started for file ${
          files.find((f) => f.id === fileId)?.originalName
        }`,
        {
          autoClose: 2000,
        }
      );

      // Add to background jobs tracking
      setBackgroundJobs((prev) => {
        const updated = new Map(prev);
        updated.set(`anon-${fileId}`, "processing");
        return updated;
      });

      // Update file in list
      setActionStatus({
        id: fileId,
        message: "File anonymization started",
        type: "success",
      });

      // Refresh file list after a short delay
      setTimeout(() => {
        refreshFileList();
        // Clear status message after a few seconds
        setTimeout(() => setActionStatus(null), 3000);
      }, 1000);
    } catch (error) {
      console.error("Anonymization error:", error);
      toast.error(`Failed to anonymize file: ${error}`);
      setActionStatus({
        id: fileId,
        message: "Failed to anonymize file",
        type: "error",
      });
    } finally {
      // Remove file from processing state
      setProcessingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const refreshFileList = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/files");
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Error refreshing files:", error);
      toast.error("Failed to refresh files list");
    }
  };

  const viewExtractedText = (fileId: string) => {
    navigate(`/files/${fileId}`);
  };

  const viewAnonymizedFile = (fileId: string) => {
    navigate(`/files/${fileId}/anonymized`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Uploaded Files</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Uploaded Files</h2>
        <p className="text-gray-500">No files uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Uploaded Files</h2>
        <button
          onClick={refreshFileList}
          className="bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* AI Anonymization input field */}
      {selectedFileId && (
        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h3 className="font-medium mb-2">AI Anonymization</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              ref={wordInputRef}
              value={wordToAnonymize}
              onChange={(e) => setWordToAnonymize(e.target.value)}
              placeholder="Enter word to anonymize"
              className="border rounded p-2 flex-grow"
              autoFocus
            />
            <button
              onClick={() => handleAIAnonymize(selectedFileId)}
              disabled={
                processingFiles.has(selectedFileId) || !wordToAnonymize.trim()
              }
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {processingFiles.has(selectedFileId) ? (
                <span className="flex items-center">
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
                  Processing...
                </span>
              ) : (
                "Anonymize with AI"
              )}
            </button>
            <button
              onClick={() => setSelectedFileId(null)}
              className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Original Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Anonymized
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Text Extracted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr
                key={file.id}
                className={
                  actionStatus?.id === file.id
                    ? actionStatus.type === "success"
                      ? "bg-green-50"
                      : "bg-red-50"
                    : selectedFileId === file.id
                    ? "bg-blue-50"
                    : ""
                }
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.originalName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.anonymizedName ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Yes
                    </span>
                  ) : backgroundJobs.has(`anon-${file.id}`) ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Processing
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.textExtracted ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Yes
                    </span>
                  ) : backgroundJobs.has(`extract-${file.id}`) ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Processing
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex">
                  {/* AI Anonymize button - only visible if text is extracted */}
                  {file.textExtracted && !file.anonymizedName && (
                    <button
                      onClick={() => setSelectedFileId(file.id)}
                      disabled={processingFiles.has(file.id)}
                      className="text-white bg-indigo-500 px-2 py-1 rounded text-xs hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      AI Anonymize
                    </button>
                  )}

                  {/* Standard Anonymize button - only visible if text is extracted */}
                  {file.textExtracted && !file.anonymizedName && (
                    <button
                      onClick={() => handleAnonymize(file.id)}
                      disabled={
                        processingFiles.has(file.id) ||
                        backgroundJobs.has(`anon-${file.id}`)
                      }
                      className="text-white bg-green-500 px-2 py-1 rounded text-xs hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {processingFiles.has(file.id) ||
                      backgroundJobs.has(`anon-${file.id}`) ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
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
                          Processing...
                        </span>
                      ) : (
                        "Anonymize"
                      )}
                    </button>
                  )}

                  {/* Text Extraction button or View Text button */}
                  {file.textExtracted ? (
                    <button
                      onClick={() => viewExtractedText(file.id)}
                      className="text-white bg-blue-500 px-2 py-1 rounded text-xs hover:bg-blue-600"
                    >
                      View Text
                    </button>
                  ) : (
                    <button
                      onClick={() => handleExtractText(file.id)}
                      disabled={
                        processingFiles.has(file.id) ||
                        backgroundJobs.has(`extract-${file.id}`)
                      }
                      className="text-white bg-purple-500 px-2 py-1 rounded text-xs hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {processingFiles.has(file.id) ||
                      backgroundJobs.has(`extract-${file.id}`) ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
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
                          Processing...
                        </span>
                      ) : (
                        "Extract Text"
                      )}
                    </button>
                  )}

                  {/* View Anonymized File button */}
                  {file.anonymizedName && (
                    <button
                      onClick={() => viewAnonymizedFile(file.id)}
                      className="text-white bg-teal-500 px-2 py-1 rounded text-xs hover:bg-teal-600"
                    >
                      View Anonymized
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {actionStatus && (
        <div
          className={`mt-4 p-3 rounded ${
            actionStatus.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {actionStatus.message}
        </div>
      )}
    </div>
  );
};

export default FileList;
