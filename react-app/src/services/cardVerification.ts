export interface VerificationResult {
  isAuthentic: boolean;
  confidence: number;
  message: string;
}

export const verifyCard = async (imageFile: File): Promise<VerificationResult> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch('/verification/verify-card', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Verification request failed');
    }

    const result = await response.json();
    return {
      isAuthentic: result.result.is_authentic,
      confidence: result.result.confidence,
      message: result.result.message || result.message
    };
  } catch (error) {
    throw new Error('Failed to verify card: ' + (error as Error).message);
  }
}; 