import { useState, useEffect } from "react";

interface FileRecord {
  id: string;
  originalName: string;
  anonymizedName: string;
}

const FileList = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/files");
        const data = await response.json();
        setFiles(data);
        console.log("Files fetched:", data);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Uploaded Files</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Original Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Anonymized Name
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.originalName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.anonymizedName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileList;
