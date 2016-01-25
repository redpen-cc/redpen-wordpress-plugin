<?php
/*
Plugin Name: RedPen Text Validator
Plugin URI: http://redpen.cc
Description: Validates posts with RedPen while editing.
Author: Anton Keks & Takahiko Ito
Version: 0.1
*/
$redpen_proxy_url = plugins_url('/proxy.php/', __FILE__);
$redpen_plugin_root = plugins_url('/', __FILE__);

function redpen_init() {
	global $redpen_proxy_url, $redpen_plugin_root;
	echo <<< HTML
		<script src="{$redpen_proxy_url}js/redpen.js"></script>
		<script src="{$redpen_plugin_root}js/editor.js"></script>
		<script src="{$redpen_plugin_root}js/plugin.js"></script>
		<link rel="stylesheet" type="text/css" href="{$redpen_plugin_root}css/redpen.css">
		<script>
		    var redpenPlugin = new RedPenPlugin('$redpen_proxy_url').autoValidate('#content');
		</script>
HTML;
}

function start_redpen_on_tinymce_init($settings) {
	global $redpen_plugin_root;
	$settings['setup'] = "function(editor) {redpenPlugin.autoValidate(editor)}";
	$settings['content_style'] = "@import url('{$redpen_plugin_root}css/redpen.css');";
	return $settings;
}

function redpen_add_meta_boxes() {
	add_meta_box(
		'redpen-errors',
		'<span class="redpen-red">Red</span>Pen <span class="redpen-title"></span>',
		'redpen_errors_content',
		array('post', 'page'),
		'advanced',
		'high'
	);

	add_meta_box(
		'redpen-config',
		'<span class="redpen-red">Red</span>Pen configuration (<span class="redpen-lang"></span>)',
		'redpen_config_content',
		array('post', 'page'),
		'advanced',
		'low'
	);
}

function redpen_errors_content($post) {
	echo '<ol class="redpen-error-list"></ol>';
	redpen_init();
}

function redpen_config_content($post) {
	echo <<< HTML
		<ul class="redpen-validators"></ul>
		<button type="button" class="button redpen-reset" onclick="redpenPlugin.resetConfiguration()">Reset to defaults</button>
HTML;
}

add_filter('tiny_mce_before_init', 'start_redpen_on_tinymce_init');
add_action('add_meta_boxes', 'redpen_add_meta_boxes');
?>
