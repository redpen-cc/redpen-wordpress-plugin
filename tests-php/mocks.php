<?php
$registered_hooks = [];
$registered_meta_boxes = [];

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

function plugins_url($resource_path) {
    return 'http://localhost/wp-content/plugins/redpen'.$resource_path;
}
?>