import React, { useState } from "react";
import { verifyCard, VerificationResult } from "../services/cardVerification";
import pokemonSpinner from "../assets/pokeballloading.gif";

const VerifyCard: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size too large. Please upload an image under 5MB.");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image file.");
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const verificationResult = await verifyCard(selectedFile);
      setResult(verificationResult);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex items-center justify-center p-4">

      <div className="flex gap-6 w-full max-w-5xl justify-center">
        {/* Upload Card Box */}
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 font-roboto">Card Verification</h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Card Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          {result && (
            <div className={`mb-6 p-4 rounded-lg ${result.isAuthentic ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <h3 className="font-bold text-lg mb-2">
                {result.isAuthentic ? 'Card is Authentic' : 'Card is Not Authentic'}
              </h3>
              <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
              <p>{result.message}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedFile}
            className={`w-full py-2 font-bold text-white transition
              ${isLoading || !selectedFile 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
            style={{ borderRadius: "100px" }}
          > 
            {isLoading ? (
              <span className="flex items-center justify-center">
                <img 
                  src={pokemonSpinner} 
                  alt="Loading..." 
                  style={{ width: "10px", height: "10px" }} 
                />
                Verifying...
              </span>
            ) : 'Verify Card'}
          </button>

          {selectedFile && (
            <button
              onClick={handleRemove}
              className="w-full mt-4 py-2 text-red-600 font-bold border-2 border-red-600 hover:bg-red-50 transition"
              style={{ borderRadius: "100px" }}
            >
              Remove Card
            </button>
          )}
        </div>

        {/* Preview Box */}
        {preview && (
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 font-roboto">Card Preview</h1>
            <img src={preview} alt="Preview" className="w-full h-auto rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCard;

