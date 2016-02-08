<?php
class RedPenProxyTest extends PHPUnit_Framework_TestCase {
    public function testProxyLoadsUrl() {
        global $_SERVER;
        $_SERVER = array('SERVER_NAME' => 'localhost', 'SERVER_PORT' => 80, 'SCRIPT_NAME' => '/proxy.php',
                         'REQUEST_URI' => '/proxy.php/https://redpen.herokuapp.com/js/redpen.js', 'HTTP_USER_AGENT' => 'Blah', 'REQUEST_METHOD' => 'GET');

        include dirname(__FILE__) . '/../proxy.php';
        ob_end_clean();

        global $url;
        $this->assertEquals('https://redpen.herokuapp.com/js/redpen.js', $url);
    }
}
?>