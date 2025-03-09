import React, { useState } from "react";
import axios from "axios";
import pokemonSpinner from "../assets/pokeballloading.gif";
import { getAccessToken } from "../services/auth-service";

interface UploadResponse {
  message: string;
  card_id: number;
  image_url: string;
}

const UploadCard: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardName, setCardName] = useState<string>("");
  const [cardQuality, setCardQuality] = useState<string>("MINT");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !cardName) {
      setError("Please select a file and enter a card name");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('card_name', cardName);
    formData.append('card_quality', cardQuality);
    formData.append('image', selectedFile);

    try {
      console.log('Uploading card with data:', {
        cardName,
        cardQuality,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });

      const token = getAccessToken();
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await axios.post<UploadResponse>(
        'http://127.0.0.1:8000/entry/card-entry/create',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          timeout: 10000,
          validateStatus: (status) => {
            return status >= 200 && status < 300;
          }
        }
      );

      console.log('Upload response:', response.data);

      if (response.data && response.data.card_id) {
        setSuccessMessage(`Card uploaded successfully. Your Card ID is ${response.data.card_id}.`);
        // Reset form
        setSelectedFile(null);
        setCardName("");
        setPreviewUrl(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        console.error('Error response data:', err.response.data);
        
        if (err.response.status === 404) {
          setError("Upload endpoint not found. Please check the server configuration.");
        } else if (err.response.status === 401) {
          setError("Authentication failed. Please check your login status.");
        } else {
          setError(err.response.data.detail || "Failed to upload card");
        }
      } else if (err.request) {
        console.error('No response received. Request details:', err.request);
        setError("No response from server. Please check if the server is running.");
      } else {
        console.error('Error setting up request:', err.message);
        setError("Failed to upload card. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Upload Your Card</h2>
        
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
                <span>Uploading...</span>
              </div>
            ) : (
              'Upload Card'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadCard;

