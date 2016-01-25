function RedPenPlugin(proxyUrl) {
  var pub = this;
  var $ = jQuery;
  var textarea, editor;
  var ed = new RedPenEditor();
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
      title.html('server is not running on the same machine as WordPress at <strong>' + redpenServerUrl + '</strong>, you can change it in <strong>config.php</strong>');
    });
  }

  pub.validate = function() {
    var container = $('.redpen-error-list');
    var text = ed.getDocumentText();
    var textNodes = ed.isPlainText() ? null : ed.findTextNodes(editor.getBody());

    redpen.detectLanguage(text, function(lang) {
      pub.renderConfiguration(pub.redpens[lang]);
      var config = prepareConfigForValidation(lang);

      var args = {config:config, document:text, format:'json2'};

      redpen.validateJSON(args, function(result) {
        container.empty();

        $.each(result.errors, function(i, error) {

          $.each(error.errors, function(j, suberror) {
            var errorNode = ed.isPlainText() ? null : highlightErrorInEditor(suberror, textNodes);

            var message = $('<li class="redpen-error-message"></li>').text(suberror.message)
              .appendTo(container)
              .on('click', function() {ed.showErrorInText(suberror, errorNode);});

            $('<div class="redpen-error-validator"></div>')
              .text(suberror.validator)
              .appendTo(message);
          });
        });

        title.text('found ' + container.children().length + ' errors');
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
    if (pub.validate) pub.validate();
  }

  pub._prepareConfigForValidation = prepareConfigForValidation;
  function prepareConfigForValidation(lang) {
    var validators = {};
    $.each(pub.redpens[lang].validators, function(name, options) {
      if (!options.disabled)
        validators[name] = options;
    });

    return {lang: lang, validators: validators, symbols: pub.redpens[lang].symbols};
  }

  pub.resetConfiguration = function() {
    loadDefaultConfiguration();
    pub.validate();
  };

  pub.autoValidate = function(what) {
    var lastText, lastKeyUp;

    function validateOnKeyUp() {
      clearTimeout(lastKeyUp);
      lastKeyUp = setTimeout(function() {
        var text = ed.getDocumentText();
        if (text != lastText) {
          pub.validate();
          lastText = text;
        }
      }, 500);
    }

    ed.initFor(what);

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

  pub.renderConfiguration = function(config) {
    $('.redpen-lang').text(config.lang);
    var validatorContainer = $('.redpen-validators').empty();

    $.each(config.validators, function(name, options) {
      var element = $('<li><label><input type="checkbox" value="' + name + '">' + name + '</label></li>').appendTo(validatorContainer);

      var checkbox = element.find(':checkbox').on('change', function() {
        config.validators[name].disabled = !this.checked;
        onConfigurationChange();
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
    }
  }

  function highlightErrorInEditor(error, textNodes) {
    var node = textNodes[error.position.start.line-1];
    var textWithError = node.data.substring(error.position.start.offset, error.position.end.offset);

    var tailNode = node.splitText(error.position.start.offset);
    tailNode.data = tailNode.data.substring(textWithError.length);

    return $('<span class="redpen-error" data-mce-bogus="1"></span>')
      .attr('title', 'RedPen: ' + error.message).text(textWithError)
      .insertBefore(tailNode)[0];
  }
}
