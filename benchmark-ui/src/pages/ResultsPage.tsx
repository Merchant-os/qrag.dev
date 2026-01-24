import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { SearchIcon, CopyIcon, CheckCircleIcon, XCircleIcon } from "../components/Icons";

type Report = {
  baseline: Record<string, number> & { tasks?: TaskResult[] };
  rag: Record<string, number> & { tasks?: TaskResult[] };
  delta: Record<string, number>;
};

type TaskResult = {
  id: string;
  "pass@1": boolean;
  "pass@3": boolean;
  "compile@1": boolean;
  attempts: {
    success: boolean;
    compile_ok: boolean;
    test_ok: boolean;
    error: string | null;
    elapsed_sec: number;
  }[];
};

type Preview = {
  id: string;
  description: string;
  rag_output: string;
  baseline_output: string;
  rag_result?: {
    "pass@1"?: boolean;
    "compile@1"?: boolean;
    attempts?: { error?: string | null; elapsed_sec?: number }[];
  } | null;
  baseline_result?: {
    "pass@1"?: boolean;
    "compile@1"?: boolean;
    attempts?: { error?: string | null; elapsed_sec?: number }[];
  } | null;
};

type FilterType = "all" | "rag-wins" | "baseline-wins" | "ties" | "both-failed";

const ERROR_CATEGORIES = {
  "Implicit Result": { pattern: "QS0005", description: "RAG properly handles Q# result values" },
  "Undefined Identifier": { pattern: "QS5022", description: "RAG uses correct Q# standard library functions" },
  "Type Mismatch": { pattern: "QS0001", description: "RAG generates type-safe code" },
  "Namespace Issues": { pattern: "QS4002", description: "RAG structures code in valid namespaces" },
  "Syntax Errors": { pattern: "QS3035", description: "RAG produces syntactically correct Q#" },
  "Invalid Comparison": { pattern: "QS5007", description: "RAG handles quantum type comparisons correctly" },
  "Array Type Errors": { pattern: "QS5004", description: "RAG correctly uses array operations" },
  "Test Failures": { pattern: "xUnit", description: "RAG generates logically correct algorithms" },
};

