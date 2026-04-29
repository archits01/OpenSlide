"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ZoomIn } from "lucide-react";
import { RibbonGroup, RibbonButton, RibbonButtonLarge } from "../primitives";
import { useSheetCommands } from "../hooks/useSheetCommands";
import { useSheetFacade } from "../SheetFacadeContext";

const ZOOM_PRESETS = [200, 100, 75, 50, 25];

export function ViewZoomGroup() {
  const facadeRef = useSheetFacade();
  const commands = useSheetCommands(facadeRef);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState("");
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Sync preset selection when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      const current = commands.currentZoom;
      if (ZOOM_PRESETS.includes(current)) {
        setSelectedPreset(current);
        setCustomValue("");
      } else {
        setSelectedPreset(null);
        setCustomValue(String(current));
      }
    }
  }, [dialogOpen, commands.currentZoom]);

  // Calculate position when dialog opens
  useEffect(() => {
    if (!dialogOpen || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 2, left: rect.left });
  }, [dialogOpen]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!dialogOpen) return;
    function onDown(e: MouseEvent) {
      if (
        dialogRef.current && !dialogRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) setDialogOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDialogOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dialogOpen]);

  const handleOk = () => {
    if (selectedPreset !== null) {
      commands.setZoom(selectedPreset);
    } else {
      const val = parseInt(customValue, 10);
      if (!isNaN(val) && val >= 10 && val <= 400) {
        commands.setZoom(val);
      }
    }
    setDialogOpen(false);
  };

  return (
    <RibbonGroup label="Zoom">
      <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
        {/* Zoom large button with dialog */}
        <div ref={anchorRef}>
          <RibbonButtonLarge
            icon={<ZoomIn size={20} />}
            label="Zoom"
            tooltip="Open Zoom dialog"
            onClick={() => setDialogOpen((o) => !o)}
          />
        </div>
        {dialogOpen && createPortal(
          <div
            ref={dialogRef}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: 280,
              background: "#FFFFFF",
              border: "1px solid #C8C6C4",
              borderRadius: 4,
              boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
              zIndex: 10000,
              padding: 0,
            }}
          >
            {/* Title */}
            <div style={{ padding: "10px 14px 6px", fontWeight: 600, fontSize: 13, color: "#333", borderBottom: "1px solid #E8E8E8" }}>
              Zoom
            </div>

            {/* Body */}
            <div style={{ padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>
                Current zoom: {commands.currentZoom}%
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#333", marginBottom: 6 }}>
                Magnification
              </div>

              {/* Preset radio buttons */}
              {ZOOM_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setSelectedPreset(preset);
                    setCustomValue("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    height: 26,
                    padding: "0 4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#333",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "2px solid #666",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {selectedPreset === preset && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#4338CA",
                        }}
                      />
                    )}
                  </span>
                  {preset}%
                </button>
              ))}

              {/* Custom input row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 26,
                  padding: "0 4px",
                  marginTop: 2,
                }}
              >
                <button
                  onClick={() => {
                    setSelectedPreset(null);
                    if (!customValue) setCustomValue(String(commands.currentZoom));
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "2px solid #666",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {selectedPreset === null && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#4338CA",
                        }}
                      />
                    )}
                  </span>
                </button>
                <span style={{ fontSize: 12, color: "#333" }}>Custom:</span>
                <input
                  type="number"
                  min={10}
                  max={400}
                  value={customValue}
                  onChange={(e) => {
                    setCustomValue(e.target.value);
                    setSelectedPreset(null);
                  }}
                  onFocus={() => setSelectedPreset(null)}
                  style={{
                    width: 60,
                    height: 22,
                    border: "1px solid #C8C6C4",
                    borderRadius: 3,
                    padding: "0 6px",
                    fontSize: 12,
                    color: "#333",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: 12, color: "#666" }}>%</span>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 6,
                padding: "8px 14px",
                borderTop: "1px solid #E8E8E8",
              }}
            >
              <button
                onClick={handleOk}
                style={{
                  height: 26,
                  padding: "0 16px",
                  border: "1px solid #4338CA",
                  borderRadius: 3,
                  background: "#4338CA",
                  color: "#FFF",
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#3730A3"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#4338CA"; }}
              >
                OK
              </button>
              <button
                onClick={() => setDialogOpen(false)}
                style={{
                  height: 26,
                  padding: "0 16px",
                  border: "1px solid #C8C6C4",
                  borderRadius: 3,
                  background: "#FFFFFF",
                  color: "#333",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F0F0F0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* Smaller buttons column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <RibbonButton
            icon={null}
            label="100%"
            tooltip="Zoom to 100%"
            onClick={() => commands.zoomTo100()}
            showLabel
          />
          <RibbonButton
            icon={null}
            label="Zoom to Selection"
            tooltip="Zoom to fit the current selection"
            onClick={() => commands.zoomToSelection()}
            showLabel
          />
        </div>
      </div>
    </RibbonGroup>
  );
}
