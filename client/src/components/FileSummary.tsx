import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";

interface FileSummaryData {
  id: string;
  originalName: string;
  summary: string;
}

const FileSummary = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<FileSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileSummary = async () => {
      try {
        setLoading(true);

        // Fetch the summary
        const response = await fetch(`http://localhost:3000/api/summary/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch summary");
        }

        const data = await response.json();

        setFile({
          id: data.id,
          originalName: data.originalName,
          summary: data.summary,
        });
      } catch (error) {
        console.error("Error fetching file summary:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        toast.error(
          `Error: ${
            error instanceof Error ? error.message : "Failed to load summary"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFileSummary();
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
          <h2 className="text-2xl font-bold">File Summary</h2>
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
        <h2 className="text-2xl font-bold">File Summary</h2>
        <Link to="/files" className="text-blue-500 hover:underline">
          Back to Files
        </Link>
      </div>

      {file && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-medium">File: {file.originalName}</h3>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Summary:</h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 prose max-w-none">
              {file.summary.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded bg-blue-50 text-blue-700">
            <p className="text-sm">
              <strong>Note:</strong> This summary was generated automatically by
              AI ;/{" "}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileSummary;
