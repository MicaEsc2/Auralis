
function showInfoPopup(infoId) {
  
  const infoElement = document.getElementById(infoId);
  
  if (!infoElement) {
    console.error(`Elemento de información con ID ${infoId} no encontrado`);
    return;
  }
  
  
  const content = infoElement.innerHTML;
  const title = infoElement.getAttribute('data-title') || 'Información';
  

  document.getElementById('popupTitle').textContent = title;
  document.getElementById('popupContent').innerHTML = content;
  
 
  const popup = document.getElementById('infoPopup');
  popup.style.display = 'block';
  
 
  popup.addEventListener('click', function(event) {
    if (event.target === popup) {
      closeInfoPopup();
    }
  });

  document.addEventListener('keydown', handleEscapeKey);
}


function closeInfoPopup() {
  const popup = document.getElementById('infoPopup');
  const popupContent = document.querySelector('.info-popup-content');
  
 
  popup.classList.add('closing');
  popupContent.classList.add('closing');
  

  setTimeout(() => {
    popup.style.display = 'none';
   
    popup.classList.remove('closing');
    popupContent.classList.remove('closing');
    
   
    document.removeEventListener('keydown', handleEscapeKey);
  }, 300); 
}


function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    closeInfoPopup();
  }
}


document.addEventListener('DOMContentLoaded', function() {

  const infoIcons = document.querySelectorAll('.info-icon');
 
  infoIcons.forEach(icon => {
    const infoId = icon.getAttribute('onclick').match(/'([^']+)'/)[1];
    icon.removeAttribute('onclick');
    

    icon.addEventListener('click', function() {
      showInfoPopup(infoId);
    });
  });
});