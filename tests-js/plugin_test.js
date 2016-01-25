describe('RedPenPlugin', function() {
  var textarea, editor, redpenPlugin;
  var errorContainer, title;
  var proxyUrl = 'http://wordpress/proxy.php/';

  var redpens = {
    'en': {lang:'en', validators:{}, symbols:{}},
    'ja': {lang:'ja', validators:{}, symbols:{}}
  };

  beforeEach(function() {
    $('body').empty();
    localStorage.clear();

    errorContainer = $('<ol class="redpen-error-list"></ol>').appendTo('body');
    title = $('<div class="redpen-title"></div>').appendTo('body');

    textarea = $('<textarea></textarea>').val('Hello World!').appendTo('body');
    editor = {};

    redpen = {
      setBaseUrl: function(url) {},
      getRedPens: function(callback) {
        callback({redpens: redpens});
      }
    };

    spyOn(redpen, 'setBaseUrl');

    redpenPlugin = new RedPenPlugin(proxyUrl);
    redpenPlugin.editor.switchTo(textarea);
  });

  describe('creation', function() {
    it('shows an error message if redpen server is not running', function() {
      window.redpen = undefined;
      $.get = jasmine.createSpy().and.callFake(function(url, callback) {
        expect(url).toBe(proxyUrl + 'redpen_base_url');
        callback('http://localhost:8080/');
      });
      redpenPlugin = new RedPenPlugin(proxyUrl);
      expect(title.text()).toBe('server is not running on the same machine as WordPress at http://localhost:8080/, you can change it in config.php');
    });

    it('passes baseUrl to redpen API', function() {
      expect(redpen.setBaseUrl).toHaveBeenCalledWith(proxyUrl)
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
      redpenPlugin = new RedPenPlugin(proxyUrl);
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
      expect(redpen.validateJSON).toHaveBeenCalled();
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

    it('highlights plain text when clicking on error message', function() {
      mockedValidateResponse.errors[0].errors[0].position = {
        start: {offset: 3, line: 2}, end: {offset: 5, line: 2}
      };
      mockValidateJSON(mockedValidateResponse);

      textarea.val('Hello\nWorld!');
      spyOn(textarea[0], 'setSelectionRange');

      redpenPlugin.validate();

      errorContainer.find('.redpen-error-message').eq(0).click();

      expect(textarea[0].setSelectionRange).toHaveBeenCalledWith(9, 11);
    });

    it('highlights text in visual editor when clicking on error message', function() {
      $.each(mockedValidateResponse.errors[0].errors, function() {
        this.position = {start: {offset: 1, line: 2}, end: {offset: 4, line: 2}};
      });
      mockValidateJSON(mockedValidateResponse);

      var editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';
      var selection = jasmine.createSpyObj('selection', ['removeAllRanges', 'addRange']);
      var range = jasmine.createSpyObj('range', ['selectNode']);

      editor.getBody = function() {return $(editorContent)[0]};
      editor.selection = {
        getSel: function() {return selection},
        getRng: function() {return range}
      };
      editor.container = document.documentElement;
      redpenPlugin.editor.switchTo(editor);

      redpenPlugin.validate();
      errorContainer.find('.redpen-error-message').eq(0).click();

      expect(range.selectNode).toHaveBeenCalledWith(jasmine.objectContaining({className: 'redpen-error'}));

      expect(selection.removeAllRanges).toHaveBeenCalled();
      expect(selection.addRange).toHaveBeenCalledWith(range);
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
      editor.onKeyUp = jasmine.createSpyObj('onKeyUp', ['add']);

      redpenPlugin.autoValidate(editor);
      expect(redpenPlugin.validate).toHaveBeenCalledTimes(1);

      editor.getBody = function() {return $(editorContent.replace('Hello', 'Hallo'))[0]};
      editor.onKeyUp.add.calls.first().args[0](); // simulate keyUp in editor
      expect(redpenPlugin.validate).toHaveBeenCalledTimes(2);
    });
  });

  describe('config', function() {
    var validatorContainer, langContainer;

    beforeEach(function() {
      validatorContainer = $('<div class="redpen-validators"></div>').appendTo('body');
      langContainer = $('<div class="redpen-lang"></div>').appendTo('body');
      redpenPlugin.validate = jasmine.createSpy();
    });

    it('displays detected language', function() {
      redpenPlugin.renderConfiguration({lang: 'et', validators: {}});
      expect(langContainer.text()).toBe('et');
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

    it('can reset to default', function() {
      redpenPlugin.redpens = {};
      redpenPlugin.resetConfiguration();
      expect(redpenPlugin.redpens).toBe(redpens);
      expect(redpenPlugin.validate).toHaveBeenCalled();
    });
  });
});
