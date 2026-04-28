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

const accents = ["#9b5cff", "#14b8a6", "#f97316", "#38bdf8", "#ec5fc7"];

const scriptNumber = (scriptId: string) => {
  const [, numeric] = scriptId.split("-");
  return Number(numeric) || 0;
};

const accentFor = (scriptId: string) =>
  accents[scriptNumber(scriptId) % accents.length] || brand.purple;

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
  const frame = useCurrentFrame();
  const accent = accentFor(scriptId);
  const drift = Math.sin(frame / 34) * 28;
  const spin = Math.sin(frame / 70) * 6;
  return (
    <AbsoluteFill
      style={{
        background:
          `radial-gradient(circle at ${26 + drift / 9}% 10%, ${accent}47, transparent 32%), radial-gradient(circle at 82% 26%, rgba(236,95,199,0.24), transparent 30%), linear-gradient(180deg, #050508 0%, #0b0c12 50%, #050508 100%)`,
        color: brand.ink,
        fontFamily:
          'ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          opacity: 0.22,
          transform: `translateY(${(frame % 54) * -0.2}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -180,
          top: 330,
          width: 520,
          height: 520,
          borderRadius: 120,
          background: `${accent}2b`,
          filter: "blur(2px)",
          transform: `rotate(${14 + spin}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -190,
          top: 760,
          width: 470,
          height: 470,
          borderRadius: "999px",
          border: `2px solid ${accent}55`,
          boxShadow: `0 0 90px ${accent}22`,
        }}
      />
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
              background: `linear-gradient(135deg, ${accent}, ${brand.pink})`,
              display: "grid",
              placeItems: "center",
              boxShadow: `0 16px 40px ${accent}55`,
              fontSize: 30,
            }}
          >
            TW
          </div>
          <div style={{ fontSize: 34 }}>Text Wingman</div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: brand.quiet,
          }}
        >
          <span style={{ color: accent, fontWeight: 950 }}>TEXTING MOVE</span>
          <span>{scriptId}</span>
        </div>
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
      <div
        style={{
          width: "max-content",
          margin: "0 auto 20px",
          borderRadius: 999,
          padding: "10px 18px",
          background: "rgba(251,191,36,0.14)",
          border: "2px solid rgba(251,191,36,0.32)",
          color: brand.gold,
          fontSize: 20,
          fontWeight: 950,
          letterSpacing: 1.1,
        }}
      >
        STOP THE FUMBLE
      </div>
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          color: brand.quiet,
          fontSize: 22,
          fontWeight: 850,
          letterSpacing: 0.4,
        }}
      >
        <span>incoming text</span>
        <span style={{ color: brand.green }}>wingman mode</span>
      </div>
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
        bottom: 168,
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
        gula-agents2.vercel.app
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
        bottom: 330,
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

const NativePanel: React.FC<{
  children: React.ReactNode;
  delay: number;
  style?: React.CSSProperties;
}> = ({ children, delay, style }) => {
  const frame = useCurrentFrame();
  const amount = pop(frame, delay);
  return (
    <div
      style={{
        borderRadius: 32,
        padding: 26,
        background: "rgba(255,255,255,0.078)",
        border: "2px solid rgba(255,255,255,0.13)",
        boxShadow: "0 28px 70px rgba(0,0,0,0.24)",
        opacity: ease(frame, delay, delay + 12),
        transform: `translateY(${(1 - amount) * 22}px) scale(${0.98 + amount * 0.02})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const MiniKicker: React.FC<{ label: string; color?: string }> = ({
  label,
  color = brand.gold,
}) => (
  <div
    style={{
      color,
      fontSize: 21,
      lineHeight: 1,
      fontWeight: 950,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      marginBottom: 14,
    }}
  >
    {label}
  </div>
);

const NativeStage: React.FC<
  VideoProps & {
    badge: string;
    children: React.ReactNode;
    whyDelay?: number;
  }
> = ({ script, badge, children, whyDelay = 360 }) => {
  const frame = useCurrentFrame();
  const amount = pop(frame, 34);
  const accent = accentFor(script.id);
  return (
    <Shell scriptId={script.id}>
      <Hook text={script.hook} />
      <div
        style={{
          position: "absolute",
          left: 86,
          right: 86,
          top: 420,
          height: 915,
          borderRadius: 42,
          padding: 28,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.095), rgba(255,255,255,0.045))",
          border: "2px solid rgba(255,255,255,0.16)",
          boxShadow: "0 44px 110px rgba(0,0,0,0.34)",
          overflow: "hidden",
          opacity: ease(frame, 30, 44),
          transform: `translateY(${(1 - amount) * 24}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 12% 18%, ${accent}24, transparent 24%), radial-gradient(circle at 94% 76%, rgba(52,211,153,0.16), transparent 22%)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              borderRadius: 999,
              padding: "12px 18px",
              color: accent,
              background: `${accent}1f`,
              border: `2px solid ${accent}55`,
              fontSize: 22,
              fontWeight: 950,
              letterSpacing: 1.1,
              textTransform: "uppercase",
            }}
          >
            {badge}
          </div>
          <div
            style={{
              color: brand.quiet,
              fontSize: 22,
              fontWeight: 850,
              textAlign: "right",
            }}
          >
            TikTok creative test
          </div>
        </div>
        <div style={{ position: "relative" }}>{children}</div>
      </div>
      <WhyBar text={script.why} delay={whyDelay} />
      <CTA text={script.cta} />
    </Shell>
  );
};

