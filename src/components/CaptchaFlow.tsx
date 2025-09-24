"use client";
import { useState } from "react";
import CaptchaOne from "@/components/CaptchaOne";
import CaptchaTwo from "@/components/CaptchaTwo";
import CaptchaThree from "@/components/CaptchaThree";
import CaptchaFour from "@/components/CaptchaFour";
import CaptchaFive from "./CaptchaFive";

interface CaptchaFlowProps {
  onComplete: () => void;
}

export default function CaptchaFlow({ onComplete }: CaptchaFlowProps) {
  const [step, setStep] = useState(0);

  const captchaSteps = [
    <CaptchaOne key="c1" onSuccess={() => setStep((s) => s + 1)} />,
    <CaptchaTwo key="c2" onSuccess={() => setStep((s) => s + 1)} />,
    <CaptchaThree
      key="c3"
      text="build build build"
      onSuccess={() => setStep((s) => s + 1)}
    />,
    <CaptchaFour key="c5" onSuccess={() => setStep((s) => s + 1)} />,
    <CaptchaFive key="c4" onSuccess={() => onComplete()} />,
  ];

  return (
    <div className="w-full">
      {step < captchaSteps.length ? captchaSteps[step] : null}
    </div>
  );
}
