function RedPenPlugin(baseUrl) {
  var pub = this;

  redpen.setBaseUrl(baseUrl);
  redpen.getRedPens(function(result) {
    pub.config = result.redpens.default;
  });

  pub.validate = function(text) {
    var container = $('.redpen-error-list').empty();
    redpen.validateJSON({config:pub.config, document:text, documenParser:'PLAIN', format:'json2'}, function(result) {
      $.each(result.errors, function(i, error) {
        var validators = [];
        $.each(error.errors, function(j, suberror) {
          var message = $('<li class="redpen-error-message"></li>').text(suberror.message).appendTo(container);
          $('<div class="redpen-error-validator"></div>').text(suberror.validator + ' ' + JSON.stringify(suberror.position)).appendTo(message);
        });
      });
    });
  };
}
