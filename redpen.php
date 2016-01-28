<?php
/*
Plugin Name: RedPen Text Validator
Plugin URI: http://redpen.cc
Description: Validates posts with RedPen while editing.
Author: Anton Keks & Takahiko Ito
Version: 0.1
*/
$redpen_plugin_ver = '0.1';
$redpen_plugin_root = plugin_dir_url(__FILE__);
$redpen_proxy_url = $redpen_plugin_root . 'proxy.php/';

function redpen_head($page) {
	if ($page != 'post.php') return;

	global $redpen_plugin_ver, $redpen_plugin_root, $redpen_proxy_url;
	wp_enqueue_script('redpen-api', $redpen_proxy_url . 'js/redpen.js', false, $redpen_plugin_ver);
	wp_enqueue_script('redpen-editor', $redpen_plugin_root . 'js/editor.js', false, $redpen_plugin_ver);
	wp_enqueue_script('redpen-plugin', $redpen_plugin_root . 'js/plugin.js', false, $redpen_plugin_ver);
	wp_enqueue_style('redpen-styles', $redpen_plugin_root . 'css/redpen.css', false, $redpen_plugin_ver);
}

function redpen_start_on_tinymce_init($settings) {
	global $redpen_plugin_root;
	$settings['setup'] = "function(editor) {redpenPlugin.autoValidate(editor, '.wp-switch-editor.switch-tmce')}";
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
	global $redpen_proxy_url;
	echo <<< HTML
		<ol class="redpen-error-list"></ol>
		<script>var redpenPlugin = new RedPenPlugin('$redpen_proxy_url').autoValidate('#content', '.wp-switch-editor.switch-html');</script>
HTML;
}

function redpen_config_content($post) {
	echo <<< HTML
		<ul class="redpen-validators"></ul>
		<button type="button" class="button redpen-reset" onclick="redpenPlugin.resetConfiguration()">Reset to defaults</button>
HTML;
}

add_action('admin_enqueue_scripts', 'redpen_head');
add_filter('tiny_mce_before_init', 'redpen_start_on_tinymce_init');
add_action('add_meta_boxes', 'redpen_add_meta_boxes');
?>
