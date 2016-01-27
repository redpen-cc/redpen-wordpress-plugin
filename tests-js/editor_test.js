describe('RedPenEditor', function() {
  var ed;

  beforeEach(function() {
    $('body').empty();
    ed = new RedPenEditor();
  });

  describe('plain text', function() {
    var textarea;

    beforeEach(function() {
      textarea = $('<textarea id="content"></textarea>').appendTo('body');
      ed.switchTo('#content');
    });

    it('getDocumentText() returns textarea content', function() {
      textarea.val('Hello World!');
      expect(ed.getDocumentText()).toBe('Hello World!');
    });

    it('showErrorInText() calls setSelectionRange', function() {
      textarea.val('Hello\nWorld!');
      spyOn(textarea[0], 'setSelectionRange');

      var error = {position: {start: {offset: 3, line: 2}, end: {offset: 5, line: 2}}};
      ed.showErrorInText(error);

      expect(textarea[0].setSelectionRange).toHaveBeenCalledWith(9, 11);
    });
  });

  describe('visual (tinyMCE)', function() {
    var editor = {
      getBody: function() {}
    };

    beforeEach(function() {
      ed.switchTo(editor);
    });

    it('getDocumentText() returns text as a single line', function() {
      var editorContent = '<div><p>Hello <i>the\u00A0great</i> <strong>WordPress</strong></p>\n<p>and the World!</p></div>';
      editor.getBody = function() {return $(editorContent)[0]};

      expect(ed.getDocumentText()).toBe('Hello the great WordPress and the World!')
    });

    it('showErrorInText() uses Range inside of editor\'s body', function() {
      var editorContent = '<div><p>Hello <strong>WordPress</strong></p><p>and the World!</p></div>';
      var selection = jasmine.createSpyObj('selection', ['removeAllRanges', 'addRange']);
      var range = jasmine.createSpyObj('range', ['selectNode', 'setStart', 'setEnd']);

      editor.getBody = function() {return $(editorContent)[0]};
      editor.selection = {
        getSel: function() {return selection},
        getRng: function() {return range}
      };
      editor.container = document.documentElement;

      ed.getDocumentText();
      var error = {position: {start: {offset: 23, line: 1}, end: {offset: 28, line: 1}}};
      var node = ed.highlightError(error);
      ed.showErrorInText(error, node);

      expect(node.textContent).toBe('World');
      expect(node.className).toBe('redpen-error');
      expect(range.selectNode).toHaveBeenCalledWith(node);
      expect(selection.removeAllRanges).toHaveBeenCalled();
      expect(selection.addRange).toHaveBeenCalledWith(range);
    });
  });
});