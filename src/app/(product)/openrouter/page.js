"use client";

import React, { useState } from "react";

/**
 * Demo calculator. Calls the admin-only /api/openrouter proxy —
 * never embed API keys in the client bundle.
 */
const RansomwareCalculator = () => {
  const [formData, setFormData] = useState({
    ransomAmount: "",
    downtimeHours: "",
    revenueLossPerHour: "",
    recoveryCosts: "",
    legalFines: "",
  });
  const [totalCost, setTotalCost] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setTotalCost(null);

    try {
      const prompt = `Calculate the total ransomware attack cost with:
              Ransom Amount: $${formData.ransomAmount},
              Downtime: ${formData.downtimeHours} hours,
              Revenue Loss per Hour: $${formData.revenueLossPerHour},
              Recovery Costs: $${formData.recoveryCosts},
              Legal Fines: $${formData.legalFines}.`;

      const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setTotalCost(
        data.choices?.[0]?.message?.content || "Error calculating cost"
      );
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message || "Error fetching response");
      setTotalCost(null);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-100 rounded-lg shadow-lg mt-10">
      <h2 className="text-lg font-bold mb-4 text-center">
        Ransomware Attack Cost Calculator
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.keys(formData).map((key) => (
          <input
            key={key}
            type="number"
            name={key}
            value={formData[key]}
            onChange={handleChange}
            placeholder={key.replace(/([A-Z])/g, " $1").trim()}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        ))}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Calculate
        </button>
      </form>
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-center text-sm">
          {error}
        </div>
      )}
      {totalCost && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow text-center">
          <p className="text-gray-700 font-bold">Estimated Cost: {totalCost}</p>
        </div>
      )}
    </div>
  );
};

export default RansomwareCalculator;
