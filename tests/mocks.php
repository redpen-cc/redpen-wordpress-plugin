<?php
$registered_actions = [];

// This function is normally provided by Wordpress
function add_action($hook, $func) {
    global $registered_actions;
    $registered_actions[$hook] = $func;
    echo "Registered hook $hook to function $func\n";
}
?>