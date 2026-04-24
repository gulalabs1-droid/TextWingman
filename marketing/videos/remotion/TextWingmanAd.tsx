import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoProps } from "./types";

const brand = {
  ink: "#f9fafb",
  muted: "rgba(249, 250, 251, 0.68)",
  quiet: "rgba(249, 250, 251, 0.42)",
  panel: "rgba(255, 255, 255, 0.075)",
  line: "rgba(255, 255, 255, 0.14)",
  purple: "#9b5cff",
  pink: "#ec5fc7",
  green: "#34d399",
  red: "#fb7185",
  gold: "#fbbf24",
};

const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const pop = (frame: number, delay: number) => {
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 130, mass: 0.9 },
  });
};

const FitText: React.FC<{
  children: string;
  maxChars?: number;
  style?: React.CSSProperties;
}> = ({ children, maxChars = 54, style }) => {
  const length = children.length;
  const size = length > maxChars ? 38 : length > 40 ? 43 : 48;
  return (
    <div
      style={{
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Shell: React.FC<{ children: React.ReactNode; scriptId: string }> = ({
  children,
  scriptId,
}) => {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(155,92,255,0.25), transparent 34%), linear-gradient(180deg, #050508 0%, #0b0c12 50%, #050508 100%)",
        color: brand.ink,
        fontFamily:
          'ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 54,
          borderRadius: 44,
          border: `2px solid ${brand.line}`,
          boxShadow: "inset 0 0 80px rgba(255,255,255,0.035)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 82,
          left: 82,
          right: 82,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 800,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${brand.purple}, ${brand.pink})`,
              display: "grid",
              placeItems: "center",
              boxShadow: "0 16px 40px rgba(155,92,255,0.35)",
              fontSize: 30,
            }}
          >
            TW
          </div>
          <div style={{ fontSize: 34 }}>Text Wingman</div>
        </div>
        <div style={{ fontSize: 22, color: brand.quiet }}>{scriptId}</div>
      </div>
      {children}
    </AbsoluteFill>
  );
};

const Hook: React.FC<{ text: string; delay?: number }> = ({ text, delay = 8 }) => {
  const frame = useCurrentFrame();
  const amount = pop(frame, delay);
  return (
    <div
      style={{
        position: "absolute",
        top: 190,
        left: 86,
        right: 86,
        opacity: ease(frame, delay, delay + 10),
        transform: `translateY(${(1 - amount) * 22}px)`,
      }}
    >
      <FitText
        maxChars={52}
        style={{
          fontWeight: 950,
          textAlign: "center",
          textWrap: "balance",
        }}
      >
        {text}
      </FitText>
    </div>
  );
};

const Phone: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 28,
}) => {
  const frame = useCurrentFrame();
  const amount = pop(frame, delay);
  return (
    <div
      style={{
        position: "absolute",
        left: 148,
        right: 148,
        top: 420,
        height: 990,
        borderRadius: 64,
        background: "linear-gradient(180deg, #171821, #0d0e14)",
        border: "3px solid rgba(255,255,255,0.12)",
        boxShadow: "0 50px 120px rgba(0,0,0,0.55)",
        padding: 40,
        opacity: ease(frame, delay, delay + 14),
        transform: `scale(${0.96 + amount * 0.04}) translateY(${(1 - amount) * 24}px)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 168,
          height: 18,
          borderRadius: 999,
          background: "rgba(255,255,255,0.12)",
          margin: "0 auto 40px",
        }}
      />
      {children}
    </div>
  );
};

const Bubble: React.FC<{
  children: string;
  side: "them" | "you";
  tone?: "bad" | "good" | "neutral";
  delay: number;
}> = ({ children, side, tone = "neutral", delay }) => {
  const frame = useCurrentFrame();
  const amount = pop(frame, delay);
  const isYou = side === "you";
  const background =
    tone === "bad"
      ? "rgba(251,113,133,0.16)"
      : tone === "good"
        ? "linear-gradient(135deg, rgba(155,92,255,0.95), rgba(236,95,199,0.92))"
        : isYou
          ? "rgba(155,92,255,0.22)"
          : "rgba(255,255,255,0.10)";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isYou ? "flex-end" : "flex-start",
        marginBottom: 22,
        opacity: ease(frame, delay, delay + 10),
        transform: `translateY(${(1 - amount) * 18}px)`,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          borderRadius: 30,
          borderBottomLeftRadius: isYou ? 30 : 8,
          borderBottomRightRadius: isYou ? 8 : 30,
          padding: "22px 28px",
          background,
          border:
            tone === "bad"
              ? `2px solid rgba(251,113,133,0.35)`
              : "2px solid rgba(255,255,255,0.10)",
          color: brand.ink,
          fontSize: children.length > 56 ? 29 : 34,
          lineHeight: 1.18,
          fontWeight: tone === "good" ? 800 : 650,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Tag: React.FC<{
  label: string;
  color?: string;
  delay: number;
  style?: React.CSSProperties;
}> = ({ label, color = brand.purple, delay, style }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "10px 16px",
        color,
        background: `${color}1f`,
        border: `2px solid ${color}44`,
        fontSize: 21,
        fontWeight: 900,
        textTransform: "uppercase",
        opacity: ease(frame, delay, delay + 8),
        ...style,
      }}
    >
      {label}
    </div>
  );
};

