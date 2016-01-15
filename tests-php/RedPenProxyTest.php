<?php
class RedPenProxyTest extends PHPUnit_Framework_TestCase {
    public function testBaseUrlIsDefinedInConfigPhp() {
        include dirname(__FILE__) . '/../config.php';
        global $redpen_base_url;
        $this->assertEquals('http://localhost:8080/', $redpen_base_url);
    }

    public function testProxyUsesBaseUrl() {
        global $_SERVER;
        $_SERVER = array('SERVER_NAME' => 'localhost', 'SERVER_PORT' => 80, 'SCRIPT_NAME' => '/proxy.php',
                         'REQUEST_URI' => '/proxy.php/js/redpen.js', 'HTTP_USER_AGENT' => 'Blah', 'REQUEST_METHOD' => 'GET');

        include dirname(__FILE__) . '/../proxy.php';
        ob_end_clean();

        global $redpen_base_url, $url;
        $this->assertEquals('http://localhost:8080/', $redpen_base_url);
        $this->assertEquals('http://localhost:8080/js/redpen.js', $url);
    }
}
?>