const IncomingCard: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 50,
}) => (
  <NativePanel delay={delay} style={{ marginBottom: 18 }}>
    <MiniKicker label="incoming" color={brand.green} />
    <div
      style={{
        fontSize: text.length > 42 ? 34 : 40,
        lineHeight: 1.12,
        fontWeight: 850,
        color: brand.ink,
      }}
    >
      {text}
    </div>
  </NativePanel>
);

const ReplyCard: React.FC<{
  label: string;
  text: string;
  tone: "bad" | "good" | "neutral";
  delay: number;
  style?: React.CSSProperties;
}> = ({ label, text, tone, delay, style }) => {
  const color =
    tone === "bad" ? brand.red : tone === "good" ? brand.green : brand.gold;
  const background =
    tone === "good"
      ? "linear-gradient(135deg, rgba(155,92,255,0.92), rgba(236,95,199,0.88))"
      : tone === "bad"
        ? "rgba(251,113,133,0.14)"
        : "rgba(251,191,36,0.13)";
  return (
    <NativePanel
      delay={delay}
      style={{
        marginBottom: 18,
        background,
        border: `2px solid ${color}55`,
        ...style,
      }}
    >
      <MiniKicker label={label} color={tone === "good" ? "#d1fae5" : color} />
      <div
        style={{
          fontSize: text.length > 48 ? 31 : 37,
          lineHeight: 1.13,
          fontWeight: 920,
          color: brand.ink,
        }}
      >
        {text}
      </div>
    </NativePanel>
  );
};

const MetricBar: React.FC<{
  label: string;
  value: number;
  color: string;
  delay: number;
}> = ({ label, value, color, delay }) => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [delay, delay + 26], [0, value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ marginBottom: 18, opacity: ease(frame, delay, delay + 8) }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: brand.muted,
          fontSize: 23,
          fontWeight: 850,
          marginBottom: 8,
        }}
      >
        <span>{label}</span>
        <span style={{ color }}>{Math.round(fill)}%</span>
      </div>
      <div
        style={{
          height: 18,
          borderRadius: 999,
          background: "rgba(255,255,255,0.10)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${fill}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
            boxShadow: `0 0 32px ${color}66`,
          }}
        />
      </div>
    </div>
  );
};

