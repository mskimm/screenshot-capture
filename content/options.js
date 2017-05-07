// Saves options to c
function save_options() {
  var url = document.getElementById('url').value;
  chrome.storage.sync.set({
    url: url
  }, function() {
    restore_options();
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    url: '#'
  }, function(items) {
    document.getElementById('status').textContent = items.url;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);

