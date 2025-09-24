"use client";
import React, { useEffect, useRef, useState } from "react";

interface CaptchaCanvasProps {
  text: string; // plain text to render as captcha
  width?: number; // canvas width in CSS px
  height?: number; // canvas height in CSS px
  onSuccess?: () => void;
  className?: string;
}

export default function CaptchaThree({
  text,
  width = 520,
  height = 140,
  onSuccess,
  className = "",
}: CaptchaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);

  // redraw whenever text, seed, width or height changes
  useEffect(() => {
    drawCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, seed, width, height]);

  function rand(rng: () => number, a: number, b: number) {
    return a + (b - a) * rng();
  }

  // deterministic RNG based on seed
  function makeRng(s: number) {
    let v = s >>> 0;
    return function () {
      // xorshift32
      v ^= v << 13;
      v ^= v >>> 17;
      v ^= v << 5;
      return ((v >>> 0) % 1000000) / 1000000;
    };
  }

  function drawCaptcha() {
    const c = canvasRef.current!;
    if (!c) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    c.width = Math.floor(width * dpr);
    c.height = Math.floor(height * dpr);
    c.style.width = `${width}px`;
    c.style.height = `${height}px`;

    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);

    const rng = makeRng(seed);
    // background - soft paper-like
    ctx.fillStyle = "#fbfbf9";
    ctx.fillRect(0, 0, c.width, c.height);

    // add subtle background texture: thin red scribbles
    const bgLines = Math.floor(rand(rng, 6, 12));
    ctx.save();
    ctx.lineWidth = 6 * dpr;
    ctx.strokeStyle = "rgba(210,90,80,0.12)";
    for (let i = 0; i < bgLines; i++) {
      ctx.beginPath();
      const startY = rand(rng, 0, c.height);
      ctx.moveTo(0, startY);
      const segments = 6;
      for (let s = 1; s <= segments; s++) {
        ctx.quadraticCurveTo(
          rand(rng, c.width * 0.1, c.width * 0.9),
          rand(rng, 0, c.height),
          (s / segments) * c.width,
          rand(rng, 0, c.height)
        );
      }
      ctx.stroke();
    }
    ctx.restore();

    // draw each char with distortion
    const paddingX = 24 * dpr;
    const usableW = c.width - paddingX * 2;
    const charCount = Math.max(1, text.length);
    const fontSize = Math.floor(rand(rng, 38, 56) * dpr);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `${fontSize}px "Arial", "Helvetica", sans-serif`;

    // base color for text (soft bluish)
    const baseColor = "rgba(60,120,140,0.95)";

    for (let i = 0; i < charCount; i++) {
      const ch = text[i];
      // x position distributed evenly with jitter
      const x =
        paddingX +
        (i + 0.5) * (usableW / charCount) +
        rand(rng, -8 * dpr, 8 * dpr);

      // vertical sine wave displacement
      const waveAmp = rand(rng, 6, 18) * dpr;
      const waveFreq = rand(rng, 0.006, 0.02);
      const y = c.height / 2 + Math.sin((x + seed) * waveFreq) * waveAmp;

      // skew/rotate and draw char twice for a blurred look
      const rot = rand(rng, -0.5, 0.5); // radians
      const shear = rand(rng, -0.3, 0.3);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.transform(1, shear, 0.05 * shear, 1, 0, 0);

      // subtle shadow/roughness by drawing twice
      ctx.fillStyle = baseColor;
      ctx.fillText(ch, 0, 0);

      // slightly offset stroke to add edge roughness
      ctx.lineWidth = Math.max(1 * dpr, fontSize * 0.06);
      ctx.strokeStyle = "rgba(40,60,70,0.12)";
      ctx.strokeText(ch, rand(rng, -1, 1), rand(rng, -1, 1));
      ctx.restore();
    }

    // add thick noisy lines over the text
    const overLines = Math.floor(rand(rng, 3, 6));
    for (let i = 0; i < overLines; i++) {
      ctx.beginPath();
      ctx.lineWidth = rand(rng, 2, 6) * dpr;
      ctx.strokeStyle = `rgba(${Math.floor(rand(rng, 30, 200))},${Math.floor(
        rand(rng, 30, 90)
      )},${Math.floor(rand(rng, 30, 120))},${rand(rng, 0.18, 0.4)})`;
      const yStart = rand(rng, c.height * 0.15, c.height * 0.85);
      ctx.moveTo(0, yStart);
      const bends = Math.floor(rand(rng, 2, 5));
      for (let b = 1; b <= bends; b++) {
        ctx.quadraticCurveTo(
          rand(rng, c.width * 0.1, c.width * 0.9),
          rand(rng, 0, c.height),
          (b / bends) * c.width,
          rand(rng, 0, c.height)
        );
      }
      ctx.stroke();
    }

    // add splatter dots
    const dots = Math.floor(rand(rng, 80, 160));
    for (let i = 0; i < dots; i++) {
      ctx.beginPath();
      const rx = rand(rng, 0, c.width);
      const ry = rand(rng, 0, c.height);
      const r = rand(rng, 0.5, 2.4) * dpr;
      ctx.fillStyle = `rgba(40,60,70,${rand(rng, 0.08, 0.35)})`;
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // final low-opacity overlay of tiny noise (grain)
    ctx.save();
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < imageData.data.length; i += 4 * 40) {
      const v = Math.floor(rand(rng, -8, 8));
      imageData.data[i] = Math.min(255, imageData.data[i] + v);
      imageData.data[i + 1] = Math.min(255, imageData.data[i + 1] + v);
      imageData.data[i + 2] = Math.min(255, imageData.data[i + 2] + v);
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.restore();
  }

  // regenerate with new seed
  function refresh() {
    setSeed(Math.floor(Math.random() * 1e9));
    setWrong(false);
  }

  function speakText() {
    if (!("speechSynthesis" in window)) return;
    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (answer.trim() === text) {
      onSuccess?.();
    } else {
      // wrong — shake and clear
      setWrong(true);
      setTimeout(() => setWrong(false), 700);
      setAnswer("");

      setTimeout(() => refresh(), 420);
    }
  }

  return (
    <div className="flex justify-center items-center">
      <div
        className={`max-w-[560px] p-4 rounded-md border shadow-sm bg-white ${className}`}
      >
        <p className="text-base font-medium mb-3">Enter the text below</p>

        <div className="relative border rounded-md overflow-hidden mb-3">
          <canvas ref={canvasRef} className={`w-full h-[${height}px]`} />

          {/* left audio */}
          <button
            onClick={speakText}
            aria-label="Play captcha audio"
            className="absolute left-3 bottom-3 w-9 h-9 flex items-center justify-center bg-white rounded-md shadow-sm"
            title="Play audio"
          >
            {/* small speaker SVG */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path d="M5 9v6h4l5 4V5L9 9H5z" fill="#111827" />
              <path
                d="M16.5 8.5a4.5 4.5 0 010 7"
                stroke="#111827"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* refresh */}
          <button
            onClick={refresh}
            aria-label="Refresh captcha"
            className="absolute right-3 bottom-3 w-9 h-9 flex items-center justify-center bg-white rounded-md shadow-sm"
            title="Refresh"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M21 12a9 9 0 10-3 6.8"
                stroke="#111827"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 3v6h-6"
                stroke="#111827"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          className="flex gap-3"
        >
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer"
            className={`flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              wrong ? "animate-shake border-red-400" : ""
            }`}
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-md"
          >
            Submit
          </button>
        </form>

        <style jsx>{`
          /* small shake animation — Tailwind doesn't include this by default */
          @keyframes shake {
            0% {
              transform: translateX(0);
            }
            20% {
              transform: translateX(-6px);
            }
            40% {
              transform: translateX(6px);
            }
            60% {
              transform: translateX(-4px);
            }
            80% {
              transform: translateX(4px);
            }
            100% {
              transform: translateX(0);
            }
          }
          .animate-shake {
            animation: shake 0.6s ease-in-out;
          }
        `}</style>
      </div>
    </div>
  );
}
