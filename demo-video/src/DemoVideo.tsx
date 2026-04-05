// Main composition — sequences all 8 segments into 60 seconds (1800 frames @ 30fps)
import { Sequence } from "remotion";
import { EndCard } from "./EndCard";
import { ScreenRecording } from "./ScreenRecording";
import { TechStackCard } from "./TechStackCard";
import { TitleCard } from "./TitleCard";
import { TransitionCard } from "./TransitionCard";

// Segment timing in frames (30fps)
// [0-3s]   TitleCard         0   → 90
// [3-6s]   TransitionCard    90  → 180
// [6-10s]  Nosana dashboard  180 → 300
// [10-12s] Agent opens       300 → 360
// [12-40s] Main demo         360 → 1200
// [40-48s] Second query      1200 → 1440
// [48-55s] TechStackCard     1440 → 1650
// [55-60s] EndCard           1650 → 1800

const SEGMENTS = {
  title: { from: 0, duration: 90 },
  transition: { from: 90, duration: 90 },
  nosana: { from: 180, duration: 120 },
  agentOpens: { from: 300, duration: 60 },
  mainDemo: { from: 360, duration: 840 },
  yieldQuery: { from: 1200, duration: 240 },
  techStack: { from: 1440, duration: 210 },
  endCard: { from: 1650, duration: 150 },
} as const;

export const DemoVideo: React.FC = () => {
  return (
    <>
      {/* 1 — Title card */}
      <Sequence
        from={SEGMENTS.title.from}
        durationInFrames={SEGMENTS.title.duration}
        name="TitleCard"
      >
        <TitleCard />
      </Sequence>

      {/* 2 — Transition card */}
      <Sequence
        from={SEGMENTS.transition.from}
        durationInFrames={SEGMENTS.transition.duration}
        name="TransitionCard"
      >
        <TransitionCard />
      </Sequence>

      {/* 3 — Nosana dashboard screen recording */}
      <Sequence
        from={SEGMENTS.nosana.from}
        durationInFrames={SEGMENTS.nosana.duration}
        name="NosanaDashboard"
      >
        <ScreenRecording
          filename="01-nosana-dashboard.mov"
          overlayText="Running on Nosana decentralized GPU network"
        />
      </Sequence>

      {/* 4 — Agent opens */}
      <Sequence
        from={SEGMENTS.agentOpens.from}
        durationInFrames={SEGMENTS.agentOpens.duration}
        name="AgentOpens"
      >
        <ScreenRecording
          filename="02-agent-opens.mov"
          overlayText="Octy — DeFi Intelligence Agent"
        />
      </Sequence>

      {/* 5 — Main demo query */}
      <Sequence
        from={SEGMENTS.mainDemo.from}
        durationInFrames={SEGMENTS.mainDemo.duration}
        name="MainDemo"
      >
        <ScreenRecording
          filename="03-main-query.mov"
          overlayText="Real-time data from DeFiLlama + CoinGecko"
        />
      </Sequence>

      {/* 6 — Yield query */}
      <Sequence
        from={SEGMENTS.yieldQuery.from}
        durationInFrames={SEGMENTS.yieldQuery.duration}
        name="YieldQuery"
      >
        <ScreenRecording
          filename="04-yield-query.mov"
          overlayText="Live yields. No hallucinations. Just data."
        />
      </Sequence>

      {/* 7 — Tech stack card */}
      <Sequence
        from={SEGMENTS.techStack.from}
        durationInFrames={SEGMENTS.techStack.duration}
        name="TechStackCard"
      >
        <TechStackCard />
      </Sequence>

      {/* 8 — End card */}
      <Sequence
        from={SEGMENTS.endCard.from}
        durationInFrames={SEGMENTS.endCard.duration}
        name="EndCard"
      >
        <EndCard />
      </Sequence>
    </>
  );
};
