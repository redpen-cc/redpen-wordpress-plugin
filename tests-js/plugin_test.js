describe('RedPenPlugin', function() {
  var textarea, editor, redpenPlugin;
  var errorContainer, title, langSelect;
  var baseUrl = 'http://redpen/';

  var redpens = {
    'en': {lang:'en', validators:{}, symbols:{}},
    'ja': {lang:'ja', validators:{}, symbols:{}}
  };

  beforeEach(function() {
    $('body').empty();
    localStorage.clear();

    errorContainer = $('<ol class="redpen-error-list"></ol>').appendTo('body');
    title = $('<div class="redpen-title"></div>').appendTo('body');
    langSelect = $('<select id="redpen-language"></select>').appendTo('body');

    textarea = $('<textarea></textarea>').val('Hello World!').appendTo('body');
    editor = {};

    redpen = {
      setBaseUrl: function(url) {},
      getRedPens: function(callback) {
        callback({redpens: redpens});
      }
    };

    spyOn(redpen, 'setBaseUrl');

    redpenPlugin = new RedPenPlugin(baseUrl);
    redpenPlugin.editor.switchTo(textarea);
  });

  describe('creation', function() {
    it('shows an error message if redpen server is not running', function() {
      window.redpen = undefined;
      redpenPlugin = new RedPenPlugin(baseUrl);
      expect(title.text()).toBe('Server is not available. Make sure the correct URL is configured in Settings > Writing > RedPen Server');
    });

    it('passes baseUrl to redpen API', function() {
      expect(redpen.setBaseUrl).toHaveBeenCalledWith(baseUrl)
    });

    it('loads default configuration from server', function() {
      expect(redpenPlugin.redpens).toBe(redpens);
    });

    it('stores configuration for next visit', function() {
      expect(localStorage.redpens).toBe(JSON.stringify(redpens));
    });

    it('loads previous configuration from localStorage', function() {
      var redpens = {hello: 'world'};
      localStorage.redpens = JSON.stringify(redpens);
      redpenPlugin = new RedPenPlugin(baseUrl);
      expect(redpenPlugin.redpens).toEqual(redpens);
    });
  });

  describe('validation', function() {
    var mockedValidateResponse = {
      errors: [{
        errors: [
          {validator: 'Spelling', message: 'Hello is spelled incorrectly', sentence: 'Hello World'},
          {validator: 'WrongSymbol', message: 'You cannot use !', sentence: 'Hello World!'}
        ]
      }]
    };

    function mockValidateJSON(validationResult) {
      redpen.validateJSON = function (args, callback) {
        expect(args.config.lang).toBe('en');
        expect(args.config.symbols).toBe(redpens.en.symbols);
        expect(args.format).toBe('json2');
        expect(args.document).toBe(redpenPlugin.editor.getDocumentText());
        callback(validationResult);
      };
    }

    beforeEach(function () {
      redpen.detectLanguage = jasmine.createSpy().and.callFake(function(text, callback) {
        callback('en');
      });
    });

    it('WordPress has global jQuery, but not $, so define it locally', function () {
      try {
        delete window.$;
        mockValidateJSON({errors: []});
        redpenPlugin.validate();
      }
      finally {
        window.$ = jQuery;
      }
    });

    it('language is detected and the correct configuration is chosen', function() {
      var japaneseText = '本稿では,複数の計算機（クラスタ）でで動作する各サーバーを「インスタンス」と呼びまます。';
      spyOn(redpenPlugin.editor, 'getDocumentText').and.returnValue(japaneseText);

      redpen.detectLanguage = jasmine.createSpy().and.callFake(function(text, callback) {
        expect(text).toBe(japaneseText);
        callback('ja');
      });

      redpen.validateJSON = jasmine.createSpy().and.callFake(function(args) {
        expect(args.document).toBe(japaneseText);
        expect(args.config.lang).toBe('ja');
        expect(args.config.symbols).toBe(redpens.ja.symbols);
      });

      redpenPlugin.validate();

      expect(langSelect.val()).toBe('ja');
      expect(redpen.validateJSON).toHaveBeenCalled();
    });

    it('language can be chosen manually', function() {
      var englishText = 'Hello there!';
      spyOn(redpenPlugin.editor, 'getDocumentText').and.returnValue(englishText);

      redpen.detectLanguage = jasmine.createSpy();
      redpen.validateJSON = jasmine.createSpy();

      langSelect.val('ja').trigger('change');

      expect(redpen.detectLanguage).not.toHaveBeenCalled();
      expect(redpen.validateJSON).toHaveBeenCalled();

      redpenPlugin.validate();

      expect(redpen.detectLanguage).not.toHaveBeenCalled();
      expect(langSelect.val()).toBe('ja');
    });

    it('displays nothing if no errors', function () {
      mockValidateJSON({errors: []});
      redpenPlugin.validate();
      expect(errorContainer.find('li').length).toBe(0);
      expect(title.text()).toBe('found 0 errors');
    });

    it('displays all errors', function () {
      mockValidateJSON(mockedValidateResponse);

      redpenPlugin.validate();

      var items = errorContainer.find('li');
      expect(items.length).toBe(2);
      expect(items.hasClass('redpen-error-message')).toBe(true);

      expect(items.eq(0).text()).toMatch(/Hello is spelled incorrectly/);
      expect(items.eq(0).text()).toMatch(/Spelling/);

      expect(items.eq(1).text()).toMatch(/You cannot use !/);
      expect(items.eq(1).text()).toMatch(/WrongSymbol/);

      expect(title.text()).toBe('found 2 errors');
    });

    it('highlights error in text when clicking on error message', function() {
      mockValidateJSON(mockedValidateResponse);

      var errorNode = {};
      var index = 0;
      spyOn(redpenPlugin.editor, 'highlightError').and.callFake(function(error) {
        expect(error.index).toBe(++index);
        return errorNode;
      });
      spyOn(redpenPlugin.editor, 'showErrorInText');

      redpenPlugin.validate();

      errorContainer.find('.redpen-error-message').eq(0).click();

      expect(redpenPlugin.editor.highlightError).toHaveBeenCalledTimes(2);
      expect(redpenPlugin.editor.showErrorInText).toHaveBeenCalledWith(mockedValidateResponse.errors[0].errors[0], errorNode);
    });
  });

  describe('automatic validation', function() {
    beforeEach(function() {
      spyOn(redpenPlugin, 'validate');

      spyOn(window, 'setTimeout').and.callFake(function(callback) {
        callback();
      });
      spyOn(window, 'clearTimeout');
    });

    it('can be started', function() {
      var instance = redpenPlugin.autoValidate(textarea);
      expect(redpenPlugin.validate).toHaveBeenCalled();
      expect(instance).toBe(redpenPlugin);
    });

    it('of plain text only if text has changed', function() {
      redpenPlugin.autoValidate(textarea);
      expect(redpenPlugin.validate).toHaveBeenCalledTimes(1);

      textarea.trigger('keyup');
      expect(redpenPlugin.validate).toHaveBeenCalledTimes(1);

      textarea.val('Hello2');
      textarea.trigger('keyup');
      expect(redpenPlugin.validate).toHaveBeenCalledTimes(2);

      textarea.trigger('keyup');
      expect(redpenPlugin.validate).toHaveBeenCalledTimes(2);
    });

    it('of plain text waits for more keystrokes before validating', function() {
      var timeoutId = 123;

      window.setTimeout.and.callFake(function(callback, timeout) {
        expect(timeout).toBe(500);
        return timeoutId++;
      });

      redpenPlugin.autoValidate(textarea);
      expect(window.clearTimeout).toHaveBeenCalledWith(undefined);
      expect(window.setTimeout).toHaveBeenCalledTimes(1);

      textarea.trigger('keyup');
      expect(window.clearTimeout).toHaveBeenCalledWith(123);
      expect(window.setTimeout).toHaveBeenCalledTimes(2);

      textarea.trigger('keyup');
      expect(window.clearTimeout).toHaveBeenCalledWith(124);
      expect(window.setTimeout).toHaveBeenCalledTimes(3);
    });

    it('in visual editor', function() {
      var editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';
      editor.getBody = function() {return $(editorContent)[0]};
      editor.onKeyUp = editor.onPaste = jasmine.createSpyObj('onKeyUp', ['add']);
      editor.onInit = jasmine.createSpyObj('onInit', ['add']);
      editor.onInit.add.and.callFake(function(handler) {handler()});

      redpenPlugin.autoValidate(editor);
      expect(redpenPlugin.validate).toHaveBeenCalledTimes(1);

      editor.getBody = function() {return $(editorContent.replace('Hello', 'Hallo'))[0]};
      editor.onKeyUp.add.calls.first().args[0](); // simulate keyUp in editor
      expect(redpenPlugin.validate).toHaveBeenCalledTimes(2);
    });

    it('listens to switches between editors', function() {
      var switcher = $('<button class="wp-switch-editor">Text</button>').appendTo('body');
      spyOn(redpenPlugin.editor, 'switchTo');

      redpenPlugin.autoValidate(textarea, '.wp-switch-editor');

      expect(redpenPlugin.editor.switchTo).toHaveBeenCalledWith(textarea);
      redpenPlugin.editor.switchTo.calls.reset();
      redpenPlugin.validate.calls.reset();

      switcher.click();
      expect(redpenPlugin.editor.switchTo).toHaveBeenCalledWith(textarea);
      expect(redpenPlugin.validate).toHaveBeenCalled();
    });
  });

  describe('config', function() {
    var validatorContainer, symbolContainer;

    beforeEach(function() {
      validatorContainer = $('<div class="redpen-validators"></div>').appendTo('body');
      symbolContainer = $('<table class="redpen-symboltable"><tbody></tbody></table>').appendTo('body');
      redpenPlugin.validate = jasmine.createSpy();
    });

    it('displays all available configurations', function() {
      var options = langSelect.find('option');
      expect(options.eq(0).text()).toBe('en');
      expect(options.eq(1).text()).toBe('ja');
    });

    it('displays validator list', function() {
      var validators = {
        "Spelling": {languages:['en']},
        "ImpoliteCursing": {properties:{max_impoliteness:0.5}}
      };

      redpenPlugin.renderConfiguration({validators: validators});

      var validatorElements = validatorContainer.find('li');
      expect(validatorElements.length).toBe(2);
      expect(validatorElements.eq(0).find('label').text()).toBe('Spelling');
      expect(validatorElements.eq(0).find('i').text().trim()).toBe('en');
      expect(validatorElements.eq(1).find('label').text()).toBe('ImpoliteCursing');
      expect(validatorElements.eq(1).find('.redpen-validator-properties').text()).toBe('max_impoliteness=0.5');
    });

    it('requests only enabled validators', function() {
      redpens.en.validators = {
        "Spelling": {languages:['en']},
        "ImpoliteCursing": {properties:{max_impoliteness:0.5}, disabled: true}
      };

      var config = redpenPlugin._prepareConfigForValidation('en');

      expect(config.lang).toBe('en');
      expect(config.symbols).toBe(redpens.en.symbols);
      expect(config.validators["Spelling"]).toBe(redpens.en.validators["Spelling"]);
      expect(config.validators["ImpoliteCursing"]).toBeUndefined();
    });

    it('allows to change validator properties', function() {
      var validators = {
        "ImpoliteCursing": {properties:{max_impoliteness:0.5}}
      };

      redpenPlugin.renderConfiguration({validators: validators});

      window.prompt = jasmine.createSpy().and.returnValue('max_impoliteness=0.2 ');

      validatorContainer.find('.redpen-validator-properties').click();

      expect(window.prompt).toHaveBeenCalledWith('ImpoliteCursing', 'max_impoliteness=0.5');
      expect(validatorContainer.find('.redpen-validator-properties').text()).toBe('max_impoliteness=0.2');
      expect(validators['ImpoliteCursing'].properties.max_impoliteness).toBe('0.2');
      expect(redpenPlugin.validate).toHaveBeenCalled();
    });

    it('allows adding new validator properties', function() {
      var validators = {
        "ImpoliteCursing": {properties:{}}
      };

      redpenPlugin.renderConfiguration({validators: validators});
      window.prompt = jasmine.createSpy().and.returnValue('hello=world');

      expect(validatorContainer.find('.redpen-validator-properties').text()).toBe('+');
      validatorContainer.find('.redpen-validator-properties').click();

      expect(window.prompt).toHaveBeenCalledWith('ImpoliteCursing', '');
      expect(validatorContainer.find('.redpen-validator-properties').text()).toBe('hello=world');
      expect(validators['ImpoliteCursing'].properties.hello).toBe('world');
    });

    it('displays symbols', function() {
      var symbols = {
        "AMPERSAND": {value:'&', invalid_chars:'@$%', before_space:false, after_space:true},
        "DOLLAR_SIGN": {value:'$'}
      };

      redpenPlugin.renderConfiguration({symbols: symbols});

      var symbolRows = symbolContainer.find('tr');
      expect(symbolRows.length).toBe(2);
      expect(symbolRows.eq(0).find('td').eq(0).text()).toBe('AMPERSAND');
      expect(symbolRows.eq(0).find('td').eq(1).text()).toBe('&');
      expect(symbolRows.eq(0).find('td').eq(2).text()).toBe('@$%');
      expect(symbolRows.eq(0).find(':checkbox')[0].checked).toBe(false);
      expect(symbolRows.eq(0).find(':checkbox')[1].checked).toBe(true);
      expect(symbolRows.eq(1).text()).toBe('DOLLAR_SIGN$');
    });

    it('allows enabling or disabling usage of space eiother before or after the symbol', function() {
      var symbols = {"AMPERSAND": {value:'&', before_space:false, after_space:true}};

      redpenPlugin.renderConfiguration({symbols: symbols});

      expect(symbolContainer.find(':checkbox[value=before_space]').click()[0].checked).toBe(true);
      expect(symbols["AMPERSAND"].before_space).toBe(true);

      expect(symbolContainer.find(':checkbox[value=after_space]').click()[0].checked).toBe(false);
      expect(symbols["AMPERSAND"].after_space).toBe(false);

      expect(redpenPlugin.validate).toHaveBeenCalledTimes(2);
    });

    it('allows changing symbols', function() {
      var symbols = {"AMPERSAND": {value:'&', invalid_chars:'#'}};

      redpenPlugin.renderConfiguration({symbols: symbols});
      window.prompt = jasmine.createSpy().and.returnValue(' % ');

      symbolContainer.find('.redpen-symbol-value').click();

      expect(window.prompt).toHaveBeenCalledWith('AMPERSAND', '&');
      expect(symbols["AMPERSAND"].value).toBe('%');
      expect(redpenPlugin.validate).toHaveBeenCalled();

      symbolContainer.find('.redpen-symbol-invalid').click();

      expect(window.prompt).toHaveBeenCalledWith('AMPERSAND', '#');
      expect(symbols["AMPERSAND"].invalid_chars).toBe('%');
      expect(redpenPlugin.validate).toHaveBeenCalled();
    });

    it('can reset to default', function() {
      redpenPlugin.redpens = {};
      redpenPlugin.resetConfiguration();
      expect(redpenPlugin.redpens).toBe(redpens);
      expect(redpenPlugin.validate).toHaveBeenCalled();
    });
  });
});
