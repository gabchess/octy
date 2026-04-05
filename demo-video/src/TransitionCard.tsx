// Segment 2: [3-6s] "Watch this" — staggered line reveals, hard cut exit
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "./theme";

const LINE_STARTS = [0, 12, 24] as const;
const FADE_DURATION = 12;

const useFadeIn = (frame: number, startFrame: number) => ({
  opacity: interpolate(
    frame,
    [startFrame, startFrame + FADE_DURATION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  ),
  transform: `translateY(${interpolate(
    frame,
    [startFrame, startFrame + FADE_DURATION],
    [14, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  )}px)`,
});

export const TransitionCard: React.FC = () => {
  const frame = useCurrentFrame();

  const line1Style = useFadeIn(frame, LINE_STARTS[0]);
  const line2Style = useFadeIn(frame, LINE_STARTS[1]);
  const line3Style = useFadeIn(frame, LINE_STARTS[2]);

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
        gap: 24,
      }}
    >
      <p
        style={{
          color: COLORS.accent,
          fontSize: 42,
          fontWeight: 700,
          margin: 0,
          textAlign: "center",
          ...line1Style,
        }}
      >
        5,000+ DeFi protocols.
      </p>

      <p
        style={{
          color: COLORS.textDim,
          fontSize: 32,
          fontWeight: 400,
          margin: 0,
          textAlign: "center",
          lineHeight: 1.4,
          ...line2Style,
        }}
      >
        Finding which ones matter used to take a research team.
      </p>

      <p
        style={{
          color: COLORS.text,
          fontSize: 48,
          fontWeight: 700,
          margin: 0,
          textAlign: "center",
          ...line3Style,
        }}
      >
        Watch this.
      </p>
    </div>
  );
};
