/** Deterministic Computer Networks helpers used for NAT verification. */

export function usableHostsFromMask(maskOctets) {
  // maskOctets e.g. [255,255,240,0]
  let hostBits = 0;
  for (const oct of maskOctets) {
    for (let b = 0; b < 8; b++) {
      if (((oct >> (7 - b)) & 1) === 0) hostBits += 1;
    }
  }
  if (hostBits <= 1) return 0;
  return 2 ** hostBits - 2;
}

export function prefixFromMask(maskOctets) {
  let ones = 0;
  for (const oct of maskOctets) {
    for (let b = 7; b >= 0; b--) {
      if ((oct >> b) & 1) ones += 1;
      else return ones;
    }
  }
  return ones;
}

/** Number of fragments for payloadBytes over mtu with ipHeaderBytes (no options). */
export function ipv4FragmentCount(payloadBytes, mtu, ipHeaderBytes = 20) {
  const maxData = mtu - ipHeaderBytes;
  if (maxData <= 0) throw new Error('MTU too small');
  // Fragment payload must be multiple of 8
  const maxPayload = maxData - (maxData % 8);
  if (maxPayload <= 0) throw new Error('No room for fragment payload');
  return Math.ceil(payloadBytes / maxPayload);
}

/** Bandwidth-delay product in bits: R (bps) * 2 * propDelay (s) for full duplex stop-and-wait window? */
export function slidingWindowFrames({ bandwidthBps, propDelaySec, frameBits }) {
  const rtt = 2 * propDelaySec;
  const bdp = bandwidthBps * rtt;
  return Math.ceil(bdp / frameBits);
}

/** Simple CRC remainder: treat bits as poly division over GF(2). */
export function crcRemainder(dataBits, generatorBits) {
  const data = dataBits.replace(/[^01]/g, '');
  const gen = generatorBits.replace(/[^01]/g, '');
  if (!data || !gen || gen.length < 2) throw new Error('Invalid CRC inputs');
  const deg = gen.length - 1;
  let reg = (data + '0'.repeat(deg)).split('').map((c) => Number(c));
  const g = gen.split('').map((c) => Number(c));
  for (let i = 0; i <= reg.length - gen.length; i++) {
    if (reg[i] === 0) continue;
    for (let j = 0; j < g.length; j++) {
      reg[i + j] ^= g[j];
    }
  }
  return reg.slice(-deg).join('');
}

/** Transmission (serialization) delay in seconds. */
export function transmissionDelaySec(bits, bandwidthBps) {
  return bits / bandwidthBps;
}

/** One-way prop delay (s) for distanceMeters at speed m/s (default 2e8 copper/fiber approx). */
export function propagationDelaySec(distanceMeters, speedMps = 2e8) {
  return distanceMeters / speedMps;
}

/** Usable hosts from CIDR prefix length. */
export function usableHostsFromPrefix(prefix) {
  const hostBits = 32 - prefix;
  if (hostBits <= 1) return 0;
  return 2 ** hostBits - 2;
}

/** Number of /newPrefix subnets inside /oldPrefix. */
export function subnetCount(oldPrefix, newPrefix) {
  if (newPrefix < oldPrefix) throw new Error('newPrefix must be >= oldPrefix');
  return 2 ** (newPrefix - oldPrefix);
}

/** Slotted ALOHA throughput S = G * e^{-G}; return rounded % of capacity (G offered). */
export function slottedAlohaEfficiencyPercent(G, decimals = 2) {
  const s = G * Math.exp(-G);
  return Number((s * 100).toFixed(decimals));
}

/** Pure ALOHA S = G * e^{-2G}; return rounded %. */
export function pureAlohaEfficiencyPercent(G, decimals = 2) {
  const s = G * Math.exp(-2 * G);
  return Number((s * 100).toFixed(decimals));
}

/** Stop-and-wait utilization percent. */
export function stopAndWaitUtilPercent(Tt, Tp, decimals = 2) {
  return Number(((Tt / (Tt + 2 * Tp)) * 100).toFixed(decimals));
}

/** TCP slow-start cwnd (in MSS) after n successful RTTs starting from 1, capped by ssthresh. */
export function slowStartCwndAfterRtts(rtts, ssthresh = Infinity) {
  let cwnd = 1;
  for (let k = 0; k < rtts; k++) {
    if (cwnd >= ssthresh) {
      cwnd += 1; // rough CA: +1 MSS per RTT
    } else {
      cwnd = Math.min(cwnd * 2, ssthresh);
    }
  }
  return cwnd;
}

export function answersMatch(expected, actual, { numericTol = 0 } = {}) {
  const e = String(expected ?? '').trim();
  const a = String(actual ?? '').trim();
  if (!e || !a) return false;
  const eAlts = e.split('|').map((s) => s.trim());
  return eAlts.some((alt) => {
    if (alt.toUpperCase() === a.toUpperCase()) return true;
    const nE = Number(alt);
    const nA = Number(a);
    if (Number.isFinite(nE) && Number.isFinite(nA)) {
      return Math.abs(nE - nA) <= numericTol;
    }
    return false;
  });
}
