import axios from 'axios';
import { getAuthorizationHeader } from './auth-service';

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
    const authHeader = getAuthorizationHeader();
    if (!authHeader) {
      throw new Error('You must be logged in to view unvalidated cards');
    }

    const response = await axios.get(
      'http://127.0.0.1:8000/entry/card-entry/unvalidated',
      {
        headers: {
          'Authorization': authHeader
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching unvalidated cards:', error);
    throw error;
  }
};

export const verifyCard = async (cardId: number): Promise<{ message: string; card_id: number; is_validated: boolean }> => {
  try {
    const authHeader = getAuthorizationHeader();
    if (!authHeader) {
      throw new Error('You must be logged in to verify cards');
    }

    const response = await axios.post(
      `http://127.0.0.1:8000/verification/verify-card/${cardId}`,
      {},
      {
        headers: {
          'Authorization': authHeader
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error verifying card:', error);
    throw error;
  }
}; 