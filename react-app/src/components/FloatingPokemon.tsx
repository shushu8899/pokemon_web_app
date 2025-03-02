import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const fetchRandomPokemon = async () => {
  const randomId = Math.floor(Math.random() * 151) + 1; // Gen 1 Pokémon
  const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
  return {
    name: response.data.name,
    sprite: response.data.sprites.front_default,
  };
};

const FloatingPokemon: React.FC = () => {
  const [pokemon, setPokemon] = useState<{ name: string; sprite: string } | null>(null);

  useEffect(() => {
    const loadPokemon = async () => {
      const poke = await fetchRandomPokemon();
      setPokemon(poke);
    };
    loadPokemon();
  }, []);

  return (
    <div style={{ position: "fixed", bottom: "20px", left: "15px", zIndex: 1000 }}>
      {pokemon && (
        <motion.div
          animate={{
            // x: [0, 15, -15, 0], // Move left-right continuously
            y: [0, -5, 0], // Slight floating effect
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "10px",
            boxShadow: "2px 2px 10px rgba(255, 215, 0, 0.2)",
            border: "1px solid #FFD700",
            width: "400px",
            // color: "#FFD700",
          }}
        >
          <img
            src={pokemon.sprite}
            alt={pokemon.name}
            style={{ width: "450px", height: "100px" }}
          />
          <p style={{ fontSize: "18px", fontWeight: "bold", height: "10px", padding: "3px"}}>Let's get you a Pokémon today!</p>
        </motion.div>
      )}
    </div>
  );
};

export default FloatingPokemon;
