describe('RedPenEditor', function() {
  var ed;

  beforeEach(function() {
    ed = new RedPenEditor();
  });

  describe('plain text', function() {
    var textarea;

    beforeEach(function() {
      textarea = $('<textarea id="content"></textarea>').val('Hello World!').appendTo('body');
      ed.switchTo('#content');
    });

    it('getDocumentText() returns textarea content', function() {
      expect(ed.getDocumentText()).toBe('Hello World!');
    });
  });

  describe('visual (tinyMCE)', function() {
    var editor = {
      getBody: function() {}
    };

    beforeEach(function() {
      ed.switchTo(editor);
    });

    it('getDocumentText() returns text nodes separated by newlines', function() {
      var editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';
      editor.getBody = function() {return $(editorContent)[0]};

      expect(ed.getDocumentText()).toBe('Hello \nWordPress\nand the World!')
    });
  });
});