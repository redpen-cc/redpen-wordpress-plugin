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

$redpen_base_url = plugins_url('proxy.php', __FILE__) . '/http://localhost:8080/';

function add_redpen_button() {
	echo '
		<ol class="redpen-error-list"></ol>
		<button class="redpen button" type="button" onclick="redpenPlugin.validate($(\'#content\').val())">Validate with RedPen</button>
	';
}

function redpen_head() {
	global $redpen_base_url;
    echo '<script src="' . $redpen_base_url . 'js/redpen.js"></script>';
	echo '<script src="' . plugins_url('js/plugin.js', __FILE__) . '"></script>';
	echo '<script>redpenPlugin = new RedPenPlugin("' . $redpen_base_url . '")</script>';
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
add_action('admin_head', 'redpen_head');
?>
