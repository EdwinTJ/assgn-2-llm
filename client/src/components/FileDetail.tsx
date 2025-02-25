import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";

interface FileData {
  id: string;
  originalName: string;
  textExtracted: boolean;
  extractedText: string | null;
}

const FileDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<string>("");
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [toastId, setToastId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/extracted-text/${id}`
        );

        if (response.status === 202) {
          // Text extraction is still in progress
          const data = await response.json();
          setExtractionStatus(data.message);

          // Show or update toast for background process
          if (!isPolling) {
            // First time polling, create a toast
            const id = toast.info("Text extraction in progress...", {
              autoClose: false,
              closeButton: false,
            });
            setToastId(id.toString());
            setIsPolling(true);
          } else {
            // Update existing toast
            if (toastId) {
              toast.update(toastId, {
                render: "Text extraction in progress...",
                autoClose: false,
              });
            }
          }

          // Poll again after 2 seconds
          setTimeout(() => {
            setLoading(true);
          }, 2000);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch file details");
        }

        const data = await response.json();
        setFile(data);
        setExtractionStatus("");

        // If we were polling and now the job is complete, update the toast
        if (isPolling && toastId) {
          toast.update(toastId, {
            type: "success",
            render: "Text extraction completed successfully!",
            autoClose: 3000,
          });
          setIsPolling(false);
          setToastId(null);
        }
      } catch (error) {
        setError("Error fetching file details");
        console.error("Error:", error);

        // If polling was happening, update toast to show error
        if (isPolling && toastId) {
          toast.update(toastId, {
            type: "error",
            render: "Error during text extraction process",
            autoClose: 3000,
          });
          setIsPolling(false);
          setToastId(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      fetchFileDetails();
    }

    // Cleanup toasts when component unmounts
    return () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [id, loading, isPolling, toastId]);

  const startTextExtraction = async () => {
    try {
      setExtractionStatus("Starting text extraction...");

      // Show toast for starting process
      toast.info("Starting text extraction process...");

      const response = await fetch(
        `http://localhost:3000/api/extract-text/${id}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start text extraction");
      }

      const data = await response.json();
      setExtractionStatus(data.message);

      // Start polling for results
      setLoading(true);
    } catch (error) {
      setError("Error starting text extraction");
      console.error("Error:", error);
      toast.error("Failed to start text extraction process");
    }
  };

  if (loading && !file) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-500">{error}</div>
        <Link
          to="/files"
          className="text-blue-500 hover:underline mt-4 inline-block"
        >
          Back to Files
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">File Details</h2>
        <Link to="/files" className="text-blue-500 hover:underline">
          Back to Files
        </Link>
      </div>

      {file && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-medium">File: {file.originalName}</h3>
          </div>

          {!file.textExtracted && (
            <div className="mb-6">
              <button
                onClick={startTextExtraction}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Extract Text
              </button>

              {extractionStatus && (
                <p className="mt-2 text-sm text-gray-600">{extractionStatus}</p>
              )}
            </div>
          )}

          {file.textExtracted && file.extractedText && (
            <div>
              <h3 className="text-lg font-medium mb-2">Extracted Text:</h3>
              <div className="bg-gray-50 p-4 rounded border border-gray-200 max-h-96 overflow-y-auto whitespace-pre-wrap">
                {file.extractedText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileDetail;
