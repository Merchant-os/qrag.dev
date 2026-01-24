import React, { useCallback, useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";

export function ProcessPage() {
  // Retrieval section state
  const [retrievalProgress, setRetrievalProgress] = useState(0);
  const [retrievalPhase, setRetrievalPhase] = useState<'before' | 'active' | 'after'>('before');
  const retrievalRef = useRef<HTMLDivElement>(null);

  // Pipeline section state
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelinePhase, setPipelinePhase] = useState<'before' | 'active' | 'after'>('before');
  const pipelineRef = useRef<HTMLDivElement>(null);

  const retrievalSteps = [
    { title: "Query Embedding", desc: "User request is converted to 1536-dimensional vector using OpenAI's text-embedding-3-small model." },
    { title: "Similarity Search", desc: "Cosine similarity calculated against all pre-computed example vectors in the corpus." },
    { title: "Rank & Filter", desc: "Results ranked by similarity score, with top-k examples selected for inclusion." },
    { title: "Context Assembly", desc: "Retrieved examples formatted into system prompt with descriptions and source code." },
  ];

  const pipelineSteps = [
    {
      phase: "Understanding",
      title: "Intent Parsing",
      subtitle: "Extract Quantum Requirements",
      description: "The agent analyzes the user's natural language request to identify the quantum operation needed. Key constraints are extracted including qubit counts, required gate operations (H, X, Y, Z, CNOT), measurement patterns, and algorithmic variants.",
      detail: "Uses GPT-4o-mini to parse requests into structured queries containing operation type, qubit requirements, gates involved, and expected outputs.",
    },
    {
      phase: "Understanding",
      title: "Query Embedding",
      subtitle: "Vectorize User Intent",
      description: "The parsed query is converted into a 1536-dimensional vector representation. This captures semantic meaning rather than just keywords, allowing the system to find relevant examples even when they use different terminology.",
      detail: "Embeddings are cached for identical queries, reducing API calls and improving response time for repeated tasks.",
    },
    {
      phase: "Retrieval",
      title: "Vector Search",
      subtitle: "Find Similar Q# Examples",
      description: "Cosine similarity is calculated between the query vector and all pre-computed example vectors in the corpus. This identifies the most semantically similar Q# code samples and documentation.",
      detail: "Uses NumPy's optimized linear algebra operations for fast similarity calculation across the entire corpus.",
    },
    {
      phase: "Retrieval",
      title: "Context Ranking",
      subtitle: "Select Top-k Examples",
      description: "Search results are ranked by similarity score and filtered to select the top-k most relevant examples. These examples represent diverse yet relevant patterns for the task at hand.",
      detail: "Implements diversity sampling to avoid selecting too many similar examples, ensuring broader context coverage.",
    },
    {
      phase: "Generation",
      title: "Prompt Assembly",
      subtitle: "Format Retrieved Context",
      description: "The selected examples are formatted into a structured system prompt that includes descriptions, complete Q# code, and usage patterns. This provides the model with concrete, working patterns to emulate.",
      detail: "System prompt includes QDK 0.28 syntax requirements, namespace conventions, and best practices.",
    },
    {
      phase: "Generation",
      title: "Code Generation",
      subtitle: "Generate with Retrieved Context",
      description: "GPT-4o-mini processes the augmented prompt to generate Q# code. The model has access to retrieved examples as reference patterns, ensuring generated code uses correct namespaces and follows idiomatic patterns.",
      detail: "Temperature set to 0.3 for consistent output, balancing creativity with adherence to retrieved patterns.",
    },
    {
      phase: "Verification",
      title: "Q# Compilation",
      subtitle: "Build with QDK 0.28",
      description: "Generated code is compiled using the .NET 6 SDK with QDK 0.28 toolchain. This full compilation catches namespace errors, type mismatches, missing operations, and any other issues.",
      detail: "Uses 'dotnet build' with full error output captured, including file, line number, and error description.",
    },
    {
      phase: "Verification",
      title: "xUnit Testing",
      subtitle: "Verify Functional Correctness",
      description: "For each successfully compiled operation, xUnit tests execute to verify functional correctness. Tests check quantum behavior against expected outcomes, measuring qubit states and validating algorithm outputs.",
      detail: "Tests are dynamically generated for each benchmark task, covering edge cases and typical usage patterns.",
    },
    {
      phase: "Analysis",
      title: "Metrics Calculation",
      subtitle: "Compute Quality Scores",
      description: "Results from all attempts are aggregated to compute three key metrics: pass@1, pass@3, and compile@1. These metrics provide a comprehensive view of generation quality.",
      detail: "Results stored in report_latest.json with detailed per-attempt logs, including compilation errors and test failures.",
    },
  ];

  // Handle wheel events
  const handleWheel = useCallback((e: WheelEvent) => {
    const delta = e.deltaY;

    // Check retrieval section
    if (retrievalRef.current) {
      const rect = retrievalRef.current.getBoundingClientRect();
      const isFullyOnScreen = rect.top <= 5 && rect.top >= -5;

      // Entering section - snap to it first
      if (delta > 0 && retrievalPhase === 'before' && rect.top < window.innerHeight * 0.5 && rect.top > -50) {
        e.preventDefault();
        retrievalRef.current.scrollIntoView({ behavior: 'smooth' });
        // Wait for scroll to complete before activating
        setTimeout(() => {
          setRetrievalPhase('active');
        }, 400);
        return;
      }

      // In active phase - drive parallax
      if (retrievalPhase === 'active' && isFullyOnScreen) {
        e.preventDefault();

        // Limit max progress change per scroll event (max ~0.15 per event = ~7 scrolls minimum)
        const maxProgressChange = 0.15;
        const rawChange = delta * 0.0012;
        const clampedChange = Math.max(-maxProgressChange, Math.min(maxProgressChange, rawChange));
        const newProgress = Math.max(0, Math.min(1, retrievalProgress + clampedChange));

        if (newProgress >= 1 && delta > 0) {
          setRetrievalProgress(1);
          setRetrievalPhase('after');
          setTimeout(() => {
            window.scrollBy({ top: 150, behavior: 'smooth' });
          }, 200);
        } else if (newProgress <= 0 && delta < 0) {
          setRetrievalProgress(0);
          setRetrievalPhase('before');
          window.scrollBy({ top: -150, behavior: 'smooth' });
        } else {
          setRetrievalProgress(newProgress);
        }
        return;
      }

      // Still in active phase but section moved - keep preventing scroll
      if (retrievalPhase === 'active' && !isFullyOnScreen) {
        e.preventDefault();
        retrievalRef.current.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Scrolling back up into completed section
      if (delta < 0 && retrievalPhase === 'after' && rect.top > -window.innerHeight * 0.3 && rect.top < 150) {
        e.preventDefault();
        setRetrievalProgress(0.99);
        retrievalRef.current.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          setRetrievalPhase('active');
        }, 400);
        return;
      }
    }

    // Check pipeline section
    if (pipelineRef.current) {
      const rect = pipelineRef.current.getBoundingClientRect();
      const isFullyOnScreen = rect.top <= 5 && rect.top >= -5;

      // Entering section - snap to it first
      if (delta > 0 && pipelinePhase === 'before' && rect.top < window.innerHeight * 0.5 && rect.top > -50) {
        e.preventDefault();
        pipelineRef.current.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          setPipelinePhase('active');
        }, 400);
        return;
      }

      // In active phase
      if (pipelinePhase === 'active' && isFullyOnScreen) {
        e.preventDefault();

        // Limit max progress change per scroll event (max ~0.08 per event for 9 cards)
        const maxProgressChange = 0.08;
        const rawChange = delta * 0.0005;
        const clampedChange = Math.max(-maxProgressChange, Math.min(maxProgressChange, rawChange));
        const newProgress = Math.max(0, Math.min(1, pipelineProgress + clampedChange));

        if (newProgress >= 1 && delta > 0) {
          setPipelineProgress(1);
          setPipelinePhase('after');
          setTimeout(() => {
            window.scrollBy({ top: 150, behavior: 'smooth' });
          }, 200);
        } else if (newProgress <= 0 && delta < 0) {
          setPipelineProgress(0);
          setPipelinePhase('before');
          window.scrollBy({ top: -150, behavior: 'smooth' });
        } else {
          setPipelineProgress(newProgress);
        }
        return;
      }

      // Still in active phase but section moved
      if (pipelinePhase === 'active' && !isFullyOnScreen) {
        e.preventDefault();
        pipelineRef.current.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      // Scrolling back up
      if (delta < 0 && pipelinePhase === 'after' && rect.top > -window.innerHeight * 0.3 && rect.top < 150) {
        e.preventDefault();
        setPipelineProgress(0.99);
        pipelineRef.current.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          setPipelinePhase('active');
        }, 400);
        return;
      }
    }
  }, [retrievalPhase, retrievalProgress, pipelinePhase, pipelineProgress]);

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Calculate active steps
  const activeRetrievalStep = Math.min(3, Math.floor(retrievalProgress * 4));
  const activePipelineStep = Math.min(8, Math.floor(pipelineProgress * 9));

  return (
    <div className="bg-[#fbf7f2] text-[#0b0f19]">
      <SiteNav />

      <main className="flex w-full flex-col">
        {/* Hero Section */}
        <section className="relative flex min-h-screen w-full items-end">
          <div className="mx-auto w-full max-w-[1440px] px-6 pb-16 lg:px-12 lg:pb-24">
            <div className="flex w-full flex-col gap-10">
              <div className="flex flex-col gap-8">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">
                  Process
                </span>
                <h1 className="font-display text-6xl font-normal leading-[0.9] tracking-tight text-black lg:text-[96px]">
                  How QRAG
                  <br />
                  works.
                </h1>
              </div>
              <p className="max-w-[720px] text-lg font-light leading-[1.7] text-[#6b7280]">
                Each code generation request moves through a carefully designed pipeline of retrieval, synthesis, and verification to ensure output stays aligned with QDK expectations.
              </p>
            </div>
          </div>
        </section>

        {/* Three Steps Overview */}
        <section className="w-full bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
            <div className="mb-24 max-w-[640px]">
              <span className="mb-5 block text-[11px] font-medium tracking-[0.15em] text-[#64748b]">
                The Generation Pipeline
              </span>
              <h2 className="font-display text-4xl font-normal leading-[1.15] text-[#0b0f19] lg:text-5xl">
                Three steps to verified Q# code.
              </h2>
              <p className="mt-8 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                From parsing user intent to delivering compilable operations, each stage is designed for accuracy and reliability.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-16 md:grid-cols-3 lg:gap-20">
              {[
                {
                  title: "Intent Parsing",
                  desc: "The agent extracts constraints like qubit counts, gate operations, and algorithm variants from natural language prompts.",
                  detail: "Analyzes the request to understand what quantum operation is needed, identifying key parameters and expected outputs.",
                },
                {
                  title: "Context Retrieval",
                  desc: "Vector semantic search surfaces verified Q# examples and documentation that match request semantics.",
                  detail: "Using cosine similarity on 1536-dimensional embeddings to find the most relevant patterns.",
                },
                {
                  title: "Grounded Generation",
                  desc: "The LLM composes code with retrieved snippets anchored in system prompt, ensuring QDK 0.28 compliance.",
                  detail: "GPT-4o generates code following Q# syntax guidelines, incorporating patterns from retrieved examples.",
                },
              ].map((item) => (
                <div key={item.title} className="group relative">
                  <div className="absolute -left-4 top-0 h-full w-px bg-gradient-to-b from-[#c9a66b] via-[#c9a66b]/40 to-transparent opacity-60" />
                  <div className="pl-6">
                    <h4 className="mb-5 font-display text-2xl font-normal text-[#0b0f19]">
                      {item.title}
                    </h4>
                    <p className="mb-5 text-[15px] font-light leading-[1.8] text-[#6b7280]">
                      {item.desc}
                    </p>
                    <p className="text-[13px] font-light leading-[1.7] text-[#94a3b8]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Retrieval Workflow Section - PARALLAX */}
        <section
          ref={retrievalRef}
          className="relative w-full overflow-hidden bg-[#f8f9fa]"
          style={{ height: "100vh" }}
        >
          {/* Subtle gradient overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: "radial-gradient(ellipse at 20% 50%, rgba(201, 166, 107, 0.08), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(100, 116, 139, 0.06), transparent 50%)"
            }}
          />

          {/* Scroll indicator */}
          {retrievalPhase === 'active' && (
            <div className="pointer-events-none absolute bottom-8 left-1/2 z-50 -translate-x-1/2 animate-bounce">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-[#64748b]">Scroll to explore</span>
                <svg className="h-5 w-5 text-[#c9a66b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          )}

          <div className="flex h-full items-center">
            <div className="relative mx-auto w-full max-w-[1440px] px-6 py-20 lg:px-12">
              <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
                {/* Left side - Description */}
                <div>
                  <span className="mb-5 block text-[11px] font-medium tracking-[0.15em] text-[#64748b]">
                    Retrieval Workflow
                  </span>
                  <h2 className="font-display text-4xl font-normal leading-[1.15] text-[#0b0f19] lg:text-5xl">
                    From query to context in milliseconds.
                  </h2>
                  <p className="mt-8 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                    The retrieval engine uses vector embeddings to find and rank the most relevant Q# examples from the curated corpus.
                  </p>

                  {/* Progress indicator */}
                  <div className="mt-12 flex items-center gap-4">
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#c9a66b] to-[#d4b896]"
                        style={{
                          width: `${retrievalProgress * 100}%`,
                          transition: 'width 0.15s ease-out'
                        }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold tabular-nums text-[#c9a66b]">
                      {activeRetrievalStep + 1}/4
                    </span>
                  </div>
                </div>

                {/* Right side - Parallax cards */}
                <div className="relative h-[400px] lg:h-[500px]">
                  {retrievalSteps.map((flow, index) => {
                    // Smooth continuous interpolation based on progress
                    const cardProgress = retrievalProgress * 4; // 0 to 4
                    const distanceFromActive = index - cardProgress;

                    // Smooth interpolation for position and scale
                    let translateY = distanceFromActive * 140;
                    let scale = Math.max(0.85, 1 - Math.abs(distanceFromActive) * 0.08);

                    // Sharp opacity transitions for legibility
                    // Card is either fully visible (1) or hidden (0), with quick transition
                    let opacity = 0;
                    if (Math.abs(distanceFromActive) < 0.6) {
                      opacity = 1; // Active card fully visible
                    } else if (distanceFromActive >= 0.6 && distanceFromActive < 1) {
                      // Next card fading in - keep it hidden until almost active
                      opacity = 0;
                    }

                    // Clamp values for cards that are far away
                    if (distanceFromActive < -0.5) {
                      translateY = -140 + (distanceFromActive + 0.5) * 80;
                      opacity = 0;
                    }

                    const isActive = Math.abs(distanceFromActive) < 0.5;

                    return (
                      <div
                        key={flow.title}
                        className="absolute inset-x-0 top-1/2"
                        style={{
                          transform: `translateY(calc(-50% + ${translateY}px)) scale(${scale})`,
                          opacity,
                          zIndex: 10 - Math.abs(Math.round(distanceFromActive)),
                          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        <div
                          className="rounded-2xl border bg-white p-8"
                          style={{
                            borderColor: isActive ? 'rgba(201, 166, 107, 0.4)' : '#e5e7eb',
                            boxShadow: isActive
                              ? '0 25px 70px rgba(201, 166, 107, 0.2)'
                              : '0 8px 30px rgba(0, 0, 0, 0.04)',
                            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                        >
                          <div className="flex items-start gap-6">
                            <div className="relative">
                              <div
                                className="flex h-14 w-14 items-center justify-center rounded-full"
                                style={{
                                  backgroundColor: isActive ? '#c9a66b' : '#f3f4f6',
                                  boxShadow: isActive ? '0 0 30px rgba(201, 166, 107, 0.5)' : 'none',
                                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                              >
                                <span
                                  className="text-base font-bold"
                                  style={{
                                    color: isActive ? 'white' : '#94a3b8',
                                    transition: 'color 0.4s ease',
                                  }}
                                >
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="mb-3 font-display text-xl font-normal text-[#0b0f19]">{flow.title}</h4>
                              <p className="text-[15px] font-light leading-[1.75] text-[#6b7280]">{flow.desc}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Complete Pipeline Section - PARALLAX */}
        <section
          ref={pipelineRef}
          className="relative w-full bg-white"
          style={{ height: "100vh" }}
        >
          {/* Scroll indicator */}
          {pipelinePhase === 'active' && (
            <div className="pointer-events-none absolute bottom-8 left-1/2 z-50 -translate-x-1/2 animate-bounce">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-[#64748b]">Scroll to explore</span>
                <svg className="h-5 w-5 text-[#c9a66b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          )}

          <div className="flex h-full items-center justify-center overflow-hidden">
            <div className="relative mx-auto w-full max-w-[1440px] px-6 lg:px-12">
              {/* Header */}
              <div
                className="absolute left-6 top-8 max-w-[500px] lg:left-12"
                style={{
                  opacity: Math.max(0, 1 - pipelineProgress * 5),
                  transform: `translateY(${-pipelineProgress * 60}px)`,
                  transition: 'all 0.3s ease-out',
                }}
              >
                <span className="mb-3 block text-[11px] font-medium tracking-[0.15em] text-[#64748b]">
                  Complete Pipeline
                </span>
                <h2 className="font-display text-3xl font-normal leading-[1.15] text-[#0b0f19] lg:text-4xl">
                  End-to-end generation with verification.
                </h2>
              </div>

              {/* Progress bar */}
              <div className="absolute right-6 top-8 lg:right-12">
                <div className="w-48">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[#94a3b8]">Progress</span>
                    <span className="text-[11px] font-bold tabular-nums text-[#c9a66b]">
                      {activePipelineStep + 1}/{pipelineSteps.length}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-[#e5e7eb]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#c9a66b] to-[#d4b896]"
                      style={{
                        width: `${((activePipelineStep + 1) / pipelineSteps.length) * 100}%`,
                        transition: 'width 0.15s ease-out'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Pipeline cards */}
              <div className="relative flex items-center justify-center" style={{ minHeight: "70vh" }}>
                {pipelineSteps.map((item, index) => {
                  // Smooth continuous interpolation based on progress
                  const cardProgress = pipelineProgress * 9; // 0 to 9
                  const distanceFromActive = index - cardProgress;

                  // Smooth interpolation for position and scale
                  let translateY = distanceFromActive * 160;
                  let scale = Math.max(0.82, 1 - Math.abs(distanceFromActive) * 0.1);

                  // Sharp opacity transitions for legibility
                  // Card is either fully visible (1) or hidden (0)
                  let opacity = 0;
                  if (Math.abs(distanceFromActive) < 0.6) {
                    opacity = 1; // Active card fully visible
                  }

                  // Clamp values for cards that are far away
                  if (distanceFromActive < -0.5) {
                    translateY = -160 + (distanceFromActive + 0.5) * 100;
                    opacity = 0;
                  }

                  const isActive = Math.abs(distanceFromActive) < 0.5;

                  const phaseColors: Record<string, string> = {
                    Understanding: "#c9a66b",
                    Retrieval: "#64748b",
                    Generation: "#c9a66b",
                    Verification: "#64748b",
                    Analysis: "#c9a66b",
                  };
                  const accentColor = phaseColors[item.phase] || "#c9a66b";

                  return (
                    <div
                      key={item.title}
                      className="absolute w-full max-w-[580px]"
                      style={{
                        transform: `translateY(${translateY}px) scale(${scale})`,
                        opacity,
                        zIndex: 20 - Math.abs(Math.round(distanceFromActive)),
                        pointerEvents: isActive ? "auto" : "none",
                        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <div
                        className="rounded-2xl border bg-white p-8 lg:p-10"
                        style={{
                          borderColor: isActive ? 'rgba(201, 166, 107, 0.3)' : '#f3f4f6',
                          boxShadow: isActive
                            ? '0 40px 100px rgba(0, 0, 0, 0.1)'
                            : '0 10px 40px rgba(0, 0, 0, 0.03)',
                          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        {/* Phase badge */}
                        <div className="mb-5 flex items-center justify-between">
                          <span
                            className="inline-block rounded-md px-4 py-1.5 text-[10px] font-semibold tracking-[0.1em]"
                            style={{
                              backgroundColor: isActive ? `${accentColor}18` : "#f8f9fa",
                              color: isActive ? accentColor : "#94a3b8",
                              transition: 'all 0.4s ease',
                            }}
                          >
                            {item.phase}
                          </span>
                          <span className="text-[11px] font-medium text-[#d4d4d4]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <h3 className="mb-2 font-display text-2xl font-normal text-[#0b0f19] lg:text-3xl">
                          {item.title}
                        </h3>
                        <span className="mb-5 block text-[12px] font-normal tracking-[0.03em] text-[#94a3b8]">
                          {item.subtitle}
                        </span>
                        <p className="mb-6 text-[15px] font-light leading-[1.8] text-[#6b7280]">
                          {item.description}
                        </p>

                        {/* Detail box */}
                        <div
                          className="border-l-2 py-3 pl-5"
                          style={{
                            borderColor: isActive ? `${accentColor}50` : "#e5e7eb",
                            transition: 'border-color 0.4s ease'
                          }}
                        >
                          <p className="text-[13px] font-light leading-[1.7] text-[#64748b]">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Metrics Summary */}
        <section className="w-full bg-[#f8f9fa]">
          <div className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
            <div className="mb-16 flex items-center gap-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent" />
              <span className="text-[11px] font-medium tracking-[0.15em] text-[#94a3b8]">Performance Summary</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent" />
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
              {[
                { label: "Pipeline Latency", value: "~3s", desc: "From request to verified metrics, including retrieval, generation, and testing." },
                { label: "Retrieval Accuracy", value: "94%", desc: "Queries where top-k examples contain relevant patterns for successful generation." },
                { label: "Hallucination Reduction", value: "78%", desc: "Fewer undefined helpers and incorrect API calls compared to baseline." },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="group relative overflow-hidden rounded-2xl bg-white p-8 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)]"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#c9a66b]/5 transition-all duration-500 group-hover:scale-150 group-hover:bg-[#c9a66b]/10" />
                  <span className="relative mb-4 block text-[11px] font-medium tracking-[0.12em] text-[#64748b]">
                    {metric.label}
                  </span>
                  <span className="relative font-display text-5xl font-normal tracking-tight text-[#0b0f19] lg:text-6xl">
                    {metric.value}
                  </span>
                  <p className="relative mt-5 text-[14px] font-light leading-[1.7] text-[#94a3b8]">
                    {metric.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-[rgba(0,0,0,0.06)] bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-12">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <span className="font-mono text-sm text-[#9ca3af]">
                QRAG - Quantum Retrieval Augmented Generation
              </span>
              <span className="text-sm text-[#9ca3af]">
                Built by Ivan Car
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
