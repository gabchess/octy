// Reusable segment: plays a .mov from public/recordings/ with a bottom text overlay.
// When the file is missing (pre-recording phase), renders a placeholder panel.
import {
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { OffthreadVideo } from "remotion";
import { COLORS, FONTS } from "./theme";

interface ScreenRecordingProps {
  /** Filename inside public/recordings/, e.g. "01-nosana-dashboard.mov" */
  filename: string;
  /** Label shown at the bottom of the frame */
  overlayText: string;
  /** Whether to render the real video or a placeholder (default: true = use placeholder when file absent) */
  usePlaceholder?: boolean;
}

const OverlayBar: React.FC<{ text: string; frame: number }> = ({
  text,
  frame,
}) => {
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "18px 40px",
        background:
          "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity,
        fontFamily: FONTS.sans,
      }}
    >
      {/* Accent pip */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: COLORS.accent,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          color: COLORS.text,
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: "0.01em",
        }}
      >
        {text}
      </span>
    </div>
  );
};

const Placeholder: React.FC<{ filename: string; overlayText: string }> = ({
  filename,
  overlayText,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.placeholder,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        fontFamily: FONTS.sans,
      }}
    >
      {/* Grid overlay to suggest a screen */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 59px,
            ${COLORS.border} 59px,
            ${COLORS.border} 60px
          ), repeating-linear-gradient(
            90deg,
            transparent,
            transparent 59px,
            ${COLORS.border} 59px,
            ${COLORS.border} 60px
          )`,
          opacity: 0.4,
        }}
      />

      <p
        style={{
          color: COLORS.accent,
          fontSize: 22,
          fontWeight: 600,
          margin: 0,
          marginBottom: 12,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          opacity: 0.7,
        }}
      >
        [GABE_SCREEN_RECORD_HERE]
      </p>
      <p
        style={{
          color: COLORS.textDim,
          fontSize: 18,
          fontWeight: 400,
          margin: 0,
          fontFamily: "monospace",
          opacity: 0.6,
        }}
      >
        {filename}
      </p>

      <OverlayBar text={overlayText} frame={frame} />
    </div>
  );
};

export const ScreenRecording: React.FC<ScreenRecordingProps> = ({
  filename,
  overlayText,
  usePlaceholder = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  if (usePlaceholder) {
    return <Placeholder filename={filename} overlayText={overlayText} />;
  }

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        backgroundColor: COLORS.bg,
      }}
    >
      <OffthreadVideo
        src={staticFile(`recordings/${filename}`)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <OverlayBar text={overlayText} frame={frame} />
    </div>
  );
};
