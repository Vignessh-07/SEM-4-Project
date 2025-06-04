const eyeIcons = document.querySelector('.eye-toggle');

eyeIcons.addEventListener('click',()=>{
    const passwordInput = document.querySelector('.passwordtoggle'); 
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcons.classList.remove('ri-eye-off-line'); 
        eyeIcons.classList.add('ri-eye-line'); 
    } 
    else if(passwordInput.type === 'text') {
        passwordInput.type = 'password';
        eyeIcons.classList.remove('ri-eye-line');
        eyeIcons.classList.add('ri-eye-off-line'); 
    }
});


