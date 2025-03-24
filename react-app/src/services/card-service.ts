import api from './api';

export interface UnvalidatedCard {
  CardID: number;
  CardName: string;
  CardQuality: string;
  ImageURL: string;
  IsValidated: boolean;
  OwnerID: number;
}

export const getUnvalidatedCards = async (): Promise<UnvalidatedCard[]> => {
  try {
    const response = await api.get('/entry/card-entry/unvalidated');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching unvalidated cards:', error);
    throw error;
  }
};

export const verifyCard = async (cardId: number, pokemonTcgId: string): Promise<{ message: string; card_id: number; is_validated: boolean }> => {
  try {
    const formData = new FormData();
    formData.append('pokemon_tcg_id', pokemonTcgId);
    
    const response = await api.post(`/verification/verify-card/${cardId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error verifying card:', error);
    throw error;
  }
}; 

export const getPresignedUrl = async (file: File, authHeader: string) => {
  const response = await fetch("http://127.0.0.1:8000/entry/generate-presigned-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader, 
    },
    body: JSON.stringify({ filename: file.name }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get pre-signed URL: ${response.statusText}`);
  }

  const data = await response.json();
  return data; // { upload_url, s3_url }
};


export const uploadToS3 = async (file: File, uploadUrl: string) => {
  let retries = 3;

  while (retries > 0) {
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { 
          "Content-Type": decodeURIComponent(file.type),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to upload to S3: ${response.statusText}`);
      }

      return; 
    } catch (error) {
      console.error(`Upload failed. Retries left: ${retries - 1}`, error);
      retries -= 1;
      if (retries === 0) throw error; // After 3 failed attempts, throw the error
    }
  }
};