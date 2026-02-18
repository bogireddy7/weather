const starsEl = document.getElementById('stars');
for (let i = 0; i < 120; i++) {
  const s = document.createElement('div');
  s.className = 'star';
  const sz = Math.random() * 2.2 + 0.4;
  s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--d:${(Math.random()*3+2).toFixed(1)}s;animation-delay:${(Math.random()*4).toFixed(1)}s`;
  starsEl.appendChild(s);
}

// Weather icons
const WX = {
  0:{l:'Clear Sky',i:'☀️'},1:{l:'Mainly Clear',i:'🌤'},2:{l:'Partly Cloudy',i:'⛅'},3:{l:'Overcast',i:'☁️'},
  45:{l:'Foggy',i:'🌫'},48:{l:'Icy Fog',i:'🌫'},51:{l:'Light Drizzle',i:'🌦'},53:{l:'Drizzle',i:'🌦'},
  55:{l:'Heavy Drizzle',i:'🌧'},61:{l:'Slight Rain',i:'🌧'},63:{l:'Rain',i:'🌧'},65:{l:'Heavy Rain',i:'🌨'},
  71:{l:'Slight Snow',i:'🌨'},73:{l:'Snow',i:'❄️'},75:{l:'Heavy Snow',i:'❄️'},80:{l:'Showers',i:'🌦'},
  81:{l:'Rain Showers',i:'🌧'},82:{l:'Violent Showers',i:'⛈'},95:{l:'Thunderstorm',i:'⛈'},99:{l:'Thunderstorm',i:'⛈'},
};
function wx(code){ return WX[code] || {l:'Unknown',i:'🌡'}; }

// Quick search via input
function quickSearch(city){document.getElementById('search-input').value=city; doSearch();}
async function doSearch(){
  const query = document.getElementById('search-input').value.trim();
  if(!query) return;
  showLoading();
  try{
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();
    if(!geoData.results || geoData.results.length===0){showError('City not found'); return;}
    const { latitude, longitude, name, country, timezone } = geoData.results[0];
    const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(timezone)}&forecast_days=7`);
    const wxData = await wxRes.json();
    renderWeather(wxData,name,country);
  }catch(e){showError('Could not load weather.');}
}
function renderWeather(data,city,country){
  const cur=data.current_weather,daily=data.daily,hourly=data.hourly,info=wx(cur.weathercode);
  document.getElementById('r-city').textContent=city;
  document.getElementById('r-country').textContent=country;
  document.getElementById('r-icon').textContent=info.i;
  document.getElementById('r-temp').textContent=Math.round(cur.temperature)+'°';
  document.getElementById('r-cond').textContent=info.l;
  document.getElementById('r-hl').innerHTML=`H: ${Math.round(daily.temperature_2m_max[0])}° | L: ${Math.round(daily.temperature_2m_min[0])}° | Feels like —°`;
  document.getElementById('r-humidity').textContent='—';
  document.getElementById('r-wind').textContent='—';
  document.getElementById('r-uv').textContent='—';

  let hourlyHtml='';
  for(let i=0;i<hourly.time.length;i++){
    const t=new Date(hourly.time[i]),h=wx(hourly.weathercode[i]),label=i===0?'NOW':t.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true});
    hourlyHtml+=`<div class="h-item ${i===0?'now':''}"><div class="h-time">${label}</div><div class="h-icon">${h.i}</div><div class="h-rain">${hourly.precipitation_probability[i]}%</div><div class="h-temp">${Math.round(hourly.temperature_2m[i])}°</div></div>`;
  }
  document.getElementById('hourly-strip').innerHTML=hourlyHtml;

  const dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  document.getElementById('weekly-list').innerHTML=daily.time.map((date,i)=>{
    const d=new Date(date+'T00:00:00'),dInfo=wx(daily.weathercode[i]);
    return `<div class="w-item"><div class="w-day">${i===0?'Today':dayNames[d.getDay()]}</div><div class="w-icon">${dInfo.i}</div><div class="w-cond">${dInfo.l}</div><div class="w-temps"><span class="w-high">${Math.round(daily.temperature_2m_max[i])}°</span> <span class="w-low">${Math.round(daily.temperature_2m_min[i])}°</span></div></div>`;
  }).join('');

  document.getElementById('loading-wrap').style.display='none';
  document.getElementById('default-wrap').style.display='none';
  document.getElementById('error-wrap').style.display='none';
  document.getElementById('result-wrap').style.display='flex';
}
function showLoading(){
  document.getElementById('loading-wrap').style.display='flex';
  document.getElementById('default-wrap').style.display='none';
  document.getElementById('result-wrap').style.display='none';
  document.getElementById('error-wrap').style.display='none';
}
function showError(msg){
  document.getElementById('loading-wrap').style.display='none';
  document.getElementById('default-wrap').style.display='flex';
  const el=document.getElementById('error-wrap');
  el.textContent='⚠️ '+msg;
  el.style.display='block';
}
function switchTab(tab){
  document.getElementById('tab-h').className='tab-btn'+(tab==='hourly'?' active':'');
  document.getElementById('tab-w').className='tab-btn'+(tab==='weekly'?' active':'');
  document.getElementById('panel-hourly').className=tab==='hourly'?'':'hidden';
  document.getElementById('panel-weekly').className=tab==='weekly'?'':'hidden';
}
document.getElementById('search-input').addEventListener('keydown',e=>{if(e.key==='Enter') doSearch();});

// Load default city
quickSearch('Hyderabad');