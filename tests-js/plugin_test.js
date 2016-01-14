describe('RedpenPlugin', function() {

  var textarea, editor, redpenPlugin;

  var mockedRedPensResponse = {
    redpens: {
      'default': {}
    }
  };

  beforeEach(function() {
    $('body').empty();

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
    redpenPlugin = new RedPenPlugin('http://localhost:8080', textarea, editor);
  });

  describe('creation', function() {
    it('passes baseUrl to redpen API', function() {
      expect(redpen.setBaseUrl).toHaveBeenCalledWith('http://localhost:8080')
    });

    it('loads default configuration', function() {
      expect(redpenPlugin.config).toBe(mockedRedPensResponse.redpens.default);
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
    var errorContainer, title;

    var mockedValidateResponse = {
      errors: [{
        errors: [
          {validator: 'Spelling', message: 'Hello is spelled incorrectly', sentence: 'Hello World'},
          {validator: 'WrongSymbol', message: 'You cannot use !', sentence: 'Hello World!'}
        ]
      }]
    };

    function mockValidateJSON(validationResult, expectedDocument) {
      redpen.validateJSON = function (args, callback) {
        expect(args.config).toBe(mockedRedPensResponse.redpens.default);
        expect(args.format).toBe('json2');
        if (expectedDocument) expect(args.document).toBe(expectedDocument);
        callback(validationResult);
      };
    }

    beforeEach(function () {
      errorContainer = $('<ol class="redpen-error-list"></ol>').appendTo('body');
      title = $('<div class="redpen-title"></div>').appendTo('body');
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
    });

    it('of plain text validation can be started', function() {
      textarea.val('Hello');
      redpenPlugin.startValidation();
      expect(redpenPlugin.validate).toHaveBeenCalled();
    });

    it('of plain text only if text has changed', function() {
      textarea.val('Hello');

      spyOn(window, 'setTimeout').and.callFake(function(callback) {
        callback();
      });

      redpenPlugin.startValidation();

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
      textarea.val('Hello');

      spyOn(window, 'setTimeout').and.callFake(function(callback, timeout) {
        expect(timeout).toBe(500);
        return timeoutId;
      });

      spyOn(window, 'clearTimeout');

      redpenPlugin.startValidation();

      textarea.trigger('keyup');

      expect(window.clearTimeout).toHaveBeenCalledWith(undefined);
      expect(window.setTimeout).toHaveBeenCalled();

      textarea.trigger('keyup');

      expect(window.clearTimeout).toHaveBeenCalledWith(timeoutId);
      expect(window.setTimeout).toHaveBeenCalledTimes(2);
    });
  });
});
