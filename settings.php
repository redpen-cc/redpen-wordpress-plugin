<?php
// create custom plugin settings menu
add_action('admin_menu', 'redpen_create_menu');
global $redpen_base_url;

function redpen_create_menu() {
    add_options_page('RedPen Plugin Settings', 'RedPen', 'administrator', __FILE__, 'redpen_settings_page');
    add_action('admin_init', 'register_redpen_settings');
}


function register_redpen_settings() {
    //register our settings
    register_setting('redpen-settings-group', 'redpen_base_url');
}

function redpen_settings_page() {
    ?>
    <div class="wrap">
        <h2>RedPen Server</h2>
        <p>Change the URL below if you want to use your own instance of RedPen Server.</p>

        <form method="post" action="settings.php">
            <?php settings_fields('redpen-settings-group')?>
            <?php do_settings_sections('redpen-settings-group')?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">URL</th>
                    <td><input type="text" name="redpen_base_url" value="<?=esc_attr(get_option('redpen_base_url'))?>"></td>
                </tr>
            </table>

            <?php submit_button(); ?>

        </form>
    </div>
<?php } ?>
