export type CardReview={due:number;interval:number;reviews:number;lapses:number;last:number};
export type LearningProgress={cards:Record<string,CardReview>;decisions:Record<string,{attempts:number;correct:number}>};
export type Rating='again'|'hard'|'good';
export function schedule(previous:CardReview|undefined,rating:Rating,now=Date.now()):CardReview {
 const interval=rating==='again'?0:rating==='hard'?1:Math.min(30,previous?.interval?previous.interval*2+1:3);
 return {due:now+(rating==='again'?600000:interval*86400000),interval,reviews:Math.min(10000,(previous?.reviews||0)+1),lapses:Math.min(10000,(previous?.lapses||0)+(rating==='again'?1:0)),last:now};
}
export function validLearning(value:unknown):value is LearningProgress {
 const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const num=(x:unknown,max:number)=>typeof x==='number'&&Number.isInteger(x)&&x>=0&&x<=max;
 if(!obj(value)||!obj(value.cards)||!obj(value.decisions)||Object.keys(value.cards).length>100||Object.keys(value.decisions).length>100)return false;
 for(const [id,c] of Object.entries(value.cards)){if(!/^[a-z][a-z0-9-]{0,59}$/.test(id)||!obj(c)||!num(c.due,8640000000000000)||!num(c.last,8640000000000000)||!num(c.interval,30)||!num(c.reviews,10000)||!num(c.lapses,10000)||Number(c.lapses)>Number(c.reviews))return false;}
 for(const [id,q] of Object.entries(value.decisions)){if(!/^[a-z][a-z0-9-]{0,59}$/.test(id)||!obj(q)||!num(q.attempts,10000)||!num(q.correct,10000)||Number(q.correct)>Number(q.attempts))return false;}
 return true;
}
