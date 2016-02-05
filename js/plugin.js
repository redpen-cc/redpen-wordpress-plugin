function RedPenPlugin(proxyUrl) {
  var pub = this;
  var $ = jQuery;
  var ed = pub.editor = new RedPenEditor();
  var title = $('.redpen-title');
  var manualLanguage;

  if (localStorage.redpens)
    pub.redpens = JSON.parse(localStorage.redpens);

  if (window.redpen) {
    redpen.setBaseUrl(proxyUrl);

    if (!pub.redpens)
      loadDefaultConfiguration();

    populateLanguages();
  }
  else {
    $.get(proxyUrl + 'redpen_base_url', function(redpenServerUrl) {
      title.html('server is not running on the same machine as WordPress at <strong>' + redpenServerUrl + '</strong>, you can change it in <strong>config.php</strong>');
    });
  }

  var lastXhr;
  $(document).ajaxSend(function(event, jqxhr, settings) {
    if (settings.url == proxyUrl + 'rest/document/validate/json') {
      if (lastXhr) lastXhr.abort();
      lastXhr = jqxhr;
    }
  });

  pub.validate = function() {
    ed.clearErrors();
    var text = ed.getDocumentText();
    var container = $('.redpen-error-list');

    chooseLanguage(text, function(langKey) {
      if (!manualLanguage) $('#redpen-language').val(langKey);
      pub.renderConfiguration(pub.redpens[langKey]);
      var config = prepareConfigForValidation(langKey);

      var args = {config:config, document:text, format:'json2'};

      redpen.validateJSON(args, function(result) {
        container.empty();
        var index = 0;
        var cursorPos = ed.getCursorPos();

        $.each(result.errors, function(i, error) {

          $.each(error.errors, function(j, suberror) {
            suberror.index = ++index;
            var errorNodes = ed.highlightError(suberror);

            var message = $('<li class="redpen-error-message"></li>').text(suberror.message)
              .appendTo(container)
              .on('click', function() {ed.showErrorInText(suberror, errorNodes);});

            $('<div class="redpen-error-validator"></div>')
              .text(suberror.validator)
              .appendTo(message);
          });
        });

        ed.setCursorPos(cursorPos);
        title.text('found ' + container.children().length + ' errors');
      });
    });
  };

  function chooseLanguage(text, callback) {
    if (manualLanguage) callback(manualLanguage);
    else redpen.detectLanguage(text, callback);
  }

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

  function populateLanguages() {
    var select = $('#redpen-language').empty();
    $.each(pub.redpens, function(lang) {
      select.append('<option>' + lang + '</option>');
    });
    select.on('change', function() {
      manualLanguage = select.val();
      onConfigurationChange();
    });
  }

  pub._prepareConfigForValidation = prepareConfigForValidation;
  function prepareConfigForValidation(langKey) {
    var validators = {};
    var config = pub.redpens[langKey];
    $.each(config.validators, function(name, options) {
      if (!options.disabled)
        validators[name] = options;
    });
    return {lang: config.lang, validators: validators, symbols: config.symbols};
  }

  pub.resetConfiguration = function() {
    loadDefaultConfiguration();
  };

  pub.autoValidate = function(what, switchSelector) {
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

    ed.switchTo(what);
    ed.onChange(validateOnKeyUp);

    $(switchSelector).on('click', function() {
      ed.switchTo(what);
      pub.validate();
    });

    return pub;
  };

  pub.renderConfiguration = function(config) {
    var validatorContainer = $('.redpen-validators').empty();
    var symbolContainer = $('.redpen-symboltable tbody').empty();

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

    $.each(config.symbols, function(name, options) {
      var row = $('<tr></tr>').appendTo(symbolContainer);
      $('<td></td>').text(name).appendTo(row);
      $('<td class="redpen-symbol-value"></td>').text(options.value).appendTo(row);
      $('<td class="redpen-symbol-invalid"></td>').text(options.invalid_chars).appendTo(row);
      $('<td><input type="checkbox" name="' + name + '" value="before_space" ' + (options.before_space ? 'checked' : '') + '></td>').appendTo(row);
      $('<td><input type="checkbox" name="' + name + '" value="after_space" ' + (options.after_space ? 'checked' : '') + '></td>').appendTo(row);

      row.find(':checkbox').on('change', function() {
        config.symbols[name][this.value] = this.checked;
        onConfigurationChange();
      });

      row.find('.redpen-symbol-value').on('click', function() {editSymbol(name, 'value', options, $(this))});
      row.find('.redpen-symbol-invalid').on('click', function() {editSymbol(name, 'invalid_chars', options, $(this))});
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

  function editSymbol(name, key, options, propertyElement) {
    var value = propertyElement.text();
    value = prompt(name, value);
    if (value === null) return;

    value = value.trim();
    options[key] = value;
    propertyElement.text(value);
    onConfigurationChange();
  }
}
