import { keyway, smallKeyway, keepK, keepE, keepP } from "./geometry";

/** Decorative artwork. The enclosing home link supplies the accessible name. */
export function KeepLogo() {
  return (
    <svg
      className="keep-logo"
      viewBox="0 0 794 256"
      width="146"
      height="47"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="keep-logo-mark" transform="translate(0 20) scale(.76)">
        <path className="keep-logo-normal" d={keyway} />
        <path className="keep-logo-reversed" d={smallKeyway} />
      </g>
      <g className="keep-logo-type" transform="translate(224 0)">
        <path d={keepK} />
        <path fillRule="evenodd" transform="translate(152 0)" d={keepE} />
        <path fillRule="evenodd" transform="translate(288 0)" d={keepE} />
        <path fillRule="evenodd" transform="translate(426 0)" d={keepP} />
      </g>
    </svg>
  );
}
