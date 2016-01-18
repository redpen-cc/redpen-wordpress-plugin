describe('RedpenPlugin', function() {

  var textarea, editor, redpenPlugin;
  var errorContainer, title;
  var proxyUrl = 'http://wordpress/proxy.php/';

  var mockedRedPensResponse = {
    redpens: {
      'en': {},
      'ja': {}
    }
  };

  beforeEach(function() {
    $('body').empty();

    errorContainer = $('<ol class="redpen-error-list"></ol>').appendTo('body');
    title = $('<div class="redpen-title"></div>').appendTo('body');

    textarea = $('<textarea></textarea>').val('Hello World!').appendTo('body');
    editor = {};

    redpen = {
      setBaseUrl: function(url) {},
      getRedPens: function(callback) {
        callback(mockedRedPensResponse);
      }
    };

    spyOn(redpen, 'setBaseUrl');

    textarea.show();
    redpenPlugin = new RedPenPlugin(proxyUrl, textarea, editor);
  });

  describe('creation', function() {
    it('shows an error message if redpen server is not running', function() {
      window.redpen = undefined;
      $.get = jasmine.createSpy().and.callFake(function(url, callback) {
        expect(url).toBe(proxyUrl + 'redpen_base_url');
        callback('http://localhost:8080/');
      });
      redpenPlugin = new RedPenPlugin(proxyUrl, textarea, editor);
      expect(title.text()).toBe('RedPen server is not running on the same machine as WordPress at http://localhost:8080/, you can change it in config.php');
    });

    it('passes baseUrl to redpen API', function() {
      expect(redpen.setBaseUrl).toHaveBeenCalledWith(proxyUrl)
    });

    it('loads default configurations', function() {
      expect(redpenPlugin.redpens).toBe(mockedRedPensResponse.redpens);
    });

  });

  describe('getDocumentText', function() {
    it('for plain text', function() {
      expect(redpenPlugin._getDocumentText()).toBe('Hello World!')
    });

    it('for visual editor (tinyMCE)', function() {
      var editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';
      editor.getBody = function() {return $(editorContent)[0]};
      textarea.hide();

      expect(redpenPlugin._getDocumentText()).toBe('Hello \nWordPress\nand the World!')
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
        expect(args.config).toBe(mockedRedPensResponse.redpens.en);
        expect(args.format).toBe('json2');
        expect(args.document).toBe(redpenPlugin._getDocumentText());
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
      textarea.val(japaneseText);
      redpen.detectLanguage = jasmine.createSpy().and.callFake(function(text, callback) {
        expect(text).toBe(japaneseText);
        callback('ja');
      });
      redpen.validateJSON = jasmine.createSpy();

      redpenPlugin.validate();

      expect(redpen.validateJSON).toHaveBeenCalledWith(
        jasmine.objectContaining({config: mockedRedPensResponse.redpens.ja, document: japaneseText}),
        jasmine.any(Function));
    });

    it('displays nothing if no errors', function () {
      mockValidateJSON({errors: []});
      redpenPlugin.validate();
      expect(errorContainer.find('li').length).toBe(0);
      expect(title.text()).toBe('RedPen found 0 errors');
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

      expect(title.text()).toBe('RedPen found 2 errors');
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
      mockedValidateResponse.errors[0].errors[0].position = {
        start: {offset: 1, line: 2}, end: {offset: 4, line: 2}
      };
      mockValidateJSON(mockedValidateResponse);

      var editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';
      var selection = jasmine.createSpyObj('selection', ['removeAllRanges', 'addRange']);
      var range = jasmine.createSpyObj('range', ['setStart', 'setEnd']);

      editor.getBody = function() {return $(editorContent)[0]};
      editor.selection = {
        getSel: function() {return selection},
        getRng: function() {return range}
      };

      textarea.hide();
      redpenPlugin.validate();
      errorContainer.find('.redpen-error-message').eq(0).click();

      expect(range.setStart).toHaveBeenCalledWith(jasmine.objectContaining({textContent: 'WordPress'}), 1);
      expect(range.setEnd).toHaveBeenCalledWith(jasmine.objectContaining({textContent: 'WordPress'}), 4);

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
      redpenPlugin.startValidation();
      expect(redpenPlugin.validate).toHaveBeenCalled();
    });

    it('of plain text only if text has changed', function() {
      redpenPlugin.startValidation();
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

      redpenPlugin.startValidation();
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
      textarea.hide();

      var editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';
      editor.getBody = function() {return $(editorContent)[0]};
      editor.onKeyUp = jasmine.createSpyObj('onKeyUp', ['add']);

      redpenPlugin.startValidation();
      expect(redpenPlugin.validate).toHaveBeenCalledTimes(1);

      editor.getBody = function() {return $(editorContent.replace('Hello', 'Hallo'))[0]};
      editor.onKeyUp.add.calls.first().args[0](); // simulate keyUp in editor
      expect(redpenPlugin.validate).toHaveBeenCalledTimes(2);
    });
  });

  describe('config', function() {
    var validatorContainer;

    beforeEach(function() {
      validatorContainer = $('<div class="redpen-validators"></div>').appendTo('body');
    });

    it('displays validator list', function() {
      var validators = {
        "Spelling": {languages:['en']},
        "ImpoliteCursing": {properties:{max_impoliteness:0.5}}
      };

      redpenPlugin.displayValidators({validators: validators});

      var validatorElements = validatorContainer.find('li');
      expect(validatorElements.length).toBe(2);
      expect(validatorElements.eq(0).text()).toBe('Spelling en');
      expect(validatorElements.eq(1).find('label').text()).toBe('ImpoliteCursing');
      expect(validatorElements.eq(1).find('.redpen-validator-properties').text()).toBe('max_impoliteness=0.5');
    });
  });
});
