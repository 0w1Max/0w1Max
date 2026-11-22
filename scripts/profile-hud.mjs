/** Include even the final partial month and keep bold labels inside the calendar. */
const MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
export const HUD=Object.freeze({titleSize:21,monthSize:15,cellSize:18,gap:2,radius:3});
export function monthLabels(grid,{gridX=72,step=20,cell=18}={}){
  const groups=new Map();
  for(let col=0;col<grid.length;col++)for(const day of grid[col]){
    if(!day)continue;
    const month=day.date.slice(0,7);
    if(!groups.has(month))groups.set(month,col);
  }
  const right=gridX+(grid.length-1)*step+cell,width=HUD.monthSize*.64*3,gap=7;
  const labels=[...groups].sort(([a],[b])=>a.localeCompare(b)).map(([month,col])=>({month,text:MONTHS[Number(month.slice(5))-1],x:Math.min(gridX+col*step,right-width),width}));
  // Only the first partial month can share a column with the next month.
  // Move earlier labels left when needed; keep the newest month visible.
  for(let i=labels.length-2;i>=0;i--)labels[i].x=Math.min(labels[i].x,labels[i+1].x-width-gap);
  if(labels.some(label=>label.x<8||label.x+label.width>right+.001))throw Error('Month labels do not fit');
  return labels;
}
