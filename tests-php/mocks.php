<?php
$registered_hooks = [];
$registered_meta_boxes = [];
$enqueued_resources = [];
$options = [];

// These functions are normally provided by Wordpress

function add_action($hook, $func) {
    global $registered_hooks;
    $registered_hooks[$hook] = $func;
    echo "Registered action hook $hook to function $func\n";
}

function add_filter($hook, $func) {
    global $registered_hooks;
    $registered_hooks[$hook] = $func;
    echo "Registered filter hook $hook to function $func\n";
}

function add_meta_box($id, $title, $callback, $screen, $context, $priority) {
    global $registered_meta_boxes;
    $registered_meta_boxes[$id] = func_get_args();
}

function plugin_dir_url($file) {
    return 'http://localhost/wp-content/plugins/redpen/';
}

function wp_enqueue_script($handle, $src, $deps, $ver) {
    global $enqueued_resources;
    $enqueued_resources[$handle] = $src;
}

function wp_enqueue_style($handle, $src, $deps, $ver) {
    global $enqueued_resources;
    $enqueued_resources[$handle] = $src;
}

function get_option($option) {
    global $options;
    return $options[$option];
}

function update_option($option, $value) {
    global $options;
    $options[$option] = $value;
}
?>