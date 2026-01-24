import React from "react";
import { SiteNav } from "../components/SiteNav";

export function AboutPage() {
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
                  About
                </span>
                <h1 className="font-display text-6xl font-normal leading-[0.9] tracking-tight text-black lg:text-[96px]">
                  The why
                  <br />
                  behind QRAG.
                </h1>
              </div>
              <p className="max-w-[720px] text-lg font-light leading-[1.7] text-[#6b7280]">
                Understanding the fundamental challenge that makes quantum code generation
                uniquely difficult, and how retrieval-augmented generation provides a path forward.
              </p>
            </div>
          </div>
        </section>

        {/* The Problem - Deep Dive */}
        <section className="w-full bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
            <div className="mb-20 max-w-[720px]">
              <span className="mb-5 block text-[11px] font-medium uppercase tracking-[0.15em] text-[#64748b]">
                The Core Challenge
              </span>
              <h2 className="font-display text-4xl font-normal leading-[1.15] text-[#0b0f19] lg:text-5xl">
                Quantum programming exists in a data desert.
              </h2>
              <p className="mt-8 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                Large language models learn patterns from massive datasets. For Python, there are
                billions of lines of code to learn from. For Q#? A fraction of a percent of that volume.
              </p>
            </div>

            {/* Scale Comparison */}
            <div className="mb-20 rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-gradient-to-br from-[#fdfbf8] to-white p-8 lg:p-12">
              <div className="mb-12">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">
                  Training Data Scale Comparison
                </span>
              </div>

              <div className="space-y-8">
                {/* Python */}
                <div>
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-[#0b0f19]">Python</span>
                    <span className="text-sm text-[#6b7280]">~100B+ tokens</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-[4px] bg-[#f1f5f9]">
                    <div className="h-full w-full rounded-[4px] bg-[#64748b]" />
                  </div>
                </div>

                {/* JavaScript */}
                <div>
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-[#0b0f19]">JavaScript</span>
                    <span className="text-sm text-[#6b7280]">~80B+ tokens</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-[4px] bg-[#f1f5f9]">
                    <div className="h-full w-[80%] rounded-[4px] bg-[#64748b]" />
                  </div>
                </div>

                {/* Rust */}
                <div>
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-[#0b0f19]">Rust</span>
                    <span className="text-sm text-[#6b7280]">~5B tokens</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-[4px] bg-[#f1f5f9]">
                    <div className="h-full w-[5%] rounded-[4px] bg-[#64748b]" />
                  </div>
                </div>

                {/* Q# */}
                <div>
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-[#c9a66b]">Q#</span>
                    <span className="text-sm text-[#c9a66b]">~0.01B tokens (estimated)</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-[4px] bg-[#fdf6ed]">
                    <div className="h-full w-[0.5%] min-w-[4px] rounded-[4px] bg-[#c9a66b]" />
                  </div>
                </div>
              </div>

              <p className="mt-10 text-sm leading-relaxed text-[#9ca3af]">
                Q# training data is roughly 10,000x smaller than mainstream languages.
                This data scarcity means LLMs lack the pattern exposure needed to reliably
                generate correct quantum code.
              </p>
            </div>

            {/* Consequence Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-8">
                <h3 className="mb-3 text-lg font-semibold text-[#0b0f19]">Syntax Hallucinations</h3>
                <p className="text-sm leading-relaxed text-[#6b7280]">
                  Models invent plausible-looking but invalid Q# syntax, mixing patterns from
                  C# or F# that don't exist in the quantum language.
                </p>
              </div>

              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-8">
                <h3 className="mb-3 text-lg font-semibold text-[#0b0f19]">Deprecated APIs</h3>
                <p className="text-sm leading-relaxed text-[#6b7280]">
                  Q# has evolved significantly. Models trained on older data reference deprecated
                  operations and outdated namespace structures.
                </p>
              </div>

              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-8">
                <h3 className="mb-3 text-lg font-semibold text-[#0b0f19]">Type System Errors</h3>
                <p className="text-sm leading-relaxed text-[#6b7280]">
                  Q#'s quantum type system (Qubit, Result, Pauli) has unique constraints that
                  models frequently violate without proper grounding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Solution */}
        <section className="w-full border-t border-[rgba(0,0,0,0.06)] bg-[#fbf7f2]">
          <div className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
            <div className="mb-20 max-w-[720px]">
              <span className="mb-5 block text-[11px] font-medium uppercase tracking-[0.15em] text-[#64748b]">
                The QRAG Approach
              </span>
              <h2 className="font-display text-4xl font-normal leading-[1.15] text-[#0b0f19] lg:text-5xl">
                Retrieval bridges the knowledge gap.
              </h2>
              <p className="mt-8 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                Instead of relying solely on what the model learned during training, QRAG
                dynamically retrieves relevant Q# documentation and verified code examples
                at generation time, giving the model accurate, current context for every task.
              </p>
            </div>

            {/* How RAG Works */}
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white p-8 lg:p-10">
                <div className="mb-8">
                  <span className="inline-block rounded-[6px] bg-[#f1f5f9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">
                    Without RAG
                  </span>
                </div>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-sm font-medium text-[#64748b]">
                      1
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed text-[#6b7280]">
                        User requests quantum code generation
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-sm font-medium text-[#64748b]">
                      2
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed text-[#6b7280]">
                        Model relies on sparse Q# training data
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-sm font-medium text-[#dc2626]">
                      3
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed text-[#6b7280]">
                        Output contains hallucinated syntax, deprecated APIs, or type errors
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] border-2 border-[#c9a66b]/20 bg-[#fffaf4] p-8 lg:p-10">
                <div className="mb-8">
                  <span className="inline-block rounded-[6px] bg-[#fdf6ed] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#c9a66b]">
                    With QRAG
                  </span>
                </div>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdf6ed] text-sm font-medium text-[#c9a66b]">
                      1
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed text-[#6b7280]">
                        User requests quantum code generation
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdf6ed] text-sm font-medium text-[#c9a66b]">
                      2
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed text-[#6b7280]">
                        QRAG retrieves relevant Q# docs, examples, and type signatures
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdf6ed] text-sm font-medium text-[#c9a66b]">
                      3
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed text-[#6b7280]">
                        Model generates code grounded in verified, current documentation
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-sm font-medium text-[#16a34a]">
                      4
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed text-[#6b7280]">
                        Output compiles correctly and passes tests
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Knowledge Base */}
        <section className="w-full border-t border-[rgba(0,0,0,0.06)] bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
            <div className="mb-16 max-w-[720px]">
              <span className="mb-5 block text-[11px] font-medium uppercase tracking-[0.15em] text-[#64748b]">
                The Knowledge Base
              </span>
              <h2 className="font-display text-4xl font-normal leading-[1.15] text-[#0b0f19] lg:text-5xl">
                Curated from official sources.
              </h2>
              <p className="mt-8 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                QRAG's retrieval corpus is built from authoritative Microsoft Q# documentation
                and the Quantum Development Kit, ensuring every retrieved example is verified and current.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-[#fdfbf8] p-6">
                <div className="mb-4 font-display text-3xl tracking-tight text-[#c9a66b]">QDK</div>
                <p className="text-sm leading-relaxed text-[#6b7280]">
                  Microsoft Quantum Development Kit standard library operations and types
                </p>
              </div>
              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-6">
                <div className="mb-4 font-display text-3xl tracking-tight text-[#0b0f19]">API Docs</div>
                <p className="text-sm leading-relaxed text-[#6b7280]">
                  Official Q# API reference with function signatures and usage patterns
                </p>
              </div>
              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-6">
                <div className="mb-4 font-display text-3xl tracking-tight text-[#0b0f19]">Samples</div>
                <p className="text-sm leading-relaxed text-[#6b7280]">
                  Verified code samples from Microsoft's quantum algorithms repository
                </p>
              </div>
              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-6">
                <div className="mb-4 font-display text-3xl tracking-tight text-[#0b0f19]">Katas</div>
                <p className="text-sm leading-relaxed text-[#6b7280]">
                  Quantum Katas exercises with correct solutions and explanations
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About the Creator */}
        <section className="w-full border-t border-[rgba(0,0,0,0.06)] bg-[#fbf7f2]">
          <div className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div>
                <span className="mb-5 block text-[11px] font-medium uppercase tracking-[0.15em] text-[#64748b]">
                  Created By
                </span>
                <h2 className="font-display text-4xl font-normal leading-[1.15] text-[#0b0f19] lg:text-5xl">
                  Ivan Car
                </h2>
                <p className="mt-8 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                  I'm 16 years old and deeply fascinated by the intersection of artificial intelligence
                  and quantum computing, two fields that I believe will define the next era of technology.
                </p>
                <p className="mt-6 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                  QRAG started as an exploration into whether retrieval-augmented generation could
                  solve the practical challenges of quantum code generation. The results exceeded
                  my expectations: a 19% improvement in pass rate by simply grounding the model
                  in verified documentation.
                </p>
                <p className="mt-6 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                  This project represents my belief that the frontier of AI isn't just about bigger
                  models. It's about smarter architectures that combine the best of machine learning
                  with structured knowledge retrieval.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white p-8">
                  <span className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9ca3af]">
                    Interests
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-[6px] bg-[#fdf6ed] px-4 py-2 text-sm font-medium text-[#c9a66b]">
                      Artificial Intelligence
                    </span>
                    <span className="rounded-[6px] bg-[#f1f5f9] px-4 py-2 text-sm font-medium text-[#64748b]">
                      Quantum Computing
                    </span>
                    <span className="rounded-[6px] bg-[#f1f5f9] px-4 py-2 text-sm font-medium text-[#64748b]">
                      Machine Learning
                    </span>
                    <span className="rounded-[6px] bg-[#f1f5f9] px-4 py-2 text-sm font-medium text-[#64748b]">
                      Software Engineering
                    </span>
                    <span className="rounded-[6px] bg-[#f1f5f9] px-4 py-2 text-sm font-medium text-[#64748b]">
                      RAG Systems
                    </span>
                  </div>
                </div>

                <div className="rounded-[16px] border-2 border-[#c9a66b]/20 bg-[#fffaf4] p-8">
                  <span className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#c9a66b]">
                    Vision
                  </span>
                  <p className="text-base leading-relaxed text-[#6b7280]">
                    "I want to be at the forefront of AI and quantum computing. Not just using
                    these technologies, but pushing their boundaries and finding new ways to
                    combine them."
                  </p>
                </div>
              </div>
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
