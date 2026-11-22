/** A Moscow calendar day selects one approved location, independently of API updates. */
export const OFFICIAL_LOCATIONS=Object.freeze(['desert','industrial','temple','coast']);
const dayNumber=date=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid publication date');
  const ms=Date.parse(date+'T00:00:00Z');
  if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==date)throw Error('Invalid publication date');
  return ms/86400000;
};
export function calendarDate(now,timezone='Europe/Moscow'){
  if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error('Invalid clock');
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get=type=>parts.find(p=>p.type===type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validateSettings(settings){
  if(settings.timezone!=='Europe/Moscow'||settings.rotation?.mode!=='daily-cycle'||settings.rotation.preventConsecutiveRepeats!==true)
    throw Error('Invalid daily rotation settings');
  const order=settings.rotation.order;
  if(!Array.isArray(order)||order.length!==4||new Set(order).size!==4||order.some(id=>!OFFICIAL_LOCATIONS.includes(id)))
    throw Error('Only the four approved locations may be published');
  dayNumber(settings.rotation.epoch);
  for(const id of order)if(!Number.isSafeInteger(settings.seeds?.[id])||settings.seeds[id]<0)throw Error('Invalid approved seed');
}
export function selectDailyLocation(settings,previous,now=new Date()){
  validateSettings(settings);
  const date=calendarDate(now,settings.timezone),day=dayNumber(date),order=settings.rotation.order;
  if(previous){
    if(!OFFICIAL_LOCATIONS.includes(previous.location))throw Error('Unknown previously published location');
    if(previous.date===null){if(previous.bootstrap!==true)throw Error('Invalid bootstrap state');}
    else if(dayNumber(previous.date)>day)throw Error('Publication clock moved backwards');
    if(previous.date===date){
      if(previous.seed!==settings.seeds[previous.location])throw Error('Same-day approved seed changed');
      return {...previous,version:settings.version};
    }
  }
  let index=((day-dayNumber(settings.rotation.epoch))%order.length+order.length)%order.length;
  if(previous?.location===order[index])index=(index+1)%order.length;
  const location=order[index];
  if(previous&&location===previous.location)throw Error('Consecutive location repeat');
  return {schema:1,version:settings.version,date,location,seed:settings.seeds[location],previousDate:previous?.date??null,previousLocation:previous?.location??null};
}
