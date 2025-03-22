import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8000'; // Adjust the base URL as needed

// export const fetchSearchResults = async (query: string) => {
//   try {
//     const [cardResponse, profileResponse] = await Promise.all([
//       axios.get(`${API_BASE_URL}/search/cards`, { params: { search_query: query } }),
//       axios.get(`${API_BASE_URL}/search/profiles`, { params: { search_query: query } })
//     ]);

//     // Combine both results
//     return [...cardResponse.data, ...profileResponse.data];
//   } catch (error) {
//     console.error("Error during search", error);
//     throw error;
//   }
// };

// interface SearchResult {
//   id: string;
//   CardName?: string;
//   Username?: string;
// }


// export const fetchSearchResults = async (
//   query: string,
//   setResults: (results: any[]) => void,
//   setLoading: (loading: boolean) => void
// ) => {
//   setLoading(true);
//   try {
//     const cardResults = await axios.get(`http://127.0.0.1:8000/search/cards?search_query=${query}`);
//     const profileResults = await axios.get(`http://127.0.0.1:8000/search/profiles?search_query=${query}`);
//     const auctionResults = await axios.get(`http://127.0.0.1:8000/search/auctions?search_query=${query}`);
//     setResults([...cardResults.data, ...profileResults.data, ...auctionResults.data]);
//   } catch (error) {
//     console.error("Error fetching search results:", error);
//   } finally {
//     setLoading(false);
//   }
// };

interface SearchResult {
  id: string;
  CardName?: string;
  Username?: string;
  CurrentRating?: string;
  Email?: string;
  _table?: string;
  CardQuality?: string;
  AuctionID?: string;
  ImageURL?: string;
}

const BASE_URL = "http://127.0.0.1:8000";

export const fetchSearchResults = async (
  query: string,
  setResults: (results: SearchResult[]) => void,
  setLoading: (loading: boolean) => void
) => {
  setLoading(true);
  try {
    console.log('Making API request to:', `${BASE_URL}/search/all?query=${encodeURIComponent(query)}`);
    const response = await axios.get(`${BASE_URL}/search/all?query=${encodeURIComponent(query)}`);
    console.log('API Response:', response.data);

    if (response.status !== 200) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const allResults: SearchResult[] = [];

    if (response.data && typeof response.data.results === "object") {
      Object.entries(response.data.results).forEach(([tableName, tableResults]) => {
        if (Array.isArray(tableResults)) {
          allResults.push(
            ...tableResults.map((result: any) => ({
              ...result,
              _table: tableName,
            }))
          );
        }
      });
    }

    console.log('Processed results:', allResults);
    setResults(allResults);
  } catch (error) {
    console.error("Error fetching search results:", error);
    setResults([]);
  } finally {
    setLoading(false);
  }
};
