import * as React from "react"
import * as RechartsPrimitive from "recharts"

const ChartContext = React.createContext<ChartConfig | null>(null)

type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string }
    | { theme?: Record<string, string> }
  )
}

type ChartProps = {
  config: ChartConfig
  children: React.ReactNode
  className?: string
}

function Chart({ config, children, className }: ChartProps) {
  return (
    <ChartContext.Provider value={config}>
      <div className={className}>{children}</div>
    </ChartContext.Provider>
  )
}

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <Chart />")
  }

  return context
}

export { Chart, useChart }
export type { ChartConfig }

// Recharts components with accessibility layer
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ReactElement<RechartsPrimitive.ResponsiveContainerProps>
  }
>(({ config, children, className, ...props }, ref) => {
  const chartId = React.useId() || generateId()

  return (
    <Chart config={config}>
      <div ref={ref} data-chart={chartId} className={className} {...props}>
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </Chart>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(colorConfig).reduce((acc, [key, value]) => {
          const color =
            value.theme?.light || value.color || `hsl(var(--chart-${key}))`
          acc += `
            [data-chart="${id}"] {
              --color-${key}: ${color};
            }
          `
          return acc
        }, ""),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const context = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = labelKey ?? item.name
      const value =
        label ?? item.name ?? (labelFormatter?.(item.payload[key]) ?? key)

      return (
        <div className="grid gap-1">
          <div className={labelClassName}>{value}</div>
        </div>
      )
    }, [hideLabel, payload, labelKey, label, labelFormatter, labelClassName])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        role="tooltip"
        aria-label="Chart tooltip"
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-xl",
          "transition-all duration-200",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((value, index) => {
            return (
              <div
                key={index}
                className={cn(
                  "flex w-full items-stretch gap-2",
                  nestLabel ? "items-center" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex shrink-0 items-center gap-1",
                    nestLabel ? "w-0" : "w-full"
                  )}
                >
                  {!hideIndicator && value.color && (
                    <div
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-[2px]",
                        {
                          "rounded-full": indicator === "dot",
                          "h-2.5 w-1.5": indicator === "line",
                          "border-2 border-dashed": indicator === "dashed",
                        }
                      )}
                      style={{
                        backgroundColor: value.color,
                      }}
                    />
                  )}
                  {value.name && !hideLabel && (
                    <span className="text-slate-700">{value.name}</span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-900">
                    {formatter?.(value.value, value.name, value.payload) ||
                      value.value}
                  </span>
                  {value.name && nestLabel && (
                    <span className="text-[0.7rem] text-slate-500">
                      {value.name}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const COLORS = [
  "#0f766e", // RAG color (teal)
  "#94a3b8", // Baseline color (slate)
  "#f43f5e", // Accent (rose)
  "#f59e0b", // Amber
  "#3b82f6", // Blue
]

const generateId = () => {
  return `chart-${Math.random().toString(36).substring(2, 9)}`
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  COLORS,
}
