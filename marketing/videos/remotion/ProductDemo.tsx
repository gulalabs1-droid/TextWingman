import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// "Sorry been busy": a 28-second product demo. A relatable dating moment
// (the urge to send the anxious paragraph) resolved inside the real Coach
// screen: screenshot in, who-it-is detected, Coach's read, three drafts, copy,
// and their reply. Colors, labels and layout mirror the app.

const c = {
  bg: "#0b0f0c",
  panel: "#141c16",
  card: "rgba(255,255,255,0.045)",
  line: "rgba(255,255,255,0.10)",
  cream: "#f5f7ec",
  sage: "#abb7aa",
  faint: "rgba(171,183,170,0.65)",
  lime: "#d3ff68",
  limeInk: "#14200e",
  them: "#26282c",
  you: "#0a84ff",
  red: "#fb7185",
};

const font = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';

const fade = (f: number, from: number, to: number) =>
  interpolate(f, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const usePop = (at: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 140, mass: 0.8 } });
};

// Scene timing (30 fps)
const T = {
  thread: 0,
  silence: 70,
  busy: 100,
  typing: 160,
  stop: 236,
  flash: 262,
  app: 272,
  shot: 288,
  detect: 318,
  read: 340,
  drafts: 410,
  tweaks: 448,
  swipe: 478,
  tap: 520,
  back: 600,
  sent: 610,
  dots: 640,
  reply: 690,
  end: 762,
};

const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const frame = useCurrentFrame();
  const p = usePop(at);
  return (
    <div style={{ opacity: fade(frame, at, at + 8), transform: `translateY(${(1 - p) * 18}px) scale(${0.96 + p * 0.04})`, ...style }}>
      {children}
    </div>
  );
};

const Bubble: React.FC<{ side: "them" | "you"; at: number; children: React.ReactNode; color?: string; ink?: string }> = ({ side, at, children, color, ink }) => (
  <Pop at={at} style={{ display: "flex", justifyContent: side === "you" ? "flex-end" : "flex-start", marginBottom: 14 }}>
    <div
      style={{
        maxWidth: "76%",
        padding: "18px 24px",
        borderRadius: 30,
        borderBottomLeftRadius: side === "them" ? 8 : 30,
        borderBottomRightRadius: side === "you" ? 8 : 30,
        background: color || (side === "you" ? c.you : c.them),
        color: ink || "#fff",
        fontSize: 32,
        lineHeight: 1.22,
        fontWeight: 560,
      }}
    >
      {children}
    </div>
  </Pop>
);

const Dots: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", marginBottom: 14, opacity: fade(frame, from, from + 6) }}>
      <div style={{ display: "flex", gap: 9, padding: "22px 26px", borderRadius: 30, borderBottomLeftRadius: 8, background: c.them }}>
        {[0, 1, 2].map((d) => (
          <div key={d} style={{ width: 13, height: 13, borderRadius: 99, background: "#fff", opacity: 0.3 + 0.7 * Math.max(0, Math.sin((frame - from) / 4 - d * 0.9)) }} />
        ))}
      </div>
    </div>
  );
};

/** The big line above the phone; each caption fades in at its frame and out at the next. */
const Caption: React.FC<{ lines: { at: number; until: number; text: string; accent?: boolean }[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {lines.map((line) => {
        const o = Math.min(fade(frame, line.at, line.at + 10), 1 - fade(frame, line.until - 8, line.until));
        return (
          <div
            key={line.at}
            style={{
              position: "absolute",
              top: 150,
              left: 70,
              right: 70,
              textAlign: "center",
              fontSize: 60,
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: -1.5,
              color: line.accent ? c.lime : c.cream,
              opacity: o,
              transform: `translateY(${(1 - o) * 16}px)`,
              textWrap: "balance",
            }}
          >
            {line.text}
          </div>
        );
      })}
    </>
  );
};

