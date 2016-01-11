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

function add_redpen_button() {
	echo '<button class="redpen button" onclick="alert(\'Not implemented yet\')">Validate with RedPen</button>';
}

function redpen_css() {
	echo '
	<style type="text/css"">
	button.redpen {
		background: red !important;
		color: white !important;
	}
	</style>
	';
}

add_action('edit_form_advanced', 'add_redpen_button');
add_action('admin_head', 'redpen_css');
?>
