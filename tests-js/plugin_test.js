describe('RedpenPlugin', function() {

  var redpenPlugin;
  var mockedRedPensResponse = {
    redpens: {
      'default': {}
    }
  };

  function mockTextArea(text) {
    return $('<textarea></textarea>').val(text).appendTo('body');
  }

  beforeEach(function() {
    redpen = {
      setBaseUrl: function(url) {},
      getRedPens: function(callback) {
        callback(mockedRedPensResponse);
      }
    };

    spyOn(redpen, 'setBaseUrl');

    redpenPlugin = new RedPenPlugin('http://localhost:8080');
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
      var textarea = mockTextArea('Hello World!');
      expect(redpenPlugin._getDocumentText(textarea)).toBe('Hello World!')
    });

    it('for visual editor (tinyMCE)', function() {
      var editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';

      tinyMCE = {
        activeEditor: {
          getBody: function() {return $(editorContent)[0]}
        }
      };

      var textarea = mockTextArea().hide();
      expect(redpenPlugin._getDocumentText(textarea)).toBe('Hello \nWordPress\nand the World!')
    });
  });

  describe('validation', function() {
    var container;

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
      container = $('<ol class="redpen-error-list"></ol>').appendTo('body');
    });

    it('WordPress has global jQuery, but not $, so define it locally', function () {
      var textarea = mockTextArea('Hello World!');
      try {
        delete window.$;
        mockValidateJSON({errors: []});
        redpenPlugin.validate(textarea);
      }
      finally {
        window.$ = jQuery;
      }
    });

    it('displays nothing if no errors', function () {
      mockValidateJSON({errors: []});
      redpenPlugin.validate(mockTextArea('Hello World!', 'Hello World!'));
      expect(container.find('li').length).toBe(0);
    });

    it('displays all errors', function () {
      mockValidateJSON(mockedValidateResponse);

      redpenPlugin.validate(mockTextArea('Hello World!'));

      var items = container.find('li');
      expect(items.length).toBe(2);
      expect(items.hasClass('redpen-error-message')).toBe(true);

      expect(items.eq(0).text()).toMatch(/Hello is spelled incorrectly/);
      expect(items.eq(0).text()).toMatch(/Spelling/);

      expect(items.eq(1).text()).toMatch(/You cannot use !/);
      expect(items.eq(1).text()).toMatch(/WrongSymbol/);
    });

    it('highlights plain text when clicking on error message', function() {
      mockedValidateResponse.errors[0].errors[0].position = {
        start: {offset: 3, line: 2}, end: {offset: 5, line: 2}
      };
      mockValidateJSON(mockedValidateResponse);

      var textarea = mockTextArea('Hello\nWorld!');
      spyOn(textarea[0], 'setSelectionRange');

      redpenPlugin.validate(textarea);

      container.find('.redpen-error-message').eq(0).click();

      expect(textarea[0].setSelectionRange).toHaveBeenCalledWith(9, 11);
    });

    it('highlights text in visual editor when clicking on error message', function() {
      mockedValidateResponse.errors[0].errors[0].position = {
        start: {offset: 1, line: 2}, end: {offset: 4, line: 2}
      };
      mockValidateJSON(mockedValidateResponse);

      var textarea = mockTextArea().hide();
      redpenPlugin.validate(textarea);

      var editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';
      var selection = jasmine.createSpyObj('selection', ['removeAllRanges', 'addRange']);
      var range = jasmine.createSpyObj('range', ['setStart', 'setEnd']);

      tinyMCE = {
        activeEditor: {
          getBody: function() {return $(editorContent)[0]},
          selection: {
            getSel: function() {return selection},
            getRng: function() {return range}
          }
        }
      };

      container.find('.redpen-error-message').eq(0).click();

      expect(range.setStart).toHaveBeenCalledWith(jasmine.objectContaining({textContent: 'WordPress'}), 1);
      expect(range.setEnd).toHaveBeenCalledWith(jasmine.objectContaining({textContent: 'WordPress'}), 4);

      expect(selection.removeAllRanges).toHaveBeenCalled();
      expect(selection.addRange).toHaveBeenCalledWith(range);
    });

  });
});
