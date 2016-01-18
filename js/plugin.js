function RedPenPlugin(proxyUrl, textarea, editor) {
  var pub = this;
  var $ = jQuery;
  textarea = $(textarea);
  var title = $('.redpen-title');

  if (window.redpen) {
    redpen.setBaseUrl(proxyUrl);
    redpen.getRedPens(function (result) {
      pub.redpens = result.redpens;
    });
  }
  else {
    $.get(proxyUrl + 'redpen_base_url', function(redpenServerUrl) {
      title.html('<span class="redpen-red">Red</span>Pen server is not running on the same machine as WordPress at <strong>' + redpenServerUrl + '</strong>, you can change it in <strong>config.php</strong>');
    });
  }

  pub.validate = function() {
    var container = $('.redpen-error-list').empty();
    var text = getDocumentText();

    redpen.detectLanguage(text, function(lang) {
      var config = pub.redpens[lang];
      pub.displayValidators(config);

      var args = {config:config, document:text, documenParser:'PLAIN', format:'json2'};

      redpen.validateJSON(args, function(result) {
        $.each(result.errors, function(i, error) {

          $.each(error.errors, function(j, suberror) {
            var message = $('<li class="redpen-error-message"></li>').text(suberror.message)
              .appendTo(container)
              .data('error', suberror)
              .on('click', function() {pub.showErrorInText(this, textarea);});

            $('<div class="redpen-error-validator"></div>')
              .text(suberror.validator)
              .appendTo(message);
          });
        });

        title.html('<span class="redpen-red">Red</span>Pen found ' + container.children().length + ' errors');
      });
    });
  };

  pub.autoValidate = function(what) {
    var lastText, lastKeyUp;

    function validateOnKeyUp() {
      clearTimeout(lastKeyUp);
      lastKeyUp = setTimeout(function() {
        var text = getDocumentText();
        if (text != lastText) {
          pub.validate();
          lastText = text;
        }
      }, 500);
    }

    if (what.onKeyUp) {
      editor = what;
      editor.onKeyUp.add(validateOnKeyUp);
    }
    else {
      textarea = $(what);
      textarea.on('keyup', validateOnKeyUp);
    }

    validateOnKeyUp();
    return pub;
  };

  pub.displayValidators = function(config) {
    var validatorContainer = $('.redpen-validators').empty();
    $.each(config.validators, function(name, options) {
      var element = $('<li><label><input type="checkbox" checked disabled>' + name + '</label></li>').appendTo(validatorContainer);
      $.each(options.languages, function(i, lang) {
        element.append('<i> ' + lang + '</i>');
      });
      $.each(options.properties, function(name, value) {
        $('<div class="redpen-validator-properties"></div>').text(name + '=' + value).appendTo(element);
      });
    });
  };

  function isPlainText() {
    return textarea.is(':visible');
  }

  function findTextNodes(node) {
    var textNodes = [];
    function recurse(i, node) {
      if (node.nodeType == node.TEXT_NODE)
        textNodes.push(node);
      $.each(node.childNodes, recurse);
    }
    recurse(0, node);
    return textNodes;
  }

  function breakTagsIntoLines(node) {
    var textNodes = findTextNodes(node);
    return textNodes.map(function(node) {return node.textContent}).join('\n');
  }

  pub._getDocumentText = getDocumentText;
  function getDocumentText() {
    if (isPlainText())
      return textarea.val();
    else
      return breakTagsIntoLines(editor.getBody());
  }

  function calculateGlobalOffset(textarea, position) {
    var lines = textarea.val().split('\n');
    var offset = position.offset;
    for (var i = 0; i < position.line - 1; i++) offset += lines[i].length + 1;
    return offset;
  }

  pub.showErrorInText = function(li, textarea) {
    var error = $(li).data('error');

    if (isPlainText()) {
      var start = calculateGlobalOffset(textarea, error.position.start);
      var end = calculateGlobalOffset(textarea, error.position.end);
      textarea[0].setSelectionRange(start, end);
    }
    else {
      var selection = editor.selection.getSel();
      var range = editor.selection.getRng();
      var textNodes = findTextNodes(editor.getBody());
      range.setStart(textNodes[error.position.start.line-1], error.position.start.offset);
      range.setEnd(textNodes[error.position.end.line-1], error.position.end.offset);
      selection.removeAllRanges();
      selection.addRange(range);
      editor.getBody().focus();
    }
  };
}
