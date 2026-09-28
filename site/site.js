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
        download.href = release.html_url || `https://github.com/${repo}/releases`;
        download.classList.remove('is-loading');
        download.removeAttribute('aria-disabled');
        download.querySelector('.button-main').textContent = 'Открыть релиз';
        size.textContent = 'Открыть релиз';
        note.textContent = 'В релизе пока нет ZIP-файла. Откройте страницу релиза и проверьте вложения.';
        return;
      }

      download.href = asset.browser_download_url;
      download.classList.remove('is-loading');
      download.removeAttribute('aria-disabled');
      size.textContent = formatSize(asset.size);
      note.textContent = `Файл ${asset.name} · загрузка с GitHub Releases`;
    })
    .catch(() => {
      version.textContent = 'GitHub недоступен';
      date.textContent = 'Попробуйте открыть список релизов';
      download.href = `https://github.com/${repo}/releases/latest`;
      download.classList.remove('is-loading');
      download.removeAttribute('aria-disabled');
      size.textContent = 'Открыть GitHub';
      note.textContent = 'Не удалось загрузить ссылку автоматически. Вы можете скачать релиз на GitHub.';
    });
})();
