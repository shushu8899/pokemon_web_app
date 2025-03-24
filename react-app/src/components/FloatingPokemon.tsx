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
            y: [0, -5, 0], // Slight floating effect
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: "3px 3px 15px rgba(255, 215, 0, 0.3)"
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
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
        >
          <img
            src={pokemon.sprite}
            alt={pokemon.name}
            style={{ width: "100px", height: "100px" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <p style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
              Let's get you a Pokémon today!
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FloatingPokemon;
