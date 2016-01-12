<?php
$registered_actions = [];

// These functions are normally provided by Wordpress

function add_action($hook, $func) {
    global $registered_actions;
    $registered_actions[$hook] = $func;
    echo "Registered hook $hook to function $func\n";
}

function plugins_url($resource_path) {
    return 'http://localhost/wp-content/plugins/redpen/'.$resource_path;
}
?>