<?php
/*
Plugin Name: RedPen Text Validator
Plugin URI: http://redpen.cc
Description: Validates posts with RedPen while editing.
Author: Anton Keks & Takahiko Ito
Version: 0.1
*/

$redpen_base_url = plugins_url('proxy.php', __FILE__) . '/';

function add_redpen_to_edit_form() {
	global $redpen_base_url;
	echo '
		<script src="' . $redpen_base_url . 'js/redpen.js"></script>
		<script src="' . plugins_url('js/plugin.js', __FILE__) . '"></script>
		<link rel="stylesheet" type="text/css" href="' . plugins_url('css/redpen.css', __FILE__) . '">
		<div class="redpen-title"></div><ol class="redpen-error-list"></ol>
		<script>var redpenPlugin = new RedPenPlugin("' . $redpen_base_url . '")</script>
	';
}

function start_redpen_on_tinymce_init($settings) {
	$settings['setup'] = 'function(editor) {redpenPlugin.startValidation(jQuery("#content"), editor)}';
	return $settings;
}

add_action('edit_form_advanced', 'add_redpen_to_edit_form');
add_filter('tiny_mce_before_init', 'start_redpen_on_tinymce_init');
?>
