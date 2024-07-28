import React, { useEffect, useState } from 'react';

const SuggestionsPage = () => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('http://localhost:5000/suggestions'); // Update this line
        if (!res.ok) {
          throw new Error('Failed to fetch suggestions.');
        }
        const data = await res.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    fetchSuggestions();
  }, []);

  return (
    <div>
      <h1>Suggestions</h1>
      <ul>
        {suggestions.map((suggestion, index) => (
          <li key={index}>{suggestion}</li>
        ))}
      </ul>
    </div>
  );
};

export default SuggestionsPage;
