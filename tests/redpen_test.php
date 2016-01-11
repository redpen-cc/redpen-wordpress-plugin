<?php
require_once 'mocks.php';
require_once '../redpen.php';

class RedPenTest extends PHPUnit_Framework_TestCase {

    public function testRedButton() {
        $this->expectOutputRegex('/<button class="redpen/');
        hello_post();
    }

}
?>