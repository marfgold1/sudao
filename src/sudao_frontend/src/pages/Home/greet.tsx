import React, { useState } from "react";
import { sudao_backend } from "declarations/sudao_backend";

const Greet: React.FC = () => {
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === "") {
      alert("Please enter a name.");
      return;
    }
    try {
      const greeting = await sudao_backend.greet(name);
      alert(greeting);
    } catch (error) {
      alert("Failed to greet. Please try again.");
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
        onChange={e => setName(e.target.value)}
        className="border rounded px-2 py-1"
        placeholder="Your name"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white rounded px-4 py-1 hover:bg-blue-600"
      >
        Greet
      </button>
    </form>
  );
};

export default Greet;
