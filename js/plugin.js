function RedPenPlugin(baseUrl) {
  var pub = this;
  var $ = jQuery;

  redpen.setBaseUrl(baseUrl);
  redpen.getRedPens(function(result) {
    pub.config = result.redpens.default;
  });

  pub.validate = function(textarea) {
    var container = $('.redpen-error-list').empty();

    var args = {config:pub.config, document:$(textarea).val(), documenParser:'PLAIN', format:'json2'};

    redpen.validateJSON(args, function(result) {
      $.each(result.errors, function(i, error) {

        $.each(error.errors, function(j, suberror) {
          var message = $('<li class="redpen-error-message"></li>').text(suberror.message)
            .appendTo(container)
            .data('error', suberror)
            .on('click', function() {pub.showErrorInText(this, textarea);});

          $('<div class="redpen-error-validator"></div>')
            .text(suberror.validator + ' ' + JSON.stringify(suberror.position))
            .appendTo(message);
        });
      });
    });
  };

  pub.showErrorInText = function(li, textarea) {
    var error = $(li).data('error');
    var lines = textarea.val().split('\n');

    var start = error.position.start.offset;
    console.log(error.position.start.line);
    for (var i = 0; i < error.position.start.line-1; i++) start += lines[i].length + 1;

    var end = error.position.end.offset;
    for (var i = 0; i < error.position.end.line-1; i++) end += lines[i].length + 1;

    textarea[0].setSelectionRange(start, end);
  };
}
