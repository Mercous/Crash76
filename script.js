// script.js - Подключение к Supabase и управление таблицей

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ===== КОНФИГУРАЦИЯ =====
const SUPABASE_URL = 'https://ygmqrcxzkfcqqrgjrzzk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kZxd3SwneXpOFLZOnOVkSQ_9wZlJW5Z';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE_NAME = 'coverage_report';

// ===== СОСТОЯНИЕ =====
let currentPage = 1;
const rowsPerPage = 25;
let allData = [];
let filteredData = [];
let totalRecords = 0;

// ===== DOM-ЭЛЕМЕНТЫ =====
const tbody = document.getElementById('data-table-body');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchButton');
const resetBtn = document.getElementById('resetButton');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const totalRecordsSpan = document.getElementById('totalRecords');

const filterMTS = document.getElementById('filterMTS');
const filterMegaFon = document.getElementById('filterMegaFon');
const filterBeeline = document.getElementById('filterBeeline');
const filterTele2 = document.getElementById('filterTele2');

// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadData() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Ошибка загрузки данных:', error);
      showError('Не удалось загрузить данные. Проверьте подключение.');
      return;
    }

    allData = data || [];
    filteredData = [...allData];
    totalRecords = filteredData.length;
    totalRecordsSpan.textContent = totalRecords;
    renderPage(1);
  } catch (err) {
    console.error('Ошибка:', err);
    showError('Произошла ошибка при загрузке данных.');
  }
}

// ===== ОТРИСОВКА ТАБЛИЦЫ =====
function renderTable(data) {
  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 40px; color: #6c7a8d;">
          <strong>Нет данных</strong><br>
          <span style="font-size: 0.85rem;">Попробуйте изменить параметры поиска или фильтрации</span>
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  data.forEach((row, index) => {
    html += `
      <tr>
        <td>${(currentPage - 1) * rowsPerPage + index + 1}</td>
        <td>${escapeHtml(row.municipality || '')}</td>
        <td><strong>${escapeHtml(row.settlement || '')}</strong></td>
        <td>${formatNumber(row.population)}</td>
        <td>${escapeHtml(row.communication_channel || '')}</td>
        <td>${row.wifi ? '✔' : ''}</td>
        <td>${formatStatus(row.mts)}</td>
        <td>${formatStatus(row.megafon)}</td>
        <td>${formatStatus(row.beeline)}</td>
        <td>${formatStatus(row.tele2)}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function formatStatus(value) {
  if (!value || value.trim() === '' || value.toLowerCase() === 'нет') {
    return '<span class="status-none">—</span>';
  }
  const val = value.trim().toUpperCase();
  if (val.includes('4G')) return `<span class="status-4g">${escapeHtml(value)}</span>`;
  if (val.includes('3G')) return `<span class="status-3g">${escapeHtml(value)}</span>`;
  if (val.includes('2G')) return `<span class="status-2g">${escapeHtml(value)}</span>`;
  return `<span>${escapeHtml(value)}</span>`;
}

function formatNumber(num) {
  if (!num) return '0';
  return Number(num).toLocaleString('ru-RU');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  tbody.innerHTML = `
    <tr>
      <td colspan="10" style="text-align: center; padding: 40px; color: #b34a2a;">
        <strong>Ошибка</strong><br>
        <span>${message}</span>
      </td>
    </tr>
  `;
}

// ===== ПАГИНАЦИЯ =====
function renderPage(page) {
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filteredData.slice(start, end);

  renderTable(pageData);
  totalRecordsSpan.textContent = filteredData.length;

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  pageInfo.textContent = `Страница ${page} из ${totalPages}`;
  prevPageBtn.disabled = page <= 1;
  nextPageBtn.disabled = page >= totalPages;
  currentPage = page;
}

function changePage(delta) {
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const newPage = Math.min(Math.max(currentPage + delta, 1), totalPages);
  if (newPage !== currentPage) {
    renderPage(newPage);
  }
}

// ===== ФИЛЬТРАЦИЯ И ПОИСК =====
function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  const showMTS = filterMTS.checked;
  const showMegaFon = filterMegaFon.checked;
  const showBeeline = filterBeeline.checked;
  const showTele2 = filterTele2.checked;

  filteredData = allData.filter(row => {
    // Поиск по населенному пункту
    if (searchTerm && !(row.settlement || '').toLowerCase().includes(searchTerm)) {
      return false;
    }

    // Фильтр по операторам
    const mts = (row.mts || '').trim().toUpperCase();
    const megafon = (row.megafon || '').trim().toUpperCase();
    const beeline = (row.beeline || '').trim().toUpperCase();
    const tele2 = (row.tele2 || '').trim().toUpperCase();

    const hasMTS = mts && mts !== 'НЕТ' && mts !== '';
    const hasMegaFon = megafon && megafon !== 'НЕТ' && megafon !== '';
    const hasBeeline = beeline && beeline !== 'НЕТ' && beeline !== '';
    const hasTele2 = tele2 && tele2 !== 'НЕТ' && tele2 !== '';

    // Если ни один фильтр не выбран - показываем всё
    if (!showMTS && !showMegaFon && !showBeeline && !showTele2) {
      return true;
    }

    // Проверяем соответствие хотя бы одному выбранному оператору
    let match = false;
    if (showMTS && hasMTS) match = true;
    if (showMegaFon && hasMegaFon) match = true;
    if (showBeeline && hasBeeline) match = true;
    if (showTele2 && hasTele2) match = true;

    return match;
  });

  totalRecords = filteredData.length;
  renderPage(1);
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
searchBtn.addEventListener('click', applyFilters);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyFilters();
});

resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  filterMTS.checked = true;
  filterMegaFon.checked = true;
  filterBeeline.checked = true;
  filterTele2.checked = true;
  applyFilters();
});

filterMTS.addEventListener('change', applyFilters);
filterMegaFon.addEventListener('change', applyFilters);
filterBeeline.addEventListener('change', applyFilters);
filterTele2.addEventListener('change', applyFilters);

prevPageBtn.addEventListener('click', () => changePage(-1));
nextPageBtn.addEventListener('click', () => changePage(1));

// ===== ИНИЦИАЛИЗАЦИЯ =====
loadData();
