"use client"

import React from "react"

interface Series {
  label: string
  data: number[]
  color?: string
}

interface Props {
  categories: string[]
  series: Series[]
  maxOverride?: number
}

function formatMoney(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`
  return `$${n}`
}

export default function SalesChart({ categories, series, maxOverride }: Props) {
  if (!series || series.length === 0) return <div className="text-sm text-muted-foreground pl-3">No sales data</div>

  // compute max across series
  const flat = series.flatMap(s => s.data)
  const computedMax = Math.max(...flat, 1)
  const max = typeof maxOverride === 'number' && maxOverride > 0 ? maxOverride : computedMax

  const width = Math.max(700, categories.length * 60)
  const height = 320
  const paddingLeft = 56
  const paddingRight = 36
  const paddingTop = 20
  const paddingBottom = 40

  const plotW = width - paddingLeft - paddingRight
  const plotH = height - paddingTop - paddingBottom

  // grid bands (4 bands)
  const bands = 4

  // helper: map value -> y
  const yFor = (v: number) => paddingTop + plotH - (v / max) * plotH

  const colors = ['#06b6d4', '#f59e0b', '#7c3aed', '#ef4444']

  // responsiveness helpers: adapt label density, point size and stroke by category count
  const denom = Math.max(1, categories.length - 1)
  const labelStep = Math.ceil(categories.length / 12) // aim to show at most ~12 x labels
  const labelFontSize = categories.length > 20 ? 10 : categories.length > 12 ? 11 : 12
  const pointRadius = Math.max(1.2, Math.min(4, 40 / Math.max(6, categories.length)))
  const strokePrimary = Math.max(1.2, Math.min(3.5, 28 / Math.max(6, categories.length)))
  const strokeOther = Math.max(1, Math.min(2.2, 18 / Math.max(6, categories.length)))

  // build path points for a series
  const buildPoints = (arr: number[]) => arr.map((v, i) => {
    const x = paddingLeft + (i / denom) * plotW
    const y = yFor(v || 0)
    return { x, y }
  })

  const primary = series[0]
  const primaryPoints = buildPoints(primary.data)

  return (
    <div className="w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(6,182,212,0.18)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.03)" />
          </linearGradient>
        </defs>

        {/* background bands */}
        {Array.from({ length: bands }).map((_, i) => {
          const y0 = paddingTop + (plotH * i) / bands
          const h = plotH / bands
          return (
            <rect key={i} x={paddingLeft} y={y0} width={plotW} height={h} fill={i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)'} />
          )
        })}

        {/* y axis labels and grid lines */}
        {Array.from({ length: bands + 1 }).map((_, i) => {
          const v = Math.round(max * (1 - i / bands))
          const y = paddingTop + (plotH * i) / bands
          return (
            <g key={i}>
              <line x1={paddingLeft} x2={width - paddingRight} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
              <text x={paddingLeft - 12} y={y + 5} fontSize={12} textAnchor="end" fill="#9ca3af">{formatMoney(v)}</text>
            </g>
          )
        })}

        {/* area under primary series */}
        {primaryPoints.length > 0 && (
          <path d={
            'M ' + primaryPoints.map((p, i) => `${p.x} ${p.y}`).join(' L ') +
            ` L ${paddingLeft + plotW} ${paddingTop + plotH} L ${paddingLeft} ${paddingTop + plotH} Z`
          } fill="url(#areaGrad)" stroke="none" />
        )}

        {/* lines for each series */}
        {series.map((s, si) => {
          const pts = buildPoints(s.data)
          const path = pts.map(p => `${p.x} ${p.y}`).join(' L ')
          const stroke = s.color || colors[si % colors.length]
          return (
            <g key={s.label}>
              <path d={`M ${path}`} fill="none" stroke={stroke} strokeWidth={si === 0 ? strokePrimary : strokeOther} strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, idx) => (
                <circle key={idx} cx={p.x} cy={p.y} r={si === 0 ? pointRadius + 0.8 : Math.max(0.9, pointRadius - 0.8)} fill={stroke} />
              ))}
            </g>
          )
        })}

        {/* x labels (density-controlled) */}
        {categories.map((c, i) => {
          const x = paddingLeft + (i / denom) * plotW
          const show = (i % labelStep === 0) || i === categories.length - 1 || categories.length <= 8
          return (
            <text key={c} x={x} y={height - 10} fontSize={labelFontSize} textAnchor="middle" fill="#9ca3af">
              {show ? c : ''}
            </text>
          )
        })}

        {/* legend */}
        <g transform={`translate(${width - paddingRight - 140}, ${paddingTop})`}>
          {series.map((s, i) => (
            <g key={s.label} transform={`translate(0, ${i * 18})`}>
              <rect x={0} y={-10} width={10} height={10} rx={2} fill={s.color || colors[i % colors.length]} />
              <text x={16} y={-2} fontSize={12} fill="#cbd5e1">{s.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