const Phone: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: 110,
      right: 110,
      top: 360,
      height: 1380,
      borderRadius: 72,
      border: "3px solid rgba(255,255,255,0.14)",
      background: "#050706",
      boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

const paragraph =
  "did I do something wrong? you've been so distant and I just feel like maybe you're losing interest and I'd honestly rather you just tell me";

const MessagesScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = Math.floor(interpolate(frame, [T.typing, T.stop - 6], [0, paragraph.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const afterApp = frame >= T.back;
  const stop = fade(frame, T.stop, T.stop + 8);
  return (
    <AbsoluteFill style={{ background: "#000", padding: "40px 34px 0", fontFamily: font }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingBottom: 22, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 84, height: 84, borderRadius: 99, background: "linear-gradient(180deg,#9aa3ad,#6b7480)", display: "grid", placeItems: "center", color: "#fff", fontSize: 38, fontWeight: 700 }}>J</div>
        <div style={{ color: "#fff", fontSize: 26, fontWeight: 600 }}>Jordan</div>
      </div>
      <div style={{ padding: "26px 6px 0" }}>
        <Bubble side="them" at={T.thread + 10}>good morning sleepyhead</Bubble>
        <Bubble side="you" at={T.thread + 24}>morning!! coffee first, then I'm a person</Bubble>
        <Bubble side="them" at={T.thread + 38}>same. talk later?</Bubble>
        <Pop at={T.silence} style={{ textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: 22, fontWeight: 600, margin: "26px 0 18px" }}>
          Thursday 11:48 PM · 2 days later
        </Pop>
        <Bubble side="them" at={T.busy}>sorry been busy</Bubble>
        {afterApp && (
          <>
            <Bubble side="you" at={T.sent}>missed you a little. don&apos;t make it a habit</Bubble>
            <Pop at={T.sent + 10} style={{ textAlign: "right", color: "rgba(255,255,255,0.45)", fontSize: 20, marginTop: -6, marginBottom: 12 }}>Delivered</Pop>
            {frame >= T.dots && frame < T.reply && <Dots from={T.dots} />}
            {frame >= T.reply && <Bubble side="them" at={T.reply}>ok that made me smile. sorry, rough week. dinner friday?</Bubble>}
          </>
        )}
      </div>
      {!afterApp && frame >= T.typing && (
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 40, display: "flex", alignItems: "flex-end", gap: 14 }}>
          <div style={{ flex: 1, minHeight: 64, padding: "16px 22px", borderRadius: 34, border: `2px solid ${stop ? c.red : "rgba(255,255,255,0.18)"}`, color: "#fff", fontSize: 27, lineHeight: 1.28, position: "relative" }}>
            {paragraph.slice(0, typed)}
            <span style={{ opacity: Math.floor(frame / 8) % 2 ? 1 : 0, color: c.you }}>|</span>
            {stop > 0 && (
              <div style={{ position: "absolute", left: 18, right: 18, top: "50%", height: 5, borderRadius: 5, background: c.red, transform: `scaleX(${stop})`, transformOrigin: "left" }} />
            )}
          </div>
          <div style={{ width: 64, height: 64, borderRadius: 99, background: stop ? "#3a3a3c" : c.you, display: "grid", placeItems: "center", color: "#fff", fontSize: 32, fontWeight: 800 }}>↑</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Mark: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ width: 52, height: 52, borderRadius: 15, background: c.lime, display: "grid", placeItems: "center", transform: "rotate(-8deg)" }}>
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={c.limeInk} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    </div>
    <div style={{ fontSize: 32, letterSpacing: -1, color: c.cream }}>
      <span style={{ fontWeight: 500 }}>text</span>
      <span style={{ fontWeight: 900, color: c.lime }}>wingman</span>
    </div>
  </div>
);

