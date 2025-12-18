'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'

const THEMES = { light: '', dark: '.dark' } as const

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) {
    throw new Error('useChart must be used within <ChartContainer />')
  }
  return ctx
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ReactNode
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn('flex aspect-video justify-center text-xs', className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, c]) => c.color || c.theme,
  )

  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, item]) => {
    const color =
      item.theme?.[theme as keyof typeof item.theme] || item.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Tooltip                                                                     */
/* -------------------------------------------------------------------------- */

const ChartTooltip = RechartsPrimitive.Tooltip

type TooltipPayloadItem = {
  name?: string
  dataKey?: string
  value?: number | string
  color?: string
  payload?: Record<string, unknown>
}

type ChartTooltipContentProps = React.ComponentProps<'div'> & {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: React.ReactNode
}

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      className={cn(
        'rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl',
        className,
      )}
    >
      {label != null && (
        <div className="mb-1 font-medium">{String(label)}</div>
      )}

      <div className="grid gap-1">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? index)
          const itemConfig = config[key]

          return (
            <div
              key={index}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-muted-foreground">
                {itemConfig?.label ?? item.name}
              </span>
              {item.value != null && (
                <span className="font-mono font-medium">
                  {Number(item.value).toLocaleString()}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Legend                                                                      */
/* -------------------------------------------------------------------------- */

const ChartLegend = RechartsPrimitive.Legend

type LegendPayloadItem = {
  value?: string
  dataKey?: string
  color?: string
}

type ChartLegendContentProps = React.ComponentProps<'div'> & {
  payload?: LegendPayloadItem[]
}

function ChartLegendContent({
  payload,
  className,
}: ChartLegendContentProps) {
  const { config } = useChart()

  if (!payload || payload.length === 0) return null

  return (
    <div className={cn('flex gap-4', className)}>
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? index)
        const itemConfig = config[key]

        return (
          <div key={index} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded"
              style={{ backgroundColor: item.color }}
            />
            {itemConfig?.label}
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
