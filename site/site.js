(() => {
  const repo = 'mozrg/RVL';
  const version = document.getElementById('version');
  const date = document.getElementById('release-date');
  const download = document.getElementById('download');
  const size = document.getElementById('asset-size');
  const note = document.getElementById('download-note');

  document.getElementById('year').textContent = new Date().getFullYear();

  const formatSize = (bytes) => {
    if (!bytes) return 'ZIP';
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ · ZIP`;
  };

  const formatDate = (value) => new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(value));

  fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then((response) => {
      if (!response.ok) throw new Error('Не удалось получить релиз с GitHub');
      return response.json();
    })
    .then((release) => {
      const assets = (release.assets || []).filter((asset) => /\.zip$/i.test(asset.name));
      const asset = assets.find((item) => /^rvl[._-]/i.test(item.name)) || assets[0];

      version.textContent = release.tag_name || release.name || 'Последняя версия';
      date.textContent = release.published_at ? `Опубликовано ${formatDate(release.published_at)}` : 'Последний релиз GitHub';

      if (!asset) {
        download.removeAttribute('href');
        download.classList.remove('is-loading');
        download.setAttribute('aria-disabled', 'true');
        download.querySelector('.button-main').textContent = 'Загрузка недоступна';
        size.textContent = 'ZIP не прикреплён';
        note.textContent = 'Чтобы скачать RVL, к последнему GitHub-релизу нужно прикрепить ZIP приложения.';
        return;
      }

      download.href = asset.browser_download_url;
      download.setAttribute('download', asset.name);
      download.classList.remove('is-loading');
      download.removeAttribute('aria-disabled');
      size.textContent = formatSize(asset.size);
      note.textContent = `Файл ${asset.name} · загрузка с GitHub Releases`;
    })
    .catch(() => {
      version.textContent = 'GitHub недоступен';
      date.textContent = 'Попробуйте открыть список релизов';
      download.removeAttribute('href');
      download.classList.remove('is-loading');
      download.setAttribute('aria-disabled', 'true');
      download.querySelector('.button-main').textContent = 'Загрузка недоступна';
      size.textContent = 'Нет соединения';
      note.textContent = 'Не удалось получить ссылку. Попробуйте позже.';
    });
})();
