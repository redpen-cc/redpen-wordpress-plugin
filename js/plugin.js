var redpenPlugin = (function() {
  var pub = {};
  var config;

  redpen.getRedPens(function(result) {
    config = result.redpens.en;
  });

  pub.validate = function(text) {
    var container = $('#redpen-errors').empty();
    redpen.validateJSON({config:config, document:text, documenParser:'PLAIN', format:'json2'}, function(result) {
      $.each(result.errors, function(i, error) {
        var validators = [];
        $.each(error.errors, function(j, suberror) {
          validators.push(suberror.validator + ': ' + suberror.message);
        });
        container.append('<li>' + validators.join(', ') + ': ' + error.sentence + '</li>')
      });
    });
  };

  return pub;
})();