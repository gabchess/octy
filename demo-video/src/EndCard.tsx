// Segment 8: [55-60s] End card — Octy branding, repo, logos, hashtag
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "./theme";

const useFadeSlide = (
  frame: number,
  startFrame: number,
  distance = 20,
): React.CSSProperties => ({
  opacity: interpolate(frame, [startFrame, startFrame + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }),
  transform: `translateY(${interpolate(
    frame,
    [startFrame, startFrame + 14],
    [distance, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  )}px)`,
});

const LogoPlaceholder: React.FC<{ label: string; opacity: number }> = ({
  label,
  opacity,
}) => (
  <div
    style={{
      width: 120,
      height: 48,
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity,
      fontFamily: FONTS.sans,
    }}
  >
    <span
      style={{
        color: COLORS.textDim,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  </div>
);

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scaleProgress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.7 },
    durationInFrames: 18,
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
        gap: 0,
        position: "relative",
      }}
    >
      {/* Subtle radial glow behind the wordmark */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accent}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Wordmark */}
      <p
        style={{
          color: COLORS.text,
          fontSize: 120,
          fontWeight: 800,
          margin: 0,
          letterSpacing: "-3px",
          lineHeight: 1,
          transform: `scale(${0.7 + 0.3 * scaleProgress})`,
          opacity: scaleProgress,
        }}
      >
        Octy
      </p>

      {/* Tagline */}
      <p
        style={{
          color: COLORS.textDim,
          fontSize: 28,
          fontWeight: 400,
          margin: 0,
          marginTop: 16,
          textAlign: "center",
          ...useFadeSlide(frame, 12),
        }}
      >
        DeFi Intelligence on Decentralized GPUs
      </p>

      {/* Repo URL */}
      <p
        style={{
          color: COLORS.accent,
          fontSize: 22,
          fontWeight: 500,
          margin: 0,
          marginTop: 20,
          fontFamily: "monospace",
          letterSpacing: "0.02em",
          ...useFadeSlide(frame, 20),
        }}
      >
        github.com/gabrieltemtsen/octy
      </p>

      {/* Logo row — placeholder boxes; Gabe replaces with real PNGs */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 36,
          ...useFadeSlide(frame, 30, 12),
        }}
      >
        <LogoPlaceholder label="Nosana" opacity={logoOpacity} />
        <LogoPlaceholder label="ElizaOS" opacity={logoOpacity} />
      </div>

      {/* Hashtag */}
      <p
        style={{
          color: COLORS.textDim,
          fontSize: 18,
          fontWeight: 500,
          margin: 0,
          marginTop: 24,
          letterSpacing: "0.04em",
          ...useFadeSlide(frame, 40, 8),
        }}
      >
        #NosanaAgentChallenge
      </p>
    </div>
  );
};
