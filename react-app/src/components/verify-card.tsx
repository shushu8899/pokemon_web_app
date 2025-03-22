import React, { useState } from "react";
import axios from "axios";
import pokemonSpinner from "../assets/pokeballloading.gif";
import { getAuthorizationHeader } from "../services/auth-service";
import { API_BASE_URL } from '../config';
import { useNavigate } from "react-router-dom";

interface UploadResponse {
  message: string;
  card_id: number;
  image_url: string;
}

interface VerificationResult {
    success: boolean;
    message: string;
    details: any;
}

const UploadCard: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardName, setCardName] = useState<string>("");
  const [cardQuality, setCardQuality] = useState<string>("MINT");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMessage(null);
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
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setVerificationResult(null);
    setSuccessMessage(null);

    const formData = new FormData();
    if (selectedFile) {
      formData.append("file", selectedFile);
    }
    formData.append("card_name", cardName);
    formData.append("card_quality", cardQuality);

    try {
      const authHeader = getAuthorizationHeader();
      if (!authHeader) {
        throw new Error('You must be logged in to verify cards');
      }

      // Step 1: Upload and verify the card
      console.log('Sending verification request...');
      const response = await axios.post<UploadResponse>(
        `${API_BASE_URL}/entry/card-entry/unvalidated`,
        formData,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Upload response:', response.data);
      const cardId = response.data.card_id;

      // Step 2: Verify the card
      const verifyResponse = await axios.post(
        `${API_BASE_URL}/verification/verify-card/${cardId}`,
        {},
        {
          headers: {
            'Authorization': authHeader,
          },
        }
      );

      console.log('Verification response:', verifyResponse.data);

      // Check if the card is validated based on the is_validated flag
      if (verifyResponse.data.is_validated) {
        // For authenticated cards, redirect to My Cards page
        setIsLoading(false);
        setShowResults(false);
        setVerificationResult(null);
        navigate('/my-cards');
      } else {
        // For fake cards, show the modal
        setVerificationResult({
          success: false,
          message: verifyResponse.data.message || "Card verification failed",
          details: { card_id: cardId }
        });
        setShowResults(true);
        setIsLoading(false);
      }

    } catch (error: any) {
      console.error("Error verifying card:", error);
      const errorMessage = error.response?.data?.detail || "Verification failed. Please check your card details and try again.";
      setError(errorMessage);
      setVerificationResult({
        success: false,
        message: errorMessage,
        details: error.response?.data || {}
      });
      setShowResults(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6 text-center" style={{ fontFamily: "Roboto" }}>Verify Card</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Name Input */}
          <div>
            <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">
              Card Name
            </label>
            <input
              type="text"
              id="cardName"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Card Quality Select */}
          <div>
            <label htmlFor="cardQuality" className="block text-sm font-medium text-gray-700">
              Card Quality
            </label>
            <select
              id="cardQuality"
              value={cardQuality}
              onChange={(e) => setCardQuality(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="MINT">Mint</option>
              <option value="NEAR_MINT">Near Mint</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="LIGHT_PLAYED">Light Played</option>
              <option value="PLAYED">Played</option>
              <option value="POOR">Poor</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Card Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {previewUrl && (
                  <div className="mb-4">
                    <img
                      src={previewUrl}
                      alt="Card preview"
                      className="mx-auto h-48 w-auto object-contain"
                    />
                  </div>
                )}
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileSelect}
                      accept="image/*"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex justify-center">
                <p className="text-[8px] font-light text-green-800 text-center">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Verification Result: {verificationResult.message}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !selectedFile}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading || !selectedFile
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <img src={pokemonSpinner} alt="Loading..." className="w-5 h-5 mr-2" />
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify Card'
            )}
          </button>
        </form>
      </div>

      {/* Verification Results Modal */}
      {showResults && verificationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className={`text-xl font-bold mb-4 text-center ${verificationResult.success ? 'text-green-600' : 'text-red-600'}`}>
              Verification Result
            </h3>
            <div className="mb-4">
              <p className={`text-lg font-medium text-center ${verificationResult.success ? 'text-gray-800' : 'text-red-600'}`}>
                {verificationResult.message}
              </p>
              {verificationResult.success && verificationResult.details && verificationResult.details.card_id && (
                <p className="mt-2 text-sm text-gray-600 text-center">
                  Card ID: {verificationResult.details.card_id}
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  setShowResults(false);
                  if (verificationResult.success) {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setCardName("");
                  }
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadCard;

