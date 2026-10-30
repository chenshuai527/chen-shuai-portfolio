(() => {
  const root = document.querySelector('.reading-library');
  if (!root) return;
  const books = JSON.parse(document.getElementById('reading-shelf-data').textContent);
  const display = root.querySelector('[data-shelf-display]');
  const cards = [...display.querySelectorAll('.shelf-book')];
  const months = [...root.querySelectorAll('[data-shelf-month]')];
  const search = root.querySelector('[data-shelf-search]');
  const empty = root.querySelector('[data-shelf-empty]');
  const status = root.querySelector('[data-shelf-status]');
  const dialog = root.querySelector('dialog');
  const chineseMonths = ['','一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  const englishMonths = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  let month = 'all';
  let lastOpener;
  const english = () => document.documentElement.lang === 'en';

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const shown = cards.filter(card => (month === 'all' || card.dataset.month === month) && `${card.dataset.title} ${card.dataset.author}`.toLocaleLowerCase().includes(query));
    display.replaceChildren();
    const perShelf = matchMedia('(max-width:480px)').matches ? 3 : matchMedia('(max-width:760px)').matches ? 5 : 9;
    for (let start = 0; start < shown.length; start += perShelf) {
      const shelf = document.createElement('ol');
      shelf.className = 'reading-shelf';
      shelf.setAttribute('aria-label', english() ? `Shelf ${Math.floor(start / perShelf) + 1}` : `第 ${Math.floor(start / perShelf) + 1} 层书架`);
      shelf.append(...shown.slice(start, start + perShelf));
      display.append(shelf);
    }
    display.style.gridTemplateRows = `repeat(${Math.max(Math.ceil(shown.length / perShelf), 3)},minmax(0,1fr))`;
    display.hidden = !shown.length;
    empty.hidden = !!shown.length;
    const waiting = month === '11' && !query;
    empty.querySelector('[data-shelf-empty-title]').textContent = english() ? (waiting ? 'Room for the next chapter.' : 'No books found.') : (waiting ? '十一月，留给下一本。' : '这次没有找到这本书。');
    empty.querySelector('[data-shelf-empty-copy]').textContent = english() ? (waiting ? 'November is waiting for a new read.' : 'Try another title, or return to all books.') : (waiting ? '新的阅读，还在路上。' : '换个书名试试，或回到整座书架。');
    status.textContent = english() ? `${shown.length} of ${books.length} books${month === 'all' ? '' : ` · ${englishMonths[Number(month)]}`}` : (month === 'all' && !query ? `${books.length} 本书，都在这里。` : `${month === 'all' ? '' : chineseMonths[Number(month)] + ' · '}显示 ${shown.length} / ${books.length} 本`);
    months.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shelfMonth === month)));
  }

  function translate() {
    root.querySelectorAll('[data-shelf-zh]').forEach(node => { node.textContent = english() ? node.dataset.shelfEn : node.dataset.shelfZh; });
    search.placeholder = english() ? 'Find a book…' : '找一本书…';
    search.setAttribute('aria-label', english() ? 'Search book titles' : '搜索书名');
    root.querySelector('.library-months').setAttribute('aria-label', english() ? 'Filter books by month' : '按月份筛选书籍');
    cards.forEach(card => {
      card.querySelector('button').setAttribute('aria-label', english() ? `View the cover of ${card.dataset.title}` : `查看《${card.dataset.title}》封面`);
      card.querySelectorAll('[data-shelf-zh]').forEach(node => { node.textContent = english() ? node.dataset.shelfEn : node.dataset.shelfZh; });
    });
    dialog.querySelector('button').setAttribute('aria-label', english() ? 'Close cover' : '关闭书封');
    render();
  }
  months.forEach(button => button.addEventListener('click', () => { month = button.dataset.shelfMonth; render(); }));
  search.addEventListener('input', render);
  root.querySelector('[data-shelf-reset]').addEventListener('click', () => { month = 'all'; search.value = ''; render(); root.querySelector('[data-shelf-month="all"]').focus(); });
  display.addEventListener('click', event => {
    const button = event.target.closest('[data-book-index]');
    if (!button) return;
    const book = books.find(item => item.index === Number(button.dataset.bookIndex));
    if (!book) return;
    lastOpener = button;
    const image = dialog.querySelector('[data-detail-cover]');
    image.src = book.asset; image.alt = `《${book.title}》`;
    dialog.querySelector('h2').textContent = book.title;
    dialog.querySelector('[data-detail-month]').textContent = english() ? `${englishMonths[book.month]} · ${String(book.index).padStart(2,'0')} / ${books.length}` : `${chineseMonths[book.month]} · 第 ${String(book.index).padStart(2,'0')} 本`;
    dialog.querySelector('[data-detail-author]').textContent = book.author;
    const source = dialog.querySelector('[data-detail-source]');
    source.hidden = !book.sourceURL;
    if (book.sourceURL) source.href = book.sourceURL;
    dialog.showModal();
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && dialog.open) { event.preventDefault(); event.stopImmediatePropagation(); dialog.close(); } }, true);
  dialog.addEventListener('close', () => { lastOpener?.focus({preventScroll:true}); });
  document.addEventListener('portfolio-language-change', translate);
  matchMedia('(max-width:760px)').addEventListener('change', render);
  matchMedia('(max-width:480px)').addEventListener('change', render);
  translate();
})();
