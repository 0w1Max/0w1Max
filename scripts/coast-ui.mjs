/**
 * Victory panel for Storm Coast. The global mission timing and alpha
 * animation remain owned by generate.mjs; only this biome's art differs.
 */
import {gameOverHeading,endScreenEntry} from './end-screen-art.mjs';

export function stormCoastVictory(timing) {
  const motion=endScreenEntry(timing);
  return `<g id="storm-coast-victory" data-biome="coast" data-end-screen="game-over" shape-rendering="crispEdges">
    ${motion}
    <rect x="364" y="209" width="472" height="100" fill="#102836" fill-opacity=".96"/>
    <rect x="368" y="213" width="464" height="92" fill="none" stroke="#8db7bd" stroke-width="3"/>
    <rect x="374" y="219" width="452" height="80" fill="none" stroke="#355f70" stroke-width="2"/>
    <path d="M364 234h9v-15h19v-10h-28zM836 234h-9v-15h-19v-10h28zM364 284h9v15h19v10h-28zM836 284h-9v15h-19v10h28z" fill="#b0cbd0"/>
    <rect x="382" y="226" width="26" height="3" fill="#86b6bf"/>
    <rect x="792" y="226" width="26" height="3" fill="#86b6bf"/>
    <rect x="384" y="284" width="48" height="3" fill="#375e6d"/>
    <rect x="769" y="284" width="48" height="3" fill="#375e6d"/>
    ${gameOverHeading('#f0eee2','#102836')}
    <rect x="458" y="274" width="80" height="2" fill="#4d919d"/>
    <rect x="663" y="274" width="80" height="2" fill="#4d919d"/>
    <text x="600" y="290" fill="#91c4c8" font-family="monospace" font-size="17" font-weight="bold" letter-spacing="2" text-anchor="middle">STORM COAST</text>
    <path d="M376 292h10v-3h11v3h11m383 0h10v-3h11v3h11" fill="none" stroke="#7babb2" stroke-width="2"/>
  </g>`;
}
