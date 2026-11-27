import React from "react";
import { Composition, registerRoot } from "remotion";
import scripts from "../scripts.json";
import { TextWingmanAvatar } from "./TextWingmanAvatar";
import { TextWingmanAd } from "./TextWingmanAd";
import { ProductDemo } from "./ProductDemo";
import type { VideoScript } from "./types";

const firstScript = scripts[0] as VideoScript;

const Root = () => {
  return (
    <>
      <Composition
        id="TextWingmanAd"
        component={TextWingmanAd}
        durationInFrames={540}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ script: firstScript }}
      />
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        durationInFrames={840}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TextWingmanAvatar"
        component={TextWingmanAvatar}
        durationInFrames={1}
        fps={30}
        width={720}
        height={720}
      />
    </>
  );
};

registerRoot(Root);