export function ResultsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [preview, setPreview] = useState<Preview[]>([]);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState<"side-by-side" | "unified">("side-by-side");

  const formatPct = (value?: number) => {
    if (typeof value !== "number") return "-";
    return `${Math.round(value * 100)}%`;
  };

  const formatDelta = (value?: number) => {
    if (typeof value !== "number") return "-";
    const pct = Math.round(value * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  useEffect(() => {
    fetch("/report_latest.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load report");
        return res.json();
      })
      .then((data) => {
        setReport(data);
        setLoadedAt(new Date().toLocaleString());
        setError(null);
      })
      .catch((err) => {
        setError("Failed to load benchmark data. Please run the benchmark harness.");
        console.error(err);
        setReport(null);
      });

    fetch("/preview_latest.json")
      .then((res) => res.json())
      .then((data) => setPreview(data))
      .catch(() => setPreview([]));
  }, []);

  const taskCount = report?.baseline?.n_tasks ?? report?.rag?.n_tasks ?? 0;

  const ragWins = useMemo(() => {
    if (!report?.rag?.tasks || !report?.baseline?.tasks) return [];
    const wins: Array<{
      id: string;
      description: string;
      baselineError: string | null;
      ragCode: string;
      baselineCode: string;
      errorCategory: string | null;
    }> = [];

    report.rag.tasks.forEach((ragTask) => {
      const baselineTask = report.baseline.tasks?.find((t) => t.id === ragTask.id);
      const previewItem = preview.find((p) => p.id === ragTask.id);

      if (baselineTask && ragTask["pass@1"] && !baselineTask["pass@1"]) {
        const errorStr = baselineTask.attempts?.[0]?.error || "";
        let errorCategory: string | null = null;

        for (const [category, { pattern }] of Object.entries(ERROR_CATEGORIES)) {
          if (errorStr.includes(pattern)) {
            errorCategory = category;
            break;
          }
        }

        wins.push({
          id: ragTask.id,
          description: previewItem?.description || ragTask.id,
          baselineError: baselineTask.attempts?.[0]?.error || null,
          ragCode: previewItem?.rag_output || "",
          baselineCode: previewItem?.baseline_output || "",
          errorCategory,
        });
      }
    });
    return wins;
  }, [report, preview]);

  const ragWinPatterns = useMemo(() => {
    const patterns: Record<string, number> = {};
    ragWins.forEach((win) => {
      const category = win.errorCategory || "Other";
      patterns[category] = (patterns[category] || 0) + 1;
    });
    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category,
        count,
        description: ERROR_CATEGORIES[category as keyof typeof ERROR_CATEGORIES]?.description || "Various compilation issues",
      }));
  }, [ragWins]);

  const allTaskResults = useMemo(() => {
    if (!report?.rag?.tasks || !report?.baseline?.tasks) return [];
    return report.rag.tasks.map((ragTask) => {
      const baselineTask = report.baseline.tasks?.find((t) => t.id === ragTask.id);
      const previewItem = preview.find((p) => p.id === ragTask.id);
      return {
        id: ragTask.id,
        description: previewItem?.description || ragTask.id,
        ragPass: ragTask["pass@1"],
        ragCompile: ragTask["compile@1"],
        baselinePass: baselineTask?.["pass@1"] || false,
        baselineCompile: baselineTask?.["compile@1"] || false,
        ragWon: ragTask["pass@1"] && !baselineTask?.["pass@1"],
        baselineWon: !ragTask["pass@1"] && baselineTask?.["pass@1"],
        bothPassed: ragTask["pass@1"] && baselineTask?.["pass@1"],
        bothFailed: !ragTask["pass@1"] && !baselineTask?.["pass@1"],
        ragCode: previewItem?.rag_output || "",
        baselineCode: previewItem?.baseline_output || "",
        baselineError: baselineTask?.attempts?.[0]?.error || null,
      };
    });
  }, [report, preview]);

  const filteredTasks = useMemo(() => {
    let tasks = allTaskResults;

    switch (filter) {
      case "rag-wins":
        tasks = tasks.filter((t) => t.ragWon);
        break;
      case "baseline-wins":
        tasks = tasks.filter((t) => t.baselineWon);
        break;
      case "ties":
        tasks = tasks.filter((t) => t.bothPassed);
        break;
      case "both-failed":
        tasks = tasks.filter((t) => t.bothFailed);
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.id.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    return tasks.sort((a, b) => {
      if (a.ragWon && !b.ragWon) return -1;
      if (!a.ragWon && b.ragWon) return 1;
      if (a.bothPassed && !b.bothPassed) return -1;
      if (!a.bothPassed && b.bothPassed) return 1;
      if (a.baselineWon && !b.baselineWon) return -1;
      if (!a.baselineWon && b.baselineWon) return 1;
      return 0;
    });
  }, [allTaskResults, filter, searchQuery]);

  const taskStats = useMemo(() => {
    return {
      ragPassed: allTaskResults.filter((t) => t.ragPass).length,
      baselinePassed: allTaskResults.filter((t) => t.baselinePass).length,
      ragWins: allTaskResults.filter((t) => t.ragWon).length,
      baselineWins: allTaskResults.filter((t) => t.baselineWon).length,
      ties: allTaskResults.filter((t) => t.bothPassed).length,
      bothFailed: allTaskResults.filter((t) => t.bothFailed).length,
    };
  }, [allTaskResults]);

  const getErrorSummary = (error: string | null): string => {
    if (!error) return "Unknown error";
    if (error.includes("QS0005")) return "Implicit result ignored";
    if (error.includes("QS5022")) return "Undefined identifier";
    if (error.includes("QS5007")) return "Invalid type comparison";
    if (error.includes("QS4002")) return "Declaration outside namespace";
    if (error.includes("QS0001")) return "Type mismatch";
    if (error.includes("QS3035")) return "Syntax error";
    if (error.includes("QS3103")) return "Invalid identifier";
    if (error.includes("QS5004")) return "Type is not an array";
    if (error.includes("xUnit")) return "Test assertion failed";
    return "Compilation error";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getLineDiffs = (code1: string, code2: string) => {
    const lines1 = code1.split('\n');
    const lines2 = code2.split('\n');
    const diffLines1 = new Set<number>();
    const diffLines2 = new Set<number>();

    const maxLen = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLen; i++) {
      if (lines1[i] !== lines2[i]) {
        if (i < lines1.length) diffLines1.add(i);
        if (i < lines2.length) diffLines2.add(i);
      }
    }

    return { diffLines1, diffLines2 };
  };

  return (
    <div className="bg-[#fbf7f2] text-[#0b0f19]">
      <SiteNav />

      <main className="flex w-full flex-col">
        {/* Hero Section - Matching Process Page Style */}
        <section className="relative flex min-h-screen w-full items-end">
          <div className="mx-auto w-full max-w-[1440px] px-6 pb-16 lg:px-12 lg:pb-24">
            <div className="flex w-full flex-col gap-10">
              <div className="flex flex-col gap-8">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">
                  Results
                </span>
                <h1 className="font-display text-6xl font-normal leading-[0.9] tracking-tight text-black lg:text-[96px]">
                  Proven
                  <br />
                  impact.
                </h1>
              </div>
              <p className="max-w-[720px] text-lg font-light leading-[1.7] text-[#6b7280]">
                RAG delivers measurable improvements in Q# code generation, validated through real compilation and xUnit test execution against {taskCount} quantum programming tasks.
              </p>
            </div>
          </div>
        </section>

        {/* Metrics Overview Section */}
        <section className="w-full bg-white">
          <div className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
            {/* Section Header */}
            <div className="mb-20 max-w-[640px]">
              <span className="mb-5 block text-[11px] font-medium uppercase tracking-[0.15em] text-[#64748b]">
                Benchmark Summary
              </span>
              <h2 className="font-display text-4xl font-normal leading-[1.15] text-[#0b0f19] lg:text-5xl">
                Side by side.
              </h2>
              <p className="mt-8 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                A direct comparison of pass rates across {taskCount} quantum programming tasks.
              </p>
            </div>

            {/* Large Visual Comparison */}
            <div className="mb-20 rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-gradient-to-br from-[#fdfbf8] to-white p-8 lg:p-16">
              <div className="flex flex-col items-center gap-12 lg:flex-row lg:justify-between">
                {/* Baseline Side */}
                <div className="flex flex-1 flex-col items-center text-center">
                  <span className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">
                    Baseline LLM
                  </span>
                  {/* Circular Progress */}
                  <div className="relative mb-8">
                    <svg className="h-48 w-48 -rotate-90 transform lg:h-56 lg:w-56" viewBox="0 0 200 200">
                      {/* Background circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="12"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(report?.baseline?.["pass@1"] || 0) * 534} 534`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-5xl font-normal tracking-tight text-[#64748b] lg:text-6xl">
                        {formatPct(report?.baseline?.["pass@1"])}
                      </span>
                      <span className="mt-1 text-xs text-[#9ca3af]">pass@1</span>
                    </div>
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    {taskStats.baselinePassed} of {taskCount} tasks passed
                  </div>
                </div>

                {/* Delta / Arrow Section */}
                <div className="flex flex-col items-center gap-4 lg:px-8">
                  <div className="flex items-center gap-4">
                    <div className="hidden h-px w-12 bg-gradient-to-r from-[#94a3b8] to-transparent lg:block" />
                    <div className="relative">
                      <div className="rounded-[12px] border-2 border-[#c9a66b]/20 bg-[#fdf6ed] px-6 py-4 lg:px-8 lg:py-6">
                        <span className="font-display text-4xl font-normal tracking-tight text-[#c9a66b] lg:text-5xl">
                          {formatDelta(report?.delta?.["pass@1"])}
                        </span>
                      </div>
                    </div>
                    <div className="hidden h-px w-12 bg-gradient-to-l from-[#c9a66b] to-transparent lg:block" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-[0.15em] text-[#c9a66b]">
                    Improvement
                  </span>
                  {/* Arrow pointing right */}
                  <svg className="hidden h-6 w-12 text-[#c9a66b] lg:block" fill="none" viewBox="0 0 48 24">
                    <path
                      d="M0 12h44m0 0l-8-8m8 8l-8 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* RAG Side */}
                <div className="flex flex-1 flex-col items-center text-center">
                  <span className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a66b]">
                    RAG-Enhanced
                  </span>
                  {/* Circular Progress */}
                  <div className="relative mb-8">
                    <svg className="h-48 w-48 -rotate-90 transform lg:h-56 lg:w-56" viewBox="0 0 200 200">
                      {/* Background circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#fdf6ed"
                        strokeWidth="12"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#c9a66b"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(report?.rag?.["pass@1"] || 0) * 534} 534`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-5xl font-normal tracking-tight text-[#c9a66b] lg:text-6xl">
                        {formatPct(report?.rag?.["pass@1"])}
                      </span>
                      <span className="mt-1 text-xs text-[#9ca3af]">pass@1</span>
                    </div>
                  </div>
                  <div className="text-sm text-[#c9a66b]">
                    {taskStats.ragPassed} of {taskCount} tasks passed
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-6">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#9ca3af]">
                  RAG Wins
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl tracking-tight text-[#c9a66b]">
                    {taskStats.ragWins}
                  </span>
                  <span className="text-sm text-[#9ca3af]">tasks</span>
                </div>
              </div>
              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-6">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#9ca3af]">
                  Both Passed
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl tracking-tight text-[#0b0f19]">
                    {taskStats.ties}
                  </span>
                  <span className="text-sm text-[#9ca3af]">tasks</span>
                </div>
              </div>
              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-6">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#9ca3af]">
                  Baseline Wins
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl tracking-tight text-[#64748b]">
                    {taskStats.baselineWins}
                  </span>
                  <span className="text-sm text-[#9ca3af]">tasks</span>
                </div>
              </div>
              <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-6">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#9ca3af]">
                  Both Failed
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl tracking-tight text-[#0b0f19]">
                    {taskStats.bothFailed}
                  </span>
                  <span className="text-sm text-[#9ca3af]">tasks</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-12">
            <div
              role="alert"
              className="rounded-[12px] border border-[#c9a66b]/30 bg-[#fdf6ed] px-6 py-4 text-[#c9a66b]"
            >
              <span className="font-medium">Note:</span> {error}
            </div>
          </div>
        )}

        {/* Why RAG Wins */}
        {report && ragWinPatterns.length > 0 && (
          <section className="w-full border-t border-[rgba(0,0,0,0.06)] bg-[#fbf7f2]">
            <div className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
              <div className="mb-16 max-w-[640px]">
                <span className="mb-5 block text-[11px] font-medium tracking-[0.15em] text-[#64748b]">
                  Pattern Analysis
                </span>
                <h2 className="font-display text-4xl font-normal leading-[1.15] text-[#0b0f19] lg:text-5xl">
                  Why RAG wins.
                </h2>
                <p className="mt-8 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                  RAG's retrieval of verified Q# examples helps avoid common pitfalls that trip up baseline LLMs.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ragWinPatterns.map((pattern) => (
                  <div
                    key={pattern.category}
                    className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white p-8 transition-shadow hover:shadow-lg"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-base font-semibold text-[#0b0f19]">
                        {pattern.category}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fdf6ed] text-sm font-bold text-[#c9a66b]">
                        {pattern.count}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[#6b7280]">
                      {pattern.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Tasks */}
        {report && allTaskResults.length > 0 && (
          <section className="w-full border-t border-[rgba(0,0,0,0.06)] bg-white">
            <div className="mx-auto max-w-[1440px] px-6 py-32 lg:px-12">
              {/* Header */}
              <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-[640px]">
                  <span className="mb-5 block text-[11px] font-medium tracking-[0.15em] text-[#64748b]">
                    Task Breakdown
                  </span>
                  <h2 className="font-display text-4xl font-normal leading-[1.15] text-[#0b0f19] lg:text-5xl">
                    All tasks.
                  </h2>
                  <p className="mt-8 text-[17px] font-light leading-[1.8] text-[#6b7280]">
                    Click any task to expand and compare the generated code side by side.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-[#fdf6ed] px-4 py-2 text-xs font-medium text-[#c9a66b]">
                    RAG: {taskStats.ragPassed} passed
                  </span>
                  <span className="rounded-lg bg-[#f3f4f6] px-4 py-2 text-xs font-medium text-[#64748b]">
                    Baseline: {taskStats.baselinePassed} passed
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "rag-wins", label: `RAG Wins (${taskStats.ragWins})` },
                    { key: "baseline-wins", label: `Baseline Wins (${taskStats.baselineWins})` },
                    { key: "ties", label: `Ties (${taskStats.ties})` },
                    { key: "both-failed", label: `Both Failed (${taskStats.bothFailed})` },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key as FilterType)}
                      className="rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                      style={{
                        background: filter === f.key ? "white" : "transparent",
                        color: filter === f.key ? "#0b0f19" : "#6b7280",
                        border: filter === f.key ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
                        boxShadow: filter === f.key ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-[rgba(0,0,0,0.08)] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#c9a66b]"
                    style={{ color: "#0b0f19" }}
                  />
                </div>
              </div>

              {/* Task List */}
              <div className="flex flex-col gap-4">
                {filteredTasks.map((task) => {
                  const isExpanded = expandedTask === task.id;
                  const { diffLines1, diffLines2 } = getLineDiffs(task.ragCode, task.baselineCode);

                  return (
                    <div
                      key={task.id}
                      className="overflow-hidden rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-white transition-shadow hover:shadow-md"
                    >
                      {/* Task Row */}
                      <button
                        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                        className="flex w-full items-center justify-between px-8 py-6 text-left transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-[#0b0f19]">
                              {task.id}
                            </span>
                            {task.ragWon && (
                              <span className="rounded-md bg-[#fdf6ed] px-2.5 py-1 text-[10px] font-semibold text-[#c9a66b]">
                                RAG WIN
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 truncate text-sm text-[#9ca3af]">
                            {task.description}
                          </p>
                        </div>

                        <div className="ml-6 flex items-center gap-8">
                          <div className="flex items-center gap-6 text-xs font-medium">
                            <span className="inline-flex items-center gap-1.5" style={{ color: task.ragPass ? "#6b8e6b" : "#b87070" }}>
                              {task.ragPass ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <XCircleIcon className="h-3.5 w-3.5" />}
                              RAG
                            </span>
                            <span className="inline-flex items-center gap-1.5" style={{ color: task.baselinePass ? "#6b8e6b" : "#b87070" }}>
                              {task.baselinePass ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <XCircleIcon className="h-3.5 w-3.5" />}
                              Base
                            </span>
                          </div>

                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            style={{
                              color: "#9ca3af",
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 200ms ease",
                            }}
                          >
                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-[rgba(0,0,0,0.06)] bg-[#fafaf9] px-8 py-8">
                          {/* Error context */}
                          {task.baselineError && !task.baselinePass && (
                            <div className="mb-6 rounded-lg bg-[#fdf4f4] px-5 py-3 text-sm text-[#b87070]">
                              <span className="font-medium">Baseline error:</span> {getErrorSummary(task.baselineError)}
                            </div>
                          )}

                          {/* Diff mode toggle */}
                          <div className="mb-6 flex items-center justify-between">
                            <span className="text-sm font-medium text-[#64748b]">
                              Code Comparison
                            </span>
                            <div className="flex gap-1 rounded-lg bg-[rgba(0,0,0,0.04)] p-1">
                              <button
                                onClick={() => setDiffMode("side-by-side")}
                                className="rounded-md px-4 py-2 text-xs font-medium transition-all"
                                style={{
                                  background: diffMode === "side-by-side" ? "white" : "transparent",
                                  color: diffMode === "side-by-side" ? "#0b0f19" : "#9ca3af",
                                  boxShadow: diffMode === "side-by-side" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                                }}
                              >
                                Side by Side
                              </button>
                              <button
                                onClick={() => setDiffMode("unified")}
                                className="rounded-md px-4 py-2 text-xs font-medium transition-all"
                                style={{
                                  background: diffMode === "unified" ? "white" : "transparent",
                                  color: diffMode === "unified" ? "#0b0f19" : "#9ca3af",
                                  boxShadow: diffMode === "unified" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                                }}
                              >
                                Unified
                              </button>
                            </div>
                          </div>

                          {/* Code Cards */}
                          {diffMode === "side-by-side" ? (
                            <div className="grid gap-6 lg:grid-cols-2">
                              {/* RAG Code */}
                              <div className="overflow-hidden rounded-xl border border-[rgba(0,0,0,0.06)]">
                                <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-white px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full"
                                      style={{ background: task.ragPass ? "#6b8e6b" : "#b87070" }}
                                    />
                                    <span className="text-sm font-medium text-[#64748b]">
                                      RAG Output
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => copyToClipboard(task.ragCode)}
                                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium text-[#9ca3af] transition-colors hover:bg-[#f3f4f6]"
                                  >
                                    <CopyIcon className="h-3.5 w-3.5" />
                                    Copy
                                  </button>
                                </div>
                                <div
                                  className="scrollbar-thin max-h-[450px] overflow-auto p-5"
                                  style={{ background: "#1e1e2e" }}
                                >
                                  <pre className="font-mono text-[13px] leading-[1.7]" style={{ color: "#cdd6f4" }}>
                                    {task.ragCode.split('\n').map((line, i) => (
                                      <div
                                        key={i}
                                        className="px-3 -mx-3"
                                        style={{
                                          background: diffLines1.has(i) ? "rgba(166, 227, 161, 0.1)" : "transparent",
                                          borderLeft: diffLines1.has(i) ? "3px solid #a6e3a1" : "3px solid transparent",
                                        }}
                                      >
                                        {line || " "}
                                      </div>
                                    ))}
                                  </pre>
                                </div>
                              </div>

                              {/* Baseline Code */}
                              <div className="overflow-hidden rounded-xl border border-[rgba(0,0,0,0.06)]">
                                <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-white px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full"
                                      style={{ background: task.baselinePass ? "#6b8e6b" : "#b87070" }}
                                    />
                                    <span className="text-sm font-medium text-[#64748b]">
                                      Baseline Output
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => copyToClipboard(task.baselineCode)}
                                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium text-[#9ca3af] transition-colors hover:bg-[#f3f4f6]"
                                  >
                                    <CopyIcon className="h-3.5 w-3.5" />
                                    Copy
                                  </button>
                                </div>
                                <div
                                  className="scrollbar-thin max-h-[450px] overflow-auto p-5"
                                  style={{ background: "#1e1e2e" }}
                                >
                                  <pre className="font-mono text-[13px] leading-[1.7]" style={{ color: "#cdd6f4" }}>
                                    {task.baselineCode.split('\n').map((line, i) => (
                                      <div
                                        key={i}
                                        className="px-3 -mx-3"
                                        style={{
                                          background: diffLines2.has(i) ? "rgba(243, 139, 168, 0.1)" : "transparent",
                                          borderLeft: diffLines2.has(i) ? "3px solid #f38ba8" : "3px solid transparent",
                                        }}
                                      >
                                        {line || " "}
                                      </div>
                                    ))}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Unified Diff */
                            <div className="overflow-hidden rounded-xl border border-[rgba(0,0,0,0.06)]">
                              <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-white px-5 py-4">
                                <span className="text-sm font-medium text-[#64748b]">
                                  Unified Diff
                                </span>
                              </div>
                              <div
                                className="scrollbar-thin max-h-[550px] overflow-auto p-5"
                                style={{ background: "#1e1e2e" }}
                              >
                                <pre className="font-mono text-[13px] leading-[1.7]">
                                  {(() => {
                                    const ragLines = task.ragCode.split('\n');
                                    const baseLines = task.baselineCode.split('\n');
                                    const maxLen = Math.max(ragLines.length, baseLines.length);
                                    const diffOutput: JSX.Element[] = [];

                                    for (let i = 0; i < maxLen; i++) {
                                      const ragLine = ragLines[i] || '';
                                      const baseLine = baseLines[i] || '';

                                      if (ragLine === baseLine) {
                                        diffOutput.push(
                                          <div key={`same-${i}`} className="px-3 -mx-3" style={{ color: "#cdd6f4" }}>
                                            {"  "}{ragLine || " "}
                                          </div>
                                        );
                                      } else {
                                        if (baseLine) {
                                          diffOutput.push(
                                            <div
                                              key={`del-${i}`}
                                              className="px-3 -mx-3"
                                              style={{
                                                background: "rgba(243, 139, 168, 0.15)",
                                                color: "#f38ba8",
                                              }}
                                            >
                                              {"- "}{baseLine}
                                            </div>
                                          );
                                        }
                                        if (ragLine) {
                                          diffOutput.push(
                                            <div
                                              key={`add-${i}`}
                                              className="px-3 -mx-3"
                                              style={{
                                                background: "rgba(166, 227, 161, 0.15)",
                                                color: "#a6e3a1",
                                              }}
                                            >
                                              {"+ "}{ragLine}
                                            </div>
                                          );
                                        }
                                      }
                                    }

                                    return diffOutput;
                                  })()}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white py-20 text-center text-sm text-[#9ca3af]">
                    No tasks match your filter
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Methodology */}
        {report && (
          <section className="w-full border-t border-[rgba(0,0,0,0.06)] bg-[#fbf7f2]">
            <div className="mx-auto max-w-[1440px] px-6 py-24 lg:px-12">
              <div className="mb-16">
                <span className="mb-5 block text-[11px] font-medium tracking-[0.15em] text-[#64748b]">
                  Methodology
                </span>
                <h2 className="font-display text-3xl font-normal leading-[1.15] text-[#0b0f19]">
                  How we evaluate.
                </h2>
              </div>

              <div className="grid gap-12 lg:grid-cols-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0b0f19]">
                    Evaluation
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
                    Real Q# compilation with xUnit tests. Each task is attempted 3 times to measure pass@1 and pass@3.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0b0f19]">
                    Toolchain
                  </h3>
                  <p className="mt-3 font-mono text-sm text-[#6b7280]">
                    QDK 0.28 · .NET 6 · xUnit
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0b0f19]">
                    RAG Corpus
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">
                    Official QDK samples and documentation from Microsoft's quantum repository.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0b0f19]">
                    Model
                  </h3>
                  <p className="mt-3 font-mono text-sm text-[#6b7280]">
                    GPT-4o
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

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
