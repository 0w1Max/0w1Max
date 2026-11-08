/* Детализированный pixel-art каньон: один локальный PNG внутри автономного SVG. */
import {readFileSync} from 'node:fs';
let memo;
export function desertScene() {
  if (!memo) {
    const bytes=readFileSync(new URL('../assets/desert-canyon-background.png',import.meta.url));
    if (bytes.length<10000||bytes.length>500000 ||
        bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a' ||
        bytes.readUInt32BE(16)!==1200 || bytes.readUInt32BE(20)!==430) {
      throw new Error('Некорректный pixel-art фон каньона');
    }
    memo=bytes.toString('base64');
  }
  return '<g id="desert-canyon-v3" data-location="desert" data-art-version="3.0"><image x="0" y="0" width="1200" height="430" preserveAspectRatio="none" image-rendering="pixelated" href="data:image/png;base64,'+memo+'"/></g>';
}
