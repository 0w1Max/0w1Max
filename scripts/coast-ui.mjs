/**
 * Victory panel for Storm Coast. The global mission timing and alpha
 * animation remain owned by generate.mjs; only this biome's art differs.
 */
const fmt = number => Number(number.toFixed(6)).toString();
const progress = (time, duration) => fmt(Math.min(1, Math.max(0, time / duration)));

export function stormCoastVictory({duration, finishedAt, fadeBegin}) {
  if (![duration, finishedAt, fadeBegin].every(Number.isFinite) ||
      duration<=0 || finishedAt<0 || fadeBegin<=finishedAt || fadeBegin>duration) {
    throw new Error('Invalid Storm Coast victory animation timing');
  }
  const enterEnd=Math.min(finishedAt+.32, fadeBegin-.005);
  const moving=enterEnd>finishedAt+.01;
  const motion=moving
    ? '<animateTransform attributeName="transform" type="translate" calcMode="linear" keyTimes="' +
      [0,progress(finishedAt-.001,duration),progress(finishedAt,duration),progress(enterEnd,duration),1].join(';') +
      '" values="0 16;0 16;0 16;0 0;0 0" dur="' + fmt(duration) + 's" repeatCount="indefinite"/>'
    : '';
  return `<g id="storm-coast-victory" data-biome="coast" shape-rendering="crispEdges">
    ${motion}
    <rect x="364" y="209" width="472" height="100" fill="#102836" fill-opacity=".96"/>
    <rect x="368" y="213" width="464" height="92" fill="none" stroke="#8db7bd" stroke-width="3"/>
    <rect x="374" y="219" width="452" height="80" fill="none" stroke="#355f70" stroke-width="2"/>
    <path d="M364 234h9v-15h19v-10h-28zM836 234h-9v-15h-19v-10h28zM364 284h9v15h19v10h-28zM836 284h-9v15h-19v10h28z" fill="#b0cbd0"/>
    <rect x="382" y="226" width="26" height="3" fill="#86b6bf"/>
    <rect x="792" y="226" width="26" height="3" fill="#86b6bf"/>
    <rect x="384" y="284" width="48" height="3" fill="#375e6d"/>
    <rect x="769" y="284" width="48" height="3" fill="#375e6d"/>
    <text x="600" y="255" fill="#f0eee2" font-family="monospace" font-size="29" font-weight="bold" text-anchor="middle" letter-spacing=".7">MISSION COMPLETE</text>
    <rect x="458" y="267" width="80" height="2" fill="#4d919d"/>
    <rect x="663" y="267" width="80" height="2" fill="#4d919d"/>
    <text x="600" y="278" fill="#91c4c8" font-family="monospace" font-size="17" font-weight="bold" letter-spacing="2" text-anchor="middle">STORM COAST</text>
    <path d="M376 292h10v-3h11v3h11m383 0h10v-3h11v3h11" fill="none" stroke="#7babb2" stroke-width="2"/>
  </g>`;
}
