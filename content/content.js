
var jcrop, selection;

var queryResultId = 'query-result';

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

var postporcess = function (data) {
  $('#' + queryResultId).remove();
  var q = $('<div id="' + queryResultId + '"></div>').css({
    'height': '300px',
    'width': '100%',
    'position': 'fixed',
    'z-index': '9999',
    'bottom': '0',
    'margin': 'auto',
    'background': 'white'
  });

  $('.jcrop-holder').append(q);

  var url = data.url;
  var query = {image: data.image};
  $.ajax({
    url: url,
    type: "POST",
    data: JSON.stringify(query),
    processData: false,
    contentType: "application/json; charset=UTF-8",
    success: function (res) {
      q.append('<div style="height: 280px;"><img src="' + data.image + '"> query </div>');
      for (var i = 0; i < res.result.length; i++) {
        var type = res.result[i].type;
        var imageUrl = res.result[i].thumbnail_url;
        var url = res.result[i].url;
        q.append('<div style="max-height: 300px" ><a href="' + url + '" target="_blank"><img src="' + imageUrl + '"></a>' + type + '</div>');
      }
      q.slick({
        infinite: true,
        slidesToShow: 9,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 1000
      });
    }
  });

};

var capture = function () {
  if (selection) {
    setTimeout(function () {
      chrome.runtime.sendMessage({
        message: 'capture', area: selection, dpr: devicePixelRatio
      }, postporcess)
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
      capture();
    }
  }
  return true;
})
