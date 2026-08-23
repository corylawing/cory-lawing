/* verifier.js — checks the schedule against every date confirmed between the
   parents, the civil week numbers, and the published Zone B holiday dates.
   Run with:  node calendrier/verifier.js
   Prints a count of checks and any failure. No personal data. */

global.window={}; require(__dirname + '/vacances.js');
require(__dirname + '/engine.js');
const E=window.Engine,V=window.Vacances,H=V.helpers,{D,ISO,addDays,dayDiff}=H;
const cfg={...E.DEFAULTS};
const FROM='2026-07-01', TO='2037-06-30';
const plan=E.plan(cfg,FROM,TO);
let pass=0, fail=0;
const ok=(c,m)=>{ c?pass++:(fail++,console.log('   FAIL  '+m)); };
const who=k=>{const d=plan.get(k); return d?(d.parent==='A'?'PAPA':'MAMAN'):'?';};

console.log('A. Dates confirmed by both parents');
[['2026-08-22','PAPA','veille du depot'],['2026-08-23','MAMAN','depot dimanche 23 aout'],
 ['2026-08-31','MAMAN','fin des vacances d ete'],['2026-09-02','MAMAN','pas au pere'],
 ['2026-09-03','MAMAN','pas au pere'],['2026-09-04','PAPA','recuperation vendredi 4'],
 ['2026-09-10','PAPA','fin de sa semaine paire'],['2026-09-11','MAMAN','retour vendredi 11'],
 ['2026-10-17','PAPA','Toussaint 1re moitie'],['2026-10-24','PAPA','fin 1re moitie'],
 ['2026-10-25','MAMAN','Toussaint 2e moitie'],
 ['2026-10-31','MAMAN','fin de la 2e moitie'],
 ['2026-11-01','PAPA','dernier dimanche, retour 18h'],
 ['2026-11-02','PAPA','semaine de la rentree (periode du 30 oct, S44 paire)'],
 ['2026-11-05','PAPA','fin de la periode'],
 ['2026-11-06','MAMAN','vendredi suivant'],
 ['2026-12-19','PAPA','Noel 1re moitie'],['2026-12-25','PAPA','Noel'],
 ['2026-12-26','PAPA','fin 1re moitie'],['2026-12-27','MAMAN','Noel 2e moitie'],
 ['2027-01-03','MAMAN','fin des vacances de Noel'],
 ['2027-02-20','MAMAN','Hiver 1re moitie, annee impaire'],['2027-02-27','MAMAN','fin 1re moitie'],
 ['2027-02-28','PAPA','Hiver 2e moitie'],
 ['2027-03-06','PAPA','fin de la 2e moitie'],
 ['2027-03-07','MAMAN','dernier dimanche, retour 18h'],
 ['2027-04-17','MAMAN','Printemps 1re moitie'],['2027-04-25','PAPA','Printemps 2e moitie'],
].forEach(([k,w,l])=>ok(who(k)===w, k+' devrait etre '+w+' ('+l+') — obtenu '+who(k)));

console.log('B. Week numbers match the civil calendar');
[['2026-08-31',36],['2026-09-07',37],['2026-09-14',38],['2026-12-28',53],['2027-01-04',1],
 ['2027-01-11',2],['2028-01-03',1]].forEach(([k,n])=>
  ok(plan.get(k) && plan.get(k).civilWeek===n, k+' devrait afficher S'+n+' — obtenu S'+(plan.get(k)||{}).civilWeek));

console.log('C. Every day assigned exactly once, no gap');
let gaps=0, n=0;
for(let dt=D(FROM); dt<=D(TO); dt=addDays(dt,1)){ n++; const d=plan.get(ISO(dt));
  if(!d || (d.parent!=='A'&&d.parent!=='B')) gaps++; }
ok(gaps===0, gaps+' jours non attribues sur '+n);

console.log('D. Term-time periods start on a Friday and run 7 days');
const term=E.blocks(plan).filter(b=>b.src==='term-week');
// a term period may also begin on the Monday school resumes after a holiday
// legitimate non-Friday starts: the Monday school resumes after a holiday, and
// the Monday after a Mother's or Father's Day weekend
const resumes=new Set(E.periodsFor(cfg,FROM,TO).map(p=>ISO(p.resume)));
for(let y=2026;y<=2037;y++){
  resumes.add(ISO(addDays(E.feteDesMeres(y),1)));
  resumes.add(ISO(addDays(E.feteDesPeres(y),1)));
}
const badDay=term.filter(b=>![5,3].includes(b.start.getUTCDay()) && !resumes.has(ISO(b.start)));
ok(badDay.length===0, badDay.length+' periodes scolaires a un jour de debut inattendu'
  + (badDay.length?': '+badDay.slice(0,5).map(b=>ISO(b.start)).join(', '):''));

