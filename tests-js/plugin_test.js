describe('RedpenPlugin', function() {

  var redpenPlugin;
  var redPensResponse = {
    redpens: {
      'default': {},
      'en': {},
      'jp': {}
    }
  };

  beforeEach(function() {
    redpen = {
      setBaseUrl: function(url) {},
      getRedPens: function(callback) {
        callback(redPensResponse);
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
      expect(redpenPlugin.config).toBe(redPensResponse.redpens.default);
    });

  });

  describe('validation', function() {
    var container;

    function mockValidateJSON(validationResult) {
      redpen.validateJSON = function (args, callback) {
        expect(args.config).toBe(redPensResponse.redpens.default);
        expect(args.document).toBe('Hello World!');
        expect(args.format).toBe('json2');
        callback(validationResult);
      };
    }

    beforeEach(function() {
      container = $('<ol class="redpen-error-list"></ol>').appendTo('body');
    });

    it('displays nothing if no errors', function() {
      mockValidateJSON({errors: []});
      redpenPlugin.validate('Hello World!');
      expect(container.find('li').length).toBe(0);
    });

    it('displays all errors', function() {
      mockValidateJSON({
        errors: [{
          errors: [
            {validator: 'Spelling', message:'Hello is spelled incorrectly', sentence:'Hello World'},
            {validator: 'WrongSymbol', message:'You cannot use !', sentence:'Hello World!'}
          ]
        }]
      });

      redpenPlugin.validate('Hello World!');

      var items = container.find('li');
      expect(items.length).toBe(2);
      expect(items.hasClass('redpen-error-message')).toBe(true);

      expect(items.eq(0).text()).toMatch(/Hello is spelled incorrectly/);
      expect(items.eq(0).text()).toMatch(/Spelling/);

      expect(items.eq(1).text()).toMatch(/You cannot use !/);
      expect(items.eq(1).text()).toMatch(/WrongSymbol/);
    });

  });
});
