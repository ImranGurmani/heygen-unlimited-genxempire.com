/**
 * @fileoverview GenXEmpire HeyGen Extension
 * @copyright © 2026 GenXEmpire. All rights reserved.
 * @license Proprietary
 * 
 * NOTICE: All information contained herein is, and remains the property of GenXEmpire.
 * Dissemination of this information or reproduction of this material, including rebranding,
 * modification, reverse engineering, or redistribution, is strictly forbidden unless prior
 * written permission is obtained from GenXEmpire.
 * 
 * For inquiries, contact: https://genxempire.com / +92-302-1008282
 */

let currentUrls = [];

function init() {
  document.getElementById('scanBtn').addEventListener('click', scanMedia);
  document.getElementById('clearBtn').addEventListener('click', clearList);
  scanMedia();
}

function scanMedia() {
  const btn = document.getElementById('scanBtn');
  const status = document.getElementById('statusText');
  const icon = btn.querySelector('svg');
  const label = btn.querySelector('.btn-label');

  btn.disabled = true;
  label.textContent = 'Scanning...';
  icon.style.animation = 'spin 0.8s linear infinite';
  status.textContent = 'Scanning for media files...';

  chrome.runtime.sendMessage({ action: 'getMediaUrls' }, function(response) {
    btn.disabled = false;
    label.textContent = 'Scan for Media';
    icon.style.animation = '';

    currentUrls = response?.urls || [];
    renderList(currentUrls);

    if (currentUrls.length === 0) {
      status.textContent = 'No files found \u2014 play a video first';
    } else {
      status.textContent = currentUrls.length + ' file(s) ready to download';
    }

    document.getElementById('countBadge').textContent = currentUrls.length;
    document.getElementById('footerCount').textContent = currentUrls.length + ' files detected';
  });
}

function renderList(urls) {
  const list = document.getElementById('fileList');

  if (urls.length === 0) {
    list.innerHTML = buildEmptyState('No media files found', 'Play a video first, then hit Scan');
    return;
  }

  list.innerHTML = urls.map(function(item, i) {
    return '<div class="file-card" style="animation-delay:' + (i * 0.05) + 's">' +
      '<div class="file-meta">' +
        '<div class="file-index">' + (i + 1) + '</div>' +
        '<div class="file-type">' + item.ext + '</div>' +
      '</div>' +
      '<button class="btn-download" data-index="' + i + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
        'Download' +
      '</button>' +
    '</div>';
  }).join('');

  list.querySelectorAll('.btn-download').forEach(function(btn) {
    btn.addEventListener('click', handleDownload);
  });
}

function handleDownload() {
  var idx = parseInt(this.getAttribute('data-index'));
  var item = currentUrls[idx];
  if (!item) return;

  chrome.runtime.sendMessage({
    action: 'download',
    url: item.url,
    filename: 'genxempire_' + (idx + 1) + '.' + item.ext
  });

  this.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="20 6 9 17 4 12"/></svg> Done';
  this.classList.add('done');
  this.disabled = true;

  document.getElementById('statusText').textContent = 'Download started!';
}

function clearList() {
  chrome.runtime.sendMessage({ action: 'clearUrls' }, function() {
    currentUrls = [];
    document.getElementById('fileList').innerHTML = buildEmptyState('List cleared', 'Play a video, then hit Scan');
    document.getElementById('countBadge').textContent = '0';
    document.getElementById('footerCount').textContent = '0 files detected';
    document.getElementById('statusText').textContent = 'Play a video, then hit Scan';
  });
}

function buildEmptyState(title, hint) {
  return '<div class="empty-state">' +
    '<div class="empty-visual">' +
      '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="2" y="4" width="20" height="16" rx="2"/>' +
        '<polygon points="10 9 15 12 10 15"/>' +
      '</svg>' +
    '</div>' +
    '<div class="empty-title">' + title + '</div>' +
    '<div class="empty-hint">' + hint + '</div>' +
  '</div>';
}

document.addEventListener('DOMContentLoaded', init);