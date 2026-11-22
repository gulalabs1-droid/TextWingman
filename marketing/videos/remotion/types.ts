export type VideoTemplate =
  | "wrong-right"
  | "group-chat"
  | "screenshot-analyzer"
  | "panic-translator"
  | "wrong-reply-court"
  | "texting-er"
  | "group-chat-outage"
  | "receipt"
  | "museum"
  | "scanner"
  | "comment-bait"
  | "funeral"
  | "speedrun"
  | "coach-scorecard"
  | "moment";

export type VideoScript = {
  id: string;
  scenario: string;
  audience: string;
  template: VideoTemplate;
  durationSeconds: number;
  hook: string;
  incoming: string;
  badReply: string;
  goodReply: string;
  why: string;
  cta: string;
  campaign: string;
  contentSlug: string;
  /** Small label above the hook; defaults to "STOP THE FUMBLE". */
  kicker?: string;
  /** Their reply after you sent the good one (the "moment" template's payoff). */
  outcome?: string;
};

export type VideoProps = {
  script: VideoScript;
};
