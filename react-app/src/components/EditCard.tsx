import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from "axios";
import pokemonSpinner from "../assets/pokeballloading.gif";
import { getAuthorizationHeader } from "../services/auth-service";
import { getPresignedUrl, uploadToS3 } from "../services/card-service";

interface CardDetails {
    card_name: string;
    card_quality: string;
    image_url: string;
}

const EditCard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const cardId = location.state?.cardId;
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cardName, setCardName] = useState("");
    const [cardQuality, setCardQuality] = useState("");
    const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);

    useEffect(() => {
        if (!cardId) {
            setError('No card ID provided');
            setIsLoading(false);
            return;
        }

        const fetchCardDetails = async () => {
            try {
                const authHeader = getAuthorizationHeader();
                if (!authHeader) {
                    throw new Error('You must be logged in to edit cards');
                }

                const response = await axios.get(
                    `http://127.0.0.1:8000/entry/card-entry/${cardId}`,
                    {
                        headers: {
                            'Authorization': authHeader
                        }
                    }
                );
                setCardDetails(response.data);
                setCardName(response.data.card_name);
                setCardQuality(response.data.card_quality);
                setPreviewUrl(response.data.image_url.startsWith('http') 
                    ? response.data.image_url 
                    : `http://127.0.0.1:8000${response.data.image_url}`);
                setIsLoading(false);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to fetch card details');
                setIsLoading(false);
            }
        };

        fetchCardDetails();
    }, [cardId]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
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
        setError(null);

        try {
            const authHeader = getAuthorizationHeader();
            if (!authHeader) {
                throw new Error('You must be logged in to edit cards');
            }

            let s3ImageUrl = null;
            if (selectedFile) {
                const { upload_url, s3_url } = await getPresignedUrl(selectedFile, authHeader);
        
                await uploadToS3(selectedFile, upload_url);
        
                s3ImageUrl = s3_url;
            }

            const formData = new FormData();
            formData.append('card_name', cardName);
            formData.append('card_quality', cardQuality);
            formData.append('card_id', cardId.toString());
            if (s3ImageUrl) {
                formData.append("image_url", s3ImageUrl);
              }

            await axios.put(
                `http://127.0.0.1:8000/entry/card-entry/update`,
                formData,
                {
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            navigate('/my-cards');
        } catch (err: any) {
            console.error('Error updating card:', err);
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Failed to update card');
            }
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <img src={pokemonSpinner} alt="Loading..." className="w-16 h-16" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-600 text-center">
                    <p className="text-xl font-bold">Error</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
                <h1 className="text-3xl font-bold mb-6 text-center" style={{ fontFamily: "Roboto" }}>Edit Card</h1>
                
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
                            required
                        >
                            <option value="">Select quality...</option>
                            <option value="Mint">Mint</option>
                            <option value="Near Mint">Near Mint</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Light Played">Light Played</option>
                            <option value="Played">Played</option>
                            <option value="Poor">Poor</option>
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
                                        <span>Upload a new image</span>
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

                    {/* Submit and Cancel Buttons */}
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <img src={pokemonSpinner} alt="Loading..." className="w-5 h-5 mr-2" />
                                    <span>Updating...</span>
                                </div>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/my-cards')}
                            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCard; 