import { useCallback, useEffect, useState } from "react";
import { type Step, STEPS } from "./steps-data";
import DetailPanel from "./DetailPanel";

const ING = "ing" as const;

// ── Connector between two steps ──────────────────────────────
function StepConnector({
  phase,
  flowing,
}: {
  phase: "ing" | "q";
  flowing: boolean;
}) {
  return (
    <div className="relative w-0.5 h-5 ml-5 bg-slate-700 overflow-hidden">
      {flowing && (
        <div
          key={Date.now()}
          className={`absolute inset-0 ${phase === ING ? "bg-[#58a6ff]" : "bg-[#3fb950]"}`}
          style={{ animation: "flowDown 0.6s ease forwards" }}
        />
      )}
    </div>
  );
}

// ── Single step node ──────────────────────────────────────────
function StepNode({
  step,
  index,
  state,
  onClick,
}: {
  step: Step;
  index: number;
  state: "idle" | "active" | "done";
  onClick: () => void;
}) {
  const isIng = step.phase === ING;
  const accent = isIng ? "#58a6ff" : "#3fb950";
  const accentDim = isIng ? "rgba(88,166,255,0.1)" : "rgba(63,185,80,0.1)";
  const accentBorder = isIng ? "rgba(88,166,255,0.3)" : "rgba(63,185,80,0.3)";
  const iconBg = isIng ? "rgba(88,166,255,0.15)" : "rgba(63,185,80,0.15)";

  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200"
      style={{
        background:
          state === "active"
            ? accentDim
            : state === "done"
              ? "rgba(255,255,255,0.02)"
              : "#161b22",
        borderColor:
          state === "active" ? accentBorder : "rgba(255,255,255,0.07)",
        boxShadow:
          state === "active"
            ? `0 0 0 1px ${accentBorder}, 0 4px 24px ${accentDim}`
            : "none",
        opacity: state === "done" ? 0.55 : 1,
      }}
    >
      {/* Icon */}
      <div
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: iconBg, border: `1px solid ${accentBorder}` }}
      >
        {state === "active" && (
          <span
            className="absolute -inset-1.5 rounded-xl border-2 pointer-events-none"
            style={{
              borderColor: accent,
              animation: "pulseRing 1.8s ease-out infinite",
            }}
          />
        )}
        {step.icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="text-[0.87rem] font-semibold text-slate-200">
          {step.label}
        </div>
        <div className="text-[0.73rem] text-slate-500 mt-0.5 font-mono">
          {step.sub}
        </div>

        {/* Data preview — only when active */}
        {state === "active" && (
          <div
            className="mt-2.5 space-y-1"
            style={{ animation: "slideIn 0.25s ease" }}
          >
            <div className="flex gap-2 items-baseline px-2 py-1.5 rounded bg-white/5 font-mono text-[0.71rem]">
              <span className="text-slate-500 min-w-[40px]">↳ in</span>
              <span className="text-slate-300">{step.input.val}</span>
            </div>
            <div className="text-[0.63rem] text-slate-600 pl-2">
              ⬇ transformation
            </div>
            <div
              className="flex gap-2 items-baseline px-2 py-1.5 rounded font-mono text-[0.71rem]"
              style={{ background: `${accentDim}` }}
            >
              <span className="text-slate-500 min-w-[40px]">↳ out</span>
              <span style={{ color: accent }}>{step.output.val}</span>
            </div>
          </div>
        )}
      </div>

      {/* Check / status */}
      <div
        className="w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center text-[0.55rem] font-black"
        style={{
          background: state === "done" ? "#3fb950" : "transparent",
          borderColor:
            state === "done"
              ? "#3fb950"
              : state === "active"
                ? accent
                : "#30363d",
          color: state === "done" ? "#0d1117" : "transparent",
        }}
      >
        ✓
      </div>

      {/* Step number */}
      <span className="absolute top-2 right-3 text-[0.6rem] text-slate-600 font-mono tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

// ── Phase block ───────────────────────────────────────────────
function PhaseBlock({
  phase,
  title,
  desc,
  badge,
  steps,
  currentStep,
  flowingConnector,
  onStepClick,
}: {
  phase: "ing" | "q";
  title: string;
  desc: string;
  badge: string;
  steps: Step[];
  currentStep: number;
  flowingConnector: number;
  onStepClick: (globalIdx: number) => void;
}) {
  const isIng = phase === ING;
  const accent = isIng ? "#58a6ff" : "#3fb950";
  const accentBg = isIng ? "rgba(88,166,255,0.06)" : "rgba(63,185,80,0.06)";

  return (
    <div className="mb-6">
      <div
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg mb-3 border-l-[3px]"
        style={{ background: accentBg, borderColor: accent }}
      >
        <h2 className="text-[0.8rem] font-bold uppercase tracking-widest text-slate-300">
          {title}
        </h2>
        <span className="text-[0.72rem] text-slate-500">{desc}</span>
        <span
          className="ml-auto text-[0.67rem] font-semibold px-2 py-0.5 rounded-full border"
          style={{
            color: accent,
            background: `${accentBg}`,
            borderColor: `${accent}40`,
          }}
        >
          {badge}
        </span>
      </div>

      <div className="flex flex-col">
        {steps.map((step, i) => {
          const globalIdx = STEPS.indexOf(step);
          const state =
            globalIdx === currentStep
              ? "active"
              : globalIdx < currentStep
                ? "done"
                : "idle";
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id} className="relative flex flex-col">
              <StepNode
                step={step}
                index={globalIdx}
                state={state}
                onClick={() => onStepClick(globalIdx)}
              />
              {!isLast && (
                <StepConnector
                  phase={phase}
                  flowing={flowingConnector === globalIdx}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────
function Timeline({
  currentStep,
  onDotClick,
}: {
  currentStep: number;
  onDotClick: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-0 px-5 py-3 bg-[#161b22] border-t border-slate-800 overflow-x-auto">
      {STEPS.map((step, i) => {
        const isIng = step.phase === ING;
        const accent = isIng ? "#58a6ff" : "#3fb950";
        const accentDim = isIng
          ? "rgba(88,166,255,0.3)"
          : "rgba(63,185,80,0.3)";
        const isDone = i < currentStep;
        const isActive = i === currentStep;
        const lastIngIdx = STEPS.reduce(
          (acc, s, idx) => (s.phase === "ing" ? idx : acc),
          -1,
        );
        const isLastIng = isIng && i === lastIngIdx;
        const isLastQ = !isIng && i === STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <div className="relative group">
              <div
                onClick={() => onDotClick(i)}
                title={step.label}
                className="w-2.5 h-2.5 rounded-full border-2 cursor-pointer transition-all duration-150 hover:scale-125"
                style={{
                  background: isActive
                    ? accent
                    : isDone
                      ? accentDim
                      : "#0d1117",
                  borderColor: isActive || isDone ? accent : "#30363d",
                  boxShadow: isActive ? `0 0 8px ${accent}` : "none",
                }}
              />
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.58rem] bg-[#161b22] border border-slate-700 rounded px-1.5 py-0.5 text-slate-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                {step.label}
              </span>
            </div>
            {!isLastIng && !isLastQ && (
              <div
                className="h-0.5 w-5 flex-shrink-0 transition-colors duration-300"
                style={{
                  background: isDone ? accent : "#21262d",
                }}
              />
            )}
            {isLastIng && (
              <div className="w-px h-7 bg-slate-700 mx-2.5 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main visualizer ───────────────────────────────────────────
export default function RagPipelineVisualizer() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [flowingConnector, setFlowingConnector] = useState(-1);

  const ingestionSteps = STEPS.filter((s) => s.phase === "ing");
  const querySteps = STEPS.filter((s) => s.phase === "q");

  const goToStep = useCallback((idx: number) => {
    setCurrentStep(idx);
    if (idx > 0) setFlowingConnector(idx - 1);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (currentStep < STEPS.length - 1) goToStep(currentStep + 1);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (currentStep > 0) goToStep(currentStep - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentStep, goToStep]);

  const progress =
    currentStep < 0 ? 0 : ((currentStep + 1) / STEPS.length) * 100;

  return (
    <>
      {/* CSS keyframes */}
      <style>{`
        @keyframes pulseRing {
          0%   { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0;   transform: scale(1.5); }
        }
        @keyframes flowDown {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tokenAppear {
          to { opacity: 1; }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>

      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-0.5 z-50 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #58a6ff, #bc8cff)",
          boxShadow: "0 0 6px #58a6ff",
        }}
      />

      <div
        className="flex flex-col rounded-xl overflow-hidden border border-slate-800"
        style={{
          background: "#0d1117",
          height: "calc(100vh - 220px)",
          minHeight: "500px",
        }}
      >
        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Pipeline panel */}
          <div className="flex-1 overflow-y-auto p-5 min-w-0">
            <PhaseBlock
              phase="ing"
              title="Phase 1 — Ingestion"
              desc="Offline · Pré-calcul des représentations vectorielles"
              badge="4 étapes"
              steps={ingestionSteps}
              currentStep={currentStep}
              flowingConnector={flowingConnector}
              onStepClick={goToStep}
            />
            <PhaseBlock
              phase="q"
              title="Phase 2 — Query"
              desc="Online · Temps réel · < 1 s end-to-end"
              badge="9 étapes"
              steps={querySteps}
              currentStep={currentStep}
              flowingConnector={flowingConnector}
              onStepClick={goToStep}
            />
          </div>

          {/* Detail panel */}
          <div className="w-[400px] flex-shrink-0 border-l border-slate-800 overflow-y-auto bg-[#161b22]">
            <div className="px-4 py-2.5 border-b border-slate-800 text-[0.65rem] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#3fb950]"
                style={{ animation: "blink 1.5s ease infinite" }}
              />
              Détail technique
            </div>
            <DetailPanel step={currentStep >= 0 ? STEPS[currentStep] : null} />
          </div>
        </div>

        {/* Timeline */}
        <Timeline currentStep={currentStep} onDotClick={goToStep} />
      </div>

      {/* Keyboard hint */}
      <p className="mt-2 text-[0.7rem] text-slate-500 text-center">
        ← → pour naviguer entre les étapes
      </p>
    </>
  );
}
