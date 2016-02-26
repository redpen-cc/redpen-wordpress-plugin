<?php
/*
Plugin Name: RedPen Text Validator
Plugin URI: http://redpen.cc
Description: Validates posts with RedPen while editing.
Author: Anton Keks & Takahiko Ito
Version: 1.1.1
*/
$redpen_plugin_ver = '1.1';
$redpen_plugin_root = plugin_dir_url(__FILE__);
$redpen_base_url = redpen_base_url();

function redpen_base_url() {
	$url = get_option('redpen_base_url');
	if (!$url) {
		$url = 'https://redpen.herokuapp.com/';
		update_option('redpen_base_url', $url);
	}
	return $url;
}

function redpen_head($page) {
	if (strpos($page, 'post') !== 0) return;

	global $redpen_plugin_ver, $redpen_plugin_root, $redpen_base_url;
	wp_enqueue_script('redpen-api', $redpen_base_url . 'js/redpen.js', false, $redpen_plugin_ver);
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

function redpen_add_meta_boxes($post_type, $post) {
	add_meta_box(
		'redpen-errors',
		'<span class="redpen-red">Red</span>Pen <span class="redpen-title"></span>',
		'redpen_errors_content', null, 'advanced', 'high'
	);

	add_meta_box(
		'redpen-config',
		'<span class="redpen-red">Red</span>Pen configuration',
		'redpen_config_content', null, 'advanced', 'low'
	);
}

function redpen_errors_content($post) {
	echo '<ol class="redpen-error-list"></ol>';
}

function redpen_config_content($post) {
	global $redpen_base_url;
	echo <<< HTML
	<div class="redpen-config-column">
		<div class="redpen-config-global">
			<label>
				<b>Language</b>
				<select id="redpen-language"></select>
			</label>
			<button type="button" class="button redpen-reset" onclick="redpenPlugin.resetConfiguration()">Reset to defaults</button>
		</div>
		<b>Validators</b>
		<b class="redpen-validator-properties">Properties</b>
		<ul class="redpen-validators"></ul>
	</div>
	<div class="redpen-config-column">
		<table class="redpen-symboltable">
			<thead>
				<tr><th>Symbols</th><th>Value</th><th>Invalid<br>Chars</th><th>Space<br>Before</th><th>Space<br>After</th></tr>
			</thead>
			<tbody></tbody>
		</table>
	</div>
	<div class="redpen-clear"></div>
	<script>var redpenPlugin = new RedPenPlugin('$redpen_base_url').autoValidate('#content', '.wp-switch-editor.switch-html');</script>
HTML;
}

add_action('admin_enqueue_scripts', 'redpen_head');
add_filter('tiny_mce_before_init', 'redpen_start_on_tinymce_init');
add_action('add_meta_boxes', 'redpen_add_meta_boxes');

require_once dirname(__FILE__).'/settings.php';
?>
