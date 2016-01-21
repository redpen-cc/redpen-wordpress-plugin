function RedPenPlugin(proxyUrl, textarea, editor) {
  var pub = this;
  var $ = jQuery;
  textarea = $(textarea);
  var title = $('.redpen-title');

  if (localStorage.redpens)
    pub.redpens = JSON.parse(localStorage.redpens);

  if (window.redpen) {
    redpen.setBaseUrl(proxyUrl);

    if (!pub.redpens)
      loadDefaultConfiguration();
  }
  else {
    $.get(proxyUrl + 'redpen_base_url', function(redpenServerUrl) {
      title.html('<span class="redpen-red">Red</span>Pen server is not running on the same machine as WordPress at <strong>' + redpenServerUrl + '</strong>, you can change it in <strong>config.php</strong>');
    });
  }

  pub.validate = function() {
    var container = $('.redpen-error-list');
    var text = getDocumentText();

    redpen.detectLanguage(text, function(lang) {
      pub.displayValidators(pub.redpens[lang]);
      var config = getConfiguration(lang);

      var args = {config:config, document:text, format:'json2'};

      redpen.validateJSON(args, function(result) {
        container.empty();

        $.each(result.errors, function(i, error) {

          $.each(error.errors, function(j, suberror) {
            var message = $('<li class="redpen-error-message"></li>').text(suberror.message)
              .appendTo(container)
              .data('error', suberror)
              .on('click', function() {showErrorInText(this);});

            $('<div class="redpen-error-validator"></div>')
              .text(suberror.validator)
              .appendTo(message);
          });
        });

        title.html('<span class="redpen-red">Red</span>Pen found ' + container.children().length + ' errors');
      });
    });
  };

  function loadDefaultConfiguration() {
    redpen.getRedPens(function (result) {
      pub.redpens = result.redpens;
      onConfigurationChange();
    });
  }

  function onConfigurationChange() {
    localStorage.redpens = JSON.stringify(pub.redpens);
  }

  pub._getConfiguration = getConfiguration;
  function getConfiguration(lang) {
    var validators = {};
    $.each(pub.redpens[lang].validators, function(name, options) {
      if (!options.disabled)
        validators[name] = options;
    });

    return {lang: lang, validators: validators, symbols: pub.redpens[lang].symbols};
  }

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
      var element = $('<li><label><input type="checkbox" value="' + name + '">' + name + '</label></li>').appendTo(validatorContainer);

      var checkbox = element.find(':checkbox').on('change', function() {
        config.validators[name].disabled = !this.checked;
        onConfigurationChange();
        pub.validate();
      });
      checkbox.attr('checked', !options.disabled);

      $.each(options.languages, function(i, lang) {
        element.append('<i> ' + lang + '</i>');
      });

      $.each(options.properties, function(key, value) {
        $('<div class="redpen-validator-properties"></div>').text(key + '=' + value).appendTo(element);
      });

      if ($.isEmptyObject(options.properties)) {
        $('<div class="redpen-validator-properties"></div>').text('+').appendTo(element);
      }

      element.find('.redpen-validator-properties').on('click', function() {editValidatorProperties(name, options, $(this))});
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

  function editValidatorProperties(name, options, propertyElement) {
    var keyvalue = propertyElement.text();
    keyvalue = prompt(name, keyvalue.indexOf('=') > 0 ? keyvalue : '');
    if (keyvalue === null) return;

    keyvalue = keyvalue.trim();
    var parts = keyvalue.split('=', 2);
    if (parts.length != 2) {
      alert(keyvalue + ': invalid property, must be in "key=value" form');
    }
    else {
      options.properties[parts[0]] = parts[1];
      propertyElement.text(keyvalue);
      onConfigurationChange();
      pub.validate();
    }
  }

  function calculateGlobalOffset(textarea, position) {
    var lines = textarea.val().split('\n');
    var offset = position.offset;
    for (var i = 0; i < position.line - 1; i++) offset += lines[i].length + 1;
    return offset;
  }

  function showErrorInText(li) {
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

      var offset = $(editor.container).offset();
      if (scrollY > offset.top) scrollTo(offset.left, offset.top);
      editor.getBody().focus();
    }
  }
}
