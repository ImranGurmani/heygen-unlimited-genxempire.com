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

/* Tracks intercepted media URLs per tab */
const mediaUrls = {};

chrome.webRequest.onCompleted.addListener(
  function(details) {
    var url = details.url;
    var type = details.type;
    var statusCode = details.statusCode;

    if ((statusCode === 200 || statusCode === 206) && type === 'media') {
      var tabId = details.tabId;
      if (tabId < 0) return;

      if (!mediaUrls[tabId]) mediaUrls[tabId] = [];

      /* Avoid duplicates */
      var exists = mediaUrls[tabId].some(function(item) {
        return item.url === url;
      });

      if (!exists) {
        var ext = getExtension(url);
        mediaUrls[tabId].unshift({ url: url, ext: ext });
        /* Keep last 20 entries max */
        if (mediaUrls[tabId].length > 20) mediaUrls[tabId].pop();
      }
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

function getExtension(url) {
  try {
    var clean = url.split('?')[0];
    var parts = clean.split('.');
    var ext = parts[parts.length - 1].toLowerCase();
    var mediaExts = ['mp4', 'webm', 'mkv', 'mp3', 'aac', 'm4a', 'ogg', 'flv', 'm3u8', 'ts'];
    return mediaExts.indexOf(ext) !== -1 ? ext : 'mp4';
  } catch (e) {
    return 'mp4';
  }
}

/* Clean up when a tab is closed */
chrome.tabs.onRemoved.addListener(function(tabId) {
  delete mediaUrls[tabId];
});

/* Message handler for popup communication */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getMediaUrls') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tabId = tabs[0] ? tabs[0].id : null;
      sendResponse({ urls: mediaUrls[tabId] || [] });
    });
    return true; /* async sendResponse */
  }

  if (request.action === 'download') {
    chrome.downloads.download({ url: request.url, filename: request.filename });
  }

  if (request.action === 'clearUrls') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tabId = tabs[0] ? tabs[0].id : null;
      if (tabId) mediaUrls[tabId] = [];
      sendResponse({ done: true });
    });
    return true; /* async sendResponse */
  }
});