const Draft: React.FC<{ label: string; text: string; featured?: boolean; copied?: boolean; tapAt?: number }> = ({ label, text, featured, copied, tapAt }) => {
  const frame = useCurrentFrame();
  const tap = tapAt === undefined ? 0 : fade(frame, tapAt, tapAt + 6) * (1 - fade(frame, tapAt + 14, tapAt + 26));
  return (
    <div style={{ width: 640, flexShrink: 0, borderRadius: 30, padding: 26, border: `2px solid ${featured ? "rgba(211,255,104,0.35)" : c.line}`, background: featured ? "rgba(211,255,104,0.07)" : c.card }}>
      <div style={{ color: c.sage, fontSize: 21, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: c.cream, fontSize: 31, lineHeight: 1.25, marginTop: 12, minHeight: 78 }}>{text}</div>
      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <div style={{ position: "relative", flex: 1, height: 70, borderRadius: 20, display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800, background: copied ? "rgba(52,211,153,0.18)" : featured ? c.lime : "rgba(255,255,255,0.07)", color: copied ? "#6ee7b7" : featured ? c.limeInk : c.cream, border: copied ? "2px solid rgba(52,211,153,0.4)" : "none" }}>
          {copied ? "✓ Copied" : "Copy"}
          {tap > 0 && <div style={{ position: "absolute", width: 90, height: 90, borderRadius: 99, background: "rgba(255,255,255,0.35)", transform: `scale(${0.6 + tap * 0.6})`, opacity: tap }} />}
        </div>
        <div style={{ height: 70, padding: "0 22px", borderRadius: 20, border: `2px solid ${c.line}`, display: "grid", placeItems: "center", color: c.sage, fontSize: 22, fontWeight: 700 }}>Coach this</div>
      </div>
    </div>
  );
};

const CoachScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const read = "They're pulling back a little, not leaving. Don't chase and don't explain. Keep it light, then give them an easy way back in.";
  const readShown = Math.floor(interpolate(frame, [T.read + 6, T.read + 62], [0, read.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const detected = frame >= T.detect;
  const slide = interpolate(frame, [T.swipe, T.swipe + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const copied = frame >= T.tap + 10;
  return (
    <AbsoluteFill style={{ background: c.bg, fontFamily: font, padding: "44px 30px 0" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Mark /></div>
      <div style={{ position: "relative", height: 1180, borderRadius: 40, border: `2px solid ${c.line}`, background: c.card, padding: "26px 26px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: c.cream, fontSize: 38, fontWeight: 800 }}>Coach</div>
          <div style={{ padding: "12px 20px", borderRadius: 18, border: `2px solid ${c.line}`, color: c.sage, fontSize: 22, fontWeight: 700 }}>Chats</div>
        </div>
        <div style={{ marginTop: 22 }}>
          <Pop at={T.shot} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <div style={{ width: 150, height: 220, borderRadius: 18, border: "2px solid rgba(211,255,104,0.35)", background: "#000", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {[60, 72, 48, 0, 58].map((w, i) => (w ? <div key={i} style={{ height: 14, width: `${w}%`, borderRadius: 8, alignSelf: i === 1 ? "flex-end" : "flex-start", background: i === 1 ? c.you : c.them }} /> : <div key={i} style={{ height: 10 }} />))}
            </div>
          </Pop>
          {frame >= T.read && (
            <Pop at={T.read} style={{ display: "flex", marginBottom: 18 }}>
              <div style={{ maxWidth: "88%", padding: "20px 24px", borderRadius: 28, borderBottomLeftRadius: 8, background: "rgba(255,255,255,0.07)", border: `2px solid ${c.line}`, color: c.cream, fontSize: 29, lineHeight: 1.3 }}>
                {read.slice(0, readShown)}
              </div>
            </Pop>
          )}
          {frame >= T.drafts && (
            <Pop at={T.drafts}>
              <div style={{ color: "#6ee7b7", fontSize: 21, fontWeight: 800, letterSpacing: 1.2, margin: "4px 4px 12px" }}>COACH DRAFTS</div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ display: "flex", gap: 18, transform: `translateX(${-slide * 658}px)` }}>
                  <Draft label="Shorter" text="all good. how's your week going?" featured={slide < 0.5} />
                  <Draft label="Spicier" text="missed you a little. don't make it a habit" featured={slide >= 0.5} copied={copied} tapAt={T.tap} />
                  <Draft label="Softer" text="no worries, hope things calm down for you" />
                </div>
              </div>
            </Pop>
          )}
          {frame >= T.tweaks && (
            <Pop at={T.tweaks} style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
              {["Shorter", "Warmer", "Bolder", "More casual"].map((t) => (
                <div key={t} style={{ padding: "12px 22px", borderRadius: 99, border: `2px solid ${c.line}`, color: c.sage, fontSize: 23, fontWeight: 700 }}>{t}</div>
              ))}
            </Pop>
          )}
        </div>
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ padding: "14px 22px", borderRadius: 18, fontSize: 24, fontWeight: 800, border: `2px solid ${detected ? "rgba(211,255,104,0.45)" : c.line}`, background: detected ? "rgba(211,255,104,0.12)" : "transparent", color: detected ? c.lime : c.sage }}>
            {detected ? "Crush" : "Who is it?"}
          </div>
          <div style={{ color: c.faint, fontSize: 21, opacity: fade(frame, T.detect, T.detect + 10) * (1 - fade(frame, T.drafts, T.drafts + 10)) }}>read from your screenshot</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const o = fade(frame, T.end, T.end + 14);
  return (
    <AbsoluteFill style={{ background: c.bg, opacity: o, fontFamily: font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30, padding: 90 }}>
      <div style={{ color: c.cream, fontSize: 82, fontWeight: 900, letterSpacing: -2.5, textAlign: "center", lineHeight: 1.02 }}>Don&apos;t send the paragraph.</div>
      <div style={{ color: c.lime, fontSize: 64, fontWeight: 900, letterSpacing: -2, textAlign: "center" }}>Say the real thing.</div>
      <div style={{ marginTop: 40, padding: "30px 46px", borderRadius: 30, background: c.lime, color: c.limeInk, fontSize: 42, fontWeight: 900, boxShadow: "0 26px 70px rgba(211,255,104,0.25)" }}>Try it free · link in bio</div>
      <div style={{ color: c.sage, fontSize: 30, fontWeight: 700 }}>textwingman.app</div>
      <div style={{ position: "absolute", bottom: 90, color: c.faint, fontSize: 22, fontWeight: 600 }}>Dramatization. Fictional example. Replies vary.</div>
    </AbsoluteFill>
  );
};

export const ProductDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const inApp = frame >= T.app && frame < T.back;
  const flash = fade(frame, T.flash, T.flash + 4) * (1 - fade(frame, T.flash + 6, T.flash + 16));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 8%, rgba(211,255,104,0.16), transparent 38%), ${c.bg}`, fontFamily: font }}>
      <Caption
        lines={[
          { at: 0, until: T.silence, text: "3 weeks of good morning texts." },
          { at: T.silence, until: T.typing, text: "Then two days of nothing." },
          { at: T.typing, until: T.stop, text: "So you start typing the paragraph…" },
          { at: T.stop, until: T.app, text: "Don't send that.", accent: true },
          { at: T.app, until: T.read, text: "Screenshot it. Ask Text Wingman." },
          { at: T.read, until: T.drafts, text: "It reads the room." },
          { at: T.drafts, until: T.back, text: "Pick the one that sounds like you." },
          { at: T.back, until: T.reply, text: "You send this instead." },
          { at: T.reply, until: T.end, text: "And then…", accent: true },
        ]}
      />
      <Phone>{inApp ? <CoachScreen /> : <MessagesScreen />}</Phone>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      {frame >= T.end && <EndCard />}
    </AbsoluteFill>
  );
};
