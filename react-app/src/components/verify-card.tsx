import React, { useState } from "react";

const VerifyCard: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      // Handle file upload and verification logic here
      console.log("File submitted:", selectedFile);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Verify Card Authenticity</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4"
        />
        {preview && (
          <div className="mb-4">
            <img src={preview} alt="Preview" className="w-full h-auto rounded-lg" />
          </div>
        )}
        <button
          onClick={handleSubmit}
          className="w-full py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 transition"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default VerifyCard;

