import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";

interface AnonymizedFileData {
  id: string;
  originalName: string;
  anonymizedName: string;
  content: string;
}

const AnonymizedFileView = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<AnonymizedFileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnonymizedFile = async () => {
      try {
        setLoading(true);

        // First, get the file metadata
        const fileResponse = await fetch(
          `http://localhost:3000/api/files/${id}`
        );

        if (!fileResponse.ok) {
          throw new Error("Failed to fetch file details");
        }

        const fileData = await fileResponse.json();

        if (!fileData.anonymizedName) {
          throw new Error("This file has not been anonymized yet");
        }

        // Then, get the anonymized content
        const contentResponse = await fetch(
          `http://localhost:3000/api/anonymized-content/${id}`
        );

        if (!contentResponse.ok) {
          const errorData = await contentResponse.json();
          throw new Error(
            errorData.message || "Failed to fetch anonymized content"
          );
        }

        const contentData = await contentResponse.json();

        setFile({
          id: fileData.id,
          originalName: fileData.originalName,
          anonymizedName: fileData.anonymizedName,
          content: contentData.content,
        });
      } catch (error) {
        console.error("Error fetching anonymized file:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        toast.error(
          `Error: ${
            error instanceof Error
              ? error.message
              : "Failed to load anonymized file"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnonymizedFile();
  }, [id]);

  if (loading) {
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Anonymized File</h2>
          <Link to="/files" className="text-blue-500 hover:underline">
            Back to Files
          </Link>
        </div>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Anonymized File</h2>
        <Link to="/files" className="text-blue-500 hover:underline">
          Back to Files
        </Link>
      </div>

      {file && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-medium">
              Original File: {file.originalName}
            </h3>
            <p className="text-gray-600">
              Anonymized as: {file.anonymizedName}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Anonymized Content:</h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {file.content || "No content available"}
            </div>
          </div>

          <div className="mt-4 p-3 rounded bg-yellow-50 text-yellow-700">
            <p className="text-sm">
              <strong>Note:</strong> All sensitive information has been
              anonymized in this view.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnonymizedFileView;
