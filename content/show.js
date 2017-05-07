var onMessageHandler = function (data) {
  var url = data.url;
  var query = {image: data.image, label: 'shopping'};
  $('#query').append('<div class="item"><img class="thumbnail" src="' + query.image + '"></div>');
  $.ajax({
    url: url,
    type: "POST",
    data: JSON.stringify(query),
    processData: false,
    contentType: "application/json; charset=UTF-8",
    success: function (res) {
      var grid = $('.masonry');
      for(var i = 0; i < res.result.length; i++) {
        var imageUrl = res.result[i].thumbnail_url;
        var url = res.result[i].url;
        grid.append('<div class="item"><a href="' + url + '" target="_blank"><img class="thumbnail" src="' + imageUrl + '"></a></div>');
      }
    }
  });
};

chrome.runtime.onMessage.addListener(onMessageHandler);

$(document).ready(function() {

});
