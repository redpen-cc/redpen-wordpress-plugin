var redpenPlugin = (function() {
  var pub = {};
  var config;

  redpen.getRedPens(function(result) {
    config = result.redpens.en;
  });

  pub.validate = function(text) {
    var container = $('.redpen-error-list').empty();
    redpen.validateJSON({config:config, document:text, documenParser:'PLAIN', format:'json2'}, function(result) {
      $.each(result.errors, function(i, error) {
        var validators = [];
        $.each(error.errors, function(j, suberror) {
          var message = $('<li class="redpen-error-message"></li>').text(suberror.message).appendTo(container);
          $('<div class="redpen-error-validator"></div>').text(suberror.validator).appendTo(message);
        });
      });
    });
  };

  return pub;
})();