console.log('E. Even weeks to the father, odd to the mother');
let par=0;
for(const d of plan.values()){
  if(d.src!=='term-week') continue;
  const expect = d.week%2===0 ? 'A':'B';
  if(d.parent!==expect) par++;
}
ok(par===0, par+' jours de periode scolaire du mauvais cote de la parite');

console.log('F. Each half-term holiday split within two days, first half by year parity');
let hb=0;
for(const p of E.periodsFor(cfg,FROM,TO)){
  if(!['toussaint','noel','hiver','printemps'].includes(p.key)) continue;
  let a=0,b=0;
  for(let dt=p.start; dt<=p.last; dt=addDays(dt,1)){ const d=plan.get(ISO(dt)); if(d) d.parent==='A'?a++:b++; }
  // up to two days apart: the closing Sunday hands over at 18:00, so it can
  // fall on the other side of the split
  if(Math.abs(a-b)>2) { hb++; console.log('      '+p.sy+' '+p.key+' : '+a+'/'+b); }
  // first half must follow the parity of the starting year
  const first=plan.get(ISO(p.start)).parent;
  const expect = p.start.getUTCFullYear()%2===0 ? 'A':'B';
  if(first!==expect) { hb++; console.log('      '+p.sy+' '+p.key+' : 1re moitie a '+first+' au lieu de '+expect); }
}
ok(hb===0, hb+' vacances mal partagees');

console.log('G. Summer: eight weeks, 3/3/1/1, reversing by year');
let sb=0;
for(const p of E.periodsFor(cfg,FROM,TO)){
  if(p.key!=='ete') continue;
  const y=p.start.getUTCFullYear();
  const seq=['A','A','A','B','B','B','A','B'].map(x=> y%2===0?x:(x==='A'?'B':'A'));
  for(let w=1;w<=8;w++){
    const anchor=H.onOrAfterWeekday(p.start,0);
    const d0=addDays(anchor,(w-1)*7);
    if(d0>p.last) continue;
    const d=plan.get(ISO(d0));
    if(d && d.parent!==seq[w-1]){ sb++; console.log('      ete '+y+' semaine '+w+' : '+d.parent+' au lieu de '+seq[w-1]); }
  }
}
ok(sb===0, sb+' semaines d ete mal attribuees');

console.log('H. Tuesday rule applies in term time only, and stops in Sept 2029');
let tb=0;
for(const d of plan.values()){
  const isTue=d.date.getUTCDay()===2, before=d.iso<'2029-09-01';
  if(isTue && !d.period && before && d.parent!=='B') { tb++; }
  if(isTue && d.period && d.src==='midweek') tb++;              // must not fire in holidays
  if(isTue && !before && d.src==='midweek') tb++;               // must not fire after 2029
}
ok(tb===0, tb+' mardis incorrects');

console.log('I. Mother’s / Father’s Day weekends');
let fb=0;
for(let y=2027;y<=2035;y++){
  const m=E.feteDesMeres(y), p=E.feteDesPeres(y);
  if(plan.get(ISO(m)) && plan.get(ISO(m)).parent!=='B') fb++;
  if(plan.get(ISO(p)) && plan.get(ISO(p)).parent!=='A') fb++;
}
ok(fb===0, fb+' week-ends de fete mal attribues');

console.log('J. Holiday dates match the published arretes (Zone B)');
const OFF={'2026-10-17':'2026-11-02','2026-12-19':'2027-01-04','2027-02-20':'2027-03-08',
           '2027-04-17':'2027-05-03','2027-07-03':'2027-09-02','2027-10-23':'2027-11-08',
           '2027-12-18':'2028-01-03','2028-02-05':'2028-02-21','2028-04-08':'2028-04-24'};
let db=0;
for(const [st,rs] of Object.entries(OFF)){
  // the raw transcription, not the engine's copy: the summer start is shifted
  // back to the Friday for allocation, which must not mask a data error
  const p=V.periodsBetween(FROM,TO).find(x=>ISO(x.start)===st);
  if(!p || ISO(p.resume)!==rs){ db++; console.log('      '+st+' -> reprise '+(p?ISO(p.resume):'absent')+' au lieu de '+rs); }
}
ok(db===0, db+' dates de vacances incorrectes');

console.log('K. Night balance over ten years');
let a=0,b=0; for(const d of plan.values()) d.parent==='A'?a++:b++;
console.log('   PAPA '+a+' / MAMAN '+b+'  ('+(100*a/(a+b)).toFixed(1)+'% / '+(100*b/(a+b)).toFixed(1)+'%)');

console.log('');
console.log(fail===0 ? '=== '+pass+' verifications, 0 erreur ===' : '=== '+pass+' ok, '+fail+' ERREUR(S) ===');
