"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { chains } from "../../lib/chains";
import { encodeQR } from "../../lib/qr";
import { estimateFees, FeeEstimate } from "../../lib/feeEstimate";
import { validateTxInput } from "../../lib/validators";
import type { FeeSpeed } from "../../lib/env";

interface Props {
  chain: string;
}

const SPEED_OPTIONS: FeeSpeed[] = ["slow", "normal", "fast"];
const SPEED_LABELS: Record<FeeSpeed, string> = {
  slow: "Slow",
  normal: "Normal",
  fast: "Fast",
};

export default function CreateTransaction({ chain: parentChain }: Props) {
  const [chain, setChain] = useState(parentChain || "ethereum");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [speed, setSpeed] = useState<FeeSpeed>("normal");
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const amountPlaceholder =
    chain === "bitcoin"
      ? "Amount (BTC)"
      : chain === "solana"
      ? "Amount (SOL)"
      : "Amount (ETH)";

  // Load fee estimate when chain changes
  useEffect(() => {
    let isMounted = true;

    const loadFees = async () => {
      setFeeLoading(true);
      try {
        const estimate = await estimateFees(chain);
        if (isMounted) {
          setFeeEstimate(estimate);
        }
      } catch (e) {
        console.error("Failed to load fees:", e);
        if (isMounted) {
          setFeeEstimate(null);
        }
      } finally {
        if (isMounted) {
          setFeeLoading(false);
        }
      }
    };

    setQr("");
    setError("");
    loadFees();

    return () => {
      isMounted = false;
    };
  }, [chain]);

  const handleGenerate = async () => {
    // Validate input
    const validation = validateTxInput(from, to, amount, chain);
    if (!validation.valid) {
      setError(validation.errors.join(". "));
      setQr("");
      return;
    }

    setError("");
    setQr("");
    setLoading(true);

    try {
      const payload = await (chains as any)[chain].buildTx({
        from,
        to,
        amount,
        speed,
      });
      setQr(encodeQR({ chain, payload }));
    } catch (e: any) {
      setError(e.message || "Failed to build transaction");
    } finally {
      setLoading(false);
    }
  };

  const getFeeDisplay = (): string => {
    if (!feeEstimate) return "Loading...";
    const feeValue = feeEstimate[speed];
    return `${feeValue} ${feeEstimate.unit}`;
  };

  return (
    <div
      className="card"
      style={{
        background: "var(--bg-surface-container)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-4)",
      }}
    >
      {/* Divider accent line */}
      <div
        style={{
          width: "100%",
          height: 2,
          background: "linear-gradient(90deg, var(--primary) 0%, transparent 100%)",
          borderRadius: 1,
          marginBottom: "var(--spacing-2)",
        }}
      />

      <h2
        style={{
          fontFamily: "var(--font-headline)",
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        Initiate Transfer
      </h2>

      {/* Chain selector */}
      <select
        id="tx-chain"
        name="chain"
        value={chain}
        onChange={(e) => {
          setChain(e.target.value);
        }}
        style={{
          width: "100%",
          background: "var(--bg-surface-lowest)",
          border: "1px solid var(--ghost-border)",
          borderRadius: "var(--radius-lg)",
          padding: "0.625rem 1rem",
          color: "var(--text-primary)",
          fontFamily: "var(--font-label)",
          fontSize: "0.8125rem",
          cursor: "pointer",
        }}
      >
        {Object.entries(chains).map(([key, val]) => (
          <option key={key} value={key}>
            {val.label}
          </option>
        ))}
      </select>

      {/* Recipient */}
      <div>
        <label
          htmlFor="tx-recipient-address"
          style={{
            fontFamily: "var(--font-label)",
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            marginBottom: "var(--spacing-2)",
          }}
        >
          Recipient Address
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="tx-recipient-address"
            name="recipient-address"
            placeholder="Enter address..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-surface-lowest)",
              border: "1px solid var(--ghost-border)",
              borderRadius: "var(--radius-lg)",
              padding: "0.625rem 1rem",
              paddingRight: "2.5rem",
              color: "var(--text-primary)",
              fontFamily: "var(--font-label)",
              fontSize: "0.8125rem",
            }}
          />
          {to && (
            <button
              onClick={() => setTo("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: "var(--text-muted)" }}
              >
                close
              </span>
            </button>
          )}
        </div>
      </div>

      {/* From address */}
      <div>
        <label
          htmlFor="tx-from-address"
          style={{
            fontFamily: "var(--font-label)",
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            marginBottom: "var(--spacing-2)",
          }}
        >
          From Address
        </label>
        <input
          id="tx-from-address"
          name="from-address"
          placeholder="Enter your address..."
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={{
            width: "100%",
            background: "var(--bg-surface-lowest)",
            border: "1px solid var(--ghost-border)",
            borderRadius: "var(--radius-lg)",
            padding: "0.625rem 1rem",
            color: "var(--text-primary)",
            fontFamily: "var(--font-label)",
            fontSize: "0.8125rem",
          }}
        />
      </div>

      {/* Amount + Speed */}
      <div style={{ display: "flex", gap: "var(--spacing-3)", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 160px" }}>
          <label
            htmlFor="tx-amount"
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "block",
              marginBottom: "var(--spacing-2)",
            }}
          >
            {amountPlaceholder}
          </label>
          <input
            id="tx-amount"
            name="amount"
            placeholder="0.00"
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-surface-lowest)",
              border: "1px solid var(--ghost-border)",
              borderRadius: "var(--radius-lg)",
              padding: "0.625rem 1rem",
              color: "var(--text-primary)",
              fontFamily: "var(--font-label)",
              fontSize: "0.8125rem",
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "block",
              marginBottom: "var(--spacing-2)",
            }}
          >
            Speed
          </label>
          <div style={{ display: "flex", gap: 2 }}>
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                disabled={feeLoading}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  cursor: feeLoading ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-label)",
                  fontSize: "0.75rem",
                  fontWeight: speed === s ? 600 : 400,
                  background:
                    speed === s
                      ? "var(--primary)"
                      : "var(--bg-surface-highest)",
                  color:
                    speed === s
                      ? "var(--bg-base)"
                      : "var(--text-muted)",
                  transition: "all 0.15s ease",
                  opacity: feeLoading ? 0.5 : 1,
                }}
              >
                {SPEED_LABELS[s]}
              </button>
            ))}
          </div>
          {feeEstimate && (
            <p
              style={{
                fontFamily: "var(--font-label)",
                fontSize: "0.625rem",
                color: "var(--text-muted)",
                margin: "var(--spacing-1) 0 0",
              }}
            >
              Fee: {feeEstimate[speed]} {feeEstimate.unit}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(255, 56, 56, 0.1)",
            color: "var(--error)",
            padding: "var(--spacing-3)",
            borderRadius: "var(--radius-lg)",
            fontFamily: "var(--font-body)",
            fontSize: "0.8125rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{ display: "flex", gap: "var(--spacing-3)", flexWrap: "wrap" }}
      >
        <button
          onClick={handleGenerate}
          disabled={loading || feeLoading}
          className="btn-primary"
          style={{
            flex: "1 1 auto",
            opacity: loading || feeLoading ? 0.6 : 1,
            cursor: loading || feeLoading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Building..." : "Generate QR"}
        </button>
      </div>

      {/* QR output */}
      {qr && (
        <div
          className="animate-fade-in"
          style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}
        >
          <div
            style={{
              background: "white",
              padding: "var(--spacing-6)",
              borderRadius: "var(--radius-xl)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <QRCodeCanvas value={qr} size={200} />
          </div>

          <div
            style={{
              background: "rgba(255, 180, 0, 0.08)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--spacing-3)",
            }}
          >
            <p
              style={{
                color: "#ffb400",
                fontFamily: "var(--font-label)",
                fontSize: "0.75rem",
                fontWeight: 600,
                margin: 0,
              }}
            >
              ⚠️ Unsigned Transaction
            </p>
            <p
              style={{
                color: "rgba(255, 180, 0, 0.6)",
                fontSize: "0.75rem",
                margin: "0.25rem 0 0",
              }}
            >
              Scan this QR on your air-gapped signer. Then use "Broadcast Signed
              Transaction" to submit it.
            </p>
          </div>

          <pre
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "0.6875rem",
              background: "var(--bg-surface-lowest)",
              color: "var(--text-muted)",
              padding: "var(--spacing-3)",
              borderRadius: "var(--radius-lg)",
              overflow: "auto",
              maxHeight: 100,
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {qr}
          </pre>
        </div>
      )}
    </div>
  );
}