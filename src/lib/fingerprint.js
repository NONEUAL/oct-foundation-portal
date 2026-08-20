// A soft, lightweight fingerprint — good enough to stop one person rapidly
// clicking a button on the same device, not a real identity system. This is
// intentional: votes and predictions here are just for fun, not tied to any
// prize, so a student using a different browser or device to participate
// again is fine — this only blocks trivial repeat-click abuse.
function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function getFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || "",
  ];
  return simpleHash(parts.join("|"));
}