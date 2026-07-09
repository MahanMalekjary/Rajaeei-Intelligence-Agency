export function initApp() {
    const user = localStorage.getItem('io_user');
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    return user;
}

export function logout() {
    localStorage.removeItem('io_user');
    window.location.href = 'login.html';
}

export function getUser() {
    return localStorage.getItem('io_user');
}