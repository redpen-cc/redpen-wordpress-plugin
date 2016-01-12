describe('RedpenPlugin', function() {

  describe('creation', function() {
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

    it('passes baseUrl to redpen API', function() {
      expect(redpen.setBaseUrl).toHaveBeenCalledWith('http://localhost:8080')
    });

    it('loads default configuration', function() {
      expect(redpenPlugin.config).toBe(redPensResponse.redpens.default);
    });

  });
});
