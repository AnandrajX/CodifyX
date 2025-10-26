const apiKey = 'AIzaSyBS1MZYT8a0DUaEpKj6bQOIQkJB7pStRfU';
const maxResults = 12;

// ✅ Only Channel IDs now — no names or icons
const CHANNELS = [
  'UCBwmMxybNva6P_5VmxjzwqA', // Apna College
  'UCDrf0V4fcBr5FlCtKwvpfwA', // College Wallah
  'UCeVMnSShP_Iviwkknt83cww', // Code With Harry
  'UCYO_jab_esuFRV4b17AJtAw'  // 3Blue1Brown (example)
];

const PLAYLISTS = [
  ['PLxgZQoSe9cg1drBnejUaDD9GEJBGQ5hMt','C PW'],
  ['PL98qAXLA6aftD9ZlnjpLhdQAOFI8xIB6e','C Programiz'],
  ['PLP9IO4UYNF0VdAajP_5pYG-jG2JRrG72s','HTML W3S'],
  ['PLP9IO4UYNF0UCaUSF3XNZ1U9f01E5h5PM','CSS W3S'],
  ['PLP9IO4UYNF0WWmZpE3W33vVPRl2GvjEqz','JS W3S'],
  ['PLhQjrBD2T3817j24-GogXmWqO5Q5vYy0V','CS50 PYTHON'],
  ['PLkDaE6sCZn6FNC6YRfRQc_FbeQrF8BwGI','ML Andrew Ng'],
  ['PLfqMhTWNBTe0b2nM6JHVCnAkhQRGiZMSJ','C++ APNI KAKSHA']
];

let nextPageToken = '';
let currentSource = null;

const $channels = document.getElementById('channelButtons');
const $playlists = document.getElementById('playlistButtons');
const $grid = document.getElementById('videosContainer');

function makeBtn(label, img){
  const b = document.createElement('button');
  b.className = 'btn';
  if(img){
    const i = document.createElement('img');
    i.src = img;
    i.alt = label;
    b.appendChild(i);
  }
  const t = document.createElement('strong');
  t.textContent = label;
  b.appendChild(t);
  return b;
}

// ✅ Fetch channel info automatically
async function loadChannels() {
  for (const id of CHANNELS) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${id}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      const channel = data.items?.[0]?.snippet;
      if (channel) {
        const label = channel.title;
        const logo = channel.thumbnails.high.url;
        const b = makeBtn(label, logo);
        b.onclick = () => fetchChannel(id);
        $channels.appendChild(b);
      }
    } catch (err) {
      console.error('Error loading channel', id, err);
    }
  }
}

// ✅ Playlist buttons stay same
PLAYLISTS.forEach(([id,label])=>{
  const b=makeBtn(label);
  b.onclick=()=>fetchPlaylist(id);
  $playlists.appendChild(b);
});

async function fetchChannel(id,pageToken=''){
  currentSource={type:'channel',id};
  $grid.setAttribute('aria-busy','true');
  const url=new URL('https://www.googleapis.com/youtube/v3/search');
  url.search=new URLSearchParams({
    key:apiKey,
    channelId:id,
    part:'snippet,id',
    order:'date',
    maxResults:String(maxResults),
    pageToken
  });
  const res=await fetch(url);
  const data=await res.json();
  nextPageToken=data.nextPageToken||'';
  if(!pageToken) $grid.innerHTML='';
  (data.items||[]).forEach(addCardFromSearch);
  $grid.setAttribute('aria-busy','false');
}

async function fetchPlaylist(id,pageToken=''){
  currentSource={type:'playlist',id};
  $grid.setAttribute('aria-busy','true');
  const url=new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.search=new URLSearchParams({
    key:apiKey,
    playlistId:id,
    part:'snippet',
    maxResults:String(maxResults),
    pageToken
  });
  const res=await fetch(url);
  const data=await res.json();
  nextPageToken=data.nextPageToken||'';
  if(!pageToken) $grid.innerHTML='';
  (data.items||[]).forEach(addCardFromPlaylist);
  $grid.setAttribute('aria-busy','false');
}

function addCardFromSearch(item){
  const vid=item?.id?.videoId; if(!vid) return;
  const s=item.snippet;
  addCard({
    videoId:vid,
    title:s.title,
    date:s.publishedAt,
    thumb:(s.thumbnails?.high||s.thumbnails?.medium)?.url
  });
}

function addCardFromPlaylist(item){
  const s=item.snippet;
  addCard({
    videoId:s?.resourceId?.videoId,
    title:s.title,
    date:s.publishedAt,
    thumb:(s.thumbnails?.high||s.thumbnails?.medium)?.url
  });
}

function addCard({videoId,title,date,thumb}){
  const card=document.createElement('article');
  card.className='card';
  card.innerHTML=`
    <div class="thumb" role="button" tabindex="0" data-video="${videoId}">
      <img loading="lazy" src="${thumb}" alt="Thumbnail"/>
      <div class="overlay"><div class="playbtn"></div></div>
    </div>
    <div class="meta">
      <div class="title">${escapeHtml(title)}</div>
      <div class="sub">Published: ${new Date(date).toLocaleDateString()}</div>
    </div>`;
  card.querySelector('.thumb').addEventListener('click',()=>openModal(videoId));
  card.querySelector('.thumb').addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();openModal(videoId);}
  });
  $grid.appendChild(card);
}

const $modal=document.getElementById('playerModal');
const $frame=document.getElementById('playerFrame');

function openModal(videoId){
  $frame.src=`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  $modal.classList.add('open');
}
function closeModal(){
  $frame.src='';
  $modal.classList.remove('open');
}

function loadMore(){
  if(!currentSource||!nextPageToken) return;
  if(currentSource.type==='channel') fetchChannel(currentSource.id,nextPageToken);
  else fetchPlaylist(currentSource.id,nextPageToken);
}
window.loadMore=loadMore;

function escapeHtml(str=''){
  return str.replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));
}

// ✅ Automatically load channel buttons on start
loadChannels();

// ✅ Default load (optional)
fetchChannel('UCYO_jab_esuFRV4b17AJtAw');