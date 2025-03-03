import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState<string>("");

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <main className="flex justify-center items-center">
      <input 
        type="text" 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Search for cards or profiles" 
        className="search-bar"
        style={{ 
          width: '400px', 
          height: "40px", 
          border: "1px solid #FFCB05", 
          borderRadius: "5px", 
          padding: "10px" }}
      />
      <button onClick={handleSearch} className="p-2 text-black rounded hover:bg-orange-300"
      style = {{ marginLeft: "10px", backgroundColor: "#FFCB05" }}>
        Search
      </button>
    </main>
  );
}

export default SearchBar;