const CTA: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = ease(frame, 430, 455);
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        right: 96,
        bottom: 122,
        opacity,
        transform: `translateY(${(1 - opacity) * 28}px)`,
      }}
    >
      <div
        style={{
          borderRadius: 30,
          padding: "28px 34px",
          background: `linear-gradient(135deg, ${brand.purple}, ${brand.pink})`,
          color: "white",
          fontSize: 40,
          lineHeight: 1.05,
          fontWeight: 950,
          textAlign: "center",
          boxShadow: "0 26px 70px rgba(155,92,255,0.35)",
        }}
      >
        {text}
      </div>
      <div
        style={{
          marginTop: 18,
          textAlign: "center",
          fontSize: 23,
          color: brand.quiet,
          fontWeight: 700,
        }}
      >
        textwingman.com/app
      </div>
    </div>
  );
};

const WhyBar: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 350,
}) => {
  const frame = useCurrentFrame();
  const amount = pop(frame, delay);
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        right: 96,
        bottom: 280,
        borderRadius: 24,
        background: "rgba(52,211,153,0.11)",
        border: "2px solid rgba(52,211,153,0.26)",
        padding: "22px 26px",
        opacity: ease(frame, delay, delay + 12),
        transform: `translateY(${(1 - amount) * 20}px)`,
      }}
    >
      <div style={{ color: brand.green, fontSize: 22, fontWeight: 950 }}>
        WHY IT WORKS
      </div>
      <div
        style={{
          color: brand.ink,
          fontSize: text.length > 50 ? 30 : 34,
          lineHeight: 1.16,
          fontWeight: 750,
          marginTop: 8,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const WrongRightTemplate: React.FC<VideoProps> = ({ script }) => {
  return (
    <Shell scriptId={script.id}>
      <Hook text={script.hook} />
      <Phone>
        <Bubble side="them" delay={54}>
          {script.incoming}
        </Bubble>
        <Tag label="do not send this" color={brand.red} delay={104} />
        <Bubble side="you" tone="bad" delay={126}>
          {script.badReply}
        </Bubble>
        <Tag
          label="wingman reply"
          color={brand.green}
          delay={222}
          style={{ marginTop: 24 }}
        />
        <Bubble side="you" tone="good" delay={246}>
          {script.goodReply}
        </Bubble>
      </Phone>
      <WhyBar text={script.why} />
      <CTA text={script.cta} />
    </Shell>
  );
};

const GroupChatTemplate: React.FC<VideoProps> = ({ script }) => {
  const frame = useCurrentFrame();
  const chaos = [
    "say something funny",
    "wait 3 hours",
    "nah too risky",
    "ask if she likes you",
  ];
  return (
    <Shell scriptId={script.id}>
      <Hook text={script.hook} />
      <Phone>
        <Bubble side="them" delay={48}>
          {script.incoming}
        </Bubble>
        <Tag label="group chat advice" color={brand.red} delay={94} />
        {chaos.map((line, index) => (
          <div
            key={line}
            style={{
              marginTop: 16,
              opacity: ease(frame, 118 + index * 20, 132 + index * 20),
              transform: `translateX(${index % 2 === 0 ? -8 : 8}px) rotate(${index % 2 === 0 ? -1.4 : 1.2}deg)`,
            }}
          >
            <div
              style={{
                borderRadius: 22,
                padding: "16px 20px",
                background: "rgba(251,113,133,0.12)",
                border: "2px solid rgba(251,113,133,0.25)",
                color: "rgba(255,255,255,0.74)",
                fontSize: 28,
                fontWeight: 750,
              }}
            >
              {line}
            </div>
          </div>
        ))}
        <div style={{ height: 24 }} />
        <Tag label="text wingman" color={brand.green} delay={242} />
        <Bubble side="you" tone="good" delay={270}>
          {script.goodReply}
        </Bubble>
      </Phone>
      <WhyBar text={script.why} delay={360} />
      <CTA text={script.cta} />
    </Shell>
  );
};

const ScreenshotAnalyzerTemplate: React.FC<VideoProps> = ({ script }) => {
  const frame = useCurrentFrame();
  const scan = ease(frame, 150, 255);
  return (
    <Shell scriptId={script.id}>
      <Hook text={script.hook} />
      <Phone delay={34}>
        <Bubble side="them" delay={64}>
          {script.incoming}
        </Bubble>
        <Bubble side="you" tone="bad" delay={112}>
          {script.badReply}
        </Bubble>
        <div
          style={{
            position: "relative",
            height: 280,
            borderRadius: 30,
            marginTop: 34,
            background: "rgba(255,255,255,0.06)",
            border: "2px solid rgba(255,255,255,0.12)",
            overflow: "hidden",
            opacity: ease(frame, 150, 170),
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${scan * 225}px`,
              height: 34,
              background:
                "linear-gradient(180deg, rgba(52,211,153,0), rgba(52,211,153,0.8), rgba(52,211,153,0))",
              boxShadow: "0 0 45px rgba(52,211,153,0.7)",
            }}
          />
          <div style={{ padding: 28 }}>
            <Tag label="analysis" color={brand.gold} delay={176} />
            <div
              style={{
                marginTop: 22,
                fontSize: 27,
                lineHeight: 1.18,
                color: brand.muted,
                fontWeight: 700,
              }}
            >
              Context detected. Neediness risk lowered. Best reply selected.
            </div>
          </div>
        </div>
        <Tag
          label="winner"
          color={brand.green}
          delay={285}
          style={{ marginTop: 26 }}
        />
        <Bubble side="you" tone="good" delay={310}>
          {script.goodReply}
        </Bubble>
      </Phone>
      <WhyBar text={script.why} delay={370} />
      <CTA text={script.cta} />
    </Shell>
  );
};

export const TextWingmanAd: React.FC<VideoProps> = ({ script }) => {
  if (script.template === "group-chat") {
    return <GroupChatTemplate script={script} />;
  }

  if (script.template === "screenshot-analyzer") {
    return <ScreenshotAnalyzerTemplate script={script} />;
  }

  return <WrongRightTemplate script={script} />;
};
