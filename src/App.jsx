import React, { useState, useEffect } from "react";
import { BalldontlieAPI } from "@balldontlie/sdk";

export default function App() {
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null); // State to hold player ID
  const [cache, setCache] = useState({}); // Cache state

  useEffect(() => {
    const fetchInitialPlayers = async () => {
      const api = new BalldontlieAPI({
        apiKey: "138e5814-bfdf-4194-8aa6-8ff31cc3db17",
      });
      try {
        const response = await api.nfl.getSeasonStats({
          season: 2024,
        });
        setPlayers(response.data);
        setFilteredPlayers(response.data); // Initialize filtered players

        //error stuff
      } catch (err) {
        setError("Failed to fetch initial players");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPlayers();
  }, []);

  const fetchPlayerByName = async () => {
    if (searchQuery.trim() === "") {
      // Reset filtered players when the search bar is cleared
      setFilteredPlayers(players);
      setSelectedPlayerId(null);
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    // Check cache
    if (cache[query]) {
      console.log("Serving from cache:", cache[query]);
      setFilteredPlayers(cache[query]);
      return;
    }

    const api = new BalldontlieAPI({
      apiKey: "138e5814-bfdf-4194-8aa6-8ff31cc3db17",
    });

    try {
      setLoading(true);
      const response = await api.nfl.getPlayers({ search: query });
      const foundPlayers = response.data;

      if (foundPlayers.length > 0) {
        // Fetch stats for found players
        const statsResponses = await Promise.all(
          foundPlayers.map((player) =>
            api.nfl.getSeasonStats({
              player_ids: [player.id],
              season: 2024,
            })
          )
        );

        // Combine player and stats data
        const combinedData = statsResponses.map((statsResponse, index) => {
          const playerStats = statsResponse.data[0] || {}; // Default to an empty object if no stats found
          return {
            ...playerStats,
            player: foundPlayers[index],
          };
        });

        setFilteredPlayers(combinedData);

        // Cache the result
        setCache((prevCache) => ({
          ...prevCache,
          [query]: combinedData,
        }));

        // Save player ID if exactly one player matches
        if (combinedData.length === 1) {
          setSelectedPlayerId(combinedData[0].player.id);
        } else {
          setSelectedPlayerId(null);
        }
      } else {
        setFilteredPlayers([]);
        setSelectedPlayerId(null);
      }
    } catch (err) {
      setError("Failed to fetch player by name");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchPlayerByName(); // Trigger fetch when Enter is pressed
    }
  };

  const getApplicableStats = (playerData) => {
    const stats = {
      "Games Played": playerData.games_played,
      "Passing Yards": playerData.passing_yards,
      "Passing Yards Per Game": playerData.passing_yards_per_game,
      "Passing Touchdowns": playerData.passing_touchdowns,
      "Interceptions": playerData.passing_interceptions,
      "Rushing Yards": playerData.rushing_yards,
      "Rushing Touchdowns": playerData.rushing_touchdowns,
      "Rushing Attempts": playerData.rushing_attempts,
      "Receiving Yards": playerData.receiving_yards,
      "Receiving Touchdowns": playerData.receiving_touchdowns,
      "Receptions": playerData.receptions,
    };

    // Filter out null or undefined stats
    return Object.entries(stats).filter(
      ([key, value]) => value !== null && value !== undefined
    );
  };


  //displaying stuff:
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <div>
      <h1>Player Stats</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search for a player..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown} // Listen for Enter key press

        //TODO: remove this and add to a css file
        style={{
          padding: "10px",
          margin: "10px 0",
          width: "100%",
          fontSize: "16px",
        }}
      />

      {filteredPlayers.length === 0 ? (
        <p>No players found for the search term.</p>
      ) : (
        <div>
          {filteredPlayers.map((playerData) => (
            <div key={playerData.player.id}>
              <h2>
                {playerData.player.first_name} {playerData.player.last_name} -{" "}
                {playerData.player.position}
              </h2>
              <p>
                <strong>Height:</strong> {playerData.player.height}
              </p>
              <p>
                <strong>Weight:</strong> {playerData.player.weight}
              </p>
              <p>
                <strong>College:</strong> {playerData.player.college}
              </p>
              <p>
                <strong>Experience:</strong> {playerData.player.experience}
              </p>
              <p>
                <strong>Age:</strong> {playerData.player.age}
              </p>

              <h3>Stats for Season 2024</h3>
              <ul>
                {getApplicableStats(playerData).map(([statName, statValue]) => (
                  <li key={statName}>
                    <strong>{statName}:</strong> {statValue}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
