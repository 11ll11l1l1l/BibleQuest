import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const rooms=read('live-rooms.js');
const innovation=read('innovation-suite.js');

must(rooms.includes("['facilitator','leader','pastor','admin'].includes(r)"),'Live Rooms frontend must allow Pastor hosts');
must(rooms.includes('facilitator, leader, pastor, or admin can start a live room'),'Live Rooms access message must mention Pastor');
must(innovation.includes("['facilitator','leader','pastor','admin'].includes(role.data?.role||'')"),'Church Challenges frontend must allow Pastor launch');
must(innovation.includes('facilitator, leader, pastor, or admin can launch a congregation challenge'),'Challenge access message must mention Pastor');

console.log('Community Pastor role parity static checks passed');
