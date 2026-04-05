// Segment 7: [48-55s] Tech stack reveal — staggered pill cards + tagline
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "./theme";

interface StackItem {
  label: string;
  role: string;
}

const STACK: StackItem[] = [
  { label: "ElizaOS v2", role: "framework" },
  { label: "Nosana", role: "decentralized compute" },
  { label: "Qwen 3.5-27B", role: "model" },
  { label: "DeFiLlama + CoinGecko", role: "data" },
];

// Each pill animates in with a spring, staggered by 8 frames
const PILL_STAGGER = 8;
const TAGLINE_START = PILL_STAGGER * STACK.length + 10;

const StackPill: React.FC<{
  item: StackItem;
  index: number;
  frame: number;
  fps: number;
}> = ({ item, index, frame, fps }) => {
  const startFrame = index * PILL_STAGGER;

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
    durationInFrames: 20,
  });

  const opacity = interpolate(frame, [startFrame, startFrame + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        backgroundColor: COLORS.cardBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "20px 28px",
        opacity,
        transform: `scale(${0.88 + 0.12 * progress}) translateY(${(1 - progress) * 20}px)`,
        fontFamily: FONTS.sans,
        minWidth: 340,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: COLORS.accent,
          flexShrink: 0,
        }}
      />
      <div>
        <p
          style={{
            color: COLORS.text,
            fontSize: 26,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {item.label}
        </p>
        <p
          style={{
            color: COLORS.textDim,
            fontSize: 18,
            fontWeight: 400,
            margin: 0,
            marginTop: 4,
          }}
        >
          {item.role}
        </p>
      </div>
    </div>
  );
};

export const TechStackCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const taglineOpacity = interpolate(
    frame,
    [TAGLINE_START, TAGLINE_START + 12],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const taglineY = interpolate(
    frame,
    [TAGLINE_START, TAGLINE_START + 12],
    [16, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

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
        gap: 20,
        padding: "0 200px",
        boxSizing: "border-box",
      }}
    >
      {/* Section label */}
      <p
        style={{
          color: COLORS.accent,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          margin: 0,
          marginBottom: 8,
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Built with
      </p>

      {/* Pill grid — 2 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          width: "100%",
        }}
      >
        {STACK.map((item, i) => (
          <StackPill
            key={item.label}
            item={item}
            index={i}
            frame={frame}
            fps={fps}
          />
        ))}
      </div>

      {/* Tagline */}
      <p
        style={{
          color: COLORS.text,
          fontSize: 32,
          fontWeight: 700,
          margin: 0,
          marginTop: 16,
          textAlign: "center",
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Open source.{" "}
        <span style={{ color: COLORS.accent }}>Decentralized.</span> Free.
      </p>
    </div>
  );
};
