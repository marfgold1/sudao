import { useAgents } from "@/hooks/useAgents";
import React, { useState } from "react";

const Greet: React.FC = () => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { agents } = useAgents();
  const daoBe = agents.daoBe;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!daoBe) {
      alert("DAO BE not found");
      return;
    }

    if (name.trim() === "") {
      alert("Please enter a name.");
      return;
    }

    setIsLoading(true);
    try {
      const greeting = await daoBe!.greet(name);
      alert(greeting);
    } catch (error) {
      console.error("Error calling greet:", error);
      alert("Failed to greet. Please check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-xs">
      <label htmlFor="name-input" className="font-medium">
        Enter your name:
      </label>
      <input
        id="name-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border rounded px-2 py-1"
        placeholder="Your name"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="bg-blue-500 text-white rounded px-4 py-1 hover:bg-blue-600 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? "Greeting..." : "Greet"}
      </button>
    </form>
  );
};

export default Greet;
