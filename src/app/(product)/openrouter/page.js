"use client";

import React, { useState } from "react";

const RansomwareCalculator = () => {
  const [formData, setFormData] = useState({
    ransomAmount: "",
    downtimeHours: "",
    revenueLossPerHour: "",
    recoveryCosts: "",
    legalFines: "",
  });
  const [totalCost, setTotalCost] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization:
              "Bearer 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",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000", // Change if deployed
            "X-Title": "Ransomware Calculator",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-pro-exp-02-05:free",
            messages: [
              {
                role: "system",
                content:
                  "You are a cybersecurity expert helping estimate ransomware costs.",
              },
              {
                role: "user",
                content: `Calculate the total ransomware attack cost with: 
              Ransom Amount: $${formData.ransomAmount}, 
              Downtime: ${formData.downtimeHours} hours, 
              Revenue Loss per Hour: $${formData.revenueLossPerHour}, 
              Recovery Costs: $${formData.recoveryCosts}, 
              Legal Fines: $${formData.legalFines}.`,
              },
            ],
          }),
        }
      );

      const data = await response.json();
      setTotalCost(
        data.choices?.[0]?.message?.content || "Error calculating cost"
      );
    } catch (error) {
      console.error("API Error:", error);
      setTotalCost("Error fetching response");
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
      {totalCost && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow text-center">
          <p className="text-gray-700 font-bold">Estimated Cost: {totalCost}</p>
        </div>
      )}
    </div>
  );
};

export default RansomwareCalculator;
