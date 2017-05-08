var chrome = chrome;

chrome.storage.sync.get(function(config) {
  if (!config.url) {
    chrome.storage.sync.set({url: '#'})
  }
});

function inject(tab) {
  chrome.tabs.sendMessage(tab.id, {message: 'init'}, function(res) {
    if (res) {
      clearTimeout(timeout);
    }
  });

  var timeout = setTimeout(function() {
    chrome.tabs.insertCSS(tab.id, {file: 'vendor/jquery.Jcrop.min.css', runAt: 'document_start'});
    chrome.tabs.insertCSS(tab.id, {file: 'vendor/slick.css', runAt: 'document_start'});
    chrome.tabs.insertCSS(tab.id, {file: 'vendor/slick-theme.css', runAt: 'document_start'});
    chrome.tabs.insertCSS(tab.id, {file: 'css/content.css', runAt: 'document_start'});

    chrome.tabs.executeScript(tab.id, {file: 'vendor/jquery.min.js', runAt: 'document_start'});
    chrome.tabs.executeScript(tab.id, {file: 'vendor/jquery.Jcrop.min.js', runAt: 'document_start'});
    chrome.tabs.executeScript(tab.id, {file: 'vendor/slick.min.js', runAt: 'document_start'});
    chrome.tabs.executeScript(tab.id, {file: 'content/content.js', runAt: 'document_start'});

    setTimeout(function () {
      chrome.tabs.sendMessage(tab.id, {message: 'init'});
    }, 100);
  }, 100);
}

chrome.browserAction.onClicked.addListener(function(tab) {
  inject(tab);
});

chrome.commands.onCommand.addListener(function(command) {
  if (command === 'take-screenshot') {
    chrome.tabs.getSelected(null, function(tab) {
      inject(tab);
    })
  }
});

chrome.runtime.onMessage.addListener(function(req, sender, res) {
  if (req.message === 'capture') {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'}, function(image) {
        // image is base64
        chrome.storage.sync.get(function(config) {
          crop(image, req.area, req.dpr, true, function(cropped) {
            res({message: 'image', image: cropped, url: config.url});
          });
        });
      });
    });
  }
  else if (req.message === 'active') {
    if (req.active) {
      chrome.browserAction.setTitle({tabId: sender.tab.id, title: 'Capture to Query'});
      chrome.browserAction.setBadgeText({tabId: sender.tab.id, text: '◩'});
    }
    else {
      chrome.browserAction.setTitle({tabId: sender.tab.id, title: 'Screenshot Capture'});
      chrome.browserAction.setBadgeText({tabId: sender.tab.id, text: ''});
    }
  }
  return true;
});

function show(data) {
  chrome.tabs.create(
    { url: chrome.runtime.getURL("/content/show.html") },
    function(tab) {
      var handler = function(tabId, changeInfo) {
        if(tabId === tab.id && changeInfo.status === "complete"){
          chrome.tabs.onUpdated.removeListener(handler);
          chrome.tabs.sendMessage(tabId, data);
        }
      };

      // in case we're faster than page load (usually):
      chrome.tabs.onUpdated.addListener(handler);
      // just in case we're too late with the listener:
      chrome.tabs.sendMessage(tab.id, data);
    }
  );
}

function crop (image, area, dpr, preserve, done) {
  var top = area.y * dpr;
  var left = area.x * dpr;
  var width = area.w * dpr;
  var height = area.h * dpr;
  var w = (dpr !== 1 && preserve) ? width : area.w;
  var h = (dpr !== 1 && preserve) ? height : area.h;

  var canvas = null;
  if (!canvas) {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
  }
  canvas.width = w;
  canvas.height = h;

  var img = new Image()
  img.onload = () => {
    var context = canvas.getContext('2d');
    context.drawImage(img,
      left, top,
      width, height,
      0, 0,
      w, h
    );

    var cropped = canvas.toDataURL('image/png');
    done(cropped);
  }
  img.src = image;
}
