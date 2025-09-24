"use client";
import { useState } from "react";
import Image from "next/image";

interface CaptchaProps {
  onSuccess: () => void;
}

export default function CaptchaFour({ onSuccess }: CaptchaProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);

  // Each grid cell is a separate image
  const images = [
    "/five/anas.jpg",
    "/five/arjun.jpg",
    "/five/avhi.jpg",
    "/five/chinna.jpg",
    "/five/mishal.jpg",
    "/five/nikku.jpg",
    "/five/priyansh.jpg",
    "/five/shibu.jpg",
    "/five/vinaya.jpg",
  ];

  const solution = [1, 2, 4, 5, 6, 7];

  const toggleSquare = (index: number) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
    setFeedback(null);
  };

  const handleVerify = () => {
    console.log(selected);
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
    <div className=" border rounded-md shadow-md overflow-hidden font-sans flex items-center justify-center">
      <div className="w-[350px]">
        {/* Header */}
        <div className="bg-blue-500 text-white p-3 text-center">
          <p className="text-sm">Select all the squares with members in the </p>
          <p className="font-bold text-lg">Athena Hacker House</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3">
          {images.map((src, i) => (
            <div
              key={i}
              onClick={() => toggleSquare(i)}
              className={`relative w-28 h-28 border cursor-pointer 
              ${
                selected.includes(i)
                  ? "border-blue-500 border-4"
                  : "border-transparent"
              }`}
            >
              <Image
                src={src}
                alt={`captcha-${i}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center p-3">
          <button
            onClick={resetTiles}
            className="w-20 h-8 rounded-full border border-gray-400 flex items-center justify-center text-gray-500 text-sm hover:bg-gray-100"
          >
            ↻
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
