import React from "react";
import { AbsoluteFill } from "remotion";

export const TextWingmanAvatar: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background:
          "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.28), transparent 24%), linear-gradient(135deg, #7c3aed 0%, #a855f7 42%, #ec4899 100%)",
        display: "flex",
        fontFamily:
          'ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        justifyContent: "center",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "rgba(5, 5, 8, 0.9)",
          border: "10px solid rgba(255,255,255,0.28)",
          borderRadius: 180,
          boxShadow: "0 36px 120px rgba(0,0,0,0.35)",
          color: "white",
          display: "flex",
          fontSize: 172,
          fontWeight: 950,
          height: 430,
          justifyContent: "center",
          letterSpacing: -14,
          width: 430,
        }}
      >
        TW
      </div>
    </AbsoluteFill>
  );
};