const PanicTranslatorTemplate: React.FC<VideoProps> = ({ script }) => (
  <NativeStage script={script} badge="panic translator">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <NativePanel
        delay={58}
        style={{
          minHeight: 296,
          background: "rgba(251,113,133,0.13)",
          borderColor: "rgba(251,113,133,0.34)",
        }}
      >
        <MiniKicker label="your brain" color={brand.red} />
        <div style={{ fontSize: 38, lineHeight: 1.06, fontWeight: 950 }}>
          {script.badReply}
        </div>
        <div
          style={{
            marginTop: 24,
            color: brand.red,
            fontSize: 26,
            fontWeight: 900,
          }}
        >
          spiral level: 97%
        </div>
      </NativePanel>
      <NativePanel
        delay={92}
        style={{
          minHeight: 296,
          background: "rgba(52,211,153,0.11)",
          borderColor: "rgba(52,211,153,0.32)",
        }}
      >
        <MiniKicker label="what it means" color={brand.green} />
        <div style={{ fontSize: 38, lineHeight: 1.08, fontWeight: 950 }}>
          {script.incoming}
        </div>
        <div
          style={{
            marginTop: 24,
            color: brand.green,
            fontSize: 26,
            fontWeight: 900,
          }}
        >
          playful opening detected
        </div>
      </NativePanel>
    </div>
    <ReplyCard
      label="translation to send"
      text={script.goodReply}
      tone="good"
      delay={210}
      style={{ marginTop: 22 }}
    />
  </NativeStage>
);

const WrongReplyCourtTemplate: React.FC<VideoProps> = ({ script }) => (
  <NativeStage script={script} badge="reply court">
    <IncomingCard text={script.incoming} delay={54} />
    <NativePanel
      delay={108}
      style={{
        position: "relative",
        minHeight: 330,
        background: "rgba(251,113,133,0.12)",
        borderColor: "rgba(251,113,133,0.34)",
      }}
    >
      <MiniKicker label="the people vs. this reply" color={brand.red} />
      <div style={{ color: brand.muted, fontSize: 26, fontWeight: 850 }}>
        Exhibit A
      </div>
      <div
        style={{
          marginTop: 10,
          width: "72%",
          fontSize: 43,
          lineHeight: 1.02,
          fontWeight: 950,
        }}
      >
        {script.badReply}
      </div>
      <div
        style={{
          position: "absolute",
          right: 28,
          bottom: 38,
          transform: "rotate(-12deg)",
          border: `6px solid ${brand.red}`,
          color: brand.red,
          borderRadius: 18,
          padding: "12px 18px",
          fontSize: 45,
          fontWeight: 950,
          letterSpacing: 2,
        }}
      >
        GUILTY
      </div>
    </NativePanel>
    <ReplyCard label="verdict" text={script.goodReply} tone="good" delay={248} />
  </NativeStage>
);

const TextingERTemplate: React.FC<VideoProps> = ({ script }) => (
  <NativeStage script={script} badge="texting er">
    <IncomingCard text={script.incoming} delay={52} />
    <NativePanel delay={100} style={{ marginBottom: 18 }}>
      <MiniKicker label="vitals" color={brand.gold} />
      <MetricBar label="panic" value={88} color={brand.red} delay={122} />
      <MetricBar label="actual danger" value={12} color={brand.green} delay={144} />
      <MetricBar label="saveable chat" value={94} color={brand.purple} delay={166} />
    </NativePanel>
    <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 18 }}>
      <ReplyCard
        label="bad treatment"
        text={script.badReply}
        tone="bad"
        delay={214}
        style={{ marginBottom: 0 }}
      />
      <ReplyCard
        label="prescription"
        text={script.goodReply}
        tone="good"
        delay={252}
        style={{ marginBottom: 0 }}
      />
    </div>
  </NativeStage>
);

const GroupChatOutageTemplate: React.FC<VideoProps> = ({ script }) => (
  <NativeStage script={script} badge="outage report">
    <IncomingCard text={script.incoming} delay={50} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
      {[
        ["GROUP CHAT", "offline", brand.red],
        ["CONFIDENCE", "buffering", brand.gold],
        ["WINGMAN", "online", brand.green],
      ].map(([label, value, color], index) => (
        <NativePanel
          key={label}
          delay={104 + index * 26}
          style={{
            minHeight: 150,
            padding: 18,
            background: `${color}18`,
            borderColor: `${color}55`,
          }}
        >
          <div style={{ color, fontSize: 19, fontWeight: 950 }}>{label}</div>
          <div
            style={{
              marginTop: 12,
              fontSize: 31,
              lineHeight: 1,
              fontWeight: 950,
            }}
          >
            {value}
          </div>
        </NativePanel>
      ))}
    </div>
    <ReplyCard
      label="committee answer"
      text={script.badReply}
      tone="bad"
      delay={200}
      style={{ marginTop: 18 }}
    />
    <ReplyCard label="actual move" text={script.goodReply} tone="good" delay={266} />
  </NativeStage>
);

