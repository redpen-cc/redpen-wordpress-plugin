<?php
require_once 'mocks.php';
global $registered_hooks, $enqueued_resources, $options, $registered_settings, $redpen_proxy_url;

require_once dirname(__FILE__) . '/../settings.php';


class RedPenSettingsTest extends PHPUnit_Framework_TestCase {

    public function testAdminInitHookRegistersSettings() {
        global $registered_hooks;
        $this->assertEquals('redpen_register_settings', $registered_hooks['admin_init']);
    }

    public function testFieldRegistration() {
        global $registered_settings;
        redpen_register_settings();
        $this->assertEquals('redpen_base_url', $registered_settings['writing']);
    }

    public function testRedPenServerFieldReadsOption() {
        global $options;
        $options['redpen_base_url'] = 'http://redpen/';
        $this->expectOutputRegex('/<input.*? name="redpen_base_url" value="http:\/\/redpen\/">/');
        redpen_setting_field();
    }

    public function testUrlIsSanitized() {
        $this->assertEquals('http://redpen/', redpen_sanitize_url('http://redpen/'));
        $this->assertEquals('http://redpen/', redpen_sanitize_url('http://redpen'));
        $this->assertEquals('http://redpen/', redpen_sanitize_url('redpen'));
        $this->assertEquals('http://localhost:8080/', redpen_sanitize_url('localhost:8080'));
    }
}
?>