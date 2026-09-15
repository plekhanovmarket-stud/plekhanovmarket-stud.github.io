'use strict';
function evaluate(s){
 if(s.schema_version!==1||!Array.isArray(s.roadmap)||!Array.isArray(s.issues)||!s.evidence)throw Error('Неверная структура статуса');
 let total=0,score=0;const ids=new Set();
 for(const r of s.roadmap){let stage=0;for(const c of r.criteria){
  if(ids.has(c.id)||!Number.isFinite(c.weight)||c.weight<=0||!['VERIFIED','UNVERIFIED','INVALIDATED','BLOCKED'].includes(c.status))throw Error('Ошибка критерия '+c.id);
  ids.add(c.id);total+=c.weight;stage+=c.weight;
  if(c.status==='VERIFIED'){if(!c.evidence.length||c.evidence.some(e=>!s.evidence[e])||c.valid_for_code_commit!==s.observed_code_commit)throw Error('Недействительное доказательство '+c.id);score+=c.weight;}
 }if(stage!==r.weight)throw Error('Вес этапа не совпадает');}
 if(total!==100||score!==s.readiness.percent)throw Error('Готовность не совпадает с критериями');
 const critical=s.issues.filter(i=>i.severity==='CRITICAL'&&i.status!=='CLOSED').length;
 if(critical!==s.critical_open)throw Error('Количество проблем не совпадает');
 return {score,critical};
}
if(typeof module!=='undefined')module.exports={evaluate};
if(typeof document!=='undefined'){
 const el=id=>document.getElementById(id),text=(id,v)=>el(id).textContent=v;
 const node=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
 const symbol={VERIFIED:'✓',UNVERIFIED:'○',BLOCKED:'!',INVALIDATED:'×'};
 const labels={VERIFIED:'проверено',UNVERIFIED:'не проверено',BLOCKED:'заблокировано',INVALIDATED:'утратило проверку'};
 const signed=n=>(n>0?'+':'')+n+'%';
 const addLi=(id,value)=>el(id).append(node('li',value));
 async function get(path,format){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error(path+': HTTP '+r.status);return format==='json'?r.json():r.text();}
 Promise.all([get('project_status.json','json'),get('progress_log.jsonl','text')]).then(([s,raw])=>{
  const v=evaluate(s),cycles=raw.trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  if(!cycles.length||cycles.at(-1).cycle_id!==s.last_cycle.id||cycles.at(-1).readiness_after!==v.score)throw Error('История и текущий статус расходятся');
  const current=s.roadmap.find(r=>r.number===s.phase.current);
  const currentIndex=Math.max(0,current.criteria.findIndex(c=>c.status!=='VERIFIED'));
  const active=current.criteria[currentIndex];
  const next=current.criteria[currentIndex+1];
  const nextStage=s.roadmap.find(r=>r.number===s.phase.current+1);
  const after=next?nextStage?.criteria?.[0]:nextStage?.criteria?.[0];
  const remaining=current.criteria.filter(c=>c.status!=='VERIFIED').length;

  text('mode',s.mode);text('percent',v.score+'%');el('progress').value=v.score;
  text('phase','Этап '+s.phase.current+' из '+s.phase.total);text('phase-name',s.phase.name);
  text('substep-position',(currentIndex+1)+' из '+current.criteria.length);text('task',s.current_task);
  text('doing-now',s.next_step||'не определено');
  text('next-substep',next?next.id+' — '+next.name:'переход к следующему этапу');
  text('after-next',after?'Этап '+nextStage.number+': '+after.name:'не определено');
  text('stage-title','Этап '+current.number+' — '+current.name);
  text('remaining','До завершения этапа '+current.number+' осталось: '+remaining+' подшагов');

  current.criteria.forEach((c,i)=>{
   const isActive=i===currentIndex,cls=c.status==='VERIFIED'?'step done':isActive?'step active':c.status==='BLOCKED'?'step blocked':'step';
   const mark=c.status==='VERIFIED'?'✓':isActive?'▶':c.status==='BLOCKED'?'!':'○';
   const box=node('div',undefined,cls);box.append(node('span',mark+' '+(i+1),'mark'),node('small',c.id),node('div',c.name));el('substep-map').append(box);
  });
  const completed=current.criteria.filter(c=>c.status==='VERIFIED');
  if(completed.length)completed.forEach(c=>addLi('completed-now',c.name));else addLi('completed-now','Пока нет подтверждённых подшагов');
  addLi('now-list','Исполнитель: Робокоп');addLi('now-list','Задача: '+s.current_task);addLi('now-list','Критерий DONE: '+(active?.verification||'не определено'));
  addLi('next-list',next?next.name:'переход к следующему этапу');
  addLi('next-list',after?after.name:'не определено');
  addLi('next-list',nextStage?'Переход к этапу '+nextStage.number+' — '+nextStage.name:'Переход к DONE');

  text('next-stage',nextStage?nextStage.number+' из '+s.phase.total+' — '+nextStage.name:'DONE');
  s.roadmap.forEach(r=>{
   const done=r.criteria.every(c=>c.status==='VERIFIED'),isCurrent=r.number===s.phase.current,blocked=!isCurrent&&r.status.includes('ЗАБЛОКИРОВАНО');
   const mark=done?'✓':isCurrent?'▶':blocked?'!':'○',cls='road-stage '+(done?'done':isCurrent?'current':blocked?'blocked':'');
   const box=node('div',undefined,cls);box.append(node('strong',mark+' Этап '+r.number),node('span',r.name));el('stage-map').append(box);
  });

  text('baseline',s.last_accepted_baseline?.commit||'Не установлен для новой версии');text('code','Проверяемый код: '+s.observed_code_commit.slice(0,7));
  text('delta',signed(s.last_cycle.delta));text('critical',v.critical);
  text('updated','Снимок состояния: '+new Date(s.updated_at).toLocaleString('ru-RU',{timeZone:'Asia/Yekaterinburg'})+' · Челябинск');
  text('method','Сумма фиксированных весов — 100%. Вес учитывается только у проверенного критерия с действующим доказательством. '+s.readiness.percent+'% — первое измерение; протокол и веса ожидают независимой технической проверки.');
  text('transport',s.transport.note+' Страница показывает сохранённый снимок, а не активность Робокопа в реальном времени.');
  for(const x of s.known_limits)el('limits').append(node('li',x));for(const x of s.definition_of_done)el('done').append(node('li',x));
  for(const r of s.roadmap){
   const d=node('details'),sm=node('summary'),earned=r.criteria.filter(c=>c.status==='VERIFIED').reduce((a,c)=>a+c.weight,0);
   sm.append(node('span',r.number+'. '+r.name,'stage-head'),node('span',earned+' / '+r.weight+'%','weight'));d.append(sm,node('p',r.status+' · Зависит от: '+(r.dependencies.join(', ')||'—'),'stage-meta'),node('p',r.deliverable));
   for(const c of r.criteria){const box=node('div',undefined,'criterion');box.append(node('div',symbol[c.status]+' '+c.name,c.status==='VERIFIED'?'verified':c.status==='BLOCKED'?'blocked':''),node('p',c.id+' · Вес '+c.weight+'% · '+labels[c.status]),node('p','Проверка: '+c.verification));if(c.evidence.length)box.append(node('p','Доказательства: '+c.evidence.join(', ')));d.append(box);}el('stages').append(d);
  }
  for(const i of s.issues){const box=node('div',undefined,'issue');box.append(node('h3',i.id+' · '+i.title,i.severity==='CRITICAL'?'critical':''),node('p',i.severity+' · '+i.status+' · '+i.classification));if(i.note)box.append(node('p',i.note));box.append(node('p','Доказательства: '+i.evidence.join(', ')));el('issue-list').append(box);}
  for(const c of cycles.reverse()){const box=node('div',undefined,'cycle');box.append(node('strong',c.cycle_id+' · '+signed(c.delta)+' · '+c.decision),node('p',c.task),node('p',c.actual_result),node('p','Исполнитель: '+c.executor+'; проверяющий: '+c.verifier),node('p',c.initial_measurement?'Первое измерение; прирост не приписан.':c.readiness_before+'% → '+c.readiness_after+'%'));el('cycles').append(box);}
  for(const [id,e]of Object.entries(s.evidence)){const box=node('div',undefined,'evidence');box.append(node('strong',id+' · '+e.method),node('p',typeof e.result==='string'?e.result:JSON.stringify(e.result)));if(e.url){const a=node('a','Открыть источник');a.href=e.url;box.append(a);}el('evidence-list').append(box);}
  el('app').hidden=false;window.setTimeout(()=>window.location.reload(),60000);
 }).catch(e=>{text('mode','BLOCKED');text('error','Статус недоступен: '+e.message+'. Процент и отсутствие проблем не подтверждены.');el('error').hidden=false;el('app').hidden=true;});
}
