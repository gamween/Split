"use client"

import { useState } from "react"
import { isAddress } from "viem"
import { toast } from "@/components/ui/use-toast"

export type Recipient = { addr: string; bps: number }

type Props = {
  initial?: Recipient[]
  onSave: (recipients: Recipient[]) => void
  className?: string
  ctaLabel?: string
}

const grayButtonStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: "#737373",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
  transition: "background-color 0.15s ease",
}

const grayButtonDisabledStyle = {
  ...grayButtonStyle,
  backgroundColor: "#d4d4d4",
  cursor: "not-allowed",
}

function validate(rows: Recipient[]): string[] {
  const errors: string[] = []
  if (rows.length === 0) {
    errors.push("Add at least one recipient")
    return errors
  }
  if (rows.some((r) => !r.addr || !isAddress(r.addr))) {
    errors.push("Please enter valid EVM addresses")
  }
  if (rows.some((r) => r.bps === undefined || r.bps === null || Number.isNaN(r.bps) || r.bps <= 0)) {
    errors.push("Please fill all bps with positive values")
  }
  const total = rows.reduce((s, r) => s + Number(r.bps || 0), 0)
  if (total !== 10000) {
    errors.push("Total bps must equal 10000")
  }
  return errors
}

export function SplitConfigurator({ initial = [{ addr: "", bps: 0 }], onSave, className = "", ctaLabel = "Save Split" }: Props) {
  const [rows, setRows] = useState<Recipient[]>(initial)

  function setRow(i: number, patch: Partial<Recipient>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  function addRow(): void {
    setRows((prev) => [...prev, { addr: "", bps: 0 }])
  }

  function removeRow(): void {
    if (rows.length === 1) return
    setRows((prev) => prev.slice(0, -1))
  }

  function onEvenSplit(): void {
    if (rows.length === 0) return
    const base = Math.floor(10000 / rows.length)
    const remainder = 10000 - base * rows.length
    const next = rows.map((r, i) => ({ ...r, bps: base + (i < remainder ? 1 : 0) }))
    setRows(next)
  }

  function handleSave(): void {
    const errors = validate(rows)
    if (errors.length > 0) {
      errors.forEach((err) => {
        toast({
          title: "Validation Error",
          description: err,
          variant: "destructive",
        })
      })
      return
    }
    onSave(rows)
    toast({
      title: "Success",
      description: "Split saved",
    })
  }

  return (
    <div
      className={className}
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "28px",
        border: "1px solid #e5e5e5",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          paddingBottom: "20px",
          borderBottom: "1px solid #f5f5f5",
          gap: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: "600",
            color: "#171717",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "calc(100% - 90px)",
          }}
        >
          Configure my split
        </h2>
        <button
          onClick={onEvenSplit}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#262626",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.8125rem",
            fontWeight: "500",
            transition: "background-color 0.15s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#404040")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#262626")}
        >
          Even
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        {rows.map((row, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <input
              type="text"
              placeholder="0x..."
              value={row.addr}
              onChange={(e) => setRow(index, { addr: e.target.value.trim() })}
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                border: "1px solid #d4d4d4",
                borderRadius: "6px",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#a3a3a3"
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,120,255,0.08)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d4d4d4"
                e.currentTarget.style.boxShadow = "none"
              }}
            />
            <input
              type="number"
              min={0}
              max={10000}
              step={1}
              placeholder="bps"
              value={row.bps || ""}
              onChange={(e) => setRow(index, { bps: Number(e.target.value) })}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                border: "1px solid #d4d4d4",
                borderRadius: "6px",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#a3a3a3"
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,120,255,0.08)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d4d4d4"
                e.currentTarget.style.boxShadow = "none"
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <button
          onClick={addRow}
          style={grayButtonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#525252")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#737373")}
        >
          Add Row
        </button>
        <button
          onClick={removeRow}
          disabled={rows.length === 1}
          style={rows.length === 1 ? grayButtonDisabledStyle : grayButtonStyle}
          onMouseEnter={(e) => {
            if (rows.length > 1) e.currentTarget.style.backgroundColor = "#525252"
          }}
          onMouseLeave={(e) => {
            if (rows.length > 1) e.currentTarget.style.backgroundColor = "#737373"
          }}
        >
          Remove Row
        </button>
      </div>

      <button
        onClick={handleSave}
        style={{
          width: "100%",
          padding: "0.875rem",
          backgroundColor: "#262626",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "0.9375rem",
          fontWeight: "600",
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#404040")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#262626")}
      >
        {ctaLabel}
      </button>
    </div>
  )
}
