(() => {
  const repo = 'mozrg/RVL';
  const version = document.getElementById('version');
  const date = document.getElementById('release-date');
  const download = document.getElementById('download');
  const size = document.getElementById('asset-size');
  const note = document.getElementById('download-note');
  const releaseList = document.getElementById('release-list');

  document.getElementById('year').textContent = new Date().getFullYear();

  const formatSize = (bytes) => {
    if (!bytes) return 'ZIP';
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ · ZIP`;
  };

  const formatDate = (value) => new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(value));

  const findZip = (release) => {
    const assets = (release.assets || []).filter((asset) => /\.zip$/i.test(asset.name));
    return assets.find((asset) => /^rvl[._-]/i.test(asset.name)) || assets[0];
  };

  function appendInline(parent, text) {
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
    let offset = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      parent.append(document.createTextNode(text.slice(offset, match.index)));
      const token = match[0];

      if (token.startsWith('**')) {
        const strong = document.createElement('strong');
        strong.textContent = token.slice(2, -2);
        parent.append(strong);
      } else if (token.startsWith('`')) {
        const code = document.createElement('code');
        code.textContent = token.slice(1, -1);
        parent.append(code);
      } else {
        const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
        if (!linkMatch) {
          parent.append(document.createTextNode(token));
        } else {
          const link = document.createElement('a');
          link.href = linkMatch[2];
          link.target = '_blank';
          link.rel = 'noreferrer';
          link.textContent = linkMatch[1];
          parent.append(link);
        }
      }
      offset = pattern.lastIndex;
    }
    parent.append(document.createTextNode(text.slice(offset)));
  }

  function renderMarkdown(container, markdown) {
    const lines = markdown.replace(/\r/g, '').split('\n');
    let paragraph = [];
    let list = null;
    let listKind = '';
    let inCode = false;
    let codeLines = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      const element = document.createElement('p');
      appendInline(element, paragraph.join(' '));
      container.append(element);
      paragraph = [];
    };
    const flushList = () => {
      if (list) container.append(list);
      list = null;
      listKind = '';
    };
    const flushText = () => {
      flushParagraph();
      flushList();
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line.startsWith('```')) {
        flushText();
        if (inCode) {
          const pre = document.createElement('pre');
          pre.textContent = codeLines.join('\n');
          container.append(pre);
          codeLines = [];
        }
        inCode = !inCode;
        continue;
      }
      if (inCode) {
        codeLines.push(rawLine);
        continue;
      }
      if (!line) {
        flushText();
        continue;
      }

      const heading = line.match(/^#{1,4}\s+(.+)$/);
      if (heading) {
        flushText();
        const element = document.createElement('h4');
        appendInline(element, heading[1]);
        container.append(element);
        continue;
      }
      if (/^([-*_]\s*){3,}$/.test(line)) {
        flushText();
        container.append(document.createElement('hr'));
        continue;
      }

      const item = line.match(/^\s*(?:[-*+]\s+|\d+\.\s+)(.+)$/);
      if (item) {
        flushParagraph();
        const ordered = /^\s*\d+\./.test(line);
        const kind = ordered ? 'ol' : 'ul';
        if (!list || listKind !== kind) {
          flushList();
          list = document.createElement(kind);
          listKind = kind;
        }
        const element = document.createElement('li');
        appendInline(element, item[1]);
        list.append(element);
        continue;
      }

      const quote = line.match(/^>\s?(.*)$/);
      if (quote) {
        flushText();
        const element = document.createElement('blockquote');
        appendInline(element, quote[1]);
        container.append(element);
        continue;
      }
      flushList();
      paragraph.push(line);
    }

    if (inCode) {
      const pre = document.createElement('pre');
      pre.textContent = codeLines.join('\n');
      container.append(pre);
    }
    flushText();
  }

  function renderReleaseHistory(releases) {
    releaseList.replaceChildren();
    const published = releases.filter((release) => !release.draft);

    if (!published.length) {
      const message = document.createElement('p');
      message.className = 'history-state';
      message.textContent = 'Опубликованных релизов пока нет.';
      releaseList.append(message);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'release-grid';
    published.forEach((release) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'release-card';
      const cardVersion = document.createElement('span');
      cardVersion.className = 'release-card-version';
      cardVersion.textContent = release.tag_name || release.name || 'Релиз RVL';
      card.append(cardVersion);
      if (release.prerelease) {
        const badge = document.createElement('span');
        badge.className = 'prerelease-label';
        badge.textContent = 'Тестовая';
        card.append(badge);
      }
      const releaseDate = release.published_at || release.created_at;
      if (releaseDate) {
        const dateLabel = document.createElement('div');
        dateLabel.className = 'release-card-date';
        dateLabel.textContent = formatDate(releaseDate);
        card.append(dateLabel);
      }
      card.setAttribute('aria-label', `Открыть версию ${cardVersion.textContent}`);
      card.onclick = () => renderReleaseDetails(release, published);
      grid.append(card);
    });
    releaseList.append(grid);
  }

  function renderReleaseDetails(release, releases) {
    releaseList.replaceChildren();
    const detail = document.createElement('article');
    detail.className = 'release-detail';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'release-back';
    back.textContent = '← Все версии';
    back.onclick = () => renderReleaseHistory(releases);
    detail.append(back);

    const heading = document.createElement('div');
    heading.className = 'release-detail-heading';
    const title = document.createElement('h3');
    title.textContent = release.tag_name || release.name || 'Релиз RVL';
    heading.append(title);
    if (release.prerelease) {
      const badge = document.createElement('span');
      badge.className = 'prerelease-label';
      badge.textContent = 'Тестовая';
      heading.append(badge);
    }
    detail.append(heading);

    const releaseDate = release.published_at || release.created_at;
    if (releaseDate) {
      const date = document.createElement('div');
      date.className = 'release-entry-date';
      date.textContent = formatDate(releaseDate);
      detail.append(date);
    }

    const asset = findZip(release);
    if (asset) {
      const assetLink = document.createElement('a');
      assetLink.className = 'release-download';
      assetLink.href = asset.browser_download_url;
      assetLink.setAttribute('download', asset.name);
      assetLink.textContent = 'Скачать ZIP ↓';
      detail.append(assetLink);
    }

    const body = document.createElement('div');
    body.className = 'release-body';
    if (release.body && release.body.trim()) {
      renderMarkdown(body, release.body);
    } else {
      body.textContent = 'Описание изменений для этой версии не добавлено.';
    }
    detail.append(body);
    releaseList.append(detail);
  }

  fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then((response) => {
      if (!response.ok) throw new Error('Не удалось получить релиз с GitHub');
      return response.json();
    })
    .then((release) => {
      const asset = findZip(release);

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

  fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then((response) => {
      if (!response.ok) throw new Error('Не удалось загрузить историю релизов');
      return response.json();
    })
    .then(renderReleaseHistory)
    .catch(() => {
      releaseList.replaceChildren();
      const message = document.createElement('p');
      message.className = 'history-state';
      message.textContent = 'Не удалось загрузить историю обновлений. Попробуйте обновить страницу.';
      releaseList.append(message);
    });
})();
