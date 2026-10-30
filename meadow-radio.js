const radio=document.querySelector('.meadow-radio');
if(radio){
  const audio=radio.querySelector('audio'),play=radio.querySelector('.radio-play'),mute=radio.querySelector('.radio-mute'),seek=radio.querySelector('input'),current=radio.querySelector('.radio-current'),duration=radio.querySelector('.radio-duration'),hint=radio.querySelector('.radio-hint');
  const english=()=>document.documentElement.lang==='en';
  const text=(zh,en)=>english()?en:zh;
  const time=n=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
  const length=()=>Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:32;
  const notes=[...radio.querySelectorAll('.score-note')];
  let audioContext,analyser,spectrum,waveform,notesFrame=0,lastNotesFrame=0;
  async function prepareAudio(){
    const AudioEngine=window.AudioContext||window.webkitAudioContext;
    if(!audioContext&&AudioEngine){
      audioContext=new AudioEngine();
      analyser=audioContext.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=.7;
      const source=audioContext.createMediaElementSource(audio);
      source.connect(analyser);analyser.connect(audioContext.destination);
      spectrum=new Uint8Array(analyser.frequencyBinCount);
      waveform=new Uint8Array(analyser.fftSize);
    }
    if(audioContext?.state==='suspended')await audioContext.resume();
  }
  function stopNotes(){cancelAnimationFrame(notesFrame);notesFrame=0;notes.forEach(note=>{note.style.setProperty('--note-y','0px');note.style.removeProperty('--note-opacity');});}
  function moveNotes(timestamp){
    if(audio.paused||document.hidden){stopNotes();return;}
    if(timestamp-lastNotesFrame>50){
      lastNotesFrame=timestamp;
      let pulse=0;
      if(analyser){analyser.getByteFrequencyData(spectrum);analyser.getByteTimeDomainData(waveform);for(const sample of waveform)pulse+=((sample-128)/128)**2;pulse=Math.min(1,Math.sqrt(pulse/waveform.length)*18);}
      notes.forEach((note,i)=>{
        let energy=0;
        if(spectrum){const start=2+i*3;for(let n=start;n<start+8;n++)energy+=spectrum[n]/255;energy=Math.min(1,pulse*.72+energy/8*.55);}
        else energy=(.45+.3*Math.sin(audio.currentTime*3.4-i*.8));
        if(audio.muted)energy*=.2;
        const lift=energy*(15+i%3*5),sway=Math.sin(audio.currentTime*4-i*.9)*energy*4;
        note.style.setProperty('--note-y',`${(-lift+sway).toFixed(2)}px`);
        note.style.setProperty('--note-opacity',String(.7+energy*.3));
      });
    }
    notesFrame=requestAnimationFrame(moveNotes);
  }
  function syncNotes(){if(audio.paused||document.hidden)stopNotes();else if(!notesFrame)notesFrame=requestAnimationFrame(moveNotes);}
  function update(){const total=length(),progress=Math.min(1,audio.currentTime/total);current.textContent=time(audio.currentTime);duration.textContent=time(total);seek.value=String(Math.round(progress*1000));seek.style.setProperty('--progress',`${progress*100}%`);seek.setAttribute('aria-valuetext',`${time(audio.currentTime)} / ${time(total)}`);}
  function state(){const active=!audio.paused;radio.classList.toggle('is-playing',active);play.setAttribute('aria-label',active?text('暂停音乐','Pause music'):text('播放音乐','Play music'));play.setAttribute('aria-pressed',String(active));seek.setAttribute('aria-label',text('播放进度','Playback position'));mute.setAttribute('aria-pressed',String(audio.muted));mute.setAttribute('aria-label',audio.muted?text('取消静音','Unmute'):text('静音','Mute'));hint.textContent=active?text('正在播放 · 草地来信','Playing · Letters from the meadow'):text('点击播放，让唱片慢慢转起来。','Press play and let the record turn.');}
  play.addEventListener('click',async()=>{if(audio.paused){try{await prepareAudio();await audio.play();}catch{hint.textContent=text('音乐暂时无法播放，请稍后重试。','Playback is unavailable. Please try again.');}}else audio.pause();});
  mute.addEventListener('click',()=>{audio.muted=!audio.muted;state();});
  seek.addEventListener('input',()=>{if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=Number(seek.value)/1000*audio.duration;update();}});
  audio.addEventListener('play',syncNotes);audio.addEventListener('pause',syncNotes);document.addEventListener('visibilitychange',syncNotes);
  audio.volume=.45;audio.addEventListener('timeupdate',update);audio.addEventListener('loadedmetadata',update);audio.addEventListener('play',state);audio.addEventListener('pause',state);audio.addEventListener('error',()=>{radio.classList.remove('is-playing');play.setAttribute('aria-pressed','false');hint.textContent=text('音乐暂时无法播放，请稍后重试。','Playback is unavailable. Please try again.');});document.addEventListener('portfolio-language-change',()=>{update();state();});update();state();
}
