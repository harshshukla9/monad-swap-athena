"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CaptchaProps {
  onSuccess: () => void;
}

const REAL = [
  "Prasad",
  "100xYash",
  "Abhinav",
  "Angra-Mainyu",
  "arjun",
  "Dev Dalia",
  "Faiz",
  "Farhaaann",
  "gauravmandall",
  "Himanshu",
  "ImmortalSul",
  "Kakashi_Hatake",
  "Kshitij",
  "Mishal",
  "renzothenoob",
  "Rushikesh",
  "Sabrina carpenter",
  "Selina Gomez",
  "Shubh",
  "sudoevans",
  "Brooklyn",
];

// imposters only
const CORRECT = ["Yo2324", "wtf_r_u", "Young Suspens", "vardaan", "vinayaa90"];

// shuffle utility
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const NAMES = shuffle([...REAL, ...CORRECT]);

export default function CaptchaImposters({ onSuccess }: CaptchaProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);

  const toggleSelect = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleVerify = () => {
    const allCorrect = selected.every((n) => CORRECT.includes(n));
    const noMissed = CORRECT.every((n) => selected.includes(n));

    if (allCorrect && noMissed) {
      setFeedback("correct");
      onSuccess();
    } else {
      setFeedback("wrong");
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50">
      <Card className="w-[600px] border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-center text-lg font-semibold">
            Identify the <span className="text-red-600">Discord imposters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] rounded-md border p-2">
            <div className="grid grid-cols-3 gap-2">
              {NAMES.map((name, idx) => (
                <Badge
                  key={idx}
                  variant={selected.includes(name) ? "default" : "outline"}
                  className={`cursor-pointer px-3 py-2 text-sm transition ${
                    selected.includes(name)
                      ? "bg-red-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => toggleSelect(name)}
                >
                  {name}
                </Badge>
              ))}
            </div>
          </ScrollArea>
          {feedback === "wrong" && (
            <p className="text-sm text-red-500 mt-2 text-center">
              Incorrect. Try again!
            </p>
          )}
          {feedback === "correct" && (
            <p className="text-sm text-green-600 mt-2 text-center">
              Verified! You found all imposters.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleVerify}>
            Verify
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
