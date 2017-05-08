
var jcrop, selection;

var overlay = ((active) => (state) => {
  active = (typeof state === 'boolean') ? state : (state === null) ? active : !active;
  $('.jcrop-holder')[active ? 'show' : 'hide']();
  chrome.runtime.sendMessage({message: 'active', active})
})(false);

var image = (done) => {
  var image = new Image()
  image.id = 'fake-image'
  image.src = chrome.runtime.getURL('/images/pixel.png')
  image.onload = () => {
    $('body').append(image)
    done()
  }
}

var init = (done) => {
  $('#fake-image').Jcrop({
    bgColor: 'none',
    onSelect: (e) => {
      selection = e
      capture()
    },
    onChange: (e) => {
      selection = e
    },
    onRelease: (e) => {
      setTimeout(() => {
        selection = null
      }, 100)
    }
  }, function ready () {
    jcrop = this

    $('.jcrop-hline, .jcrop-vline').css({
      backgroundImage: 'url(' + chrome.runtime.getURL('/images/Jcrop.gif') + ')'
    })

    if (selection) {
      jcrop.setSelect([
        selection.x, selection.y,
        selection.x2, selection.y2
      ])
    }

    done && done()
  })
}

var capture = function (force) {
  if (selection && force) {
    jcrop.release();
    setTimeout(function () {
      chrome.runtime.sendMessage({
        message: 'capture', area: selection, dpr: devicePixelRatio
      }, function (res) {
        overlay(false);
        selection = null;
      })
    }, 50);
  }
};

window.addEventListener('resize', ((timeout) => () => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    jcrop.destroy()
    init(() => overlay(null))
  }, 100)
})())

chrome.runtime.onMessage.addListener((req, sender, res) => {
  if (req.message === 'init') {
    res({}); // prevent re-injecting

    if (!jcrop) {
      image(() => init(() => {
        overlay();
        capture();
      }));
    }
    else {
      overlay();
      capture(true);
    }
  }
  return true;
})