const ReceiptTemplate: React.FC<VideoProps> = ({ script }) => (
  <NativeStage script={script} badge="date receipt">
    <IncomingCard text={script.incoming} delay={50} />
    <NativePanel
      delay={110}
      style={{
        background: "rgba(255,252,232,0.96)",
        color: "#151515",
        borderColor: "rgba(255,252,232,0.95)",
        fontFamily: '"Courier New", monospace',
        marginBottom: 18,
      }}
    >
      <div style={{ textAlign: "center", fontSize: 33, fontWeight: 950 }}>
        FIRST DATE RECEIPT
      </div>
      {[
        ["overexplaining", "+3 cringe"],
        ["generic compliment", "+2 forgettable"],
        ["specific callback", "-5 pressure"],
        ["date two signal", "UP"],
      ].map(([left, right]) => (
        <div
          key={left}
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "2px dashed rgba(0,0,0,0.22)",
            paddingTop: 14,
            marginTop: 14,
            fontSize: 28,
            fontWeight: 850,
          }}
        >
          <span>{left}</span>
          <span>{right}</span>
        </div>
      ))}
    </NativePanel>
    <ReplyCard label="skip this" text={script.badReply} tone="bad" delay={220} />
    <ReplyCard label="send this" text={script.goodReply} tone="good" delay={276} />
  </NativeStage>
);

const MuseumTemplate: React.FC<VideoProps> = ({ script }) => (
  <NativeStage script={script} badge="dry texter museum">
    <NativePanel
      delay={58}
      style={{
        minHeight: 460,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        background:
          "linear-gradient(180deg, rgba(56,189,248,0.13), rgba(255,255,255,0.05))",
      }}
    >
      <MiniKicker label="exhibit 404" color={brand.gold} />
      <div
        style={{
          width: 430,
          height: 230,
          borderRadius: 36,
          display: "grid",
          placeItems: "center",
          background: "rgba(255,255,255,0.10)",
          border: "3px solid rgba(255,255,255,0.20)",
          boxShadow: "inset 0 0 50px rgba(255,255,255,0.08)",
          fontSize: 78,
          fontWeight: 950,
        }}
      >
        {script.incoming}
      </div>
      <div style={{ marginTop: 26, color: brand.muted, fontSize: 28 }}>
        Rare dry-text artifact, emotionally carbon dated.
      </div>
    </NativePanel>
    <ReplyCard label="do not mirror it" text={script.badReply} tone="bad" delay={204} />
    <ReplyCard label="make it playful" text={script.goodReply} tone="good" delay={262} />
  </NativeStage>
);

const ScannerTemplate: React.FC<VideoProps> = ({ script }) => (
  <NativeStage script={script} badge="vibe scanner">
    <IncomingCard text={script.incoming} delay={48} />
    <NativePanel delay={104} style={{ marginBottom: 18 }}>
      <MiniKicker label="scan complete" color={brand.green} />
      <MetricBar label="flirt signal" value={82} color={brand.green} delay={126} />
      <MetricBar label="red flag" value={18} color={brand.red} delay={150} />
      <MetricBar label="reply window" value={91} color={brand.purple} delay={174} />
    </NativePanel>
    <ReplyCard label="panic read" text={script.badReply} tone="bad" delay={230} />
    <ReplyCard label="actual read" text={script.goodReply} tone="good" delay={284} />
  </NativeStage>
);

const CommentBaitTemplate: React.FC<VideoProps> = ({ script }) => (
  <NativeStage script={script} badge="comment decode">
    <NativePanel
      delay={54}
      style={{
        background: "rgba(255,255,255,0.11)",
        borderColor: "rgba(255,255,255,0.20)",
        marginBottom: 18,
      }}
    >
      <MiniKicker label="for the comments" color={brand.pink} />
      <div style={{ fontSize: 52, lineHeight: 1.02, fontWeight: 950 }}>
        Drop the text she sent.
      </div>
      <div
        style={{
          marginTop: 18,
          borderRadius: 26,
          padding: "20px 24px",
          background: "rgba(0,0,0,0.28)",
          color: brand.muted,
          fontSize: 31,
          fontWeight: 800,
        }}
      >
        Example: "{script.incoming}"
      </div>
    </NativePanel>
    <ReplyCard label="bad read" text={script.badReply} tone="bad" delay={164} />
    <ReplyCard label="wingman decode" text={script.goodReply} tone="good" delay={244} />
  </NativeStage>
);

