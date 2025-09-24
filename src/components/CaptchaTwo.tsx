"use client";
import { useState } from "react";

interface CaptchaProps {
  onSuccess: () => void;
}

export default function CaptchaTwo({ onSuccess }: CaptchaProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);

  const solution = [5, 9];
  const total = 16;

  const toggleSquare = (index: number) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
    setFeedback(null);
  };

  const handleVerify = () => {
    console.log("Selected squares:", selected);
    const isCorrect =
      selected.length === solution.length &&
      [...selected].sort().every((v, i) => v === solution.sort()[i]);

    if (isCorrect) {
      setFeedback("correct");
      onSuccess();
    } else {
      setFeedback("wrong");
    }
  };

  const resetTiles = () => {
    setSelected([]);
    setFeedback(null);
  };

  return (
    <div className=" border rounded-md shadow-md overflow-hidden font-sans flex items-center justify-center ">
      <div>
        {/* Header */}
        <div className="bg-blue-500 text-white p-3 text-center">
          <p className="text-sm">Select all the squares with</p>
          <p className="font-bold text-lg">Moand </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              onClick={() => toggleSquare(i)}
              className={`
    relative w-24 h-24 cursor-pointer border-[2px] 
    bg-[url('/moand-find.png')] bg-no-repeat bg-[length:384px_384px]
    ${selected.includes(i) ? "border-blue-500" : "border-transparent"}
  `}
              style={{
                backgroundPosition: `${-(i % 4) * 96}px ${
                  -Math.floor(i / 4) * 96
                }px`,
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center p-3">
          <button
            onClick={resetTiles}
            className="w-20 h-8 rounded-full border border-gray-400 flex items-center justify-center text-gray-500 text-sm hover:bg-gray-100"
          >
            Refresh
          </button>

          <div className="flex items-center gap-3">
            {feedback === "wrong" && (
              <span className="text-sm text-red-600">
                Incorrect — try again
              </span>
            )}
            {feedback === "correct" && (
              <span className="text-sm text-green-600">Correct ✓</span>
            )}
            <button
              onClick={handleVerify}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
