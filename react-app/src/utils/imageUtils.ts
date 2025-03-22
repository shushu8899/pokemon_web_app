export const getImageUrl = (imageUrl: string | null | undefined): string => {
    if (!imageUrl) {
        return "https://placehold.co/300x400/png?text=No+Image+Available";
    }
    
    if (imageUrl.startsWith('http')) {
        return imageUrl;
    }
    
    return `http://127.0.0.1:8000${imageUrl}`;
}; 