const FuneralTemplate: React.FC<VideoProps> = ({ script }) => (
  <NativeStage script={script} badge="opener funeral">
    <NativePanel
      delay={58}
      style={{
        minHeight: 520,
        textAlign: "center",
        background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.20))",
      }}
    >
      <MiniKicker label={script.incoming} color={brand.quiet} />
      <div
        style={{
          width: 420,
          height: 315,
          margin: "0 auto",
          borderRadius: "190px 190px 34px 34px",
          background: "linear-gradient(180deg, #9ca3af, #4b5563)",
          border: "4px solid rgba(255,255,255,0.18)",
          display: "grid",
          placeItems: "center",
          color: "#111827",
          boxShadow: "0 34px 90px rgba(0,0,0,0.34)",
        }}
      >
        <div>
          <div style={{ fontSize: 44, fontWeight: 950 }}>RIP</div>
          <div style={{ fontSize: 76, fontWeight: 950 }}>{script.badReply}</div>
          <div style={{ fontSize: 25, fontWeight: 900 }}>killed by boredom</div>
        </div>
      </div>
      <div style={{ marginTop: 28, color: brand.muted, fontSize: 28 }}>
        It served us poorly.
      </div>
    </NativePanel>
    <ReplyCard label="replacement opener" text={script.goodReply} tone="good" delay={248} />
  </NativeStage>
);

const SpeedrunTemplate: React.FC<VideoProps> = ({ script }) => {
  const frame = useCurrentFrame();
  const timer = (Math.min(frame, 260) / 30).toFixed(1).padStart(4, "0");
  return (
    <NativeStage script={script} badge="overthinking speedrun">
      <IncomingCard text={script.incoming} delay={48} />
      <NativePanel
        delay={102}
        style={{
          background: "rgba(251,113,133,0.12)",
          borderColor: "rgba(251,113,133,0.34)",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <MiniKicker label="bad speedrun" color={brand.red} />
          <div
            style={{
              color: brand.red,
              fontSize: 52,
              lineHeight: 1,
              fontWeight: 950,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            00:{timer}
          </div>
        </div>
        <div style={{ fontSize: 39, lineHeight: 1.08, fontWeight: 950 }}>
          {script.badReply}
        </div>
        <div
          style={{
            marginTop: 20,
            color: brand.red,
            fontSize: 28,
            fontWeight: 950,
            opacity: ease(frame, 150, 170),
          }}
        >
          run invalidated: too many words
        </div>
      </NativePanel>
      <ReplyCard label="world record reply" text={script.goodReply} tone="good" delay={240} />
    </NativeStage>
  );
};

export const TextWingmanAd: React.FC<VideoProps> = ({ script }) => {
  switch (script.template) {
    case "group-chat":
      return <GroupChatTemplate script={script} />;
    case "screenshot-analyzer":
      return <ScreenshotAnalyzerTemplate script={script} />;
    case "panic-translator":
      return <PanicTranslatorTemplate script={script} />;
    case "wrong-reply-court":
      return <WrongReplyCourtTemplate script={script} />;
    case "texting-er":
      return <TextingERTemplate script={script} />;
    case "group-chat-outage":
      return <GroupChatOutageTemplate script={script} />;
    case "receipt":
      return <ReceiptTemplate script={script} />;
    case "museum":
      return <MuseumTemplate script={script} />;
    case "scanner":
      return <ScannerTemplate script={script} />;
    case "comment-bait":
      return <CommentBaitTemplate script={script} />;
    case "funeral":
      return <FuneralTemplate script={script} />;
    case "speedrun":
      return <SpeedrunTemplate script={script} />;
    default:
      return <WrongRightTemplate script={script} />;
  }
};
