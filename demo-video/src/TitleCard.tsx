// Segment 1: [0-3s] Opening hook — fade-in reveal, two lines
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "./theme";

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();

  // Line 1 appears at frame 0, Line 2 at frame 20
  const line1Opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line1Y = interpolate(frame, [0, 15], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line2Opacity = interpolate(frame, [20, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Y = interpolate(frame, [20, 38], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.sans,
        padding: "0 140px",
        boxSizing: "border-box",
      }}
    >
      {/* Accent line */}
      <div
        style={{
          width: 64,
          height: 3,
          backgroundColor: COLORS.accent,
          marginBottom: 40,
          opacity: line1Opacity,
        }}
      />

      <p
        style={{
          color: COLORS.textDim,
          fontSize: 36,
          fontWeight: 400,
          margin: 0,
          marginBottom: 20,
          textAlign: "center",
          lineHeight: 1.4,
          opacity: line1Opacity,
          transform: `translateY(${line1Y}px)`,
        }}
      >
        DeFiLlama charges $49/month for AI DeFi research.
      </p>

      <p
        style={{
          color: COLORS.text,
          fontSize: 52,
          fontWeight: 700,
          margin: 0,
          textAlign: "center",
          lineHeight: 1.25,
          opacity: line2Opacity,
          transform: `translateY(${line2Y}px)`,
          letterSpacing: "-0.5px",
        }}
      >
        We built it for free — on decentralized GPUs.
      </p>
    </div>
  );
};
