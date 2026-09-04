// Общие хелперы управленческого дашборда (ТЗ 2026-09-04). Без фреймворков,
// без тяжёлых расчётов - только форматирование и отрисовка уже готовых чисел.
(function(){
'use strict';

const NAV = [
  {href:'index.html',   label:'Пульт',           ic:'⌂'},
  {href:'actions.html',  label:'Действия',        ic:'☑'},
  {href:'finance.html',  label:'Финансы',         ic:'₽'},
  {href:'sales.html',    label:'Продажи',         ic:'↗'},
  {href:'inventory.html',label:'Товар',           ic:'▦'},
  {href:'pricing.html',  label:'Цены и маржа',    ic:'⚖'},
  {href:'ads.html',      label:'Реклама',         ic:'◉'},
];
const SERVICE_NAV = [
  {href:'service.html',    label:'Состояние данных'},
  {href:'methodology.html',label:'Методология'},
  {href:'changelog.html',  label:'Журнал изменений'},
];
const BOTTOM_NAV = [
  {href:'index.html',  label:'Пульт',    ic:'⌂'},
  {href:'actions.html', label:'Действия',ic:'☑'},
  {href:'finance.html', label:'Деньги',  ic:'₽'},
  {href:'more.html',    label:'Ещё',     ic:'…'},
];

function currentFile(){
  const p = location.pathname.split('/').pop();
  return p || 'index.html';
}

function renderNav(){
  const cur = currentFile();
  const top = document.createElement('div');
  top.className = 'pagenav main';
  top.innerHTML = NAV.map(function(n){
    return '<a href="'+n.href+'"'+(n.href===cur?' class="on"':'')+'>'+n.label+'</a>';
  }).join('') + '<span style="flex:1"></span>' + SERVICE_NAV.map(function(n){
    return '<a href="'+n.href+'"'+(n.href===cur?' class="on"':'')+' style="opacity:.7;font-size:11.5px">'+n.label+'</a>';
  }).join('');

  const bottom = document.createElement('div');
  bottom.className = 'bottomnav';
  bottom.innerHTML = BOTTOM_NAV.map(function(n){
    const isMore = n.href === 'more.html';
    const on = isMore ? SERVICE_NAV.some(function(s){return s.href===cur}) || cur==='actions.html' && false
                       : n.href===cur;
    return '<a href="'+(isMore?'service.html':n.href)+'"'+(on?' class="on"':'')+'>'+
           '<span class="ic">'+n.ic+'</span>'+n.label+'</a>';
  }).join('');

  const mount = document.getElementById('navmount');
  if (mount){ mount.appendChild(top); mount.appendChild(bottom); }
}

// ── форматирование ──
function fmt0(x){
  if (x===null || x===undefined || Number.isNaN(x)) return '—';
  return Math.round(x).toLocaleString('ru-RU');
}
function fmtRub(x){ return x===null||x===undefined ? '—' : fmt0(x)+' ₽'; }
function fmtPct(x, digits){
  if (x===null||x===undefined||Number.isNaN(x)) return '—';
  return x.toFixed(digits===undefined?1:digits).replace('.',',')+'%';
}
function fmtDate(d){
  if (!d) return '—';
  const [y,m,day] = d.split('-');
  return day+'.'+m+'.'+y;
}
function signClass(x){ return x>0 ? 'pos' : (x<0 ? 'neg' : 'flat'); }

function deltaHtml(delta){
  if (!delta || delta.abs===null || delta.abs===undefined) return '<span class="dim">нет сравнения</span>';
  const arrow = delta.abs>0 ? '↑' : (delta.abs<0 ? '↓' : '→');
  const pct = delta.pct!==null && delta.pct!==undefined ? ' ('+(delta.pct>0?'+':'')+fmtPct(delta.pct)+')' : '';
  return arrow+' '+(delta.abs>0?'+':'')+fmt0(delta.abs)+' ₽'+pct;
}

// ── fetch с понятной ошибкой вместо вечной "Загрузка…" (правило 15.6) ──
function fetchJSON(path){
  return fetch(path, {cache:'no-store'}).then(function(r){
    if (!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  });
}

function loadAll(paths){
  return Promise.all(paths.map(function(p){
    return fetchJSON(p).then(function(d){ return {ok:true, data:d}; })
                        .catch(function(e){ return {ok:false, error:String(e)}; });
  }));
}

function showFatalError(mountId, missing){
  const el = document.getElementById(mountId);
  if (!el) return;
  el.innerHTML = '<div class="err-box"><b>Не удалось загрузить данные:</b> '+missing.join(', ')+
    '. Страница не может показать актуальные цифры — попробуйте обновить позже или проверьте '+
    '<a href="service.html">состояние данных</a>.</div>';
}

function sourcePill(row){
  const cls = row.status==='актуально' ? 'ok' : row.status==='задержка' ? 'delay' : row.status==='ошибка' ? 'err' : 'none';
  return '<span class="pill"><span class="dot '+cls+'"></span>'+row.source+': '+row.status+'</span>';
}

function reliabilityTag(rel){
  if (rel==='факт') return '<span class="tag-fact">факт</span>';
  if (rel==='оценка') return '<span class="tag-est">оценка</span>';
  return '<span class="tag-est">неполные данные</span>';
}

window.Dash = {
  renderNav: renderNav, fmt0: fmt0, fmtRub: fmtRub, fmtPct: fmtPct, fmtDate: fmtDate,
  signClass: signClass, deltaHtml: deltaHtml, fetchJSON: fetchJSON, loadAll: loadAll,
  showFatalError: showFatalError, sourcePill: sourcePill, reliabilityTag: reliabilityTag,
};

document.addEventListener('DOMContentLoaded', renderNav);
})();
