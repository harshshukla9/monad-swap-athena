"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function CaptchaOne({ onSuccess }: CaptchaProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheckboxClick = () => {
    if (checked || loading) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setChecked(true);
    }, 1200);
  };

  const handleSubmit = () => {
    if (checked) onSuccess();
  };

  return (
    <div className="flex items-center justify-center  bg-gray-100">
      <Card className="w-[340px] border border-gray-300 rounded-md shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Left side: custom checkbox */}
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={handleCheckboxClick}
            >
              <div
                className={`flex items-center justify-center h-7 w-7 border rounded-sm 
                ${
                  checked
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-400 bg-white"
                }`}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : checked ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </div>
              <label className="text-base font-medium select-none">
                I am an Athena member
              </label>
            </div>

            {/* Right side: fake reCAPTCHA branding */}
            <div className="flex flex-col items-center text-[10px] text-gray-500">
              <Image src="/monad.webp" alt="reCAPTCHA" width={48} height={32} className="w-12 h-8" />
              <span className="mt-1">reCAPTCHA</span>
              <span className="text-[9px]">Privacy - Terms</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4">
          <Button
            onClick={handleSubmit}
            disabled={!checked}
            className="w-full mt-3"
          >
            Verify
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
