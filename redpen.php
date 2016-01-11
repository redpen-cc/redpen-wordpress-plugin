<?php
/**
 * @package RedPen
 * @version 0.1
 */
/*
Plugin Name: RedPen Text Validator
Plugin URI: http://redpen.cc
Description: Validates posts with RedPen while editing.
Author: Anton Keks & Takahiko Ito
Version: 0.1
*/

function hello_post() {
	echo '<button class="redpen button" onclick="alert(\'Not implemented yet\')">Validate with RedPen</button>';
}

function some_css() {
	echo "
	<style type='text/css'>
	button.redpen {
		background: red !important;
		color: white !important;
	}
	</style>
	";
}

add_action('edit_form_advanced', 'hello_post');
add_action('admin_head', 'some_css');
?>
