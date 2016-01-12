<?php
require_once 'mocks.php';
global $registered_actions;

require_once '../redpen.php';

class RedPenTest extends PHPUnit_Framework_TestCase {

    public function testEditHookIsRegistered() {
        global $registered_actions;
        $this->assertEquals('add_redpen_button', $registered_actions['edit_form_advanced']);
    }

    public function testHeadHookIsRegistered() {
        global $registered_actions;
        $this->assertEquals('redpen_head', $registered_actions['admin_head']);
    }

    public function testJsPathIsCorrectlyResolved() {
        $expected_path = str_replace('/', '\\/', 'http://localhost/wp-content/plugins/redpen/js/plugin.js');
        $this->expectOutputRegex('/<script src="'.$expected_path.'"><\\/script>/');
        redpen_head();
    }

    public function testRedButton() {
        $this->expectOutputRegex('/<button class="redpen button"/');
        add_redpen_button();
    }

}
?>