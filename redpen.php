<?php
/**
 * @package RedPen_Wordpress_Plugin
 * @version 0.1
 */
/*
Plugin Name: RedPen Wordpress Plugin
Plugin URI: http://redpen.cc
Description: The plugin for validating the texts with RedPen.
Author: Anton & Takahiko
Version: 0.1
*/

function hello_post() {
	echo "<button class='redpen button' onclick=\"alert('Not implemented yet')\">Validate with RedPen</button>";
}

add_action( 'edit_form_advanced', 'hello_post' );

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

add_action( 'admin_head', 'some_css' );
?>
