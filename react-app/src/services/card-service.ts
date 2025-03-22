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

export const verifyCard = async (cardId: number): Promise<{ message: string; card_id: number; is_validated: boolean }> => {
  try {
    const response = await api.post(`/verification/verify-card/${cardId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error verifying card:', error);
    throw error;
  }
}; 