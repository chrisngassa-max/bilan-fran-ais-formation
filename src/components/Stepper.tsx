import React from "react";
import { Check } from "lucide-react";

interface StepperProps {
  currentStep: number; // 1-indexed (1 to 4)
}

export function Stepper({ currentStep }: StepperProps) {
  const steps = [
    { label: "Votre Test", desc: "Complété" },
    { label: "Vos Résultats", desc: "Positionnement" },
    { label: "Financement", desc: "Prise en charge" },
    { label: "Validation", desc: "Conseiller" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-outline-variant -z-10 rounded-full"></div>
        <div
          className="absolute top-5 left-0 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={idx} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary text-on-primary shadow-md scale-105"
                    : isActive
                      ? "bg-on-surface text-on-primary ring-4 ring-primary/20 scale-110 font-black"
                      : "bg-surface-container text-outline border-2 border-outline-variant"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-black mt-2 text-center transition-colors duration-300 ${
                  isActive ? "text-on-surface font-extrabold" : isCompleted ? "text-primary" : "text-outline"
                }`}
              >
                {step.label}
              </span>
              <span className="hidden sm:block text-[9px] font-bold text-outline uppercase tracking-wider text-center mt-0.5">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
