// UI helpers (toasts)
(function(){
  function createWrapper(){
    let w = document.querySelector('.toast-wrapper');
    if(!w){ w = document.createElement('div'); w.className='toast-wrapper'; document.body.appendChild(w);} 
    return w;
  }
  const toastQueue = [];
  let isToastShowing = false;
  function showToast(type, message, timeout=3500, undoCallback){
    toastQueue.push({type, message, timeout, undoCallback});
    if(!isToastShowing) showNextToast();
  }
  function showNextToast(){
    if(toastQueue.length === 0){ isToastShowing = false; return; }
    isToastShowing = true;
    const {type, message, timeout, undoCallback} = toastQueue.shift();
    const w = createWrapper();
    const iconMap = {
      success: '<i class="fa fa-check-circle"></i>',
      error: '<i class="fa fa-times-circle"></i>',
      info: '<i class="fa fa-info-circle"></i>',
      warning: '<i class="fa fa-exclamation-triangle"></i>'
    };
    const icon = iconMap[type] || '';
    const t = document.createElement('div'); t.className = 'toast '+(type||'info');
    t.innerHTML = `<div class="msg">${icon} ${message}</div>`;
    if(undoCallback && t.querySelector('.undo-link')){
      t.querySelector('.undo-link').onclick = () => { undoCallback(); t.remove(); showNextToast(); };
    }
    w.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(20px)'; setTimeout(()=>{ t.remove(); showNextToast(); },300); }, timeout);
  }
  window.ui = { toast: showToast };
})();
