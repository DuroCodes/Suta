(async () => {
  fetch('http://suta.tk/api').then((response) => response.json())
    .then((data) => {
      const { servers, users } = data;

      const serversDOM = document.getElementById('servers');
      const usersDOM = document.getElementById('users');

      serversDOM.innerText = servers.toLocaleString() || 0;
      usersDOM.innerText = users.toLocaleString() || 0;
    });
})();
